package com.smartfms.backend.domain;

/** 배차 상태 — db/schema.sql dispatches.status CHECK와 동일 */
public enum DispatchStatus {
    RESERVED, IN_USE, RETURNED, BLOCKED, SWAPPED
}
