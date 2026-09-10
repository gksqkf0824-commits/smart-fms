package com.smartfms.backend.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartfms.backend.domain.CarwashRequest;
import com.smartfms.backend.domain.Dispatch;
import com.smartfms.backend.domain.DispatchStatus;
import com.smartfms.backend.domain.Grade;
import com.smartfms.backend.domain.Inspection;
import com.smartfms.backend.domain.Penalty;
import com.smartfms.backend.domain.User;
import com.smartfms.backend.domain.Vehicle;
import com.smartfms.backend.domain.VehicleStatus;
import com.smartfms.backend.dto.AiPredictResponse;
import com.smartfms.backend.dto.ReturnResponse;
import com.smartfms.backend.repository.CarwashRequestRepository;
import com.smartfms.backend.repository.DispatchRepository;
import com.smartfms.backend.repository.InspectionRepository;
import com.smartfms.backend.repository.PenaltyRepository;
import com.smartfms.backend.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;

/**
 * 반납 처리 오케스트레이터 — docs/API.md `POST /return`.
 * 사진 저장 → AI 호출 → 2-Track 등급 판정 → 조치(배차/세차/패널티/알림) → DB 기록까지 조율한다.
 */
@Service
@RequiredArgsConstructor
public class InspectionService {

    private static final Logger log = LoggerFactory.getLogger(InspectionService.class);

    private final VehicleRepository vehicleRepository;
    private final InspectionRepository inspectionRepository;
    private final DispatchRepository dispatchRepository;
    private final PenaltyRepository penaltyRepository;
    private final CarwashRequestRepository carwashRequestRepository;
    private final DispatchService dispatchService;
    private final AiClient aiClient;
    private final ImageStorage imageStorage;
    private final Notifier notifier;

    /** 오염도(spill_ratio) 임계치 — application.yml에서 주입 (docs/AGREEMENTS.md 7번) */
    @Value("${app.pollution.warn-threshold:0.02}")
    private BigDecimal warnThreshold; // 0.02 (2%)

    @Value("${app.pollution.block-threshold:0.05}")
    private BigDecimal blockThreshold; // 0.05 (5%)

    @Value("${app.carwash.partner:강남 세차연합}")
    private String carwashPartner;

    private static final int WARN_PENALTY_POINTS = 5;
    private static final int BLOCK_PENALTY_POINTS = 10;

    /**
     * 반납 1건 처리.
     * 1) 사진 저장 → 2) AI 분석 → 3) 2-Track 등급 판정 → 4) 조치 실행 → 5) 기록
     */
    @Transactional
    public ReturnResponse processReturn(String plate, byte[] image) {
        Vehicle vehicle = vehicleRepository.findByPlate(plate)
                .orElseThrow(() -> new VehicleNotFoundException(plate));

        // 1. 사진 저장 — DB엔 경로(key)만 남기고 파일은 S3로 (docs/AGREEMENTS.md 3번)
        String imageKey = imageStorage.store(image, plate);

        // 2. AI 분석 요청 (2개 모델 응답)
        AiPredictResponse ai = aiClient.predict(image);
        
        // spill_ratio 복원 및 AI 반환값 파싱
        BigDecimal spillRatio = ai.roiPollutionRatio() != null ? ai.roiPollutionRatio() : BigDecimal.ZERO;
        BigDecimal occupyRatio = ai.occupyRatio() != null ? ai.occupyRatio() : BigDecimal.ZERO;
        int trashCount = ai.trashCount() != null ? ai.trashCount() : 0;
        boolean trashLarge = Boolean.TRUE.equals(ai.trashLarge());
        boolean occupyDetected = Boolean.TRUE.equals(ai.occupyDetected());

        // 3. 2-Track 등급 판정 (Track 1: 쓰레기, Track 2: spill 오염)
        Grade grade = judgeGrade(spillRatio, trashCount, trashLarge);
        boolean userAlert = occupyDetected; // 유실물 알림 플래그

        // 4. 직전 이용자 확인 및 이용 종료 처리
        Dispatch inUse = dispatchRepository
                .findFirstByVehicleIdAndStatusOrderByCreatedAtDesc(vehicle.getId(), DispatchStatus.IN_USE)
                .orElse(null);
        User previousUser = inUse != null ? inUse.getUser() : null;
        if (inUse != null) {
            inUse.markReturned();
        }

        // 5. 검수 기록 저장 (spillRatio 및 2모델 감지 결과 포함)
        Inspection inspection = inspectionRepository.save(Inspection.builder()
                .vehicle(vehicle)
                .user(previousUser)
                .spillRatio(spillRatio)
                .roiPollutionRatio(spillRatio) // 호환용 동일값 입력
                .occupyRatio(occupyRatio)
                .trashCount(trashCount)
                .trashLarge(trashLarge)
                .occupyDetected(occupyDetected)
                .grade(grade)
                .userAlert(userAlert)
                .imageKey(imageKey)
                .build());

        // 6. 등급별 조치 (docs/AGREEMENTS.md 7번)
        List<String> actions = new ArrayList<>();

        // 6-1. BLOCK: 배차 차단 + Swap
        if (grade == Grade.BLOCK) {
            dispatchService.swapNextDispatch(vehicle.getId());
            actions.add("dispatch_blocked");
        }

        // 6-2. 세차 — BLOCK 또는 WARN 등급 시 세차 요청
        if (grade == Grade.BLOCK || grade == Grade.WARN) {
            carwashRequestRepository.save(CarwashRequest.builder()
                    .vehicle(vehicle)
                    .inspection(inspection)
                    .partner(carwashPartner)
                    .build());
            actions.add("carwash_requested");
        }

        // 6-3. 패널티 부과 (WARN 이상)
        if (grade != Grade.NORMAL && previousUser != null) {
            int points = grade == Grade.BLOCK ? BLOCK_PENALTY_POINTS : WARN_PENALTY_POINTS;
            String reason = String.format("오염도 %.1f%%, 쓰레기 %d개", 
                    spillRatio.multiply(BigDecimal.valueOf(100)).doubleValue(), trashCount);

            penaltyRepository.save(Penalty.builder()
                    .user(previousUser)
                    .inspection(inspection)
                    .points(points)
                    .reason(reason)
                    .build());
            previousUser.addPenaltyPoints(points);
            actions.add("penalty_reserved");
        }

        // 6-4. 알림 — NORMAL이 아니면 발송
        if (grade != Grade.NORMAL) {
            notifier.notify(plate, spillRatio, grade, grade == Grade.BLOCK);
            actions.add("notified");
        }

        // 6-5. 유실물(occupy) 알림
        if (userAlert) {
            notifyBelongings(plate, previousUser);
            actions.add("user_alerted");
        }

        // 7. 차량 상태 갱신 — 세차 요청 시 CARWASH_NEEDED, 아니면 AVAILABLE
        vehicle.changeStatus(actions.contains("carwash_requested")
                ? VehicleStatus.CARWASH_NEEDED
                : VehicleStatus.AVAILABLE);

        return new ReturnResponse(plate, spillRatio, trashCount, occupyDetected, grade, userAlert, actions, imageKey);
    }

    /** 두고 간 소지품 안내 로그 */
    private void notifyBelongings(String plate, User previousUser) {
        String recipient = previousUser != null ? previousUser.getName() : "직전 이용자 미상";
        log.warn("[소지품 감지] 차량={} 안내대상={}", plate, recipient);
    }

    /**
     * 명세서(API.md 2번) 기준 2-Track 등급 판정
     * Track 1 (쓰레기): 대형 1개↑ 또는 3개↑ -> BLOCK / 1~2개 -> WARN
     * Track 2 (오염도): 5%↑ -> BLOCK / 2~5% -> WARN
     * Overriding: 더 심각한 등급 적용
     */
    private Grade judgeGrade(BigDecimal spillRatio, int trashCount, boolean trashLarge) {
        // Track 1: 쓰레기 판정
        Grade trashGrade = Grade.NORMAL;
        if (trashLarge || trashCount >= 3) {
            trashGrade = Grade.BLOCK;
        } else if (trashCount >= 1) {
            trashGrade = Grade.WARN;
        }

        // Track 2: spill 오염도 판정 (5% BLOCK / 2% WARN)
        Grade spillGrade = Grade.NORMAL;
        if (spillRatio.compareTo(blockThreshold) >= 0) {
            spillGrade = Grade.BLOCK;
        } else if (spillRatio.compareTo(warnThreshold) >= 0) {
            spillGrade = Grade.WARN;
        }

        // Overriding (BLOCK > WARN > NORMAL)
        if (trashGrade == Grade.BLOCK || spillGrade == Grade.BLOCK) {
            return Grade.BLOCK;
        }
        if (trashGrade == Grade.WARN || spillGrade == Grade.WARN) {
            return Grade.WARN;
        }
        return Grade.NORMAL;
    }
}