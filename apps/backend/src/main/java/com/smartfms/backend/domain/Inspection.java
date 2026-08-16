package com.smartfms.backend.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    /** 합산 오염도 (0.000~1.000) */
    @Column(name = "roi_pollution_ratio", nullable = false, precision = 4, scale = 3)
    private BigDecimal roiPollutionRatio;

    /** 고형 쓰레기 면적 비율 */
    @Column(name = "trash_ratio", nullable = false, precision = 4, scale = 3)
    @Builder.Default
    private BigDecimal trashRatio = BigDecimal.ZERO;

    /** 액체·얼룩 면적 비율 */
    @Column(name = "spill_ratio", nullable = false, precision = 4, scale = 3)
    @Builder.Default
    private BigDecimal spillRatio = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Grade grade;

    /** S3 경로 문자열만 저장 (이미지 바이너리 금지 — docs/AGREEMENTS.md 3번) */
    @Column(name = "image_key", length = 255)
    private String imageKey;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
