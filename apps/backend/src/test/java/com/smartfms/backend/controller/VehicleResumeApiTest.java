package com.smartfms.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.smartfms.backend.domain.VehicleStatus;
import com.smartfms.backend.dto.ResumeResponse;
import com.smartfms.backend.service.AdminTokenVerifier;
import com.smartfms.backend.service.InvalidVehicleStateException;
import com.smartfms.backend.service.VehicleNotFoundException;
import com.smartfms.backend.service.VehicleService;

/** POST /vehicles/{plate}/resume — 관리자 토큰 인증과 HTTP 상태 매핑 */
@WebMvcTest(value = VehicleController.class, properties = "app.admin.token=test-admin-token")
@Import(AdminTokenVerifier.class)
class VehicleResumeApiTest {

    private static final String URL = "/vehicles/12가3456/resume";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VehicleService vehicleService;

    @Test
    void 올바른_토큰이면_재개하고_변경된_상태를_돌려준다() throws Exception {
        when(vehicleService.resume("12가3456")).thenReturn(new ResumeResponse("12가3456", VehicleStatus.AVAILABLE));

        mockMvc.perform(post(URL).header(AdminTokenVerifier.HEADER, "test-admin-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plate").value("12가3456"))
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
    }

    @Test
    void 토큰이_없으면_401이고_재개하지_않는다() throws Exception {
        mockMvc.perform(post(URL))
                .andExpect(status().isUnauthorized());
        verify(vehicleService, never()).resume(any());
    }

    @Test
    void 토큰이_틀리면_401이고_재개하지_않는다() throws Exception {
        mockMvc.perform(post(URL).header(AdminTokenVerifier.HEADER, "wrong"))
                .andExpect(status().isUnauthorized());
        verify(vehicleService, never()).resume(any());
    }

    @Test
    void 없는_차량이면_404() throws Exception {
        when(vehicleService.resume("12가3456")).thenThrow(new VehicleNotFoundException("12가3456"));

        mockMvc.perform(post(URL).header(AdminTokenVerifier.HEADER, "test-admin-token"))
                .andExpect(status().isNotFound());
    }

    @Test
    void 재개할_수_없는_상태면_409() throws Exception {
        when(vehicleService.resume("12가3456")).thenThrow(new InvalidVehicleStateException("검수 중"));

        mockMvc.perform(post(URL).header(AdminTokenVerifier.HEADER, "test-admin-token"))
                .andExpect(status().isConflict());
    }
}
