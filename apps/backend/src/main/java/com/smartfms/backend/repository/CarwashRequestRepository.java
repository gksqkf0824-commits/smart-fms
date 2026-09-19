package com.smartfms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartfms.backend.domain.CarwashRequest;

@Repository
public interface CarwashRequestRepository extends JpaRepository<CarwashRequest, Long> {

    /** 해당 검수로 세차가 요청됐는지 — actions 역산용 */
    boolean existsByInspectionId(Long inspectionId);
}
