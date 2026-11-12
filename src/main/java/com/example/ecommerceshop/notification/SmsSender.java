package com.example.ecommerceshop.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SmsSender {
    private final String apiKey;
    private final String baseUrl;
    private final String sender;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();

    public SmsSender(@Value("${app.sms.infobip-api-key:${INFOBIP_API_KEY:}}") String apiKey,
                     @Value("${app.sms.infobip-base-url:${INFOBIP_BASE_URL:}}") String baseUrl,
                     @Value("${app.sms.infobip-sender:${INFOBIP_SENDER:InfoSMS}}") String sender) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.sender = sender;
    }

    public void send(String to, String message) {
        if (apiKey.isBlank() || baseUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Chưa cấu hình SMS. Hãy thiết lập INFOBIP_API_KEY và INFOBIP_BASE_URL trong môi trường backend.");
        }
        String host = baseUrl.trim().replaceFirst("^https?://", "").replaceAll("/+$", "");
        if (!host.matches("[A-Za-z0-9.-]+\\.api\\.infobip\\.com")) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "INFOBIP_BASE_URL không hợp lệ.");
        }
        // Infobip expects international MSISDN digits without a leading '+' or '00'.
        String destination = to.trim().replaceFirst("^\\+", "").replaceFirst("^00", "");
        String payload = "{\"messages\":[{\"sender\":\"" + json(sender) + "\",\"destinations\":[{\"to\":\""
                + json(destination) + "\"}],\"content\":{\"text\":\"" + json(message) + "\"}}]}";
        HttpRequest request = HttpRequest.newBuilder(URI.create("https://" + host + "/sms/3/messages"))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "App " + apiKey)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                .build();
        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Infobip trả HTTP " + response.statusCode()
                        + ". Kiểm tra API key, quyền gửi SMS, số nhận thử đã xác minh và trạng thái trong Infobip Logs.");
            }
            Matcher statusNames = Pattern.compile("\\\"name\\\"\\s*:\\s*\\\"([A-Z_]+)\\\"").matcher(response.body());
            while (statusNames.find()) {
                String status = statusNames.group(1);
                if (status.startsWith("REJECTED") || status.equals("MISSING_TO")) {
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "Infobip đã từ chối SMS (" + status + "). Kiểm tra số nhận đã xác minh trên tài khoản trial và trạng thái trong Infobip Logs.");
                }
            }
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Yêu cầu gửi SMS bị gián đoạn.");
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không kết nối được Infobip.");
        }
    }

    private String json(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
