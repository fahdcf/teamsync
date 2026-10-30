package com.teamsync;

import com.teamsync.infrastructure.security.JwtUtil;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {
    @Test
    void signsAndValidatesWithConfiguredKey() {
        JwtUtil jwt = new JwtUtil("a".repeat(64), 60_000);
        String token = jwt.generateToken("demo@example.test");
        assertTrue(jwt.validateToken(token));
        assertEquals("demo@example.test", jwt.extractEmail(token));
    }

    @Test
    void rotatedKeyRejectsPreviouslySignedTokens() {
        JwtUtil previous = new JwtUtil("a".repeat(64), 60_000);
        JwtUtil rotated = new JwtUtil("b".repeat(64), 60_000);
        assertFalse(rotated.validateToken(previous.generateToken("demo@example.test")));
    }

    @Test
    void rejectsMissingShortOddLengthOrNonHexKeys() {
        for (String invalid : new String[] { null, "", "a".repeat(62), "a".repeat(65), "z".repeat(64) }) {
            assertThrows(IllegalArgumentException.class, () -> new JwtUtil(invalid, 60_000));
        }
    }
}
