package com.example.ecommerceshop.marketplace;

import com.example.ecommerceshop.marketplace.MarketplaceDtos.StoreProfileRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OwnerStorefrontService {
    private final JdbcTemplate jdbc;

    public OwnerStorefrontService(JdbcTemplate jdbc) { this.jdbc=jdbc; }

    @Transactional(readOnly=true)
    public StoreProfileRequest profile(long ownerId) {
        List<StoreProfileRequest> rows=jdbc.query("""
                SELECT s.store_name,s.description,s.city
                FROM owner_stores s WHERE s.owner_id=?
                """,(rs,n)->new StoreProfileRequest(rs.getString("store_name"),rs.getString("description"),rs.getString("city")),ownerId);
        if(rows.isEmpty()) {
            List<StoreProfileRequest> defaults=jdbc.query("""
                    SELECT COALESCE(NULLIF(BTRIM(full_name),''),'Gian hàng LensRent')||' Studio' store_name,
                           'Gian hàng thiết bị quay chụp trên LensRent.' description,city
                    FROM users WHERE id=?
                    """,(rs,n)->new StoreProfileRequest(rs.getString("store_name"),rs.getString("description"),rs.getString("city")),ownerId);
            if(defaults.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Không tìm thấy tài khoản Owner.");
            return defaults.get(0);
        }
        return rows.get(0);
    }

    @Transactional
    public StoreProfileRequest update(long ownerId,StoreProfileRequest request) {
        jdbc.update("""
                INSERT INTO owner_stores(owner_id,store_name,description,city,updated_at)
                VALUES(?,?,?,?,CURRENT_TIMESTAMP)
                ON CONFLICT(owner_id) DO UPDATE SET store_name=EXCLUDED.store_name,
                  description=EXCLUDED.description,city=EXCLUDED.city,updated_at=CURRENT_TIMESTAMP
                """,ownerId,request.storeName().trim(),request.description()==null?"":request.description().trim(),
                request.city()==null?"":request.city().trim());
        return profile(ownerId);
    }
}
