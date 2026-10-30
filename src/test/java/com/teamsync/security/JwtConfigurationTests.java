package com.teamsync.security;

import org.springframework.security.oauth2.jwt.JwtException;
import com.teamsync.entity.User;
import org.junit.jupiter.api.Test;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;

class JwtConfigurationTests {
    private final SecurityConfig config = new SecurityConfig();

    @Test void rejectsInvalidKeys() {
        for (String key : new String[]{null,"","a".repeat(62),"a".repeat(65),"z".repeat(64)})
            assertThatThrownBy(() -> config.signingKey(key)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test void rotatedKeyRejectsOldSignatures() {
        var key = config.signingKey("a".repeat(64));
        var user = User.builder().id(UUID.randomUUID()).build();
        String token = new JwtService(config.jwtEncoder(key),60000).generateToken(user);
        assertThat(config.jwtDecoder(key).decode(token).getSubject()).isEqualTo(user.getId().toString());
        assertThatThrownBy(() -> config.jwtDecoder(config.signingKey("b".repeat(64))).decode(token))
                .isInstanceOf(JwtException.class);
    }

    @Test void rejectsNonPositiveExpiration() {
        assertThatThrownBy(() -> new JwtService(config.jwtEncoder(config.signingKey("a".repeat(64))),0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
