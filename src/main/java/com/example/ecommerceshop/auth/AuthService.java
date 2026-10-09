package com.example.ecommerceshop.auth;

import com.example.ecommerceshop.auth.AuthDtos.AuthResponse;
import com.example.ecommerceshop.auth.AuthDtos.AuthUserResponse;
import com.example.ecommerceshop.auth.AuthDtos.LoginRequest;
import com.example.ecommerceshop.auth.AuthDtos.RegisterRequest;
import com.example.ecommerceshop.user.User;
import com.example.ecommerceshop.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {
    private static final Duration TOKEN_LIFETIME = Duration.ofHours(12);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email này đã được đăng ký.");
        }

        String phone = request.phone() == null || request.phone().isBlank() ? null : request.phone().trim();
        User user = new User(request.fullName().trim(), email, passwordEncoder.encode(request.password()), phone);
        return createAuthResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        User user = userRepository.findByEmail(email).orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return createAuthResponse(user);
    }

    private AuthResponse createAuthResponse(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ecommerce-shop")
                .issuedAt(now)
                .expiresAt(now.plus(TOKEN_LIFETIME))
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(token, "Bearer", TOKEN_LIFETIME.toSeconds(),
                new AuthUserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole()));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng.");
    }
}