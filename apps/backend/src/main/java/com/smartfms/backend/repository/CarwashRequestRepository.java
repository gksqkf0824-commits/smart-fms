package com.smartfms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartfms.backend.domain.CarwashRequest;

@Repository
public interface CarwashRequestRepository extends JpaRepository<CarwashRequest, Long> {
}
