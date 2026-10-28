package com.example.ecommerceshop.marketplace;

import com.example.ecommerceshop.marketplace.MarketplaceDtos.*;
import com.example.ecommerceshop.wallet.WalletService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;
import java.util.Locale;

@Service
public class MarketplaceService {
    private final JdbcTemplate jdbc;
    private final WalletService walletService;

    public MarketplaceService(JdbcTemplate jdbc, WalletService walletService) {
        this.jdbc = jdbc;
        this.walletService = walletService;
    }

    @Transactional(readOnly = true)
    public List<StoreSummary> stores(String search, String sort) {
        String q = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        String orderBy = switch (sort == null ? "" : sort.trim().toLowerCase(Locale.ROOT)) {
            case "rating" -> "average_rating DESC, rental_count DESC, store_name";
            case "name" -> "store_name, owner_id";
            case "newest" -> "s.created_at DESC, owner_id DESC";
            default -> "rental_count DESC, active_product_count DESC, average_rating DESC, store_name";
        };
        String sql = """
                SELECT s.owner_id, s.store_name, COALESCE(u.full_name,u.email,'Chủ thiết bị') owner_name,
                       s.description, s.city, u.avatar_url,s.address,s.contact_phone,s.contact_email,
                       s.business_hours,s.facebook_url,s.instagram_url,s.logo_url,s.cover_image_url,
                       COUNT(DISTINCT p.id)::bigint active_product_count,
                       COALESCE(ROUND(AVG(p.rating)::numeric,1),0) average_rating,
                       COALESCE(SUM(stats.rental_count),0)::bigint rental_count
                FROM owner_stores s
                JOIN users u ON u.id=s.owner_id
                JOIN products p ON p.owner_id=s.owner_id AND p.status='ACTIVE'
                LEFT JOIN LATERAL (
                    SELECT COUNT(DISTINCT ri.rental_id)::bigint rental_count
                    FROM rental_items ri
                    JOIN payments pay ON pay.rental_id=ri.rental_id
                    WHERE ri.product_id=p.id
                      AND UPPER(COALESCE(ri.status,'')) NOT IN ('CANCELLED','CANCELED')
                      AND UPPER(COALESCE(pay.status,'')) IN ('PAID','SUCCESS','COMPLETED')
                ) stats ON TRUE
                WHERE (?='' OR LOWER(CONCAT_WS(' ',s.store_name,s.description,u.full_name,s.city)) LIKE '%'||?||'%'
                       OR EXISTS (SELECT 1 FROM products matched
                                  WHERE matched.owner_id=s.owner_id AND matched.status='ACTIVE'
                                    AND LOWER(CONCAT_WS(' ',matched.name,matched.description)) LIKE '%'||?||'%'))
                GROUP BY s.owner_id,s.store_name,u.full_name,u.email,s.description,s.city,u.avatar_url,
                         s.address,s.contact_phone,s.contact_email,s.business_hours,s.facebook_url,
                         s.instagram_url,s.logo_url,s.cover_image_url,s.created_at
                ORDER BY
                """ + orderBy + " LIMIT 100";
        return jdbc.query(sql, (rs,n)->new StoreSummary(
                rs.getLong("owner_id"), rs.getString("store_name"), rs.getString("owner_name"),
                rs.getString("description"), rs.getString("city"), rs.getString("avatar_url"),
                rs.getString("address"),rs.getString("contact_phone"),rs.getString("contact_email"),
                rs.getString("business_hours"),rs.getString("facebook_url"),rs.getString("instagram_url"),
                rs.getString("logo_url"),rs.getString("cover_image_url"),
                rs.getLong("active_product_count"), rs.getBigDecimal("average_rating"),
                rs.getLong("rental_count")), q,q,q);
    }

    @Transactional(readOnly = true)
    public StoreDetail store(long ownerId) {
        List<StoreSummary> summaries = jdbc.query("""
                SELECT s.owner_id,s.store_name,COALESCE(u.full_name,u.email,'Chủ thiết bị') owner_name,
                       s.description,s.city,u.avatar_url,s.address,s.contact_phone,s.contact_email,
                       s.business_hours,s.facebook_url,s.instagram_url,s.logo_url,s.cover_image_url,
                       COUNT(DISTINCT p.id)::bigint active_product_count,
                       COALESCE(ROUND(AVG(p.rating)::numeric,1),0) average_rating,
                       COALESCE(SUM(stats.rental_count),0)::bigint rental_count
                FROM owner_stores s JOIN users u ON u.id=s.owner_id
                JOIN products p ON p.owner_id=s.owner_id AND p.status='ACTIVE'
                LEFT JOIN LATERAL (
                    SELECT COUNT(DISTINCT ri.rental_id)::bigint rental_count
                    FROM rental_items ri JOIN payments pay ON pay.rental_id=ri.rental_id
                    WHERE ri.product_id=p.id AND UPPER(COALESCE(ri.status,'')) NOT IN ('CANCELLED','CANCELED')
                      AND UPPER(COALESCE(pay.status,'')) IN ('PAID','SUCCESS','COMPLETED')
                ) stats ON TRUE
                WHERE s.owner_id=?
                GROUP BY s.owner_id,s.store_name,u.full_name,u.email,s.description,s.city,u.avatar_url,
                         s.address,s.contact_phone,s.contact_email,s.business_hours,s.facebook_url,
                         s.instagram_url,s.logo_url,s.cover_image_url,s.created_at
                """, (rs,n)->new StoreSummary(rs.getLong("owner_id"),rs.getString("store_name"),rs.getString("owner_name"),
                rs.getString("description"),rs.getString("city"),rs.getString("avatar_url"),
                rs.getString("address"),rs.getString("contact_phone"),rs.getString("contact_email"),
                rs.getString("business_hours"),rs.getString("facebook_url"),rs.getString("instagram_url"),
                rs.getString("logo_url"),rs.getString("cover_image_url"),
                rs.getLong("active_product_count"),rs.getBigDecimal("average_rating"),rs.getLong("rental_count")), ownerId);
        if (summaries.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy gian hàng hoặc gian hàng chưa có thiết bị đang hiển thị.");
        StoreSummary store=summaries.get(0);
        List<StoreProduct> products=jdbc.query("""
                SELECT p.id,p.name,p.item_type type,c.slug category,b.name brand,p.rating,p.daily_price price,
                       COALESCE(img.image_url,'') image_key,
                       GREATEST(COALESCE(p.stock,0),0)::integer available_quantity,
                       COALESCE(stats.rental_count,0)::bigint rental_count
                FROM products p JOIN categories c ON c.id=p.category_id
                LEFT JOIN brands b ON b.id=p.brand_id
                LEFT JOIN LATERAL (SELECT image_url FROM product_images WHERE product_id=p.id
                                   ORDER BY is_primary DESC NULLS LAST,id LIMIT 1) img ON TRUE
                LEFT JOIN LATERAL (
                    SELECT COUNT(DISTINCT ri.rental_id)::bigint rental_count
                    FROM rental_items ri JOIN payments pay ON pay.rental_id=ri.rental_id
                    WHERE ri.product_id=p.id AND UPPER(COALESCE(ri.status,'')) NOT IN ('CANCELLED','CANCELED')
                      AND UPPER(COALESCE(pay.status,'')) IN ('PAID','SUCCESS','COMPLETED')
                ) stats ON TRUE
                WHERE p.owner_id=? AND p.status='ACTIVE'
                ORDER BY stats.rental_count DESC,p.created_at DESC,p.id DESC
                """,(rs,n)->new StoreProduct(rs.getLong("id"),rs.getString("name"),rs.getString("type"),
                rs.getString("category"),rs.getString("brand"),rs.getBigDecimal("rating"),rs.getBigDecimal("price"),
                rs.getString("image_key"),rs.getInt("available_quantity"),rs.getLong("rental_count")),ownerId);
        return new StoreDetail(store.ownerId(),store.storeName(),store.ownerName(),store.description(),store.city(),
                store.avatarUrl(),store.address(),store.contactPhone(),store.contactEmail(),store.businessHours(),
                store.facebookUrl(),store.instagramUrl(),store.logoUrl(),store.coverImageUrl(),
                store.averageRating(),store.rentalCount(),products);
    }

    @Transactional
    public long createReport(long reporterId, CreateMarketplaceReportRequest request) {
        String type=request.targetType().trim().toUpperCase(Locale.ROOT);
        if (!List.of("STORE","CUSTOMER","PRODUCT").contains(type))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Loại báo cáo không hợp lệ.");
        Long targetUserId=request.targetUserId();
        Long productId=request.productId();
        if ("PRODUCT".equals(type)) {
            if (productId==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Chọn thiết bị cần báo cáo.");
            List<Long> owners=jdbc.query("SELECT owner_id FROM products WHERE id=? AND status='ACTIVE'",(rs,n)->rs.getLong(1),productId);
            if (owners.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy thiết bị.");
            targetUserId=owners.get(0);
        } else {
            if (targetUserId==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Không tìm thấy tài khoản cần báo cáo.");
            Integer exists=jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id=?",Integer.class,targetUserId);
            if (exists==null||exists==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy tài khoản cần báo cáo.");
            if ("STORE".equals(type)) {
                Integer storeExists=jdbc.queryForObject("SELECT COUNT(*) FROM owner_stores WHERE owner_id=?",Integer.class,targetUserId);
                if (storeExists==null||storeExists==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy gian hàng.");
            }
        }
        if (targetUserId!=null && targetUserId==reporterId)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Bạn không thể báo cáo chính tài khoản của mình.");
        return jdbc.queryForObject("""
                INSERT INTO marketplace_reports(reporter_id,target_type,target_user_id,product_id,category,description)
                VALUES(?,?,?,?,?,?) RETURNING id
                """,Long.class,reporterId,type,targetUserId,productId,request.category().trim(),
                request.description().trim());
    }

    @Transactional(readOnly = true)
    public List<MarketplaceReportResponse> reports(String status) {
        String filter=status==null||status.isBlank()?"":status.trim().toUpperCase(Locale.ROOT);
        return jdbc.query("""
                SELECT r.id,r.target_type,r.target_user_id,COALESCE(target.full_name,target.email,'—') target_name,
                       r.product_id,p.name product_name,r.reporter_id,COALESCE(reporter.full_name,reporter.email,'—') reporter_name,
                       r.category,r.description,r.status,r.resolution_note,r.created_at,r.resolved_at
                FROM marketplace_reports r LEFT JOIN users target ON target.id=r.target_user_id
                LEFT JOIN products p ON p.id=r.product_id JOIN users reporter ON reporter.id=r.reporter_id
                WHERE (?='' OR r.status=?)
                ORDER BY CASE WHEN r.status IN ('OPEN','UNDER_REVIEW') THEN 0 ELSE 1 END,r.created_at DESC,r.id DESC
                LIMIT 500
                """,(rs,n)->new MarketplaceReportResponse(rs.getLong("id"),rs.getString("target_type"),
                (Long)rs.getObject("target_user_id"),rs.getString("target_name"),
                (Long)rs.getObject("product_id"),rs.getString("product_name"),rs.getLong("reporter_id"),
                rs.getString("reporter_name"),rs.getString("category"),rs.getString("description"),rs.getString("status"),
                rs.getString("resolution_note"),local(rs.getTimestamp("created_at")),local(rs.getTimestamp("resolved_at"))),
                filter,filter);
    }

    @Transactional
    public void resolveReport(long adminId,long reportId,ResolveMarketplaceReportRequest request) {
        String status=request.status().trim().toUpperCase(Locale.ROOT);
        if(!List.of("UNDER_REVIEW","RESOLVED","REJECTED").contains(status))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Trạng thái xử lý báo cáo không hợp lệ.");
        int changed=jdbc.update("""
                UPDATE marketplace_reports SET status=?,resolution_note=?,resolved_by=?,
                    resolved_at=CASE WHEN ? IN ('RESOLVED','REJECTED') THEN CURRENT_TIMESTAMP ELSE NULL END
                WHERE id=? AND status IN ('OPEN','UNDER_REVIEW')
                """,status,clean(request.resolutionNote()),adminId,status,reportId);
        if(changed==0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Báo cáo không tồn tại hoặc đã được xử lý.");
        if(List.of("RESOLVED","REJECTED").contains(status)) {
            jdbc.update("""
                    INSERT INTO user_notifications(user_id,type,title,message,target_url)
                    SELECT reporter_id,'REPORT','Báo cáo đã được xử lý',?, '/renter/notifications'
                    FROM marketplace_reports WHERE id=?
                    """,clean(request.resolutionNote()).isBlank()?"Đội ngũ LensRent đã cập nhật kết quả xử lý báo cáo của bạn.":clean(request.resolutionNote()),reportId);
        }
    }

    @Transactional
    public long createRentalDispute(long renterId,long rentalId,CreateRentalDisputeRequest request) {
        List<Long> matching=jdbc.query("""
                SELECT ri.id FROM rental_items ri
                JOIN rentals r ON r.id=ri.rental_id
                JOIN damage_reports d ON d.rental_item_id=ri.id
                WHERE ri.id=? AND r.id=? AND r.renter_id=? AND d.status IN ('OPEN','UNDER_REVIEW')
                FOR UPDATE
                """,(rs,n)->rs.getLong(1),request.rentalItemId(),rentalId,renterId);
        if(matching.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Đơn chưa có báo cáo hư hỏng đang chờ phản hồi.");
        Integer pending=jdbc.queryForObject("SELECT COUNT(*) FROM rental_disputes WHERE rental_item_id=? AND status IN ('OPEN','UNDER_REVIEW')",
                Integer.class,request.rentalItemId());
        if(pending!=null&&pending>0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Khiếu nại thiết bị này đang được xử lý.");
        Long damageId=jdbc.queryForObject("SELECT id FROM damage_reports WHERE rental_item_id=?",Long.class,request.rentalItemId());
        Long disputeId=jdbc.queryForObject("""
                INSERT INTO rental_disputes(rental_item_id,damage_report_id,reporter_id,reason,requested_amount)
                VALUES(?,?,?,?,?) RETURNING id
                """,Long.class,request.rentalItemId(),damageId,renterId,request.reason().trim(),request.requestedAmount());
        jdbc.update("UPDATE damage_reports SET status='UNDER_REVIEW' WHERE id=?",damageId);
        jdbc.update("""
                INSERT INTO deposit_settlements(rental_item_id,renter_id,owner_id,deposit_amount,status,note)
                SELECT ri.id,r.renter_id,p.owner_id,p.deposit_amount*ri.quantity,'PENDING_REVIEW','Đang chờ xử lý khiếu nại tiền cọc.'
                FROM rental_items ri JOIN rentals r ON r.id=ri.rental_id JOIN products p ON p.id=ri.product_id
                WHERE ri.id=?
                ON CONFLICT(rental_item_id) DO UPDATE SET status='PENDING_REVIEW',note=EXCLUDED.note,resolved_by=NULL,resolved_at=NULL
                """,request.rentalItemId());
        jdbc.update("""
                INSERT INTO user_notifications(user_id,type,title,message,target_url)
                SELECT p.owner_id,'DISPUTE','Người thuê khiếu nại tiền cọc','Người thuê đã gửi phản hồi về báo cáo hư hỏng của đơn '||r.rental_code||'.','/owner/returns'
                FROM rental_items ri JOIN rentals r ON r.id=ri.rental_id JOIN products p ON p.id=ri.product_id
                WHERE ri.id=?
                """,request.rentalItemId());
        return disputeId;
    }

    @Transactional(readOnly=true)
    public List<RentalDisputeResponse> rentalDisputes(String status) {
        String filter=status==null||status.isBlank()?"":status.trim().toUpperCase(Locale.ROOT);
        return jdbc.query("""
                SELECT d.id,r.id rental_id,r.rental_code,ri.id rental_item_id,p.id product_id,p.name product_name,
                       renter.id renter_id,COALESCE(renter.full_name,renter.email,'Người thuê') renter_name,
                       owner.id owner_id,COALESCE(owner.full_name,owner.email,'Owner') owner_name,
                       damage.id damage_report_id,damage.description damage_description,damage.estimated_amount,
                       p.deposit_amount*ri.quantity deposit_amount,
                       d.reason,d.requested_amount,d.status,d.resolution_note,d.resolved_amount,d.created_at,d.resolved_at
                FROM rental_disputes d JOIN rental_items ri ON ri.id=d.rental_item_id
                JOIN rentals r ON r.id=ri.rental_id JOIN products p ON p.id=ri.product_id
                JOIN users renter ON renter.id=d.reporter_id JOIN users owner ON owner.id=p.owner_id
                LEFT JOIN damage_reports damage ON damage.id=d.damage_report_id
                WHERE (?='' OR d.status=?)
                ORDER BY CASE WHEN d.status IN ('OPEN','UNDER_REVIEW') THEN 0 ELSE 1 END,d.created_at DESC,d.id DESC
                LIMIT 500
                """,(rs,n)->new RentalDisputeResponse(rs.getLong("id"),rs.getLong("rental_id"),rs.getString("rental_code"),
                rs.getLong("rental_item_id"),rs.getLong("product_id"),rs.getString("product_name"),
                rs.getLong("renter_id"),rs.getString("renter_name"),rs.getLong("owner_id"),rs.getString("owner_name"),
                (Long)rs.getObject("damage_report_id"),rs.getString("damage_description"),rs.getBigDecimal("estimated_amount"),rs.getBigDecimal("deposit_amount"),
                rs.getString("reason"),rs.getBigDecimal("requested_amount"),rs.getString("status"),rs.getString("resolution_note"),
                rs.getBigDecimal("resolved_amount"),local(rs.getTimestamp("created_at")),local(rs.getTimestamp("resolved_at"))),filter,filter);
    }

    @Transactional
    public void resolveRentalDispute(long adminId,long disputeId,ResolveRentalDisputeRequest request) {
        String status=request.status().trim().toUpperCase(Locale.ROOT);
        if(!List.of("UNDER_REVIEW","APPROVED","REJECTED").contains(status))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Trạng thái xử lý khiếu nại không hợp lệ.");
        List<DisputeSettlementRow> rows=jdbc.query("""
                SELECT d.rental_item_id,d.damage_report_id,d.reporter_id,ri.rental_id,p.owner_id,
                       p.deposit_amount*ri.quantity deposit_amount,damage.estimated_amount
                FROM rental_disputes d JOIN rental_items ri ON ri.id=d.rental_item_id
                JOIN products p ON p.id=ri.product_id LEFT JOIN damage_reports damage ON damage.id=d.damage_report_id
                WHERE d.id=? AND d.status IN ('OPEN','UNDER_REVIEW') FOR UPDATE OF d
                """,(rs,n)->new DisputeSettlementRow(rs.getLong("rental_item_id"),rs.getLong("damage_report_id"),
                rs.getLong("reporter_id"),rs.getLong("rental_id"),rs.getLong("owner_id"),
                rs.getBigDecimal("deposit_amount")==null?BigDecimal.ZERO:rs.getBigDecimal("deposit_amount"),
                rs.getBigDecimal("estimated_amount")==null?BigDecimal.ZERO:rs.getBigDecimal("estimated_amount")),disputeId);
        if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.CONFLICT,"Khiếu nại không tồn tại hoặc đã được xử lý.");
        DisputeSettlementRow row=rows.get(0);
        BigDecimal deducted=BigDecimal.ZERO;
        if("APPROVED".equals(status)) {
            deducted=request.resolvedAmount();
            BigDecimal limit=row.depositAmount().min(row.estimatedAmount());
            if(deducted.compareTo(limit)>0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Khoản khấu trừ không được vượt quá tiền cọc hoặc mức thiệt hại đã báo.");
        } else if(request.resolvedAmount().compareTo(BigDecimal.ZERO)>0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Chỉ khiếu nại được chấp thuận mới có thể khấu trừ tiền cọc.");
        }
        int changed=jdbc.update("""
                UPDATE rental_disputes SET status=?,resolution_note=?,resolved_amount=?,resolved_by=?,
                  resolved_at=CASE WHEN ? IN ('APPROVED','REJECTED') THEN CURRENT_TIMESTAMP ELSE NULL END
                WHERE id=? AND status IN ('OPEN','UNDER_REVIEW')
                """,status,request.resolutionNote().trim(),deducted,adminId,status,disputeId);
        if(changed==0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Khiếu nại đã được người khác xử lý.");
        if("UNDER_REVIEW".equals(status)) return;
        BigDecimal refunded=row.depositAmount().subtract(deducted).max(BigDecimal.ZERO);
        String settlementStatus=deducted.signum()==0?"REFUNDED":refunded.signum()==0?"WITHHELD":"PARTIAL_REFUND";
        jdbc.update("""
                INSERT INTO deposit_settlements(rental_item_id,renter_id,owner_id,deposit_amount,refunded_amount,deducted_amount,status,note,resolved_by,resolved_at)
                VALUES(?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
                ON CONFLICT(rental_item_id) DO UPDATE SET deposit_amount=EXCLUDED.deposit_amount,
                  refunded_amount=EXCLUDED.refunded_amount,deducted_amount=EXCLUDED.deducted_amount,
                  status=EXCLUDED.status,note=EXCLUDED.note,resolved_by=EXCLUDED.resolved_by,resolved_at=CURRENT_TIMESTAMP
                """,row.rentalItemId(),row.renterId(),row.ownerId(),row.depositAmount(),refunded,deducted,
                settlementStatus,request.resolutionNote().trim(),adminId);
        walletService.settleDeposit(row.rentalItemId(), refunded, deducted);
        jdbc.update("UPDATE damage_reports SET status=? WHERE id=?",status.equals("APPROVED")?"REVIEWED":"REJECTED",row.damageReportId());
        String renterMessage="Kết quả khiếu nại tiền cọc: "+status+". Hoàn lại "+refunded.toPlainString()+"đ, khấu trừ "+deducted.toPlainString()+"đ.";
        jdbc.update("INSERT INTO user_notifications(user_id,type,title,message,target_url) VALUES(?,?,?,?,?)",
                row.renterId(),"DEPOSIT","Đã xử lý tiền cọc",renterMessage,"/renter/orders/"+row.rentalId());
        jdbc.update("INSERT INTO user_notifications(user_id,type,title,message,target_url) VALUES(?,?,?,?,?)",
                row.ownerId(),"DEPOSIT","Đã xử lý khiếu nại tiền cọc",request.resolutionNote().trim(),"/owner/returns");
    }

    private record DisputeSettlementRow(long rentalItemId,long damageReportId,long renterId,long rentalId,long ownerId,
                                        BigDecimal depositAmount,BigDecimal estimatedAmount) {}
    private String clean(String value) { return value==null?"":value.trim(); }
    private java.time.LocalDateTime local(Timestamp value) { return value==null?null:value.toLocalDateTime(); }
}
