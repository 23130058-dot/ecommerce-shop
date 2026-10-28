package com.example.ecommerceshop.wallet;

import com.example.ecommerceshop.wallet.WalletDtos.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class WalletService {
    private final JdbcTemplate jdbc;

    public WalletService(JdbcTemplate jdbc) { this.jdbc=jdbc; }

    @Transactional
    public WalletOverview overview(long userId) {
        lockAccount(userId);
        syncOwnerEarnings(userId);
        return readOverview(userId);
    }

    @Transactional
    public WalletOverview requestOwnerWithdrawal(long userId, BigDecimal requestedAmount) {
        lockAccount(userId);
        syncOwnerEarnings(userId);
        BigDecimal amount=requestedAmount.setScale(2,java.math.RoundingMode.HALF_UP);
        AccountBalance before=balance(userId);
        if(before.available().compareTo(amount)<0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Số dư ví khả dụng không đủ cho yêu cầu rút tiền.");
        Long requestId=jdbc.queryForObject(
                "INSERT INTO owner_withdrawal_requests(owner_id,amount) VALUES(?,?) RETURNING id",Long.class,userId,amount);
        BigDecimal available=before.available().subtract(amount);
        jdbc.update("UPDATE wallet_accounts SET available_balance=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",available,userId);
        record(userId,"WITHDRAWAL",amount,"PENDING",available,before.held(),
                "Yêu cầu rút tiền Owner đang chờ xử lý.","OWNER_WITHDRAWAL",requestId);
        return readOverview(userId);
    }

    @Transactional
    public WalletOverview topUp(long userId,WalletActionRequest request) {
        lockAccount(userId);
        syncOwnerEarnings(userId);
        BigDecimal amount=request.amount().setScale(2,java.math.RoundingMode.HALF_UP);
        String result=request.simulatedResult().trim().toUpperCase(Locale.ROOT);
        if(!List.of("SUCCESS","FAILED","PENDING").contains(result))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Kết quả nạp mô phỏng không hợp lệ.");
        AccountBalance before=balance(userId);
        BigDecimal available=before.available();
        String status=result.equals("SUCCESS")?"COMPLETED":result;
        if("SUCCESS".equals(result)) {
            available=available.add(amount);
            jdbc.update("UPDATE wallet_accounts SET available_balance=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",available,userId);
        }
        record(userId,"TOP_UP",amount,status,available,before.held(),
                result.equals("SUCCESS")?"Nạp ví mô phỏng thành công.":result.equals("PENDING")?"Giao dịch nạp đang chờ; số dư chưa được cộng.":"Giao dịch nạp mô phỏng thất bại.",null,null);
        return readOverview(userId);
    }

    @Transactional
    public WalletOverview withdraw(long userId,WithdrawalRequest request) {
        lockAccount(userId);
        syncOwnerEarnings(userId);
        BigDecimal amount=request.amount().setScale(2,java.math.RoundingMode.HALF_UP);
        String result=request.simulatedResult().trim().toUpperCase(Locale.ROOT);
        AccountBalance before=balance(userId);
        if("SUCCESS".equals(result) && before.available().compareTo(amount)<0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Số dư ví khả dụng không đủ để rút.");
        BigDecimal available=before.available();
        String status="FAILED".equals(result)?"FAILED":"COMPLETED";
        if("SUCCESS".equals(result)) {
            available=available.subtract(amount);
            jdbc.update("UPDATE wallet_accounts SET available_balance=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",available,userId);
        }
        record(userId,"WITHDRAWAL",amount,status,available,before.held(),
                "FAILED".equals(result)?"Yêu cầu rút ví mô phỏng thất bại; số dư được giữ nguyên.":"Rút tiền mô phỏng thành công; không có giao dịch ngân hàng thật.",null,null);
        return readOverview(userId);
    }

    @Transactional
    public void chargeRental(long userId,long rentalId,BigDecimal rentalAndFees,BigDecimal deposit) {
        lockAccount(userId);
        syncOwnerEarnings(userId);
        BigDecimal charge=rentalAndFees.add(deposit).setScale(2,java.math.RoundingMode.HALF_UP);
        AccountBalance before=balance(userId);
        if(before.available().compareTo(charge)<0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Số dư ví không đủ. Hãy nạp thêm hoặc chọn thanh toán mô phỏng.");
        BigDecimal available=before.available().subtract(charge);
        BigDecimal held=before.held().add(deposit);
        jdbc.update("UPDATE wallet_accounts SET available_balance=?,held_balance=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",available,held,userId);
        if(rentalAndFees.signum()>0) record(userId,"RENTAL_PAYMENT",rentalAndFees,"COMPLETED",available,held,
                "Thanh toán tiền thuê và phí dịch vụ.","RENTAL",rentalId);
        if(deposit.signum()>0) record(userId,"DEPOSIT_HOLD",deposit,"COMPLETED",available,held,
                "Tiền cọc được giữ trong thời gian thuê.","RENTAL",rentalId);
    }

    @Transactional
    public void settleDeposit(long rentalItemId,BigDecimal refunded,BigDecimal deducted) {
        List<WalletRental> rentals=jdbc.query("""
                SELECT r.renter_id,p.deposit_amount*ri.quantity deposit_amount,
                       EXISTS(SELECT 1 FROM payments pay WHERE pay.rental_id=r.id AND pay.method='WALLET' AND pay.status IN ('PAID','SUCCESS','COMPLETED')) wallet_paid
                FROM rental_items ri JOIN rentals r ON r.id=ri.rental_id JOIN products p ON p.id=ri.product_id
                WHERE ri.id=?
                """,(rs,n)->new WalletRental(rs.getLong("renter_id"),rs.getBigDecimal("deposit_amount"),rs.getBoolean("wallet_paid")),rentalItemId);
        if(rentals.isEmpty()||!rentals.get(0).walletPaid()) return;
        WalletRental rental=rentals.get(0);
        lockAccount(rental.renterId());
        syncOwnerEarnings(rental.renterId());
        if(jdbc.queryForObject("SELECT COUNT(*) FROM wallet_transactions WHERE type IN ('DEPOSIT_RELEASE','DEPOSIT_DEDUCTION') AND reference_type='RENTAL_ITEM' AND reference_id=?",Integer.class,rentalItemId)>0) return;
        AccountBalance before=balance(rental.renterId());
        BigDecimal deposit=zero(rental.depositAmount());
        if(refunded.add(deducted).compareTo(deposit)!=0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Số tiền hoàn và khấu trừ phải khớp với tiền cọc của thiết bị.");
        if(before.held().compareTo(deposit)<0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Số dư cọc đang giữ không khớp với đơn thuê.");
        BigDecimal available=before.available().add(refunded);
        BigDecimal held=before.held().subtract(deposit);
        jdbc.update("UPDATE wallet_accounts SET available_balance=?,held_balance=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",available,held,rental.renterId());
        if(refunded.signum()>0) record(rental.renterId(),"DEPOSIT_RELEASE",refunded,"COMPLETED",available,held,
                "Hoàn lại tiền cọc sau khi trả thiết bị.","RENTAL_ITEM",rentalItemId);
        if(deducted.signum()>0) record(rental.renterId(),"DEPOSIT_DEDUCTION",deducted,"COMPLETED",available,held,
                "Khấu trừ tiền cọc theo kết quả xử lý hư hỏng.","RENTAL_ITEM",rentalItemId);
    }

    @Transactional
    public void refundCancelledRental(long rentalId) {
        List<CancelledWalletRental> rows=jdbc.query("""
                SELECT r.renter_id,r.total_amount,r.deposit_amount
                FROM rentals r JOIN payments pay ON pay.rental_id=r.id
                WHERE r.id=? AND pay.method='WALLET' AND pay.status IN ('PAID','SUCCESS','COMPLETED')
                ORDER BY pay.id DESC LIMIT 1
                """,(rs,n)->new CancelledWalletRental(rs.getLong("renter_id"),rs.getBigDecimal("total_amount"),rs.getBigDecimal("deposit_amount")),rentalId);
        if(rows.isEmpty()) return;
        CancelledWalletRental rental=rows.get(0);
        lockAccount(rental.renterId());
        syncOwnerEarnings(rental.renterId());
        if(jdbc.queryForObject("SELECT COUNT(*) FROM wallet_transactions WHERE type IN ('RENTAL_REFUND','DEPOSIT_RELEASE') AND reference_type='RENTAL' AND reference_id=?",Integer.class,rentalId)>0) return;
        AccountBalance before=balance(rental.renterId());
        BigDecimal deposit=zero(rental.depositAmount());
        BigDecimal rentalRefund=zero(rental.totalAmount()).subtract(deposit).max(BigDecimal.ZERO);
        if(before.held().compareTo(deposit)<0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Tiền cọc ví không khớp với đơn cần hủy.");
        BigDecimal available=before.available().add(rentalRefund).add(deposit);
        BigDecimal held=before.held().subtract(deposit);
        jdbc.update("UPDATE wallet_accounts SET available_balance=?,held_balance=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",available,held,rental.renterId());
        if(rentalRefund.signum()>0) record(rental.renterId(),"RENTAL_REFUND",rentalRefund,"COMPLETED",available,held,
                "Hoàn tiền thuê sau khi hủy đơn.","RENTAL",rentalId);
        if(deposit.signum()>0) record(rental.renterId(),"DEPOSIT_RELEASE",deposit,"COMPLETED",available,held,
                "Hoàn cọc sau khi hủy đơn.","RENTAL",rentalId);
    }

    @Transactional
    public void refundCancelledItems(long rentalId,long referenceItemId,BigDecimal rentalRefund,BigDecimal depositRefund) {
        List<Long> users=jdbc.query("""
                SELECT r.renter_id FROM rentals r JOIN payments pay ON pay.rental_id=r.id
                WHERE r.id=? AND pay.method='WALLET' AND pay.status IN ('PAID','SUCCESS','COMPLETED')
                ORDER BY pay.id DESC LIMIT 1
                """,(rs,n)->rs.getLong(1),rentalId);
        if(users.isEmpty()) return;
        long renterId=users.get(0);
        lockAccount(renterId);
        syncOwnerEarnings(renterId);
        if(jdbc.queryForObject("SELECT COUNT(*) FROM wallet_transactions WHERE type IN ('RENTAL_REFUND','DEPOSIT_RELEASE') AND reference_type='RENTAL_ITEM' AND reference_id=?",Integer.class,referenceItemId)>0) return;
        AccountBalance before=balance(renterId);
        BigDecimal deposit=zero(depositRefund);
        BigDecimal rent=zero(rentalRefund);
        if(before.held().compareTo(deposit)<0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Tiền cọc ví không khớp với sản phẩm bị hủy.");
        BigDecimal available=before.available().add(rent).add(deposit);
        BigDecimal held=before.held().subtract(deposit);
        jdbc.update("UPDATE wallet_accounts SET available_balance=?,held_balance=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",available,held,renterId);
        if(rent.signum()>0) record(renterId,"RENTAL_REFUND",rent,"COMPLETED",available,held,
                "Hoàn tiền thuê và phí dịch vụ cho thiết bị bị hủy.","RENTAL_ITEM",referenceItemId);
        if(deposit.signum()>0) record(renterId,"DEPOSIT_RELEASE",deposit,"COMPLETED",available,held,
                "Hoàn tiền cọc cho thiết bị bị hủy.","RENTAL_ITEM",referenceItemId);
    }

    private void ensureAccount(long userId) {
        jdbc.update("INSERT INTO wallet_accounts(user_id) VALUES(?) ON CONFLICT(user_id) DO NOTHING",userId);
    }

    private void syncOwnerEarnings(long userId) {
        List<OwnerEarning> earnings=jdbc.query("""
                SELECT ri.id AS rental_item_id,COALESCE(ri.subtotal,0) AS amount
                FROM rental_items ri JOIN products p ON p.id=ri.product_id
                WHERE p.owner_id=? AND UPPER(COALESCE(ri.status,''))='COMPLETED'
                  AND EXISTS(SELECT 1 FROM payments pay WHERE pay.rental_id=ri.rental_id
                             AND UPPER(COALESCE(pay.status,'')) IN ('PAID','SUCCESS','COMPLETED'))
                  AND NOT EXISTS(SELECT 1 FROM wallet_transactions tx WHERE tx.user_id=?
                                 AND tx.type='OWNER_EARNING' AND tx.reference_type='RENTAL_ITEM'
                                 AND tx.reference_id=ri.id)
                ORDER BY ri.id
                """,(rs,n)->new OwnerEarning(rs.getLong("rental_item_id"),zero(rs.getBigDecimal("amount"))),userId,userId);
        for(OwnerEarning earning:earnings) {
            if(earning.amount().signum()<=0) continue;
            AccountBalance before=balance(userId);
            BigDecimal available=before.available().add(earning.amount());
            int inserted=jdbc.update("""
                    INSERT INTO wallet_transactions(user_id,type,amount,status,available_after,held_after,
                                                    description,reference_type,reference_id)
                    VALUES(?,'OWNER_EARNING',?,'COMPLETED',?,?,'Thu nhập từ thiết bị cho thuê đã hoàn tất.','RENTAL_ITEM',?)
                    ON CONFLICT DO NOTHING
                    """,userId,earning.amount(),available,before.held(),earning.rentalItemId());
            if(inserted>0) jdbc.update("UPDATE wallet_accounts SET available_balance=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?",available,userId);
        }
    }
    private void lockAccount(long userId) {
        ensureAccount(userId);
        jdbc.query("SELECT user_id FROM wallet_accounts WHERE user_id=? FOR UPDATE",(rs,n)->rs.getLong(1),userId);
    }
    private AccountBalance balance(long userId) {
        return jdbc.queryForObject("SELECT available_balance,held_balance FROM wallet_accounts WHERE user_id=?",
                (rs,n)->new AccountBalance(zero(rs.getBigDecimal("available_balance")),zero(rs.getBigDecimal("held_balance"))),userId);
    }
    private WalletOverview readOverview(long userId) {
        AccountBalance account=balance(userId);
        BigDecimal topups=jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM wallet_transactions WHERE user_id=? AND type='TOP_UP' AND status='COMPLETED'",BigDecimal.class,userId);
        BigDecimal withdrawals=jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM wallet_transactions WHERE user_id=? AND type='WITHDRAWAL' AND status='COMPLETED'",BigDecimal.class,userId);
        BigDecimal ownerEarnings=jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM wallet_transactions WHERE user_id=? AND type='OWNER_EARNING' AND status='COMPLETED'",BigDecimal.class,userId);
        BigDecimal pendingWithdrawals=jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM wallet_transactions WHERE user_id=? AND type='WITHDRAWAL' AND status='PENDING'",BigDecimal.class,userId);
        List<WalletTransaction> transactions=jdbc.query("""
                SELECT id,type,amount,status,available_after,held_after,description,created_at
                FROM wallet_transactions WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 50
                """,(rs,n)->new WalletTransaction(rs.getLong("id"),rs.getString("type"),rs.getBigDecimal("amount"),
                rs.getString("status"),rs.getBigDecimal("available_after"),rs.getBigDecimal("held_after"),
                rs.getString("description"),local(rs.getTimestamp("created_at"))),userId);
        return new WalletOverview(account.available(),account.held(),zero(topups),zero(withdrawals),
                zero(ownerEarnings),zero(pendingWithdrawals),transactions);
    }
    private void record(long userId,String type,BigDecimal amount,String status,BigDecimal available,BigDecimal held,
                        String description,String referenceType,Long referenceId) {
        jdbc.update("""
                INSERT INTO wallet_transactions(user_id,type,amount,status,available_after,held_after,description,reference_type,reference_id)
                VALUES(?,?,?,?,?,?,?,?,?)
                """,userId,type,amount,status,available,held,description,referenceType,referenceId);
    }
    private BigDecimal zero(BigDecimal value) { return value==null?BigDecimal.ZERO:value; }
    private LocalDateTime local(Timestamp value) { return value==null?null:value.toLocalDateTime(); }
    private record AccountBalance(BigDecimal available,BigDecimal held) {}
    private record WalletRental(long renterId,BigDecimal depositAmount,boolean walletPaid) {}
    private record CancelledWalletRental(long renterId,BigDecimal totalAmount,BigDecimal depositAmount) {}
    private record OwnerEarning(long rentalItemId,BigDecimal amount) {}
}
