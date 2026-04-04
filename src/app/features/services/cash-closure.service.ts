import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CashClosure } from '../../shared/interfaces/cash-closure';
import { Sale } from '../../shared/interfaces/sale';
import { SalesService } from './sales.service';

@Injectable({
  providedIn: 'root'
})
export class CashClosureService {
  private readonly salesService = inject(SalesService);

  getClosures(): Observable<CashClosure[]> {
    return this.salesService.getSales().pipe(
      map((sales) => this.groupSalesByDay(sales))
    );
  }

  private groupSalesByDay(sales: Sale[]): CashClosure[] {
    const grouped = new Map<string, CashClosure>();

    for (const sale of sales) {
      const key = sale.date.slice(0, 10);
      const existing = grouped.get(key) ?? {
        id: key,
        date: sale.date,
        users: [],
        total: 0,
        cashTotal: 0,
        cardTotal: 0,
        transferTotal: 0,
        sales: []
      };

      existing.sales.push(sale);
      existing.total += sale.total;

      if (!existing.users.includes(sale.createdBy)) {
        existing.users.push(sale.createdBy);
      }

      if (sale.paymentMethod === 'cash') {
        existing.cashTotal += sale.total;
      }
      if (sale.paymentMethod === 'card') {
        existing.cardTotal += sale.total;
      }
      if (sale.paymentMethod === 'transfer') {
        existing.transferTotal += sale.total;
      }

      grouped.set(key, existing);
    }

    return Array.from(grouped.values()).sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
    );
  }
}
