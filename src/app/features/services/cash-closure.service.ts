import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CashClosure } from '../../shared/interfaces/cash-closure';
import { Sale } from '../../shared/interfaces/sale';
import { SalesService } from './sales.service';

@Injectable({
  providedIn: 'root'
})
export class CashClosureService {
  constructor(private readonly salesService: SalesService) {}

  getClosures(): Observable<CashClosure[]> {
    return this.salesService.getSales().pipe(
      map((sales) => this.groupSalesByDay(sales))
    );
  }

  private groupSalesByDay(sales: Sale[]): CashClosure[] {
    const grouped = sales.reduce((accumulator, sale) => {
      const key = sale.date.slice(0, 10);

      if (!accumulator.has(key)) {
        accumulator.set(key, {
          id: key,
          date: sale.date,
          users: [],
          total: 0,
          cashTotal: 0,
          cardTotal: 0,
          transferTotal: 0,
          sales: []
        });
      }

      const closure = accumulator.get(key)!;
      closure.sales.push(sale);
      closure.total += sale.total;

      if (!closure.users.includes(sale.createdBy)) {
        closure.users.push(sale.createdBy);
      }

      if (sale.paymentMethod === 'cash') {
        closure.cashTotal += sale.total;
      }

      if (sale.paymentMethod === 'card') {
        closure.cardTotal += sale.total;
      }

      if (sale.paymentMethod === 'transfer') {
        closure.transferTotal += sale.total;
      }

      return accumulator;
    }, new Map<string, CashClosure>());

    return Array.from(grouped.values()).sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
    );
  }
}
