export interface CashClosurePayment {
  paymentMethod: string;
  total: number;
  salesCount: number;
}

export interface CashClosure {
  id: number;
  status: 'OPEN' | 'CLOSED';
  startDate: string;
  endDate: string | null;
  openedBy: string;
  closedBy: string | null;
  openingAmount: number;
  closingAmount: number;
  subtotal: number;
  ivaAmount: number;
  total: number;
  salesCount: number;
  payments: CashClosurePayment[];
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
}
