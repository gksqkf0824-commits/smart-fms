package com.smartfms.backend.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/** 배차 이력 (+ 차단/Swap 기록) — db/schema.sql dispatches */
@Entity
@Table(name = "dispatches")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Dispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private DispatchStatus status = DispatchStatus.RESERVED;

    /** Swap된 경우 대체 차량 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "swapped_to")
    private Vehicle swappedTo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 오염 반납으로 배차 차단 + 대체 차량 Swap */
    public void block(Vehicle swappedTo) {
        this.status = DispatchStatus.BLOCKED;
        this.swappedTo = swappedTo;
    }

    /** 이용 종료(반납) 처리 */
    public void markReturned() {
        this.status = DispatchStatus.RETURNED;
    }
}
