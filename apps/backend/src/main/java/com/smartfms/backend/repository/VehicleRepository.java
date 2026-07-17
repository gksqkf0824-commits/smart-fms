package com.smartfms.backend.repository;

import com.smartfms.backend.domain.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    /** 차량 번호로 조회 — /return, /vehicles/{plate}에서 사용 */
    Optional<Vehicle> findByPlate(String plate);
}
