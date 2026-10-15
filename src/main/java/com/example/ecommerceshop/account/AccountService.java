package com.example.ecommerceshop.account;

import com.example.ecommerceshop.account.AccountDtos.ChangePasswordRequest;
import com.example.ecommerceshop.account.AccountDtos.ProfileResponse;
import com.example.ecommerceshop.account.AccountDtos.UpdateProfileRequest;
import com.example.ecommerceshop.user.User;
import com.example.ecommerceshop.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;

@Service
public class AccountService {
    private static final long MAX_AVATAR_BYTES = 5L * 1024 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Path avatarDirectory;

    public AccountService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          @Value("${app.upload-dir:uploads}") String uploadDirectory) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.avatarDirectory = Path.of(uploadDirectory, "avatars").toAbsolutePath().normalize();
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(long userId) {
        return toResponse(findUser(userId));
    }

    @Transactional
    public ProfileResponse updateProfile(long userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email này đã được sử dụng.");
        }

        LocalDate birthday = request.birthday();
        if (birthday != null && birthday.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày sinh không hợp lệ.");
        }

        user.updateProfile(request.fullName().trim(), email, normalize(request.phone()), birthday,
                normalize(request.occupation()), normalize(request.bio()), normalize(request.address()),
                normalize(request.district()), normalize(request.city()));
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(long userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        String currentHash = user.getPasswordHash();
        if (currentHash == null || !passwordEncoder.matches(request.currentPassword(), currentHash)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không chính xác.");
        }
        if (passwordEncoder.matches(request.newPassword(), currentHash)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải khác mật khẩu hiện tại.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public ProfileResponse updateAvatar(long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn ảnh đại diện.");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh đại diện tối đa 5 MB.");
        }

        String contentType = file.getContentType();
        String extension;
        try {
            byte[] bytes = file.getBytes();
            if (MediaTypeCheck.isPng(contentType) && startsWith(bytes, PNG_SIGNATURE)) {
                extension = ".png";
            } else if (MediaTypeCheck.isJpeg(contentType) && isJpeg(bytes)) {
                extension = ".jpg";
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh phải có định dạng JPG hoặc PNG hợp lệ.");
            }

            User user = findUser(userId);
            Files.createDirectories(avatarDirectory);
            String filename = "user-" + userId + "-" + UUID.randomUUID() + extension;
            Path destination = avatarDirectory.resolve(filename).normalize();
            if (!destination.startsWith(avatarDirectory)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên tệp không hợp lệ.");
            }
            Files.write(destination, bytes);
            removePreviousAvatar(user.getAvatarUrl());
            user.setAvatarUrl("/uploads/avatars/" + filename);
            return toResponse(userRepository.save(user));
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu ảnh đại diện.", exception);
        }
    }

    private User findUser(long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));
    }

    private ProfileResponse toResponse(User user) {
        return new ProfileResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(),
                user.getBirthday(), user.getOccupation(), user.getBio(), user.getAddress(), user.getDistrict(),
                user.getCity(), user.getAvatarUrl());
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private boolean startsWith(byte[] bytes, byte[] signature) {
        if (bytes.length < signature.length) return false;
        for (int index = 0; index < signature.length; index++) {
            if (bytes[index] != signature[index]) return false;
        }
        return true;
    }

    private boolean isJpeg(byte[] bytes) {
        return bytes.length >= 3 && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;
    }

    private void removePreviousAvatar(String avatarUrl) {
        if (avatarUrl == null || !avatarUrl.matches("/uploads/avatars/user-\\d+-[0-9a-fA-F-]+\\.(png|jpg)")) return;
        Path oldFile = avatarDirectory.resolve(Path.of(avatarUrl).getFileName()).normalize();
        if (!oldFile.startsWith(avatarDirectory)) return;
        try {
            Files.deleteIfExists(oldFile);
        } catch (IOException ignored) {
            // A stale avatar file can be cleaned up later without failing the profile update.
        }
    }

    private static final class MediaTypeCheck {
        private static boolean isPng(String contentType) {
            return "image/png".equalsIgnoreCase(contentType);
        }

        private static boolean isJpeg(String contentType) {
            return "image/jpeg".equalsIgnoreCase(contentType);
        }
    }
}
