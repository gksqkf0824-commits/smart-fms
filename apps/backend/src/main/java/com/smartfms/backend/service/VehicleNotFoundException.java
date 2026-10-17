package com.smartfms.backend.service;

/** 존재하지 않는 차량 번호로 조회·반납을 시도한 경우 */
public class VehicleNotFoundException extends RuntimeException {

    public VehicleNotFoundException(String plate) {
        super("존재하지 않는 차량입니다: " + plate);
    }
}
