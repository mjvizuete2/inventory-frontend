export interface Sale {
  id: number;
  date: string;
  customerId: number;
  customerName: string;
  documentNumber: string;
  createdBy: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  subtotal: number;
  iva: number;
  total: number;
  items: SaleItem[];
}

export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  iva: boolean;
  subtotal: number;
  ivaAmount: number;
  total: number;
}

export interface SalePayload {
  customerId: number;
  createdBy: string;
  paymentMethod: 'cash' | 'card' | 'transfer';
  subtotal: number;
  iva: number;
  total: number;
  items: SaleItemPayload[];
}

export interface SaleItemPayload {
  productId: number;
  quantity: number;
}
