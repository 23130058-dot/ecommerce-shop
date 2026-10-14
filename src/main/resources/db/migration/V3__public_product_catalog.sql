ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS slug VARCHAR(80);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS item_type VARCHAR(100) NOT NULL DEFAULT 'EQUIPMENT',
    ADD COLUMN IF NOT EXISTS tags TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0,
    ADD COLUMN IF NOT EXISTS featured_order INTEGER NOT NULL DEFAULT 100;

INSERT INTO users (full_name, email, password_hash, role, status, created_at)
SELECT 'LensRent Demo Owner', 'catalog@lensrent.local', '!catalog-seed-account-no-login!', 'OWNER', 'ACTIVE', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = 'catalog@lensrent.local');

UPDATE categories SET slug = 'camera' WHERE slug IS NULL AND lower(name) IN ('máy ảnh', 'camera');
UPDATE categories SET slug = 'lens' WHERE slug IS NULL AND lower(name) IN ('ống kính', 'lens');
UPDATE categories SET slug = 'accessory' WHERE slug IS NULL AND lower(name) IN ('phụ kiện', 'accessory');
UPDATE categories SET slug = 'studio' WHERE slug IS NULL AND lower(name) IN ('thiết bị studio', 'studio');

INSERT INTO categories (name, description, slug)
SELECT seed.name, seed.description, seed.slug
FROM (VALUES
    ('Máy ảnh', 'Máy ảnh mirrorless và cinema', 'camera'),
    ('Ống kính', 'Ống kính quay chụp', 'lens'),
    ('Phụ kiện', 'Phụ kiện quay chụp', 'accessory'),
    ('Thiết bị Studio', 'Thiết bị studio và drone', 'studio')
) AS seed(name, description, slug)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.slug = seed.slug);

INSERT INTO brands (name)
SELECT seed.name
FROM (VALUES ('Sony'), ('Canon'), ('RED'), ('DJI')) AS seed(name)
WHERE NOT EXISTS (SELECT 1 FROM brands b WHERE lower(b.name) = lower(seed.name));

INSERT INTO products (
    owner_id, category_id, brand_id, name, description, daily_price, deposit_amount,
    stock, status, created_at, item_type, tags, rating, featured_order
)
SELECT owner.id, category.id, brand.id, seed.name, seed.description, seed.daily_price,
       seed.deposit_amount, seed.stock, 'ACTIVE', CURRENT_TIMESTAMP - seed.age,
       seed.item_type, seed.tags, seed.rating, seed.featured_order
FROM (VALUES
    ('Sony Alpha A7R V', 'Máy ảnh full-frame độ phân giải cao cho dự án chuyên nghiệp.', 1200000, 5000000, 2, INTERVAL '1 day', 'MIRRORLESS CAMERA', '61MP Full-frame|8K Video', 4.9, 1, 'camera', 'Sony'),
    ('RED V-RAPTOR XL', 'Máy quay cinema 8K cho sản xuất hình ảnh chuyên nghiệp.', 8500000, 30000000, 1, INTERVAL '2 days', 'CINEMA CAMERA', '8K VV Sensor|120fps', 5.0, 2, 'camera', 'RED'),
    ('Canon RF 15-35mm', 'Ống kính góc rộng khẩu độ lớn với động cơ USM.', 450000, 2000000, 3, INTERVAL '3 days', 'WIDE-ANGLE LENS', 'f/2.8 Aperture|USM Motor', 4.8, 3, 'lens', 'Canon'),
    ('DJI Mavic 3 Pro', 'Flycam camera Hasselblad với thời lượng bay đến 43 phút.', 850000, 4000000, 0, INTERVAL '4 days', 'PHOTOGRAPHY DRONE', 'Hasselblad Camera|43min Flight', 4.7, 4, 'studio', 'DJI')
) AS seed(name, description, daily_price, deposit_amount, stock, age, item_type, tags, rating, featured_order, category_slug, brand_name)
JOIN users owner ON lower(owner.email) = 'catalog@lensrent.local'
JOIN categories category ON category.slug = seed.category_slug
JOIN brands brand ON lower(brand.name) = lower(seed.brand_name)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.name = seed.name);

INSERT INTO product_images (product_id, image_url, is_primary)
SELECT p.id, seed.image_url, TRUE
FROM (VALUES
    ('Sony Alpha A7R V', 'product-a7.png'),
    ('RED V-RAPTOR XL', 'product-vraptor.png'),
    ('Canon RF 15-35mm', 'product-rf.png'),
    ('DJI Mavic 3 Pro', 'product-mavic.png')
) AS seed(product_name, image_url)
JOIN products p ON p.name = seed.product_name
WHERE NOT EXISTS (
    SELECT 1 FROM product_images image
    WHERE image.product_id = p.id AND image.is_primary = TRUE
);