package com.smartfms.backend.service;

import java.math.BigDecimal;

import com.smartfms.backend.domain.Grade;

/**
 * 오염 감지 알림 발송 창구 (WARN·BLOCK 반납 시 호출).
 */
public interface Notifier {

    /**
     * @param dispatchSuspended 이 반납으로 해당 차량의 자동배차가 중지됐는지 여부 (BLOCK 등급일 때 true)
     */
    void notify(String plate, BigDecimal ratio, Grade grade, boolean dispatchSuspended);
}
