UPDATE wallet_transactions
SET status='COMPLETED',
    description='Rút tiền từ số dư ví LensRent.',
    reference_type='WALLET_WITHDRAWAL',
    reference_id=NULL
WHERE type='WITHDRAWAL' AND status='PENDING';

UPDATE wallet_transactions
SET description='Rút tiền từ số dư ví LensRent.',
    reference_type='WALLET_WITHDRAWAL',
    reference_id=NULL
WHERE type='WITHDRAWAL' AND reference_type='ZALOPAY_DISBURSEMENT';

DROP TABLE IF EXISTS wallet_disbursement_requests;
