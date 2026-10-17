package com.smartfms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartfms.backend.domain.Penalty;

@Repository
public interface PenaltyRepository extends JpaRepository<Penalty, Long> {

    /** 해당 검수로 패널티가 부과됐는지 — actions 역산용 */
    boolean existsByInspectionId(Long inspectionId);
}
