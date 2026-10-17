package com.smartfms.backend.controller;

import com.smartfms.backend.dto.ResumeResponse;
import com.smartfms.backend.dto.VehicleDetailResponse;
import com.smartfms.backend.dto.VehicleListResponse;
import com.smartfms.backend.service.AdminTokenVerifier;
import com.smartfms.backend.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final AdminTokenVerifier adminTokenVerifier;

    /** 차량 목록 — 관제 대시보드 D1 (docs/API.md) */
    @GetMapping("/vehicles")
    public List<VehicleListResponse> getVehicles() {
        return vehicleService.getVehicles();
    }

    /** 차량 상세 — 관제 대시보드 D2 (docs/API.md) */
    @GetMapping("/vehicles/{plate}")
    public VehicleDetailResponse getVehicleDetail(@PathVariable String plate) {
        return vehicleService.getVehicleDetail(plate);
    }

    /** 배차 재개 — 세차 완료 후 관리자가 수동으로 (docs/API.md, 헤더 X-Admin-Token 필요) */
    @PostMapping("/vehicles/{plate}/resume")
    public ResumeResponse resume(@PathVariable String plate,
                                 @RequestHeader(value = AdminTokenVerifier.HEADER, required = false) String adminToken) {
        adminTokenVerifier.verify(adminToken);
        return vehicleService.resume(plate);
    }
}
