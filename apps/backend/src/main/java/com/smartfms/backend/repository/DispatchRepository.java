package com.smartfms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.smartfms.backend.domain.Dispatch;
import com.smartfms.backend.domain.DispatchStatus;

@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, Long> {

    /** 오염 발생 시 Swap 대상이 될 '다음 예정된 배차' 1건 조회 */
    Optional<Dispatch> findFirstByVehicleIdAndStatusOrderByCreatedAtAsc(Long vehicleId, DispatchStatus status);

    /** 반납 처리 대상 — 해당 차량의 가장 최근 배차 1건 (직전 이용자 식별용) */
    Optional<Dispatch> findFirstByVehicleIdAndStatusOrderByCreatedAtDesc(Long vehicleId, DispatchStatus status);

    /** 이미 다른 배차의 대체 차량(swappedTo)으로 배정된 차량 id 목록 — Swap 후보에서 제외하기 위함 */
    @Query("SELECT d.swappedTo.id FROM Dispatch d WHERE d.swappedTo IS NOT NULL")
    List<Long> findSwappedVehicleIds();
}
