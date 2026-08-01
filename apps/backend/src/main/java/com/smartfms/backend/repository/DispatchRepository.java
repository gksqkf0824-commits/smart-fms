package com.smartfms.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartfms.backend.domain.Dispatch;
import com.smartfms.backend.domain.DispatchStatus;

@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, Long> {

    /** 오염 발생 시 Swap 대상이 될 '다음 예정된 배차' 1건 조회 */
    Optional<Dispatch> findFirstByVehicleIdAndStatusOrderByCreatedAtAsc(Long vehicleId, DispatchStatus status);

    /** 반납 처리 대상 — 해당 차량의 가장 최근 배차 1건 (직전 이용자 식별용) */
    Optional<Dispatch> findFirstByVehicleIdAndStatusOrderByCreatedAtDesc(Long vehicleId, DispatchStatus status);
}
