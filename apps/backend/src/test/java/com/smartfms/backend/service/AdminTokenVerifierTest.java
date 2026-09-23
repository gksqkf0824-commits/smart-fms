package com.smartfms.backend.service;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AdminTokenVerifierTest {

    @Test
    void 토큰이_일치하면_통과한다() {
        assertThatCode(() -> new AdminTokenVerifier("secret").verify("secret")).doesNotThrowAnyException();
    }

    @Test
    void 서버에_토큰이_설정되지_않았으면_빈_토큰으로도_통과할_수_없다() {
        AdminTokenVerifier verifier = new AdminTokenVerifier("");

        assertThatThrownBy(() -> verifier.verify("")).isInstanceOf(AdminAuthException.class);
        assertThatThrownBy(() -> verifier.verify(null)).isInstanceOf(AdminAuthException.class);
    }
}
