package com.smartfms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartfms.backend.domain.Penalty;

@Repository
public interface PenaltyRepository extends JpaRepository<Penalty, Long> {
}
