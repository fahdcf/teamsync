package com.teamsync.security;

import com.teamsync.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class JwtService {
    public static final String ISSUER = "teamsync";
    private final JwtEncoder encoder;
    private final long expirationMs;

    public JwtService(JwtEncoder encoder, @Value("${jwt.expiration-ms}") long expirationMs) {
        if (expirationMs <= 0) throw new IllegalArgumentException("JWT expiration must be positive");
        this.encoder = encoder;
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER).subject(user.getId().toString())
                .issuedAt(now).expiresAt(now.plusMillis(expirationMs))
                .claim("passwordVersion", passwordVersion(user)).build();
        return encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    public static String passwordVersion(User user) {
        return user.getPasswordUpdatedAt() == null ? "initial" : user.getPasswordUpdatedAt().toString();
    }
}
