export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  category: string;
  description: string;
  price: number;
  stock: number;
  iva: boolean;
  status: ProductStatus;
  supplier: string;
  updatedAt: string;
}

export type ProductPayload = Omit<Product, 'id' | 'category' | 'updatedAt'>;
