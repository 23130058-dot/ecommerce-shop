package com.example.ecommerceshop.wallet;

import com.example.ecommerceshop.wallet.ZaloPayWalletTopUpDtos.CallbackRequest;
import com.example.ecommerceshop.wallet.ZaloPayWalletTopUpDtos.CallbackResponse;
import com.example.ecommerceshop.wallet.ZaloPayWalletTopUpDtos.RedirectConfirmation;
import com.example.ecommerceshop.wallet.ZaloPayWalletTopUpDtos.StartRequest;
import com.example.ecommerceshop.wallet.ZaloPayWalletTopUpDtos.StartResponse;
import com.example.ecommerceshop.wallet.ZaloPayWalletTopUpDtos.StatusResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ZaloPayWalletTopUpService {
    private static final DateTimeFormatter APP_TRANS_DATE = DateTimeFormatter.ofPattern("yyMMdd");
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String BANK_CODE = "zalopayapp";
    private static final String EMPTY = "";

    private final JdbcTemplate jdbc;
    private final WalletService walletService;
    private final JsonMapper jsonMapper;
    private final HttpClient httpClient;
    private final boolean enabled;
    private final String appId;
    private final String key1;
    private final String key2;
    private final String createOrderEndpoint;
    private final String queryOrderEndpoint;
    private final String redirectUrl;

    public ZaloPayWalletTopUpService(
            JdbcTemplate jdbc,
            WalletService walletService,
            JsonMapper jsonMapper,
            @Value("${app.wallet.zalopay.enabled:true}") boolean enabled,
            @Value("${app.wallet.zalopay.app-id:554}") String appId,
            @Value("${app.wallet.zalopay.key1:8NdU5pG5R2spGHGhyO99HN1OhD8IQJBn}") String key1,
            @Value("${app.wallet.zalopay.key2:uUfsWgfLkRLzq6W2uNXTCxrfxs51auny}") String key2,
            @Value("${app.wallet.zalopay.create-order-endpoint:https://sandbox.zalopay.com.vn/v001/tpe/createorder}") String createOrderEndpoint,
            @Value("${app.wallet.zalopay.query-order-endpoint:https://sandbox.zalopay.com.vn/v001/tpe/getstatusbyapptransid}") String queryOrderEndpoint,
            @Value("${app.wallet.zalopay.redirect-url:http://localhost:5173/wallet/top-up-result}") String redirectUrl) {
        this.jdbc = jdbc;
        this.walletService = walletService;
        this.jsonMapper = jsonMapper;
        this.enabled = enabled;
        this.appId = appId;
        this.key1 = key1;
        this.key2 = key2;
        this.createOrderEndpoint = createOrderEndpoint;
        this.queryOrderEndpoint = queryOrderEndpoint;
        this.redirectUrl = redirectUrl;
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    @Transactional
    public StartResponse start(long userId, StartRequest request) {
        requireConfigured();
        long amount = wholeVnd(request.amount());
        if (amount < 10_000 || amount > 50_000_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền nạp phải từ 10.000đ đến 50.000.000đ.");
        }

        WalletDtos.WalletOverview overview = walletService.overview(userId);
        jdbc.query("SELECT user_id FROM wallet_accounts WHERE user_id=? FOR UPDATE", (rs, n) -> rs.getLong(1), userId);

        String random = UUID.randomUUID().toString().replace("-", "");
        String appTransId = APP_TRANS_DATE.format(LocalDateTime.now(VIETNAM_ZONE)) + "_" + random;
        String internalRequestId = UUID.randomUUID().toString();
        String orderInfo = "LensRent wallet top-up " + appTransId;
        Long topUpId = jdbc.queryForObject("""
                INSERT INTO wallet_topup_requests(user_id,order_id,request_id,amount,order_info,status)
                VALUES(?,?,?,?,?,'PENDING') RETURNING id
                """, Long.class, userId, appTransId, internalRequestId, amount, orderInfo);

        jdbc.update("""
                INSERT INTO wallet_transactions(user_id,type,amount,status,available_after,held_after,description,reference_type,reference_id)
                VALUES(?,'TOP_UP',?,'PENDING',?,?,'Đang chờ thanh toán qua ZaloPay Sandbox.','ZALOPAY_TOPUP',?)
                """, userId, BigDecimal.valueOf(amount), overview.availableBalance(), overview.heldBalance(), topUpId);

        try {
            Map<String, String> payload = createOrderPayload(userId, amount, appTransId);
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(createOrderEndpoint))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(formEncode(payload), StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode body = jsonMapper.readTree(response.body());
            int returnCode = body.path("returncode").asInt(-1);
            String orderUrl = body.path("orderurl").asText(EMPTY);
            if (response.statusCode() < 200 || response.statusCode() >= 300 || returnCode != 1 || !isTrustedPaymentUrl(orderUrl)) {
                String message = body.path("returnmessage").asText("ZaloPay không tạo được yêu cầu thanh toán.");
                markFailed(topUpId, returnCode, message);
                return new StartResponse(appTransId, BigDecimal.valueOf(amount), "FAILED", null, message);
            }

            jdbc.update("UPDATE wallet_topup_requests SET pay_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", orderUrl, topUpId);
            jdbc.update("UPDATE wallet_transactions SET description=? WHERE reference_type='ZALOPAY_TOPUP' AND reference_id=?",
                    "Đang chờ thanh toán ZaloPay Sandbox. Mở ZaloPay để hoàn tất giao dịch.", topUpId);
            return new StartResponse(appTransId, BigDecimal.valueOf(amount), "PENDING", orderUrl,
                    "Đã tạo đơn ZaloPay Sandbox. Hoàn tất thanh toán để tiền được cộng vào ví.");
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            markFailed(topUpId, -1, "Không thể kết nối ZaloPay Sandbox.");
            return new StartResponse(appTransId, BigDecimal.valueOf(amount), "FAILED", null, "Không thể kết nối ZaloPay Sandbox.");
        } catch (Exception failure) {
            markFailed(topUpId, -1, "Không thể tạo đơn ZaloPay Sandbox.");
            return new StartResponse(appTransId, BigDecimal.valueOf(amount), "FAILED", null,
                    "Không thể tạo đơn ZaloPay Sandbox. Hãy kiểm tra kết nối rồi thử lại.");
        }
    }

    @Transactional(readOnly = true)
    public StatusResponse status(long userId, String appTransId) {
        List<StatusResponse> rows = jdbc.query("""
                SELECT order_id,amount,status,created_at FROM wallet_topup_requests WHERE user_id=? AND order_id=?
                """, (rs, n) -> new StatusResponse(rs.getString("order_id"), BigDecimal.valueOf(rs.getLong("amount")),
                rs.getString("status"), local(rs.getTimestamp("created_at"))), userId, appTransId);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy giao dịch nạp ví.");
        return rows.get(0);
    }

    @Transactional
    public StatusResponse confirmRedirect(long userId, RedirectConfirmation redirect) {
        requireConfigured();
        if (!validRedirect(redirect)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin redirect ZaloPay không hợp lệ.");
        }
        TopUpRow topUp = findByOrder(userId, redirect.appTransId(), true);
        if (topUp == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu nạp ZaloPay.");
        verifyMerchantOrder(topUp, redirect.appId(), redirect.amount());
        if (!"PENDING".equals(topUp.status())) return toStatus(topUp);

        try {
            JsonNode queryResult = queryOrder(redirect.appTransId());
            int returnCode = queryResult.path("returncode").asInt(-1);
            boolean processing = queryResult.path("isprocessing").asBoolean(false);
            if (returnCode == 1) {
                long paidAmount = queryResult.path("amount").asLong(-1);
                long zpTransId = queryResult.path("zptransid").asLong(-1);
                if (paidAmount != topUp.amount() || zpTransId <= 0) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Số tiền hoặc mã giao dịch ZaloPay không khớp với yêu cầu nạp.");
                }
                completeTopUp(topUp, zpTransId);
            } else if (!processing && !isAwaitingUserPayment(topUp, returnCode)) {
                markFailed(topUp.id(), returnCode, "Thanh toán ZaloPay Sandbox không hoàn tất.");
            }
        } catch (ResponseStatusException error) {
            throw error;
        } catch (Exception ignored) {
            // Keep the transaction pending if a temporary network problem prevents a status query.
        }
        return status(userId, redirect.appTransId());
    }

    private boolean isAwaitingUserPayment(TopUpRow topUp, int returnCode) {
        // ZaloPay documents -49 (not paid yet) and -117 (wrong password) as
        // retryable while the 15-minute payment window is still open.
        return (returnCode == -49 || returnCode == -117)
                && topUp.createdAt() != null
                && LocalDateTime.now().isBefore(topUp.createdAt().toLocalDateTime().plusMinutes(15));
    }

    @Transactional
    public CallbackResponse acceptCallback(CallbackRequest callback) {
        requireConfigured();
        if (callback == null || callback.data() == null || callback.mac() == null
                || !matchesMac(callback.data(), callback.mac(), key2)) {
            return new CallbackResponse(-1, "mac not equal");
        }

        JsonNode data;
        try {
            data = jsonMapper.readTree(callback.data());
        } catch (Exception invalidJson) {
            return new CallbackResponse(-1, "invalid callback data");
        }

        String callbackAppId = data.path("appid").asText(EMPTY);
        String appTransId = data.path("apptransid").asText(EMPTY);
        long amount = data.path("amount").asLong(-1);
        long zpTransId = data.path("zptransid").asLong(-1);
        if (!appId.equals(callbackAppId) || appTransId.isBlank() || amount < 0 || zpTransId <= 0) {
            return new CallbackResponse(-1, "callback data mismatch");
        }

        TopUpRow topUp = findByOrder(null, appTransId, true);
        if (topUp == null || topUp.amount() != amount) return new CallbackResponse(-1, "order or amount mismatch");
        completeTopUp(topUp, zpTransId);
        return new CallbackResponse(1, "success");
    }

    private Map<String, String> createOrderPayload(long userId, long amount, String appTransId) {
        String appUser = Long.toString(userId);
        String appTime = Long.toString(System.currentTimeMillis());
        String amountValue = Long.toString(amount);
        String embedData = jsonMapper.writeValueAsString(Map.of("redirecturl", redirectUrl));
        String item = "[]";
        String description = "LensRent nap vi " + appTransId;

        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("appid", appId);
        payload.put("apptransid", appTransId);
        payload.put("appuser", appUser);
        payload.put("apptime", appTime);
        payload.put("amount", amountValue);
        payload.put("embeddata", embedData);
        payload.put("item", item);
        payload.put("description", description);
        payload.put("bankcode", BANK_CODE);
        String raw = appId + "|" + appTransId + "|" + appUser + "|" + amountValue + "|" + appTime + "|" + embedData + "|" + item;
        payload.put("mac", sign(raw, key1));
        return payload;
    }

    private JsonNode queryOrder(String appTransId) throws Exception {
        Map<String, String> request = new LinkedHashMap<>();
        request.put("appid", appId);
        request.put("apptransid", appTransId);
        request.put("mac", sign(appId + "|" + appTransId + "|" + key1, key1));
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(queryOrderEndpoint))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                .POST(HttpRequest.BodyPublishers.ofString(formEncode(request), StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("ZaloPay query returned HTTP " + response.statusCode());
        }
        return jsonMapper.readTree(response.body());
    }

    private boolean validRedirect(RedirectConfirmation redirect) {
        if (redirect == null || redirect.appId() == null || redirect.appTransId() == null
                || redirect.pmcId() == null || redirect.bankCode() == null || redirect.amount() == null
                || redirect.discountAmount() == null || redirect.status() == null || redirect.checksum() == null) return false;
        try {
            Long.parseLong(redirect.amount());
            Long.parseLong(redirect.discountAmount());
        } catch (NumberFormatException invalidAmount) {
            return false;
        }
        String data = redirect.appId() + "|" + redirect.appTransId() + "|" + redirect.pmcId() + "|"
                + redirect.bankCode() + "|" + redirect.amount() + "|" + redirect.discountAmount() + "|" + redirect.status();
        return appId.equals(redirect.appId()) && matchesMac(data, redirect.checksum(), key2);
    }

    private boolean matchesMac(String data, String receivedMac, String key) {
        return receivedMac != null && MessageDigest.isEqual(
                sign(data, key).getBytes(StandardCharsets.US_ASCII), receivedMac.getBytes(StandardCharsets.US_ASCII));
    }

    private String sign(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception error) {
            throw new IllegalStateException("Không thể tạo chữ ký ZaloPay.", error);
        }
    }

    private String formEncode(Map<String, String> values) {
        return values.entrySet().stream()
                .map(entry -> URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8) + "="
                        + URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
    }

    private TopUpRow findByOrder(Long userId, String appTransId, boolean lock) {
        String query = "SELECT id,user_id,order_id,amount,order_info,status,created_at FROM wallet_topup_requests WHERE order_id=?"
                + (userId == null ? "" : " AND user_id=?") + (lock ? " FOR UPDATE" : "");
        List<TopUpRow> rows = userId == null
                ? jdbc.query(query, (rs, n) -> toRow(rs.getLong("id"), rs.getLong("user_id"), rs.getString("order_id"),
                    rs.getLong("amount"), rs.getString("order_info"), rs.getString("status"), rs.getTimestamp("created_at")), appTransId)
                : jdbc.query(query, (rs, n) -> toRow(rs.getLong("id"), rs.getLong("user_id"), rs.getString("order_id"),
                    rs.getLong("amount"), rs.getString("order_info"), rs.getString("status"), rs.getTimestamp("created_at")), appTransId, userId);
        return rows.stream().findFirst().orElse(null);
    }

    private void verifyMerchantOrder(TopUpRow topUp, String redirectAppId, String redirectAmount) {
        try {
            if (!appId.equals(redirectAppId) || Long.parseLong(redirectAmount) != topUp.amount()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Thông tin đơn ZaloPay không khớp với yêu cầu nạp.");
            }
        } catch (NumberFormatException invalidAmount) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền redirect ZaloPay không hợp lệ.");
        }
    }

    private void completeTopUp(TopUpRow topUp, long zpTransId) {
        if (!"PENDING".equals(topUp.status())) return;
        WalletDtos.WalletOverview overview = walletService.overview(topUp.userId());
        jdbc.query("SELECT user_id FROM wallet_accounts WHERE user_id=? FOR UPDATE", (rs, n) -> rs.getLong(1), topUp.userId());
        BigDecimal newBalance = overview.availableBalance().add(BigDecimal.valueOf(topUp.amount()));
        jdbc.update("UPDATE wallet_accounts SET available_balance=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?", newBalance, topUp.userId());
        jdbc.update("""
                UPDATE wallet_topup_requests SET status='COMPLETED',provider_transaction_id=?,result_code=1,updated_at=CURRENT_TIMESTAMP WHERE id=?
                """, Long.toString(zpTransId), topUp.id());
        jdbc.update("""
                UPDATE wallet_transactions SET status='COMPLETED',available_after=?,held_after=?,description='Nạp ví ZaloPay Sandbox thành công.'
                WHERE user_id=? AND type='TOP_UP' AND reference_type='ZALOPAY_TOPUP' AND reference_id=? AND status='PENDING'
                """, newBalance, overview.heldBalance(), topUp.userId(), topUp.id());
    }

    private void markFailed(long topUpId, int resultCode, String message) {
        jdbc.update("UPDATE wallet_topup_requests SET status='FAILED',result_code=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='PENDING'", resultCode, topUpId);
        jdbc.update("UPDATE wallet_transactions SET status='FAILED',description=? WHERE type='TOP_UP' AND reference_type='ZALOPAY_TOPUP' AND reference_id=? AND status='PENDING'",
                message.substring(0, Math.min(message.length(), 300)), topUpId);
    }

    private boolean isTrustedPaymentUrl(String url) {
        try {
            URI payment = URI.create(url);
            String host = payment.getHost();
            return "https".equalsIgnoreCase(payment.getScheme()) && host != null
                    && (host.equalsIgnoreCase("zalopay.vn") || host.endsWith(".zalopay.vn")
                    || host.equalsIgnoreCase("zalopay.com.vn") || host.endsWith(".zalopay.com.vn"))
                    && payment.getUserInfo() == null;
        } catch (Exception error) {
            return false;
        }
    }

    private void requireConfigured() {
        if (!enabled || appId.isBlank() || key1.isBlank() || key2.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "ZaloPay Sandbox chưa được cấu hình.");
        }
    }

    private long wholeVnd(BigDecimal amount) {
        try { return amount.setScale(0, RoundingMode.UNNECESSARY).longValueExact(); }
        catch (ArithmeticException error) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền nạp phải là số nguyên đồng."); }
    }

    private TopUpRow toRow(long id, long userId, String appTransId, long amount, String orderInfo, String status, Timestamp createdAt) {
        return new TopUpRow(id, userId, appTransId, amount, orderInfo, status, createdAt);
    }

    private StatusResponse toStatus(TopUpRow topUp) {
        return new StatusResponse(topUp.appTransId(), BigDecimal.valueOf(topUp.amount()), topUp.status(), local(topUp.createdAt()));
    }

    private LocalDateTime local(Timestamp value) { return value == null ? null : value.toLocalDateTime(); }
    private record TopUpRow(long id, long userId, String appTransId, long amount, String orderInfo, String status, Timestamp createdAt) {}
}
