interface CategoryEntity {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

interface BrandEntity {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}
