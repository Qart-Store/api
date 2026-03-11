import { dbQuery } from "../config/db";
import slugify from "../utils/slugify";

const BASE_SELECT = `
  SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price::float8 AS price,
    p.status,
    p.stock,
    p.sku,
    p.rating::float8 AS rating,
    p.image_url AS "imageUrl",
    p.category_id AS "categoryId",
    c.slug AS "categorySlug",
    c.name AS "categoryName",
    p.brand_id AS "brandId",
    b.name AS "brandName",
    p.created_at AS "createdAt",
    p.updated_at AS "updatedAt",
    COALESCE(
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT pi.url ORDER BY pi.url), NULL),
      '{}'
    ) AS images,
    COALESCE(
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT pt.tag ORDER BY pt.tag), NULL),
      '{}'
    ) AS tags
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN brands b ON b.id = p.brand_id
  LEFT JOIN product_images pi ON pi.product_id = p.id
  LEFT JOIN product_tags pt ON pt.product_id = p.id
`;

const GROUP_BY = `
  GROUP BY
    p.id,
    c.slug,
    c.name,
    b.name
`;

function normalizeArray(values?: string[]) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

async function ensureCategoryId(
  categorySlug?: string | null,
  categoryName?: string | null,
) {
  const slug = categorySlug ? slugify(categorySlug) : null;
  const name = categoryName?.trim() || null;

  if (!slug && !name) return null;

  const finalSlug = slug ?? slugify(name as string);
  const finalName =
    name ??
    finalSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const result = await dbQuery<{ id: string }>(
    `
      INSERT INTO categories(name, slug)
      VALUES ($1, $2)
      ON CONFLICT (slug)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `,
    [finalName, finalSlug],
  );

  return result.rows[0]?.id ?? null;
}

async function ensureBrandId(brandName?: string | null) {
  const name = brandName?.trim() || null;
  if (!name) return null;

  const slug = slugify(name);

  const result = await dbQuery<{ id: string }>(
    `
      INSERT INTO brands(name, slug)
      VALUES ($1, $2)
      ON CONFLICT (slug)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `,
    [name, slug],
  );

  return result.rows[0]?.id ?? null;
}

function mapSort(
  sortBy?: ProductListFilters["sortBy"],
  sortOrder?: ProductListFilters["sortOrder"],
) {
  const columnMap: Record<string, string> = {
    createdAt: "p.created_at",
    price: "p.price",
    name: "p.name",
    rating: "p.rating",
  };

  const column = columnMap[sortBy ?? "createdAt"] ?? "p.created_at";
  const direction = sortOrder === "asc" ? "ASC" : "DESC";

  return `${column} ${direction}`;
}

export async function listProducts(
  filters: ProductListFilters = {},
): Promise<ProductListResult> {
  const page = Math.max(1, Number(filters.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(filters.limit ?? 20)));
  const offset = (page - 1) * limit;

  const where: string[] = [];
  const values: unknown[] = [];

  if (filters.search?.trim()) {
    values.push(`%${filters.search.trim()}%`);
    where.push(
      `(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length} OR p.sku ILIKE $${values.length})`,
    );
  }

  if (filters.category?.trim()) {
    values.push(slugify(filters.category));
    where.push(`c.slug = $${values.length}`);
  }

  if (filters.brand?.trim()) {
    values.push(filters.brand.trim());
    where.push(`b.name ILIKE $${values.length}`);
  }

  if (filters.status) {
    values.push(filters.status);
    where.push(`p.status = $${values.length}`);
  }

  if (
    typeof filters.minPrice === "number" &&
    Number.isFinite(filters.minPrice)
  ) {
    values.push(filters.minPrice);
    where.push(`p.price >= $${values.length}`);
  }

  if (
    typeof filters.maxPrice === "number" &&
    Number.isFinite(filters.maxPrice)
  ) {
    values.push(filters.maxPrice);
    where.push(`p.price <= $${values.length}`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalResult = await dbQuery<{ total: string }>(
    `
      SELECT COUNT(DISTINCT p.id)::text AS total
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN brands b ON b.id = p.brand_id
      ${whereSql};
    `,
    values,
  );

  const orderBy = mapSort(filters.sortBy, filters.sortOrder);
  values.push(limit, offset);

  const query = `
    ${BASE_SELECT}
    ${whereSql}
    ${GROUP_BY}
    ORDER BY ${orderBy}
    LIMIT $${values.length - 1}
    OFFSET $${values.length};
  `;

  const result = await dbQuery<ProductEntity>(query, values);
  const total = Number(totalResult.rows[0]?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    items: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getProductById(
  productId: string,
): Promise<ProductEntity | null> {
  const result = await dbQuery<ProductEntity>(
    `
      ${BASE_SELECT}
      WHERE p.id = $1
      ${GROUP_BY};
    `,
    [productId],
  );

  return result.rows[0] ?? null;
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ProductEntity> {
  const categoryId = await ensureCategoryId(
    input.categorySlug,
    input.categoryName,
  );
  const brandId = await ensureBrandId(input.brandName);
  const productSlug = slugify(input.name);

  const inserted = await dbQuery<{ id: string }>(
    `
      INSERT INTO products(
        name, slug, description, price, status, stock, sku, rating, image_url, category_id, brand_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING id;
    `,
    [
      input.name.trim(),
      productSlug,
      input.description ?? null,
      input.price,
      input.status ?? "available",
      input.stock ?? 0,
      input.sku ?? null,
      input.rating ?? null,
      input.imageUrl ?? null,
      categoryId,
      brandId,
    ],
  );

  const productId = inserted.rows[0]?.id;

  const images = normalizeArray(input.images);
  if (images.length) {
    await Promise.all(
      images.map((url, index) =>
        dbQuery(
          `INSERT INTO product_images(product_id, url, position) VALUES ($1, $2, $3);`,
          [productId, url, index],
        ),
      ),
    );
  }

  const tags = normalizeArray(input.tags);
  if (tags.length) {
    await Promise.all(
      tags.map((tag) =>
        dbQuery(
          `INSERT INTO product_tags(product_id, tag) VALUES ($1, $2) ON CONFLICT (product_id, tag) DO NOTHING;`,
          [productId, tag],
        ),
      ),
    );
  }

  const product = await getProductById(productId);
  if (!product) {
    throw new Error("Failed to fetch created product");
  }

  return product;
}

export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
): Promise<ProductEntity | null> {
  const existing = await getProductById(productId);
  if (!existing) return null;

  const nextName = input.name?.trim() ?? existing.name;
  const nextSlug = input.name ? slugify(input.name) : existing.slug;

  const categoryId =
    input.categorySlug !== undefined || input.categoryName !== undefined
      ? await ensureCategoryId(input.categorySlug, input.categoryName)
      : existing.categoryId;

  const brandId =
    input.brandName !== undefined
      ? await ensureBrandId(input.brandName)
      : existing.brandId;

  await dbQuery(
    `
      UPDATE products
      SET
        name = $2,
        slug = $3,
        description = $4,
        price = $5,
        status = $6,
        stock = $7,
        sku = $8,
        rating = $9,
        image_url = $10,
        category_id = $11,
        brand_id = $12
      WHERE id = $1;
    `,
    [
      productId,
      nextName,
      nextSlug,
      input.description !== undefined
        ? input.description
        : existing.description,
      input.price !== undefined ? input.price : existing.price,
      input.status ?? existing.status,
      input.stock !== undefined ? input.stock : existing.stock,
      input.sku !== undefined ? input.sku : existing.sku,
      input.rating !== undefined ? input.rating : existing.rating,
      input.imageUrl !== undefined ? input.imageUrl : existing.imageUrl,
      categoryId,
      brandId,
    ],
  );

  if (input.images) {
    await dbQuery(`DELETE FROM product_images WHERE product_id = $1;`, [
      productId,
    ]);
    const images = normalizeArray(input.images);
    await Promise.all(
      images.map((url, index) =>
        dbQuery(
          `INSERT INTO product_images(product_id, url, position) VALUES ($1, $2, $3);`,
          [productId, url, index],
        ),
      ),
    );
  }

  if (input.tags) {
    await dbQuery(`DELETE FROM product_tags WHERE product_id = $1;`, [
      productId,
    ]);
    const tags = normalizeArray(input.tags);
    await Promise.all(
      tags.map((tag) =>
        dbQuery(
          `INSERT INTO product_tags(product_id, tag) VALUES ($1, $2) ON CONFLICT (product_id, tag) DO NOTHING;`,
          [productId, tag],
        ),
      ),
    );
  }

  return getProductById(productId);
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const result = await dbQuery(`DELETE FROM products WHERE id = $1;`, [
    productId,
  ]);
  return (result.rowCount ?? 0) > 0;
}
