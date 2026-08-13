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
        //    오염 차량 자신은 아직 상태가 갱신되기 전이라 후보에 남아 있을 수 있으므로 제외하고,
        //    이미 다른 배차의 대체 차량으로 배정된 차량도 중복 배정되지 않도록 제외한다
        List<Long> alreadyClaimedVehicleIds = dispatchRepository.findSwappedVehicleIds();
        Vehicle newVehicle = vehicleRepository.findByStatus(VehicleStatus.AVAILABLE).stream()
                .filter(candidate -> !candidate.getId().equals(dirtyVehicleId))
                .filter(candidate -> !alreadyClaimedVehicleIds.contains(candidate.getId()))
                .findFirst()
                .orElse(null);

        // 3. 대체 차량을 찾았으면 Swap, 못 찾았으면 차단만
        if (newVehicle != null) {
            targetDispatch.swapTo(newVehicle);
        } else {
            targetDispatch.block();
        }
        dispatchRepository.save(targetDispatch);
    }
}