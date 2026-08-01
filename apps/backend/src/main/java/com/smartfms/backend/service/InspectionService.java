package com.smartfms.backend.service;

import java.math.BigDecimal;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartfms.backend.domain.Grade;
import com.smartfms.backend.domain.Inspection;
import com.smartfms.backend.domain.Vehicle;
import com.smartfms.backend.domain.VehicleStatus;
import com.smartfms.backend.dto.InspectionCreateRequest;
import com.smartfms.backend.repository.InspectionRepository;
import com.smartfms.backend.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InspectionService {

    private final VehicleRepository vehicleRepository;
    private final InspectionRepository inspectionRepository;
    private final DispatchService dispatchService;

    // 오염 임계값 (예: 10% 이상 오염 시 dirty 판정 -> 0.100)
    private static final BigDecimal POLLUTION_THRESHOLD = new BigDecimal("0.100");
    // 등급 판정 상한 — docs/AGREEMENTS.md 5번: ~10% NORMAL / 10~30% WARN / 30%~ BLOCK
    private static final BigDecimal BLOCK_THRESHOLD = new BigDecimal("0.300");

    /** AI 검수 결과 수신 후 차량 상태 변경 및 Swap 트리거 */
    @Transactional
    public Long processInspection(InspectionCreateRequest request) {
        // 1. 검수 대상 차량 조회
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 차량입니다. ID: " + request.vehicleId()));

        // 2. 오염 여부 판단 (오염 비율이 0.10 이상인지 확인)
        boolean isDirty = request.pollutionRatio() != null 
                && request.pollutionRatio().compareTo(POLLUTION_THRESHOLD) >= 0;

        // 3. Inspection(검수 결과) 저장
        Inspection inspection = Inspection.builder()
                .vehicle(vehicle)
                .roiPollutionRatio(request.pollutionRatio() != null ? request.pollutionRatio() : BigDecimal.ZERO)
                .grade(judgeGrade(request.pollutionRatio()))
                .imageKey(request.rawAiResultUrl())
                .build();
        
        Inspection savedInspection = inspectionRepository.save(inspection);

        // 4. 상태 머신 및 Swap 로직 연동
        if (isDirty) {
            // 오염 시: 차량 상태를 세차 필요(CARWASH_NEEDED)로 변경
            vehicle.changeStatus(VehicleStatus.CARWASH_NEEDED); 
            
            // 다음 예약자 배차 Swap 트리거 실행
            dispatchService.swapNextDispatch(vehicle.getId());
        } else {
            // 정상 시: 차량 상태를 사용가능(AVAILABLE)으로 유지
            vehicle.changeStatus(VehicleStatus.AVAILABLE);
        }

        vehicleRepository.save(vehicle);
        return savedInspection.getId();
    }

    /** 오염도 → 등급 판정 (docs/AGREEMENTS.md 5번 기준) */
    private Grade judgeGrade(BigDecimal pollutionRatio) {
        if (pollutionRatio == null || pollutionRatio.compareTo(POLLUTION_THRESHOLD) < 0) {
            return Grade.NORMAL;
        }
        return pollutionRatio.compareTo(BLOCK_THRESHOLD) < 0 ? Grade.WARN : Grade.BLOCK;
    }
}
