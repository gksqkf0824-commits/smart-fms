package com.smartfms.backend.service;

/** 현재 차량 상태에서 요청한 작업을 할 수 없는 경우 — 409로 응답 */
public class InvalidVehicleStateException extends RuntimeException {

    public InvalidVehicleStateException(String message) {
        super(message);
    }
}
