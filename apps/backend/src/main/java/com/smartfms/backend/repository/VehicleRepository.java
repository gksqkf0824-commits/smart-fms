package com.smartfms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartfms.backend.domain.Vehicle;
import com.smartfms.backend.domain.VehicleStatus;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    /** 차량 번호로 조회 — /return, /vehicles/{plate}에서 사용 */
    Optional<Vehicle> findByPlate(String plate);

    /** 특정 상태(AVAILABLE 등)의 차량 목록 조회 — 4~5주차 Swap 로직에서 사용 */
    List<Vehicle> findByStatus(VehicleStatus status);
}
