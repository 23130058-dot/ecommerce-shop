package com.example.ecommerceshop.account;

import com.example.ecommerceshop.account.VerificationDtos.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.security.SecureRandom;

@Service
public class AccountVerificationService {
    private static final long MAX_DOCUMENT_BYTES = 3L * 1024 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public AccountVerificationService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public VerificationResponse get(long userId) {
        return verificationResponse(userId);
    }

    @Transactional
    public PhoneCodeResponse sendPhoneCode(long userId, PhoneCodeRequest request) {
        String phone = normalizePhone(request.phone());
        Integer recent = jdbc.queryForObject("""
                SELECT COUNT(*) FROM account_phone_verification_codes
                WHERE user_id = ? AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 seconds'
                """, Integer.class, userId);
        if (recent != null && recent > 0) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Vui lòng chờ 30 giây trước khi yêu cầu mã mới.");
        }

        String code = String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);
        jdbc.update("""
                INSERT INTO account_phone_verification_codes(user_id, phone, code_hash, expires_at, attempts, created_at)
                VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id) DO UPDATE SET phone = EXCLUDED.phone, code_hash = EXCLUDED.code_hash,
                    expires_at = EXCLUDED.expires_at, attempts = 0, created_at = CURRENT_TIMESTAMP
                """, userId, phone, passwordEncoder.encode(code), Timestamp.valueOf(expiresAt));
        return new PhoneCodeResponse(phone, code, expiresAt);
    }

    @Transactional(noRollbackFor = ResponseStatusException.class)
    public VerificationResponse confirmPhone(long userId, ConfirmPhoneRequest request) {
        String phone = normalizePhone(request.phone());
        List<PhoneChallenge> matches = jdbc.query("""
                SELECT phone, code_hash, expires_at, attempts FROM account_phone_verification_codes WHERE user_id = ?
                """, (rs, rowNum) -> new PhoneChallenge(rs.getString("phone"), rs.getString("code_hash"),
                rs.getTimestamp("expires_at").toLocalDateTime(), rs.getInt("attempts")), userId);
        if (matches.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hãy yêu cầu mã xác minh trước.");
        PhoneChallenge challenge = matches.get(0);
        if (!challenge.phone().equals(phone)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không khớp mã đã gửi.");
        if (!challenge.expiresAt().isAfter(LocalDateTime.now())) {
            jdbc.update("DELETE FROM account_phone_verification_codes WHERE user_id = ?", userId);
            throw new ResponseStatusException(HttpStatus.GONE, "Mã đã hết hạn. Hãy yêu cầu mã mới.");
        }
        if (challenge.attempts() >= 5) throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Bạn đã nhập sai quá số lần cho phép. Hãy yêu cầu mã mới sau 30 giây.");
        if (!passwordEncoder.matches(request.code(), challenge.codeHash())) {
            jdbc.update("UPDATE account_phone_verification_codes SET attempts = attempts + 1 WHERE user_id = ?", userId);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã xác minh không chính xác.");
        }

        ensureVerificationRow(userId);
        int changed = jdbc.update("UPDATE users SET phone = ? WHERE id = ?", phone, userId);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản.");
        jdbc.update("UPDATE account_verifications SET verified_phone = ?, phone_verified_at = CURRENT_TIMESTAMP WHERE user_id = ?", phone, userId);
        jdbc.update("DELETE FROM account_phone_verification_codes WHERE user_id = ?", userId);
        return verificationResponse(userId);
    }

    @Transactional
    public VerificationResponse submitDocument(long userId, String type, MultipartFile file) {
        DocumentKind kind = DocumentKind.from(type);
        if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn ảnh giấy tờ.");
        if (file.getSize() > MAX_DOCUMENT_BYTES) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Tệp xác minh tối đa 3 MB.");

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không đọc được tệp đã chọn.", error);
        }
        String contentType = detectContentType(file.getContentType(), bytes, kind);
        ensureVerificationRow(userId);
        String fileName = safeFileName(file.getOriginalFilename(), kind, contentType);
        String sql = """
                UPDATE account_verifications SET %s_status = 'PENDING', %s_file_name = ?, %s_content_type = ?,
                    %s_data = ?, %s_submitted_at = CURRENT_TIMESTAMP, %s_review_note = NULL,
                    %s_reviewed_at = NULL, %s_reviewed_by = NULL WHERE user_id = ?
                """.formatted(kind.prefix(), kind.prefix(), kind.prefix(), kind.prefix(), kind.prefix(), kind.prefix(), kind.prefix(), kind.prefix());
        jdbc.update(sql, fileName, contentType, bytes, userId);
        return verificationResponse(userId);
    }

    @Transactional(readOnly = true)
    public List<AdminVerificationResponse> listForAdmin(String status) {
        String normalized = status == null || status.isBlank() ? "ALL" : status.trim().toUpperCase(Locale.ROOT);
        if (!List.of("ALL", "PENDING", "APPROVED", "REJECTED").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bộ lọc xác minh không hợp lệ.");
        }
        String condition = normalized.equals("ALL")
                ? "(v.student_card_status <> 'NOT_SUBMITTED' OR v.identity_status <> 'NOT_SUBMITTED')"
                : "(v.student_card_status = ? OR v.identity_status = ?)";
        String sql = """
                SELECT u.id, u.full_name, u.email, u.phone,
                       v.student_card_status, v.student_card_review_note, v.student_card_submitted_at,
                       v.identity_status, v.identity_review_note, v.identity_submitted_at
                FROM account_verifications v JOIN users u ON u.id = v.user_id
                WHERE %s ORDER BY GREATEST(COALESCE(v.student_card_submitted_at, TIMESTAMP '1970-01-01'),
                                           COALESCE(v.identity_submitted_at, TIMESTAMP '1970-01-01')) DESC, u.id DESC
                """.formatted(condition);
        var mapper = (org.springframework.jdbc.core.RowMapper<AdminVerificationResponse>) (rs, rowNum) ->
                new AdminVerificationResponse(rs.getLong("id"), rs.getString("full_name"), rs.getString("email"),
                        rs.getString("phone"), rs.getString("student_card_status"), rs.getString("student_card_review_note"),
                        local(rs.getTimestamp("student_card_submitted_at")), rs.getString("identity_status"),
                        rs.getString("identity_review_note"), local(rs.getTimestamp("identity_submitted_at")));
        return normalized.equals("ALL") ? jdbc.query(sql, mapper) : jdbc.query(sql, mapper, normalized, normalized);
    }

    @Transactional(readOnly = true)
    public VerificationDocument adminDocument(long userId, String type) {
        DocumentKind kind = DocumentKind.from(type);
        String sql = "SELECT %s_data, %s_content_type, %s_file_name FROM account_verifications WHERE user_id = ?".formatted(kind.prefix(), kind.prefix(), kind.prefix());
        List<VerificationDocument> documents = jdbc.query(sql, (rs, rowNum) -> {
            byte[] content = rs.getBytes(1);
            return content == null ? null : new VerificationDocument(content, rs.getString(2), rs.getString(3));
        }, userId).stream().filter(java.util.Objects::nonNull).toList();
        if (documents.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy giấy tờ xác minh.");
        return documents.get(0);
    }

    @Transactional
    public void review(long adminId, long userId, String type, VerificationReviewRequest request) {
        DocumentKind kind = DocumentKind.from(type);
        String status = request.status().trim().toUpperCase(Locale.ROOT);
        String sql = """
                UPDATE account_verifications SET %s_status = ?, %s_review_note = ?, %s_reviewed_at = CURRENT_TIMESTAMP,
                    %s_reviewed_by = ? WHERE user_id = ? AND %s_status = 'PENDING' AND %s_data IS NOT NULL
                """.formatted(kind.prefix(), kind.prefix(), kind.prefix(), kind.prefix(), kind.prefix(), kind.prefix());
        int changed = jdbc.update(sql, status, StringUtils.hasText(request.note()) ? request.note().trim() : null,
                adminId, userId);
        if (changed == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Giấy tờ không còn ở trạng thái chờ duyệt.");
    }

    public long countPending() {
        Long count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM account_verifications
                WHERE student_card_status = 'PENDING' OR identity_status = 'PENDING'
                """, Long.class);
        return count == null ? 0 : count;
    }

    private VerificationResponse verificationResponse(long userId) {
        List<VerificationResponse> rows = jdbc.query("""
                SELECT u.phone, v.verified_phone, v.phone_verified_at,
                       COALESCE(v.student_card_status, 'NOT_SUBMITTED') student_card_status,
                       v.student_card_review_note, v.student_card_submitted_at,
                       COALESCE(v.identity_status, 'NOT_SUBMITTED') identity_status,
                       v.identity_review_note, v.identity_submitted_at
                FROM users u LEFT JOIN account_verifications v ON v.user_id = u.id WHERE u.id = ?
                """, (rs, rowNum) -> {
            String phone = rs.getString("phone");
            String verifiedPhone = rs.getString("verified_phone");
            Timestamp verifiedAt = rs.getTimestamp("phone_verified_at");
            boolean verified = phone != null && phone.equals(verifiedPhone) && verifiedAt != null;
            return new VerificationResponse(phone, verified, verified ? local(verifiedAt) : null,
                    rs.getString("student_card_status"), rs.getString("student_card_review_note"),
                    local(rs.getTimestamp("student_card_submitted_at")), rs.getString("identity_status"),
                    rs.getString("identity_review_note"), local(rs.getTimestamp("identity_submitted_at")));
        }, userId);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản.");
        return rows.get(0);
    }

    private void ensureVerificationRow(long userId) {
        int changed = jdbc.update("INSERT INTO account_verifications(user_id) VALUES (?) ON CONFLICT (user_id) DO NOTHING", userId);
        if (changed == 0) {
            Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ?", Integer.class, userId);
            if (exists == null || exists == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản.");
        }
    }

    private String normalizePhone(String input) {
        String phone = input == null ? "" : input.trim().replaceAll("[\\s().-]", "");
        long digitCount = phone.chars().filter(Character::isDigit).count();
        if (!phone.matches("\\+?[0-9]{8,15}") || digitCount < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại không hợp lệ.");
        }
        return phone;
    }

    private String detectContentType(String requestedType, byte[] bytes, DocumentKind kind) {
        boolean jpeg = "image/jpeg".equalsIgnoreCase(requestedType) && bytes.length >= 3
                && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
        boolean png = "image/png".equalsIgnoreCase(requestedType) && startsWith(bytes, PNG_SIGNATURE);
        boolean pdf = kind == DocumentKind.IDENTITY && "application/pdf".equalsIgnoreCase(requestedType)
                && bytes.length >= 5 && bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F' && bytes[4] == '-';
        if (jpeg) return "image/jpeg";
        if (png) return "image/png";
        if (pdf) return "application/pdf";
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, kind == DocumentKind.STUDENT_CARD
                ? "Thẻ sinh viên chỉ nhận ảnh JPG hoặc PNG hợp lệ."
                : "Căn cước chỉ nhận ảnh JPG, PNG hoặc PDF hợp lệ.");
    }

    private String safeFileName(String original, DocumentKind kind, String contentType) {
        String name = original == null ? "" : original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).replaceAll("[^A-Za-z0-9._-]", "_");
        if (!StringUtils.hasText(name)) name = kind.name().toLowerCase(Locale.ROOT) + "-" + UUID.randomUUID();
        if (name.length() > 180) name = name.substring(name.length() - 180);
        if (contentType.equals("application/pdf") && !name.toLowerCase(Locale.ROOT).endsWith(".pdf")) name += ".pdf";
        return name;
    }

    private boolean startsWith(byte[] bytes, byte[] prefix) {
        if (bytes.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) if (bytes[i] != prefix[i]) return false;
        return true;
    }

    private LocalDateTime local(Timestamp timestamp) { return timestamp == null ? null : timestamp.toLocalDateTime(); }
    private record PhoneChallenge(String phone, String codeHash, LocalDateTime expiresAt, int attempts) {}
    private enum DocumentKind {
        STUDENT_CARD("student_card"), IDENTITY("identity");
        private final String prefix;
        DocumentKind(String prefix) { this.prefix = prefix; }
        String prefix() { return prefix; }
        static DocumentKind from(String value) {
            if ("student-card".equalsIgnoreCase(value) || "STUDENT_CARD".equalsIgnoreCase(value)) return STUDENT_CARD;
            if ("identity".equalsIgnoreCase(value) || "cccd".equalsIgnoreCase(value)) return IDENTITY;
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại giấy tờ không hợp lệ.");
        }
    }
}
