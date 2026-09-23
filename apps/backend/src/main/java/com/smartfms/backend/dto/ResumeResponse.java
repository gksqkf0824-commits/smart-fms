package com.smartfms.backend.dto;

import com.smartfms.backend.domain.VehicleStatus;

/** POST /vehicles/{plate}/resume 응답 — docs/API.md */
public record ResumeResponse(
        String plate,
        VehicleStatus status
) {}
