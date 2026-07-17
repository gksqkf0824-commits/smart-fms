package com.smartfms.backend.repository;

import com.smartfms.backend.domain.Inspection;
import com.smartfms.backend.domain.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {

    /** 차량의 가장 최근 검수 1건 — idx_inspections_vehicle_created 인덱스 활용 */
    Optional<Inspection> findTopByVehicleOrderByCreatedAtDesc(Vehicle vehicle);
}
