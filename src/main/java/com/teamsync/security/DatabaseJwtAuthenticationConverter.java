package com.teamsync.security;

import com.teamsync.entity.User;
import com.teamsync.repository.UserRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/** Never trust token role claims: reload the account and its current authority on every request. */
@Component
public class DatabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {
    private final UserRepository users;

    public DatabaseJwtAuthenticationConverter(UserRepository users) {
        this.users = users;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        UUID id;
        try {
            id = UUID.fromString(jwt.getSubject());
        } catch (RuntimeException ex) {
            throw new InvalidBearerTokenException("Invalid token");
        }
        User user = users.findById(id).orElseThrow(() -> new InvalidBearerTokenException("Invalid token"));
        if (!JwtService.passwordVersion(user).equals(jwt.getClaimAsString("passwordVersion"))) {
            throw new InvalidBearerTokenException("Invalid token");
        }
        return new UsernamePasswordAuthenticationToken(user.getEmail(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
    }
}
