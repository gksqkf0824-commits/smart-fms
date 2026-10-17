package com.smartfms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;

import com.smartfms.backend.domain.CarwashRequest;
import com.smartfms.backend.domain.CarwashStatus;
import com.smartfms.backend.domain.Dispatch;
import com.smartfms.backend.domain.DispatchStatus;
import com.smartfms.backend.domain.Grade;
import com.smartfms.backend.domain.Inspection;
import com.smartfms.backend.domain.User;
import com.smartfms.backend.domain.Vehicle;
import com.smartfms.backend.domain.VehicleStatus;
import com.smartfms.backend.dto.ResumeResponse;
import com.smartfms.backend.repository.CarwashRequestRepository;
import com.smartfms.backend.repository.InspectionRepository;
import com.smartfms.backend.repository.PenaltyRepository;
import com.smartfms.backend.repository.VehicleRepository;

/** 배차 재개 — 차량 상태·세차 요청 변경을 실제 스키마 위에서 검증 (DB 설정은 test/resources/application.properties) */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class VehicleResumeTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private InspectionRepository inspectionRepository;

    @Autowired
    private CarwashRequestRepository carwashRequestRepository;

    @Autowired
    private PenaltyRepository penaltyRepository;

    private VehicleService vehicleService;

    @BeforeEach
    void setUp() {
        vehicleService = new VehicleService(vehicleRepository, inspectionRepository,
                carwashRequestRepository, penaltyRepository, mock(ImageStorage.class));
    }

    private Vehicle vehicle(String plate, VehicleStatus status) {
        return em.persist(Vehicle.builder().plate(plate).status(status).build());
    }

    private CarwashRequest carwashRequested(Vehicle vehicle) {
        Inspection inspection = em.persist(Inspection.builder()
                .vehicle(vehicle)
                .roiPollutionRatio(new BigDecimal("0.080"))
                .trashCount(0)
                .trashLarge(false)
                .occupyDetected(false)
                .grade(Grade.BLOCK)
                .userAlert(false)
                .build());
        return em.persist(CarwashRequest.builder().vehicle(vehicle).inspection(inspection).partner("강남 세차연합").build());
    }

    @Test
    void 세차_필요_차량을_운행_가능으로_돌리고_세차_요청을_완료_처리한다() {
        Vehicle dirty = vehicle("12가3456", VehicleStatus.CARWASH_NEEDED);
        CarwashRequest request = carwashRequested(dirty);

        ResumeResponse result = vehicleService.resume("12가3456");
        em.flush();
        em.clear();

        assertThat(result).isEqualTo(new ResumeResponse("12가3456", VehicleStatus.AVAILABLE));
        assertThat(em.find(Vehicle.class, dirty.getId()).getStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        assertThat(em.find(CarwashRequest.class, request.getId()).getStatus()).isEqualTo(CarwashStatus.DONE);
    }

    @Test
    void 다른_차량의_세차_요청은_건드리지_않는다() {
        vehicle("12가3456", VehicleStatus.CARWASH_NEEDED);
        CarwashRequest other = carwashRequested(vehicle("34나5678", VehicleStatus.CARWASH_NEEDED));

        vehicleService.resume("12가3456");
        em.flush();
        em.clear();

        assertThat(em.find(CarwashRequest.class, other.getId()).getStatus()).isEqualTo(CarwashStatus.REQUESTED);
    }

    @Test
    void 이미_운행_가능하면_그대로_성공한다() {
        vehicle("12가3456", VehicleStatus.AVAILABLE);

        assertThat(vehicleService.resume("12가3456").status()).isEqualTo(VehicleStatus.AVAILABLE);
    }

    @Test
    void 검수_중인_차량은_재개할_수_없다() {
        Vehicle inspecting = vehicle("12가3456", VehicleStatus.INSPECTING);

        assertThatThrownBy(() -> vehicleService.resume("12가3456"))
                .isInstanceOf(InvalidVehicleStateException.class);
        assertThat(inspecting.getStatus()).isEqualTo(VehicleStatus.INSPECTING);
    }

    @Test
    void 차단된_예약은_되살리지_않는다() {
        Vehicle dirty = vehicle("12가3456", VehicleStatus.CARWASH_NEEDED);
        User user = em.persist(User.builder().name("김이용").build());
        Dispatch blocked = em.persist(Dispatch.builder().vehicle(dirty).user(user).status(DispatchStatus.BLOCKED).build());

        vehicleService.resume("12가3456");
        em.flush();
        em.clear();

        assertThat(em.find(Dispatch.class, blocked.getId()).getStatus()).isEqualTo(DispatchStatus.BLOCKED);
    }

    @Test
    void 없는_차량이면_예외() {
        assertThatThrownBy(() -> vehicleService.resume("00가0000"))
                .isInstanceOf(VehicleNotFoundException.class);
    }
}
