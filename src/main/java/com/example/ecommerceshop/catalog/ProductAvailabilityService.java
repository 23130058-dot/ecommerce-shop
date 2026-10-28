package com.example.ecommerceshop.catalog;

import com.example.ecommerceshop.marketplace.MarketplaceDtos.AvailabilityDay;
import com.example.ecommerceshop.marketplace.MarketplaceDtos.AvailabilityResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductAvailabilityService {
    private static final String OPEN_RENTAL_STATUSES="'PENDING','CONFIRMED','ACTIVE','IN_PROGRESS','RENTING','RETURN_PENDING','RETURN_REQUESTED','AWAITING_RETURN','DAMAGE_REPORTED'";
    private final JdbcTemplate jdbc;

    public ProductAvailabilityService(JdbcTemplate jdbc) { this.jdbc=jdbc; }

    public AvailabilityResponse availability(long productId,LocalDate from,LocalDate to) {
        validateRange(from,to);
        List<String> names=jdbc.query("SELECT name FROM products WHERE id=? AND status='ACTIVE'",(rs,n)->rs.getString(1),productId);
        if(names.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy thiết bị đang hoạt động.");
        List<AvailabilityDay> days=new ArrayList<>();
        for(LocalDate day=from;day.isBefore(to);day=day.plusDays(1)) days.add(day(productId,day,null));
        return new AvailabilityResponse(productId,names.get(0),from.toString(),to.toString(),days);
    }

    public void requireAvailable(long productId,LocalDate from,LocalDate to,int quantity,Long excludeCartId) {
        validateRange(from,to);
        if(quantity<1) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Số lượng thuê không hợp lệ.");
        for(LocalDate date=from;date.isBefore(to);date=date.plusDays(1)) {
            AvailabilityDay availability=day(productId,date,excludeCartId);
            if(!availability.available()||availability.availableQuantity()<quantity) {
                String reason=availability.reason()==null?"Số lượng thiết bị không đủ trong khoảng ngày đã chọn.":availability.reason();
                throw new ResponseStatusException(HttpStatus.CONFLICT,reason+" ("+date+").");
            }
        }
    }

    private AvailabilityDay day(long productId,LocalDate date,Long excludeCartId) {
        String sql = """
                SELECT p.id, p.name, COALESCE(s.is_available,TRUE) is_available,
                       EXISTS(SELECT 1 FROM owner_product_blocked_dates b WHERE b.product_id=p.id AND b.blocked_date=?) blocked,
                       GREATEST(
                         COALESCE(p.stock,0)
                         + COALESCE((SELECT SUM(ri.quantity) FROM rental_items ri
                                     WHERE ri.product_id=p.id AND UPPER(COALESCE(ri.status,'')) IN (%s)),0)
                         - COALESCE((SELECT SUM(ri.quantity) FROM rental_items ri
                                     WHERE ri.product_id=p.id AND UPPER(COALESCE(ri.status,'')) IN (%s)
                                       AND ri.start_date<=? AND ri.end_date>?),0)
                         - COALESCE((SELECT SUM(ci.quantity) FROM cart_items ci JOIN carts c ON c.id=ci.cart_id
                                     WHERE ci.product_id=p.id AND ci.reserved_until>CURRENT_TIMESTAMP
                                       AND ci.start_date<=? AND ci.end_date>?
                                       AND (CAST(? AS BIGINT) IS NULL OR c.id<>?)),0)
                       ,0)::integer available_quantity
                FROM products p LEFT JOIN owner_product_schedules s ON s.product_id=p.id
                WHERE p.id=? AND p.status='ACTIVE'
                """.formatted(OPEN_RENTAL_STATUSES,OPEN_RENTAL_STATUSES);
        List<AvailabilityDay> values=jdbc.query(sql,(rs,n)->{
            boolean isAvailable=rs.getBoolean("is_available");
            boolean blocked=rs.getBoolean("blocked");
            int quantity=rs.getInt("available_quantity");
            String reason=!isAvailable?"Chủ thiết bị đang tạm ngừng nhận lịch thuê."
                    :blocked?"Chủ thiết bị đã chặn ngày này."
                    :quantity<1?"Thiết bị đã kín lịch vào ngày này.":null;
            return new AvailabilityDay(date.toString(),quantity,isAvailable&&!blocked&&quantity>0,reason);
        },date,date,date,date,date,excludeCartId,excludeCartId,productId);
        if(values.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy thiết bị đang hoạt động.");
        return values.get(0);
    }

    private void validateRange(LocalDate from,LocalDate to) {
        if(from==null||to==null||!to.isAfter(from))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Khoảng ngày thuê không hợp lệ.");
        long days=ChronoUnit.DAYS.between(from,to);
        if(days>90) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Vui lòng chọn tối đa 90 ngày để kiểm tra lịch.");
    }
}
