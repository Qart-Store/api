type ProductStatus =
  | "available"
  | "out-of-stock"
  | "discontinued"
  | "pre-order"
  | "back-order"
  | "limited-edition"
  | "exclusive"
  | "new-arrival"
  | "best-seller"
  | "clearance"
  | "seasonal"
  | "bundle"
  | "digital"
  | "physical"
  | "archived";

interface ProductEntity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  stock: number;
  sku: string | null;
  rating: number | null;
  bannerUrl: string | null;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  images: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ProductListFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "createdAt" | "price" | "name" | "rating";
  sortOrder?: "asc" | "desc";
}

interface ProductListResult {
  items: ProductEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CreateProductInput {
  name: string;
  description?: string | null;
  price: number;
  status?: ProductStatus;
  stock?: number;
  sku?: string | null;
  rating?: number | null;
  bannerUrl?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  brandName?: string | null;
  images?: string[];
  tags?: string[];
}

interface UpdateProductInput {
  name?: string;
  description?: string | null;
  price?: number;
  status?: ProductStatus;
  stock?: number;
  sku?: string | null;
  rating?: number | null;
  bannerUrl?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  brandName?: string | null;
  images?: string[];
  tags?: string[];
}
