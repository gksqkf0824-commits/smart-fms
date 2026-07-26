package com.smartfms.backend.controller;

import com.smartfms.backend.dto.VehicleListResponse;
import com.smartfms.backend.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    /** 차량 목록 — 관제 대시보드 D1 (docs/API.md) */
    @GetMapping("/vehicles")
    public List<VehicleListResponse> getVehicles() {
        return vehicleService.getVehicles();
    }
}
