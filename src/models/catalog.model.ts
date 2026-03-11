import { dbQuery } from "../config/db";

export async function listCategories(): Promise<CategoryEntity[]> {
  const result = await dbQuery<CategoryEntity>(
    `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        COUNT(p.id)::int AS "productCount"
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC;
    `,
  );

  return result.rows;
}

export async function listBrands(): Promise<BrandEntity[]> {
  const result = await dbQuery<BrandEntity>(
    `
      SELECT
        b.id,
        b.name,
        b.slug,
        b.created_at AS "createdAt",
        b.updated_at AS "updatedAt",
        COUNT(p.id)::int AS "productCount"
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id
      GROUP BY b.id
      ORDER BY b.name ASC;
    `,
  );

  return result.rows;
}
