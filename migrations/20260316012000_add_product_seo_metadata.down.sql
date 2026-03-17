DROP INDEX IF EXISTS idx_products_seo_title;

ALTER TABLE products
DROP COLUMN IF EXISTS og_image_url,
DROP COLUMN IF EXISTS canonical_url,
DROP COLUMN IF EXISTS seo_keywords,
DROP COLUMN IF EXISTS seo_description,
DROP COLUMN IF EXISTS seo_title;