package com.smartfms.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartfms.backend.dto.InspectionCreateRequest;
import com.smartfms.backend.service.InspectionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InspectionController {

    private final InspectionService inspectionService;

    /**
     * AI 반납 검수 결과 수신 API
     * POST /api/inspections
     */
    @PostMapping
    public ResponseEntity<Long> createInspection(@RequestBody InspectionCreateRequest request) {
        Long inspectionId = inspectionService.processInspection(request);
        return ResponseEntity.ok(inspectionId);
    }
}