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
 * 사진 저장 → AI 호출 → 등급 판정 → 조치(배차/세차/패널티/알림) → DB 기록까지 조율한다.
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

    /** 등급 임계치 — 운영 정책값이므로 application.yml에서 주입 (docs/AGREEMENTS.md 5번) */
    @Value("${app.pollution.warn-threshold}")
    private BigDecimal warnThreshold;

    @Value("${app.pollution.block-threshold}")
    private BigDecimal blockThreshold;

    @Value("${app.carwash.partner}")
    private String carwashPartner;

    // 패널티 점수 — 확정 정책 나오면 조정 (임시값)
    private static final int WARN_PENALTY_POINTS = 5;
    private static final int BLOCK_PENALTY_POINTS = 10;

    /**
     * 반납 1건 처리.
     * 1) 사진 저장 → 2) AI 분석 → 3) 등급 판정 → 4) 조치 실행 → 5) 기록
     */
    @Transactional
    public ReturnResponse processReturn(String plate, byte[] image) {
        Vehicle vehicle = vehicleRepository.findByPlate(plate)
                .orElseThrow(() -> new VehicleNotFoundException(plate));

        // 1. 사진 저장 — DB엔 경로(key)만 남기고 파일은 S3로 (docs/AGREEMENTS.md 3번)
        String imageKey = imageStorage.store(image, plate);

        // 2. AI 분석 요청 (AI는 결과 JSON만 반환)
        AiPredictResponse ai = aiClient.predict(image);
        BigDecimal ratio = ai.roiPollutionRatio() != null ? ai.roiPollutionRatio() : BigDecimal.ZERO;
        BigDecimal trashRatio = ai.ratioOf("trash");
        BigDecimal occupyRatio = ai.ratioOf("occupy");

        // 3. 등급 판정
        Grade grade = judgeGrade(ratio);

        // 4. 직전 이용자 확인 및 이용 종료 처리
        Dispatch inUse = dispatchRepository
                .findFirstByVehicleIdAndStatusOrderByCreatedAtDesc(vehicle.getId(), DispatchStatus.IN_USE)
                .orElse(null);
        User previousUser = inUse != null ? inUse.getUser() : null;
        if (inUse != null) {
            inUse.markReturned();
        }

        // 5. 검수 기록 저장
        Inspection inspection = inspectionRepository.save(Inspection.builder()
                .vehicle(vehicle)
                .user(previousUser)
                .roiPollutionRatio(ratio)
                .trashRatio(trashRatio)
                .occupyRatio(occupyRatio)
                .grade(grade)
                .imageKey(imageKey)
                .build());

        // 6. 등급별 조치 (docs/AGREEMENTS.md 5번)
        List<String> actions = new ArrayList<>();

        // 6-1. BLOCK(30%~): 배차 차단 + Swap
        if (grade == Grade.BLOCK) {
            dispatchService.swapNextDispatch(vehicle.getId());
            actions.add("dispatch_blocked");
        }

        // 6-2. 세차 — BLOCK 등급일 때 호출
        if (grade == Grade.BLOCK) {
            carwashRequestRepository.save(CarwashRequest.builder()
                    .vehicle(vehicle)
                    .inspection(inspection)
                    .partner(carwashPartner)
                    .build());
            actions.add("carwash_requested");
        }

        // 6-3. WARN(10~30%) 이상: 직전 이용자에게 패널티 부과
        if (grade != Grade.NORMAL && previousUser != null) {
            int points = grade == Grade.BLOCK ? BLOCK_PENALTY_POINTS : WARN_PENALTY_POINTS;
            penaltyRepository.save(Penalty.builder()
                    .user(previousUser)
                    .inspection(inspection)
                    .points(points)
                    .reason("오염도 " + ratio.multiply(BigDecimal.valueOf(100)).intValue() + "%")
                    .build());
            previousUser.addPenaltyPoints(points);
            actions.add("penalty_reserved");
        }

        // 6-4. 알림 — NORMAL이 아니면 발송 (WARN·BLOCK 모두, PM 확정)
        if (grade != Grade.NORMAL) {
            notifier.notify(plate, ratio, grade, grade == Grade.BLOCK);
            actions.add("notified");
        }

        // 6-5. 소지품 — 면적과 무관하게 하나라도 감지되면 이용자에게 안내
        if (occupyRatio.compareTo(BigDecimal.ZERO) > 0) {
            notifyBelongings(plate, previousUser);
            actions.add("belongings_notified");
        }

        // 7. 차량 상태 갱신 — 세차가 걸리면 세차 필요, 아니면 운행 가능
        vehicle.changeStatus(actions.contains("carwash_requested")
                ? VehicleStatus.CARWASH_NEEDED
                : VehicleStatus.AVAILABLE);

        return new ReturnResponse(plate, ratio, ai.classes(), grade, actions, imageKey);
    }

    /** 두고 간 소지품 안내 — 고객 알림 채널(문자·푸시) 연동 전까지 로그로 대체 */
    private void notifyBelongings(String plate, User previousUser) {
        String recipient = previousUser != null ? previousUser.getName() : "직전 이용자 미상";
        log.warn("[소지품 감지] 차량={} 안내대상={}", plate, recipient);
    }

    /** 오염도(쓰레기 비율) → 등급 (~10% NORMAL / 10~30% WARN / 30%~ BLOCK) */
    private Grade judgeGrade(BigDecimal ratio) {
        if (ratio.compareTo(warnThreshold) < 0) {
            return Grade.NORMAL;
        }
        return ratio.compareTo(blockThreshold) < 0 ? Grade.WARN : Grade.BLOCK;
    }
}
