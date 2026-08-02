package com.smartfms.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartfms.backend.domain.Inspection;
import com.smartfms.backend.domain.Vehicle;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {

    /** 차량의 가장 최근 검수 1건 — idx_inspections_vehicle_created 인덱스 활용 */
    Optional<Inspection> findTopByVehicleOrderByCreatedAtDesc(Vehicle vehicle);
}