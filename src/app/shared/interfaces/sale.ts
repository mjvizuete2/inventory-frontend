export interface SaleInvoiceInfo {
  id: number;
  sequential: string;
  accessKey: string;
  authorizationStatus: string;
  authorizationNumber: string;
}

export interface SalePaymentInfo {
  paymentMethod: string;
  amount: number;
  reference?: string;
  receivedAmount?: number;
  changeAmount?: number;
}

export interface Sale {
  id: number;
  date: string;
  customerId: number;
  customerName: string;
  documentNumber: string;
  createdBy: string;
  paymentMethod: string;
  paymentReference?: string;
  receivedAmount?: number;
  changeAmount?: number;
  subtotal: number;
  iva: number;
  total: number;
  items: SaleItem[];
  payments: SalePaymentInfo[];
  invoice?: SaleInvoiceInfo;
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
  paymentReference?: string;
  receivedAmount?: number;
  subtotal: number;
  iva: number;
  total: number;
  items: SaleItemPayload[];
}

export interface SaleItemPayload {
  productId: number;
  quantity: number;
  finalPrice: number;
  hasIva: boolean;
}
