DO $$
DECLARE
    owner_account_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO owner_account_count
    FROM users
    WHERE LOWER(email) = '23130058@st.hcmuaf.edu.vn';

    IF owner_account_count <> 1 THEN
        RAISE EXCEPTION 'Expected exactly one account for 23130058@st.hcmuaf.edu.vn, found %', owner_account_count;
    END IF;
END $$;

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
