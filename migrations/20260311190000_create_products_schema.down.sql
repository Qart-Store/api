DROP TRIGGER IF EXISTS trg_brands_updated_at ON brands;

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;

DROP FUNCTION IF EXISTS set_updated_at;

DROP TABLE IF EXISTS product_tags;

DROP TABLE IF EXISTS product_images;

DROP TABLE IF EXISTS products;

DROP TABLE IF EXISTS categories;

DROP TABLE IF EXISTS brands;