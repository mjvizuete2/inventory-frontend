export interface Sale {
  id: number;
  date: Date;
  customerId: number;
  total: number;
  items: SaleItem[];
}

export interface SaleItem {
  productId: number;
  quantity: number;
  price: number;
}