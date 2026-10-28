package com.example.ecommerceshop.marketplace;

import com.example.ecommerceshop.marketplace.MarketplaceDtos.StoreProfileRequest;
import com.example.ecommerceshop.marketplace.MarketplaceDtos.StoreImageUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Service
public class OwnerStorefrontService {
    private static final long MAX_IMAGE_BYTES = 8L * 1024 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};
    private final JdbcTemplate jdbc;
    private final Path storefrontDirectory;

    public OwnerStorefrontService(JdbcTemplate jdbc,
            @Value("${app.upload-dir:uploads}") String uploadDirectory) {
        this.jdbc = jdbc;
        this.storefrontDirectory = Path.of(uploadDirectory, "storefront").toAbsolutePath().normalize();
    }

    @Transactional(readOnly=true)
    public StoreProfileRequest profile(long ownerId) {
        List<StoreProfileRequest> rows=jdbc.query("""
                SELECT s.store_name,s.description,s.city,s.address,s.contact_phone,s.contact_email,
                       s.business_hours,s.facebook_url,s.instagram_url,s.logo_url,s.cover_image_url
                FROM owner_stores s WHERE s.owner_id=?
                """,(rs,n)->profileFrom(rs.getString("store_name"),rs.getString("description"),rs.getString("city"),
                        rs.getString("address"),rs.getString("contact_phone"),rs.getString("contact_email"),
                        rs.getString("business_hours"),rs.getString("facebook_url"),rs.getString("instagram_url"),
                        rs.getString("logo_url"),rs.getString("cover_image_url")),ownerId);
        if(rows.isEmpty()) {
            List<StoreProfileRequest> defaults=jdbc.query("""
                    SELECT COALESCE(NULLIF(BTRIM(full_name),''),'Gian hàng LensRent')||' Studio' store_name,
                           'Gian hàng thiết bị quay chụp trên LensRent.' description,city
                    FROM users WHERE id=?
                    """,(rs,n)->profileFrom(rs.getString("store_name"),rs.getString("description"),rs.getString("city"),
                            null,null,null,null,null,null,null,null),ownerId);
            if(defaults.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy tài khoản Owner.");
            return defaults.get(0);
        }
        return rows.get(0);
    }

    @Transactional
    public StoreProfileRequest update(long ownerId,StoreProfileRequest request) {
        String facebookUrl = cleanSocialUrl(request.facebookUrl());
        String instagramUrl = cleanSocialUrl(request.instagramUrl());
        String logoUrl = cleanImageUrl(ownerId, "logo", request.logoUrl());
        String coverImageUrl = cleanImageUrl(ownerId, "cover", request.coverImageUrl());
        jdbc.update("""
                INSERT INTO owner_stores(owner_id,store_name,description,city,address,contact_phone,contact_email,
                    business_hours,facebook_url,instagram_url,logo_url,cover_image_url,updated_at)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
                ON CONFLICT(owner_id) DO UPDATE SET store_name=EXCLUDED.store_name,
                  description=EXCLUDED.description,city=EXCLUDED.city,address=EXCLUDED.address,
                  contact_phone=EXCLUDED.contact_phone,contact_email=EXCLUDED.contact_email,
                  business_hours=EXCLUDED.business_hours,facebook_url=EXCLUDED.facebook_url,
                  instagram_url=EXCLUDED.instagram_url,logo_url=EXCLUDED.logo_url,
                  cover_image_url=EXCLUDED.cover_image_url,updated_at=CURRENT_TIMESTAMP
                """,ownerId,clean(request.storeName()),clean(request.description()),clean(request.city()),
                clean(request.address()),clean(request.contactPhone()),clean(request.contactEmail()),
                clean(request.businessHours()),facebookUrl,instagramUrl,logoUrl,coverImageUrl);
        return profile(ownerId);
    }

    public StoreImageUploadResponse uploadImage(long ownerId, String kind, MultipartFile file) {
        if (!"logo".equals(kind) && !"cover".equals(kind))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại ảnh gian hàng không hợp lệ.");
        if (file == null || file.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn ảnh.");
        if (file.getSize() > MAX_IMAGE_BYTES)
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh gian hàng tối đa 8 MB.");
        try {
            byte[] bytes = file.getBytes();
            String extension;
            if ("image/png".equalsIgnoreCase(file.getContentType()) && startsWith(bytes, PNG_SIGNATURE)) {
                extension = ".png";
            } else if ("image/jpeg".equalsIgnoreCase(file.getContentType()) && isJpeg(bytes)) {
                extension = ".jpg";
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh phải là JPG hoặc PNG hợp lệ.");
            }
            Files.createDirectories(storefrontDirectory);
            String filename = "owner-" + ownerId + "-" + kind + "-" + UUID.randomUUID() + extension;
            Path destination = storefrontDirectory.resolve(filename).normalize();
            if (!destination.startsWith(storefrontDirectory))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên tệp không hợp lệ.");
            Files.write(destination, bytes);
            return new StoreImageUploadResponse("/uploads/storefront/" + filename);
        } catch (IOException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu ảnh gian hàng.", exception);
        }
    }

    private StoreProfileRequest profileFrom(String name, String description, String city, String address,
            String phone, String email, String hours, String facebook, String instagram, String logo, String cover) {
        return new StoreProfileRequest(name, description, city, address, phone, email, hours,
                facebook, instagram, logo, cover);
    }

    private String clean(String value) { return value == null ? "" : value.trim(); }

    private String cleanSocialUrl(String value) {
        String cleaned = clean(value);
        if (!cleaned.isEmpty() && !cleaned.matches("(?i)^https?://\\S+$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Liên kết mạng xã hội phải bắt đầu bằng http:// hoặc https://.");
        return cleaned;
    }

    private String cleanImageUrl(long ownerId, String kind, String value) {
        String cleaned = clean(value);
        if (!cleaned.isEmpty() && !cleaned.matches("/uploads/storefront/owner-" + ownerId + "-" + kind + "-[0-9a-fA-F-]+\\.(jpg|png)"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hãy tải ảnh gian hàng lên từ biểu mẫu.");
        return cleaned;
    }

    private boolean startsWith(byte[] bytes, byte[] signature) {
        if (bytes.length < signature.length) return false;
        for (int index = 0; index < signature.length; index++) if (bytes[index] != signature[index]) return false;
        return true;
    }

    private boolean isJpeg(byte[] bytes) {
        return bytes.length >= 3 && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
    }
}
