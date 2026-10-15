ALTER TABLE users
    ADD COLUMN birthday DATE,
    ADD COLUMN occupation VARCHAR(100),
    ADD COLUMN bio VARCHAR(240),
    ADD COLUMN avatar_url VARCHAR(500);
