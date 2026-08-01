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
}
