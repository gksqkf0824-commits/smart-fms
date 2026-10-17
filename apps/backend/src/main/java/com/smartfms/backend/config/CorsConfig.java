package com.smartfms.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS 허용 설정.
 * 브라우저는 프론트(5173)에서 백엔드(8080)로 가는 요청을 기본 차단하므로,
 * 허용할 출처를 서버가 명시해야 한다. 허용 목록은 환경변수로 외부화 (배포 시 도메인만 교체).
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
        // allowCredentials는 켜지 않음 — 쿠키 인증을 쓰지 않고,
        // 이후 JWT는 Authorization 헤더로 전달하므로 불필요 (보안상 기본 off 유지)
    }
}
