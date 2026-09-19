package com.smartfms.backend.service;

import com.smartfms.backend.domain.Grade;
import com.smartfms.backend.domain.Inspection;
import com.smartfms.backend.domain.Vehicle;
import com.smartfms.backend.dto.VehicleDetailResponse;
import com.smartfms.backend.dto.VehicleDetailResponse.LatestInspection;
import com.smartfms.backend.dto.VehicleListResponse;
import com.smartfms.backend.repository.CarwashRequestRepository;
import com.smartfms.backend.repository.InspectionRepository;
import com.smartfms.backend.repository.PenaltyRepository;
import com.smartfms.backend.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final InspectionRepository inspectionRepository;
    private final CarwashRequestRepository carwashRequestRepository;
    private final PenaltyRepository penaltyRepository;
    private final ImageStorage imageStorage;

    /** 대시보드 D1: 전체 차량 + 각 차량의 최근 오염도 */
    public List<VehicleListResponse> getVehicles() {
        return vehicleRepository.findAll().stream()
                .map(vehicle -> VehicleListResponse.of(
                        vehicle,
                        inspectionRepository.findTopByVehicleOrderByCreatedAtDesc(vehicle).orElse(null)))
                .toList();
    }

    /** 대시보드 D2: 차량 상세 + 최근 검수 내역(사진 임시 링크 포함) */
    public VehicleDetailResponse getVehicleDetail(String plate) {
        Vehicle vehicle = vehicleRepository.findByPlate(plate)
                .orElseThrow(() -> new VehicleNotFoundException(plate));

        LatestInspection latest = inspectionRepository.findTopByVehicleOrderByCreatedAtDesc(vehicle)
                .map(this::toLatestInspection)
                .orElse(null);

        return new VehicleDetailResponse(
                vehicle.getPlate(), vehicle.getZone(), vehicle.getModel(), vehicle.getStatus(), latest);
    }

    private LatestInspection toLatestInspection(Inspection inspection) {
        return new LatestInspection(
                inspection.getRoiPollutionRatio(),
                inspection.getTrashCount(),
                inspection.getTrashLarge(),
                inspection.getOccupyDetected(),
                inspection.getGrade(),
                inspection.getUserAlert(),
                imageStorage.presignedUrl(inspection.getImageKey()),
                toActions(inspection),
                inspection.getCreatedAt());
    }

    /**
     * 반납 시 실행된 조치 목록을 역산한다.
     * actions는 별도 컬럼으로 저장하지 않고, 등급과 실제로 생성된 기록에서 되짚는다.
     */
    private List<String> toActions(Inspection inspection) {
        List<String> actions = new ArrayList<>();
        if (inspection.getGrade() == Grade.BLOCK) {
            actions.add("dispatch_blocked");
        }
        if (carwashRequestRepository.existsByInspectionId(inspection.getId())) {
            actions.add("carwash_requested");
        }
        if (penaltyRepository.existsByInspectionId(inspection.getId())) {
            actions.add("penalty_reserved");
        }
        if (inspection.getGrade() != Grade.NORMAL) {
            actions.add("notified");
        }
        if (Boolean.TRUE.equals(inspection.getUserAlert()) || Boolean.TRUE.equals(inspection.getOccupyDetected())) {
            actions.add("user_alerted");
        }
        return actions;
    }
}