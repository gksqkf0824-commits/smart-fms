package com.smartfms.backend.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 반납 검수 (핵심 테이블, 반납 1건 = 1행) — db/schema.sql inspections */
@Entity
@Table(name = "inspections")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    /** 반납한 직전 이용자 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    /** 오염(spill) 면적 비율 (0.000~1.000) — Segmentation 결과 */
    @Column(name = "roi_pollution_ratio", nullable = false, precision = 4, scale = 3)
    @Builder.Default
    private BigDecimal roiPollutionRatio = BigDecimal.ZERO;

    /** 쓰레기 감지 개수 (Detection) */
    @Column(name = "trash_count", nullable = false)
    @Builder.Default
    private Integer trashCount = 0;

    /** 대형 쓰레기 여부 (ROI 1% 이상) */
    @Column(name = "trash_large", nullable = false)
    @Builder.Default
    private Boolean trashLarge = false;

    /** 소지품/유실물 감지 여부 (Detection) */
    @Column(name = "occupy_detected", nullable = false)
    @Builder.Default
    private Boolean occupyDetected = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Grade grade;

    /** 유실물 안내 발송 여부 */
    @Column(name = "user_alert", nullable = false)
    @Builder.Default
    private Boolean userAlert = false;

    /** S3 경로 문자열만 저장 (이미지 바이너리 금지 — docs/AGREEMENTS.md 3번) */
    @Column(name = "image_key", length = 255)
    private String imageKey;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}