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

    /**
     * 오염 발생 시 해당 차량의 다음 예약을 깨끗한 차량으로 Swap 및 차단
     * @return Swap 처리 성공 여부 (대체 차량으로 교체되었으면 true, 차단만 되었거나 예약이 없으면 false)
     */
    @Transactional
    public boolean swapNextDispatch(Long dirtyVehicleId) {
        // 1. 오염된 차량의 다음 예정된 배차(RESERVED) 조회
        Dispatch targetDispatch = dispatchRepository
                .findFirstByVehicleIdAndStatusOrderByCreatedAtAsc(dirtyVehicleId, DispatchStatus.RESERVED)
                .orElse(null);

        if (targetDispatch == null) {
            // 다음 예약이 없으면 Swap하지 않고 종료
            return false;
        }

        // 2. 현재 이용 가능(AVAILABLE)한 정상 차량 목록 조회
        List<Long> alreadyClaimedVehicleIds = dispatchRepository.findSwappedVehicleIds();
        Vehicle newVehicle = vehicleRepository.findByStatus(VehicleStatus.AVAILABLE).stream()
                .filter(candidate -> !candidate.getId().equals(dirtyVehicleId))
                .filter(candidate -> !alreadyClaimedVehicleIds.contains(candidate.getId()))
                .findFirst()
                .orElse(null);

        // 3. 대체 차량을 찾았으면 Swap, 못 찾았으면 차단만
        if (newVehicle != null) {
            targetDispatch.swapTo(newVehicle);
            dispatchRepository.save(targetDispatch);
            return true;
        } else {
            targetDispatch.block();
            dispatchRepository.save(targetDispatch);
            return false;
        }
    }
}