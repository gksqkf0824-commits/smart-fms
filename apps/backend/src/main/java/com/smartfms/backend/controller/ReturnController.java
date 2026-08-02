package com.smartfms.backend.controller;

import java.io.IOException;
import java.io.UncheckedIOException;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.smartfms.backend.dto.ReturnResponse;
import com.smartfms.backend.service.InspectionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class ReturnController {

    private final InspectionService inspectionService;

    /**
     * 반납하기 — docs/API.md `POST /return`.
     * 고객 폰이 차량번호와 실내 사진(원본)을 보내면, 뒤의 자동화가 모두 여기서 실행된다.
     */
    @PostMapping(value = "/return", consumes = "multipart/form-data")
    public ReturnResponse createReturn(@RequestParam("plate") String plate,
                                       @RequestParam("image") MultipartFile image) {
        try {
            return inspectionService.processReturn(plate, image.getBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("업로드된 이미지를 읽을 수 없습니다.", e);
        }
    }
}
