package com.smartfms.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import com.smartfms.backend.domain.Grade;

/**
 * POST /return 응답 — docs/API.md 스펙 기준.
 * 고객 화면(S3 결과) 및 프론트에 반납 검수 결과를 전달한다.
 */
public record ReturnResponse(
        String vehicle,                 // 차량 번호
        BigDecimal roiPollutionRatio,   // spill_ratio 오염도 (0.000~1.000)
        int trashCount,                 // 감지된 쓰레기 개수
        boolean occupyDetected,         // 소지품 감지 여부
        Grade grade,                    // NORMAL / WARN / BLOCK
        boolean userAlert,              // 유실물 알림 발송 여부
        List<String> actions,           // 실행된 조치 목록 (carwash_requested, penalty_reserved 등)
        String imageKey                 // S3 이미지 경로
) {
}