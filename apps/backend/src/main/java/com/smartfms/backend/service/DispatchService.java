package com.smartfms.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartfms.backend.domain.Dispatch;
import com.smartfms.backend.domain.DispatchStatus;
import com.smartfms.backend.domain.Vehicle;
import com.smartfms.backend.domain.VehicleStatus;
import com.smartfms.backend.repository.DispatchRepository;
import com.smartfms.backend.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DispatchService {

    private final DispatchRepository dispatchRepository;
    private final VehicleRepository vehicleRepository;

    /** 오염 발생 시 해당 차량의 다음 예약을 깨끗한 차량으로 Swap 및 차단 */
    @Transactional
    public void swapNextDispatch(Long dirtyVehicleId) {
        // 1. 오염된 차량의 다음 예정된 배차(RESERVED) 조회
        Dispatch targetDispatch = dispatchRepository
                .findFirstByVehicleIdAndStatusOrderByCreatedAtAsc(dirtyVehicleId, DispatchStatus.RESERVED)
                .orElse(null);

        if (targetDispatch == null) {
            // 다음 예약이 없으면 Swap하지 않고 종료
            return;
        }

        // 2. 현재 이용 가능(AVAILABLE)한 정상 차량 목록 조회
        List<Vehicle> availableVehicles = vehicleRepository.findByStatus(VehicleStatus.AVAILABLE);

        Vehicle newVehicle = availableVehicles.isEmpty() ? null : availableVehicles.get(0);

        // 3. 엔티티에 정의된 block 메서드를 통해 차단 및 대체 차량 Swap 등록
        targetDispatch.block(newVehicle);
        dispatchRepository.save(targetDispatch);
    }
}