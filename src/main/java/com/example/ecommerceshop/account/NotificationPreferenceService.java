package com.example.ecommerceshop.account;

import com.example.ecommerceshop.account.NotificationPreferenceDtos.PreferencesRequest;
import com.example.ecommerceshop.account.NotificationPreferenceDtos.PreferencesResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalTime;
import java.util.List;

@Service
public class NotificationPreferenceService {
    private final JdbcTemplate jdbc;

    public NotificationPreferenceService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @Transactional
    public PreferencesResponse get(long userId) {
        ensurePreferences(userId);
        return read(userId);
    }

    @Transactional
    public PreferencesResponse update(long userId, PreferencesRequest request) {
        if (request.quietHoursEnabled() && request.quietStart().equals(request.quietEnd())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giờ bắt đầu và kết thúc khung giờ im lặng phải khác nhau.");
        }
        ensurePreferences(userId);
        jdbc.update("""
                UPDATE user_notification_preferences SET in_app_enabled=?,email_enabled=?,return_reminders=?,
                  order_updates=?,payment_updates=?,disputes=?,product_recommendations=?,promotions=?,
                  quiet_hours_enabled=?,quiet_start=?,quiet_end=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?
                """, request.inAppEnabled(), request.emailEnabled(), request.returnReminders(), request.orderUpdates(),
                request.paymentUpdates(), request.disputes(), request.productRecommendations(), request.promotions(),
                request.quietHoursEnabled(), request.quietStart(), request.quietEnd(), userId);
        return read(userId);
    }

    private void ensurePreferences(long userId) {
        jdbc.update("INSERT INTO user_notification_preferences(user_id) VALUES(?) ON CONFLICT(user_id) DO NOTHING", userId);
    }

    private PreferencesResponse read(long userId) {
        List<PreferencesResponse> rows = jdbc.query("""
                SELECT in_app_enabled,email_enabled,return_reminders,order_updates,payment_updates,disputes,
                       product_recommendations,promotions,quiet_hours_enabled,quiet_start,quiet_end
                FROM user_notification_preferences WHERE user_id=?
                """, (rs, n) -> new PreferencesResponse(rs.getBoolean("in_app_enabled"), rs.getBoolean("email_enabled"),
                rs.getBoolean("return_reminders"), rs.getBoolean("order_updates"), rs.getBoolean("payment_updates"),
                rs.getBoolean("disputes"), rs.getBoolean("product_recommendations"), rs.getBoolean("promotions"),
                rs.getBoolean("quiet_hours_enabled"), rs.getObject("quiet_start", LocalTime.class),
                rs.getObject("quiet_end", LocalTime.class)), userId);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy cài đặt thông báo.");
        return rows.get(0);
    }
}
