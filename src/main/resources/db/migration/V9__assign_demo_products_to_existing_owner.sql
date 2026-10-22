DO $$
DECLARE
    owner_account_id BIGINT;
BEGIN
    SELECT id
    INTO owner_account_id
    FROM users
    WHERE LOWER(email) = '23130058@st.hcmuaf.edu.vn';

    -- Developers use separate databases, so the designated owner may not have
    -- registered yet. Keep demo products assigned to the catalog owner until
    -- that account exists instead of failing application startup.
    IF owner_account_id IS NOT NULL THEN
        UPDATE users
        SET role = 'USER'
        WHERE id = owner_account_id;

        UPDATE products
        SET owner_id = owner_account_id
        WHERE owner_id IN (
            SELECT id
            FROM users
            WHERE LOWER(email) = 'catalog@lensrent.local'
        );
    END IF;
END $$;
