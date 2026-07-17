package com.smartfms.backend.service;

import com.smartfms.backend.dto.VehicleListResponse;
import com.smartfms.backend.repository.InspectionRepository;
import com.smartfms.backend.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final InspectionRepository inspectionRepository;

    /** 대시보드 D1: 전체 차량 + 각 차량의 최근 오염도 */
    public List<VehicleListResponse> getVehicles() {
        return vehicleRepository.findAll().stream()
                .map(vehicle -> VehicleListResponse.of(
                        vehicle,
                        inspectionRepository.findTopByVehicleOrderByCreatedAtDesc(vehicle).orElse(null)))
                .toList();
    }
}
