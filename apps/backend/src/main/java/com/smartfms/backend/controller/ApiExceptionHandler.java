package com.smartfms.backend.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.smartfms.backend.service.AdminAuthException;
import com.smartfms.backend.service.AiServerException;
import com.smartfms.backend.service.InvalidVehicleStateException;
import com.smartfms.backend.service.VehicleNotFoundException;

/** 공통 예외 → HTTP 상태 매핑 (없는 차량을 500이 아니라 404로 응답) */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(VehicleNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleVehicleNotFound(VehicleNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("detail", e.getMessage()));
    }

    @ExceptionHandler(AdminAuthException.class)
    public ResponseEntity<Map<String, String>> handleAdminAuth(AdminAuthException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("detail", e.getMessage()));
    }

    @ExceptionHandler(InvalidVehicleStateException.class)
    public ResponseEntity<Map<String, String>> handleInvalidState(InvalidVehicleStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("detail", e.getMessage()));
    }

    /** AI 판정 불가 → 반납을 통과시키지 않고 재시도를 유도 (원인은 서버 로그에만) */
    @ExceptionHandler(AiServerException.class)
    public ResponseEntity<Map<String, String>> handleAiServer(AiServerException e) {
        log.error("[AI 서버 오류] {}", e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("detail", "ai_unavailable"));
    }
}
