package com.example.ecommerceshop.auth;

import com.example.ecommerceshop.auth.AuthDtos.AuthResponse;
import com.example.ecommerceshop.auth.AuthDtos.AuthUserResponse;
import com.example.ecommerceshop.auth.AuthDtos.LoginRequest;
import com.example.ecommerceshop.auth.AuthDtos.RegisterRequest;
import com.example.ecommerceshop.auth.AuthDtos.PhoneCodeRequest;
import com.example.ecommerceshop.auth.AuthDtos.PhoneLoginRequest;
import com.example.ecommerceshop.auth.AuthDtos.PhoneCodeResponse;
import com.example.ecommerceshop.account.PhoneNumbers;
import com.example.ecommerceshop.notification.SmsSender;
import com.example.ecommerceshop.user.User;
import com.example.ecommerceshop.user.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
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
import java.time.LocalDateTime;
import java.sql.Timestamp;
import java.security.SecureRandom;
import java.util.List;

@Service
public class AuthService {
    private static final Duration TOKEN_LIFETIME = Duration.ofHours(12);
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JdbcTemplate jdbc;
    private final SmsSender smsSender;
    private static final SecureRandom RANDOM = new SecureRandom();

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
                       JdbcTemplate jdbc, SmsSender smsSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.jdbc = jdbc;
        this.smsSender = smsSender;
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
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }
        return createAuthResponse(user);
    }

    @Transactional
    public PhoneCodeResponse sendPhoneLoginCode(PhoneCodeRequest request) {
        String phone = PhoneNumbers.normalize(request.phone());
        PhoneIdentity identity = findPhoneIdentity(phone);
        if (identity == null || !"ACTIVE".equalsIgnoreCase(identity.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Số này chưa liên kết và xác minh với tài khoản LensRent đang hoạt động. Hãy đăng nhập bằng email, xác minh số trong Cài đặt tài khoản rồi thử lại.");
        }
        Integer recent = jdbc.queryForObject("SELECT COUNT(*) FROM login_phone_codes WHERE phone=? AND created_at>CURRENT_TIMESTAMP-INTERVAL '30 seconds'", Integer.class, phone);
        if (recent != null && recent > 0) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng chờ 30 giây trước khi yêu cầu mã mới.");
        String code = String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);
        jdbc.update("""
                INSERT INTO login_phone_codes(phone,code_hash,expires_at,attempts,created_at)
                VALUES(?,?,?,?,CURRENT_TIMESTAMP)
                ON CONFLICT(phone) DO UPDATE SET code_hash=EXCLUDED.code_hash,expires_at=EXCLUDED.expires_at,
                    attempts=0,created_at=CURRENT_TIMESTAMP
                """, phone, passwordEncoder.encode(code), Timestamp.valueOf(expiresAt), 0);
        smsSender.send(phone, "LensRent: ma dang nhap cua ban la " + code + ". Ma co hieu luc trong 5 phut. Khong chia se ma nay voi bat ky ai.");
        return new PhoneCodeResponse(phone, expiresAt);
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public AuthResponse loginWithPhone(PhoneLoginRequest request) {
        String phone = PhoneNumbers.normalize(request.phone());
        List<PhoneChallenge> challenges = jdbc.query("SELECT code_hash,expires_at,attempts FROM login_phone_codes WHERE phone=? FOR UPDATE",
                (rs,n) -> new PhoneChallenge(rs.getString("code_hash"),rs.getTimestamp("expires_at").toLocalDateTime(),rs.getInt("attempts")), phone);
        if (challenges.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hãy yêu cầu mã đăng nhập trước.");
        PhoneChallenge challenge = challenges.get(0);
        if (!challenge.expiresAt().isAfter(LocalDateTime.now())) {
            jdbc.update("DELETE FROM login_phone_codes WHERE phone=?", phone);
            throw new ResponseStatusException(HttpStatus.GONE, "Mã đăng nhập đã hết hạn. Hãy yêu cầu mã mới.");
        }
        if (challenge.attempts() >= 5) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Bạn đã nhập sai quá số lần cho phép. Hãy yêu cầu mã mới.");
        if (!passwordEncoder.matches(request.code(), challenge.codeHash())) {
            jdbc.update("UPDATE login_phone_codes SET attempts=attempts+1 WHERE phone=?", phone);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Mã đăng nhập không chính xác.");
        }
        PhoneIdentity identity = findPhoneIdentity(phone);
        if (identity == null) throw invalidCredentials();
        if (!"ACTIVE".equalsIgnoreCase(identity.status())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        jdbc.update("DELETE FROM login_phone_codes WHERE phone=?", phone);
        return createAuthResponse(identity);
    }

    private PhoneIdentity findPhoneIdentity(String phone) {
        String[] digits = PhoneNumbers.lookupDigits(phone);
        List<PhoneIdentity> matches = jdbc.query("""
                SELECT u.id,u.full_name,u.email,u.role,u.status FROM users u
                JOIN account_verifications v ON v.user_id=u.id AND v.verified_phone=u.phone AND v.phone_verified_at IS NOT NULL
                WHERE regexp_replace(COALESCE(u.phone,''),'[^0-9]','','g') IN (?,?)
                ORDER BY id LIMIT 2
                """, (rs,n) -> new PhoneIdentity(rs.getLong("id"),rs.getString("full_name"),rs.getString("email"),rs.getString("role"),rs.getString("status")), digits[0], digits[1]);
        if (matches.size() > 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "Số điện thoại đang được gắn với nhiều tài khoản. Vui lòng liên hệ hỗ trợ.");
        return matches.isEmpty() ? null : matches.get(0);
    }

    private AuthResponse createAuthResponse(User user) {
        return createAuthResponse(new PhoneIdentity(user.getId(), user.getFullName(), user.getEmail(), user.getRole(), user.getStatus()));
    }

    private AuthResponse createAuthResponse(PhoneIdentity user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("ecommerce-shop")
                .issuedAt(now)
                .expiresAt(now.plus(TOKEN_LIFETIME))
                .subject(user.email())
                .claim("userId", user.id())
                .claim("role", user.role())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AuthResponse(token, "Bearer", TOKEN_LIFETIME.toSeconds(),
                new AuthUserResponse(user.id(), user.fullName(), user.email(), user.role()));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng.");
    }

    private record PhoneIdentity(Long id, String fullName, String email, String role, String status) {}
    private record PhoneChallenge(String codeHash, LocalDateTime expiresAt, int attempts) {}
}
