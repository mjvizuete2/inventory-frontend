import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environments';
import { CashClosure } from '../../shared/interfaces/cash-closure';

type ApiCashClosure = {
  id: number;
  status: 'OPEN' | 'CLOSED';
  startDate: string;
  endDate: string | null;
  openedBy?: string;
  closedBy?: string | null;
  openingAmount: number | string;
  closingAmount: number | string;
  subtotal: number | string;
  ivaAmount: number | string;
  total: number | string;
  salesCount: number;
  payments: Array<{
    paymentMethod: string;
    total: number | string;
    salesCount: number;
  }>;
};

@Injectable({
  providedIn: 'root'
})
export class CashClosureService {
  private readonly http = inject(HttpClient);

  getClosures(): Observable<CashClosure[]> {
    return this.http.get<ApiCashClosure[]>(`${environment.apiBaseUrl}/cash-closures`).pipe(
      map((closures) => closures.map((closure) => this.mapClosure(closure)))
    );
  }

  getCurrentClosure(): Observable<CashClosure | null> {
    return this.http.get<ApiCashClosure>(`${environment.apiBaseUrl}/cash-closures/current`).pipe(
      map((closure) => this.mapClosure(closure)),
      catchError(() => of(null))
    );
  }

  openCashBox(openingAmount: number): Observable<CashClosure> {
    return this.http.post<ApiCashClosure>(`${environment.apiBaseUrl}/cash-closures`, {
      openingAmount
    }).pipe(
      map((closure) => this.mapClosure(closure))
    );
  }

  closeCashBox(reopen: boolean, nextOpeningAmount: number): Observable<{ closedClosure: CashClosure; currentClosure: CashClosure | null }> {
    return this.http.post<{ closedClosure: ApiCashClosure; currentClosure: ApiCashClosure | null }>(
      `${environment.apiBaseUrl}/cash-closures/close`,
      {
        reopen,
        nextOpeningAmount
      }
    ).pipe(
      map((response) => ({
        closedClosure: this.mapClosure(response.closedClosure),
        currentClosure: response.currentClosure ? this.mapClosure(response.currentClosure) : null
      }))
    );
  }

  private mapClosure(closure: ApiCashClosure): CashClosure {
    const payments = closure.payments.map((payment) => ({
      paymentMethod: payment.paymentMethod,
      total: Number(payment.total ?? 0),
      salesCount: payment.salesCount
    }));

    const getPaymentTotal = (method: string): number =>
      payments.find((payment) => payment.paymentMethod === method)?.total ?? 0;

    return {
      id: closure.id,
      status: closure.status,
      startDate: closure.startDate,
      endDate: closure.endDate,
      openedBy: closure.openedBy ?? 'system',
      closedBy: closure.closedBy ?? null,
      openingAmount: Number(closure.openingAmount ?? 0),
      closingAmount: Number(closure.closingAmount ?? 0),
      subtotal: Number(closure.subtotal ?? 0),
      ivaAmount: Number(closure.ivaAmount ?? 0),
      total: Number(closure.total ?? 0),
      salesCount: closure.salesCount,
      payments,
      cashTotal: getPaymentTotal('CASH'),
      cardTotal: getPaymentTotal('CARD'),
      transferTotal: getPaymentTotal('TRANSFER')
    };
  }
}
