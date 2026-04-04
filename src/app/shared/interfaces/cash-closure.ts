import { Sale } from './sale';

export interface CashClosure {
  id: string;
  date: string;
  users: string[];
  total: number;
  cashTotal: number;
  cardTotal: number;
  transferTotal: number;
  sales: Sale[];
}
