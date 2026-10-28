ALTER TABLE wallet_transactions
    DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

ALTER TABLE wallet_transactions
    ADD CONSTRAINT wallet_transactions_type_check
    CHECK (type IN ('TOP_UP','WITHDRAWAL','OWNER_EARNING','RENTAL_PAYMENT','RENTAL_REFUND',
                    'DEPOSIT_HOLD','DEPOSIT_RELEASE','DEPOSIT_DEDUCTION'));

-- Only completed, paid rental items become withdrawable Owner earnings.
WITH earning_rows AS (
    SELECT p.owner_id AS user_id, ri.id AS rental_item_id,
           SUM(ri.subtotal)::numeric(14,2) AS amount
    FROM rental_items ri
    JOIN products p ON p.id=ri.product_id
    WHERE UPPER(COALESCE(ri.status,''))='COMPLETED'
      AND EXISTS (
          SELECT 1 FROM payments pay
          WHERE pay.rental_id=ri.rental_id
            AND UPPER(COALESCE(pay.status,'')) IN ('PAID','SUCCESS','COMPLETED')
      )
    GROUP BY p.owner_id,ri.id
), inserted_earnings AS (
    INSERT INTO wallet_transactions(user_id,type,amount,status,available_after,held_after,
                                    description,reference_type,reference_id)
    SELECT user_id,'OWNER_EARNING',amount,'COMPLETED',0,0,
           'Thu nhập từ thiết bị cho thuê đã hoàn tất.','RENTAL_ITEM',rental_item_id
    FROM earning_rows
    ON CONFLICT DO NOTHING
    RETURNING user_id,amount
), earnings_by_user AS (
    SELECT user_id,SUM(amount) AS amount FROM inserted_earnings GROUP BY user_id
)
UPDATE wallet_accounts wa
SET available_balance=wa.available_balance+earnings_by_user.amount,
    updated_at=CURRENT_TIMESTAMP
FROM earnings_by_user
WHERE wa.user_id=earnings_by_user.user_id;

-- Move any withdrawals created before the unified ledger into it exactly once.
WITH inserted_withdrawals AS (
    INSERT INTO wallet_transactions(user_id,type,amount,status,available_after,held_after,
                                    description,reference_type,reference_id,created_at)
    SELECT req.owner_id,'WITHDRAWAL',req.amount,
           CASE WHEN UPPER(req.status) IN ('COMPLETED','SUCCESS','PAID') THEN 'COMPLETED'
                WHEN UPPER(req.status)='PENDING' THEN 'PENDING' ELSE 'FAILED' END,
           0,0,'Yêu cầu rút tiền Owner.','OWNER_WITHDRAWAL',req.id,req.created_at
    FROM owner_withdrawal_requests req
    ON CONFLICT DO NOTHING
    RETURNING user_id,amount,status
), debits_by_user AS (
    SELECT user_id,SUM(amount) AS amount FROM inserted_withdrawals
    WHERE status IN ('COMPLETED','PENDING') GROUP BY user_id
)
UPDATE wallet_accounts wa
SET available_balance=GREATEST(0,wa.available_balance-debits_by_user.amount),
    updated_at=CURRENT_TIMESTAMP
FROM debits_by_user
WHERE wa.user_id=debits_by_user.user_id;
