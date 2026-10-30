-- The demo owner is seeded by V13, so this migration must remain safe when
-- that account does not exist yet. V13 repeats the product reassignment.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM users
        WHERE LOWER(email) = '23130058@st.hcmuaf.edu.vn'
    ) THEN
        UPDATE users
        SET role = 'OWNER'
        WHERE LOWER(email) = '23130058@st.hcmuaf.edu.vn';

        UPDATE products
        SET owner_id = (
            SELECT id
            FROM users
            WHERE LOWER(email) = '23130058@st.hcmuaf.edu.vn'
        )
        WHERE owner_id IN (
            SELECT id
            FROM users
            WHERE LOWER(email) = 'catalog@lensrent.local'
        );
    END IF;
END $$;
