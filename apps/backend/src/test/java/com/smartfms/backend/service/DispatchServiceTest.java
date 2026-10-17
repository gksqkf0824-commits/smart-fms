package com.smartfms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

import com.smartfms.backend.domain.Dispatch;
import com.smartfms.backend.domain.DispatchStatus;
import com.smartfms.backend.domain.User;
import com.smartfms.backend.domain.Vehicle;
import com.smartfms.backend.domain.VehicleStatus;

/**
 * 오염 차량의 다음 예약 Swap — findSwappedVehicleIds 쿼리까지 실제로 실행해 검증한다.
 * DB는 H2(PostgreSQL 모드)에 운영과 같은 db/schema.sql을 올려 쓴다 (JPA는 validate만).
 * DB 설정은 src/test/resources/application.properties 참고.
 */
@DataJpaTest
// 테스트 설정의 H2(PostgreSQL 모드)를 그대로 쓴다 — 기본값(ANY)은 모드 없는 H2로 바꿔치기함
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(DispatchService.class)
class DispatchServiceTest {

    @Autowired
    private DispatchService dispatchService;

    @Autowired
    private TestEntityManager em;

    private User user;

    @BeforeEach
    void setUp() {
        user = em.persist(User.builder().name("김이용").build());
    }

    private Vehicle vehicle(String plate, VehicleStatus status) {
        return em.persist(Vehicle.builder().plate(plate).status(status).build());
    }

    private Dispatch reserve(Vehicle vehicle) {
        return em.persist(Dispatch.builder().vehicle(vehicle).user(user).build());
    }

    private Dispatch reload(Dispatch dispatch) {
        em.flush();
        em.clear();
        return em.find(Dispatch.class, dispatch.getId());
    }

    @Test
    void 다음_예약을_운행_가능한_다른_차량으로_Swap한다() {
        Vehicle dirty = vehicle("11가1111", VehicleStatus.CARWASH_NEEDED);
        Vehicle clean = vehicle("22나2222", VehicleStatus.AVAILABLE);
        Dispatch reservation = reserve(dirty);

        assertThat(dispatchService.swapNextDispatch(dirty.getId())).isTrue();

        Dispatch result = reload(reservation);
        assertThat(result.getStatus()).isEqualTo(DispatchStatus.SWAPPED);
        assertThat(result.getSwappedTo().getId()).isEqualTo(clean.getId());
    }

    @Test
    void 대체_차량이_없으면_예약을_차단만_한다() {
        Vehicle dirty = vehicle("11가1111", VehicleStatus.CARWASH_NEEDED);
        vehicle("22나2222", VehicleStatus.CARWASH_NEEDED);
        Dispatch reservation = reserve(dirty);

        assertThat(dispatchService.swapNextDispatch(dirty.getId())).isFalse();

        Dispatch result = reload(reservation);
        assertThat(result.getStatus()).isEqualTo(DispatchStatus.BLOCKED);
        assertThat(result.getSwappedTo()).isNull();
    }

    @Test
    void 오염_차량_자신은_상태와_무관하게_대체_후보에서_제외한다() {
        Vehicle dirty = vehicle("11가1111", VehicleStatus.AVAILABLE);
        Dispatch reservation = reserve(dirty);

        assertThat(dispatchService.swapNextDispatch(dirty.getId())).isFalse();
        assertThat(reload(reservation).getStatus()).isEqualTo(DispatchStatus.BLOCKED);
    }

    @Test
    void 예약이_없으면_아무것도_바꾸지_않는다() {
        Vehicle dirty = vehicle("11가1111", VehicleStatus.CARWASH_NEEDED);
        vehicle("22나2222", VehicleStatus.AVAILABLE);

        assertThat(dispatchService.swapNextDispatch(dirty.getId())).isFalse();
    }

    @Test
    void 가장_먼저_잡힌_예약부터_Swap한다() {
        Vehicle dirty = vehicle("11가1111", VehicleStatus.CARWASH_NEEDED);
        vehicle("22나2222", VehicleStatus.AVAILABLE);
        Dispatch first = reserve(dirty);
        Dispatch second = reserve(dirty);

        dispatchService.swapNextDispatch(dirty.getId());

        assertThat(reload(first).getStatus()).isEqualTo(DispatchStatus.SWAPPED);
        assertThat(reload(second).getStatus()).isEqualTo(DispatchStatus.RESERVED);
    }

    /** 회귀: 6aed8a8 — 같은 대체 차량이 두 예약에 중복 배정되던 문제 */
    @Test
    void 이미_대체_배정된_차량은_다른_예약에_다시_배정하지_않는다() {
        Vehicle dirtyA = vehicle("11가1111", VehicleStatus.CARWASH_NEEDED);
        Vehicle dirtyB = vehicle("33다3333", VehicleStatus.CARWASH_NEEDED);
        Vehicle onlyClean = vehicle("22나2222", VehicleStatus.AVAILABLE);
        Dispatch reservationA = reserve(dirtyA);
        Dispatch reservationB = reserve(dirtyB);

        assertThat(dispatchService.swapNextDispatch(dirtyA.getId())).isTrue();
        em.flush();
        assertThat(dispatchService.swapNextDispatch(dirtyB.getId())).isFalse();

        assertThat(reload(reservationA).getSwappedTo().getId()).isEqualTo(onlyClean.getId());
        Dispatch resultB = reload(reservationB);
        assertThat(resultB.getStatus()).isEqualTo(DispatchStatus.BLOCKED);
        assertThat(resultB.getSwappedTo()).isNull();
    }

    /** 회귀: 17a4171 — 끝난 배차의 대체 차량이 Swap 후보에서 영구 제외되던 문제 */
    @Test
    void 대체_배정이_끝난_차량은_다시_Swap_후보가_된다() {
        Vehicle dirtyA = vehicle("11가1111", VehicleStatus.CARWASH_NEEDED);
        Vehicle dirtyB = vehicle("33다3333", VehicleStatus.CARWASH_NEEDED);
        Vehicle onlyClean = vehicle("22나2222", VehicleStatus.AVAILABLE);
        Dispatch reservationA = reserve(dirtyA);
        Dispatch reservationB = reserve(dirtyB);

        dispatchService.swapNextDispatch(dirtyA.getId());
        reload(reservationA).markReturned();   // 대체 차량으로 이용을 마침
        em.flush();

        assertThat(dispatchService.swapNextDispatch(dirtyB.getId())).isTrue();
        assertThat(reload(reservationB).getSwappedTo().getId()).isEqualTo(onlyClean.getId());
    }
}
