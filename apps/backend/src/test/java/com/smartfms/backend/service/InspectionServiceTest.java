package com.smartfms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.test.util.ReflectionTestUtils;

import com.smartfms.backend.domain.Dispatch;
import com.smartfms.backend.domain.DispatchStatus;
import com.smartfms.backend.domain.Grade;
import com.smartfms.backend.domain.User;
import com.smartfms.backend.domain.Vehicle;
import com.smartfms.backend.domain.VehicleStatus;
import com.smartfms.backend.dto.AiPredictResponse;
import com.smartfms.backend.dto.ReturnResponse;
import com.smartfms.backend.repository.CarwashRequestRepository;
import com.smartfms.backend.repository.DispatchRepository;
import com.smartfms.backend.repository.InspectionRepository;
import com.smartfms.backend.repository.PenaltyRepository;
import com.smartfms.backend.repository.VehicleRepository;

/** 반납 처리 — 2-Track 등급 판정(docs/API.md 2번)과 등급별 조치(docs/AGREEMENTS.md 7번) */
class InspectionServiceTest {

    private static final String PLATE = "12가3456";

    private final VehicleRepository vehicleRepository = mock(VehicleRepository.class);
    private final InspectionRepository inspectionRepository = mock(InspectionRepository.class);
    private final DispatchRepository dispatchRepository = mock(DispatchRepository.class);
    private final PenaltyRepository penaltyRepository = mock(PenaltyRepository.class);
    private final CarwashRequestRepository carwashRequestRepository = mock(CarwashRequestRepository.class);
    private final DispatchService dispatchService = mock(DispatchService.class);
    private final AiClient aiClient = mock(AiClient.class);
    private final ImageStorage imageStorage = mock(ImageStorage.class);
    private final Notifier notifier = mock(Notifier.class);

    private InspectionService service;
    private Vehicle vehicle;
    private User previousUser;
    private Dispatch inUse;

    @BeforeEach
    void setUp() {
        service = new InspectionService(vehicleRepository, inspectionRepository, dispatchRepository,
                penaltyRepository, carwashRequestRepository, dispatchService, aiClient, imageStorage, notifier);
        ReflectionTestUtils.setField(service, "warnThreshold", new BigDecimal("0.02"));
        ReflectionTestUtils.setField(service, "blockThreshold", new BigDecimal("0.05"));
        ReflectionTestUtils.setField(service, "carwashPartner", "강남 세차연합");

        vehicle = Vehicle.builder().plate(PLATE).status(VehicleStatus.INSPECTING).build();
        ReflectionTestUtils.setField(vehicle, "id", 1L);
        previousUser = User.builder().name("김이용").build();
        inUse = Dispatch.builder().vehicle(vehicle).user(previousUser).status(DispatchStatus.IN_USE).build();

        when(vehicleRepository.findByPlate(PLATE)).thenReturn(Optional.of(vehicle));
        when(imageStorage.store(any(), eq(PLATE))).thenReturn("inspections/2026/test.jpg");
        when(inspectionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(dispatchRepository.findFirstByVehicleIdAndStatusOrderByCreatedAtDesc(1L, DispatchStatus.IN_USE))
                .thenReturn(Optional.of(inUse));
    }

    private ReturnResponse returnWith(String spillRatio, int trashCount, boolean trashLarge, boolean occupy) {
        when(aiClient.predict(any()))
                .thenReturn(new AiPredictResponse(new BigDecimal(spillRatio), trashCount, trashLarge, occupy));
        return service.processReturn(PLATE, new byte[] {1});
    }

    @ParameterizedTest(name = "오염 {0}, 쓰레기 {1}개, 대형 {2} → {3}")
    @CsvSource({
            // Track 2 — 오염 면적 (2% / 5% 경계 포함)
            "0.000, 0, false, NORMAL",
            "0.019, 0, false, NORMAL",
            "0.020, 0, false, WARN",
            "0.049, 0, false, WARN",
            "0.050, 0, false, BLOCK",
            // Track 1 — 쓰레기 개수·크기
            "0.000, 1, false, WARN",
            "0.000, 2, false, WARN",
            "0.000, 3, false, BLOCK",
            "0.000, 1, true,  BLOCK",
            // 통합 — 더 심각한 쪽, 둘 다 WARN이면 WARN
            "0.030, 2, false, WARN",
            "0.060, 1, false, BLOCK",
            "0.010, 3, false, BLOCK",
    })
    void 두_트랙을_독립_판정한_뒤_더_심각한_등급을_적용한다(String spill, int trash, boolean large, Grade expected) {
        assertThat(returnWith(spill, trash, large, false).grade()).isEqualTo(expected);
    }

    @Test
    void BLOCK이면_배차_차단_세차_패널티_알림을_모두_실행한다() {
        ReturnResponse result = returnWith("0.080", 0, false, false);

        assertThat(result.actions())
                .containsExactly("dispatch_blocked", "carwash_requested", "penalty_reserved", "notified");
        verify(dispatchService).swapNextDispatch(1L);
        verify(carwashRequestRepository).save(any());
        verify(notifier).notify(eq(PLATE), any(), eq(Grade.BLOCK), eq(true));
        assertThat(previousUser.getPenaltyPoints()).isEqualTo(10);
        assertThat(vehicle.getStatus()).isEqualTo(VehicleStatus.CARWASH_NEEDED);
        assertThat(inUse.getStatus()).isEqualTo(DispatchStatus.RETURNED);
    }

    @Test
    void WARN이면_세차_패널티_알림만_하고_배차는_막지_않는다() {
        ReturnResponse result = returnWith("0.030", 0, false, false);

        assertThat(result.actions()).containsExactly("carwash_requested", "penalty_reserved", "notified");
        verify(dispatchService, never()).swapNextDispatch(anyLong());
        verify(notifier).notify(eq(PLATE), any(), eq(Grade.WARN), eq(false));
        assertThat(previousUser.getPenaltyPoints()).isEqualTo(5);
        assertThat(vehicle.getStatus()).isEqualTo(VehicleStatus.CARWASH_NEEDED);
    }

    @Test
    void NORMAL이면_아무_조치_없이_운행_가능으로_돌린다() {
        ReturnResponse result = returnWith("0.000", 0, false, false);

        assertThat(result.actions()).isEmpty();
        verifyNoInteractions(dispatchService, carwashRequestRepository, penaltyRepository, notifier);
        assertThat(previousUser.getPenaltyPoints()).isZero();
        assertThat(vehicle.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        assertThat(inUse.getStatus()).isEqualTo(DispatchStatus.RETURNED);
    }

    @Test
    void 소지품은_등급에_영향_없이_유실물_알림만_보낸다() {
        ReturnResponse result = returnWith("0.000", 0, false, true);

        assertThat(result.grade()).isEqualTo(Grade.NORMAL);
        assertThat(result.userAlert()).isTrue();
        assertThat(result.actions()).containsExactly("user_alerted");
        assertThat(vehicle.getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
    }

    @Test
    void 직전_이용자가_없으면_패널티_없이_나머지_조치만_한다() {
        when(dispatchRepository.findFirstByVehicleIdAndStatusOrderByCreatedAtDesc(1L, DispatchStatus.IN_USE))
                .thenReturn(Optional.empty());

        ReturnResponse result = returnWith("0.080", 0, false, false);

        assertThat(result.actions()).containsExactly("dispatch_blocked", "carwash_requested", "notified");
        verifyNoInteractions(penaltyRepository);
    }

    @Test
    void 없는_차량이면_AI를_호출하지_않고_404용_예외를_던진다() {
        assertThatThrownBy(() -> service.processReturn("00가0000", new byte[] {1}))
                .isInstanceOf(VehicleNotFoundException.class);
        verifyNoInteractions(aiClient, imageStorage);
        verify(notifier, never()).notify(any(), any(), any(), anyBoolean());
    }
}
