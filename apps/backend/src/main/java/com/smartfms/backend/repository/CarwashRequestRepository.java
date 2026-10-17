package com.smartfms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartfms.backend.domain.CarwashRequest;
import com.smartfms.backend.domain.CarwashStatus;

@Repository
public interface CarwashRequestRepository extends JpaRepository<CarwashRequest, Long> {

    /** 해당 검수로 세차가 요청됐는지 — actions 역산용 */
    boolean existsByInspectionId(Long inspectionId);

    /** 배차 재개 시 완료 처리할 미완료 세차 요청 */
    List<CarwashRequest> findByVehicleIdAndStatus(Long vehicleId, CarwashStatus status);
}
