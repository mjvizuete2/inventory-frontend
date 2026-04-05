import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Sale, SaleInvoiceInfo, SalePayload } from '../../shared/interfaces/sale';

type ApiSale = {
  id: number;
  clientId: number | null;
  subtotal: string;
  ivaAmount: string;
  total: string;
  createdBy: string;
  soldAt: string;
  client: {
    id: number;
    name: string;
    identification: string;
  } | null;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: string;
    hasIva: boolean;
    subtotal: string;
    ivaAmount: string;
    total: string;
    product: {
      id: number;
      name: string;
      price?: string;
    };
  }>;
  payments: Array<{
    paymentMethod: string;
    amount: string;
    reference?: string | null;
    receivedAmount?: string | null;
    changeAmount?: string | null;
  }>;
  invoice?: {
    id: number;
    sequential: string;
    accessKey: string;
    authorizationStatus: string;
    authorizationNumber: string | null;
  };
};

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private readonly http = inject(HttpClient);
  private readonly salesSubject = new BehaviorSubject<Sale[]>([]);
  private loaded = false;

  getSales(): Observable<Sale[]> {
    if (!this.loaded) {
      this.refreshSales().subscribe();
    }

    return this.salesSubject.asObservable();
  }

  refreshSales(): Observable<Sale[]> {
    return this.http.get<ApiSale[]>(`${environment.apiBaseUrl}/sales`).pipe(
      map((sales) => sales.map((sale) => this.mapSale(sale))),
      tap((sales) => {
        this.loaded = true;
        this.salesSubject.next(sales);
      })
    );
  }

  getSaleById(id: number): Observable<Sale | undefined> {
    return this.http.get<ApiSale>(`${environment.apiBaseUrl}/sales/${id}`).pipe(
      map((sale) => this.mapSale(sale))
    );
  }

  createSale(payload: SalePayload): Observable<Sale> {
    const normalizedReference = payload.paymentReference?.trim() || undefined;
    const body = {
      clientId: payload.customerId,
      createdBy: payload.createdBy,
      items: payload.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        finalPrice: item.finalPrice,
        hasIva: item.hasIva
      })),
      payments: [
        {
          paymentMethod: this.mapPaymentMethod(payload.paymentMethod),
          amount: payload.total,
          reference: normalizedReference,
          receivedAmount: payload.receivedAmount
        }
      ]
    };

    return this.http.post<ApiSale>(`${environment.apiBaseUrl}/sales`, body).pipe(
      switchMap((sale) =>
        this.http.post(`${environment.apiBaseUrl}/sales/${sale.id}/invoice`, {}).pipe(
          map(() => sale),
          catchError(() => of(sale))
        )
      ),
      switchMap((sale) => this.http.get<ApiSale>(`${environment.apiBaseUrl}/sales/${sale.id}`)),
      map((sale) => this.mapSale(sale)),
      tap((sale) => {
        this.salesSubject.next([sale, ...this.salesSubject.value.filter((entry) => entry.id !== sale.id)]);
      })
    );
  }

  private mapSale(sale: ApiSale): Sale {
    const firstPayment = sale.payments[0];

    return {
      id: sale.id,
      date: sale.soldAt,
      customerId: sale.clientId ?? 0,
      customerName: sale.client?.name ?? 'Consumidor final',
      documentNumber: sale.client?.identification ?? '9999999999999',
      createdBy: sale.createdBy ?? 'system',
      paymentMethod: this.mapPaymentMethodLabel(firstPayment?.paymentMethod ?? 'CASH'),
      paymentReference: firstPayment?.reference?.trim() || undefined,
      receivedAmount: firstPayment?.receivedAmount ? Number(firstPayment.receivedAmount) : undefined,
      changeAmount: firstPayment?.changeAmount ? Number(firstPayment.changeAmount) : undefined,
      subtotal: Number(sale.subtotal),
      iva: Number(sale.ivaAmount),
      total: Number(sale.total),
      items: sale.items.map((item) => ({
        productId: item.productId,
        productName: item.product?.name ?? 'Producto',
        quantity: item.quantity,
        price: Number(item.unitPrice),
        iva: item.hasIva,
        subtotal: Number(item.subtotal),
        ivaAmount: Number(item.ivaAmount),
        total: Number(item.total)
      })),
      payments: sale.payments.map((payment) => ({
        paymentMethod: this.mapPaymentMethodLabel(payment.paymentMethod),
        amount: Number(payment.amount),
        reference: payment.reference?.trim() || undefined,
        receivedAmount: payment.receivedAmount ? Number(payment.receivedAmount) : undefined,
        changeAmount: payment.changeAmount ? Number(payment.changeAmount) : undefined
      })),
      invoice: sale.invoice ? this.mapInvoice(sale.invoice) : undefined
    };
  }

  private mapInvoice(invoice: ApiSale['invoice']): SaleInvoiceInfo | undefined {
    if (!invoice) {
      return undefined;
    }

    return {
      id: invoice.id,
      sequential: invoice.sequential,
      accessKey: invoice.accessKey,
      authorizationStatus: invoice.authorizationStatus,
      authorizationNumber: invoice.authorizationNumber ?? ''
    };
  }

  private mapPaymentMethod(method: SalePayload['paymentMethod']): string {
    const map: Record<SalePayload['paymentMethod'], string> = {
      cash: 'CASH',
      card: 'CARD',
      transfer: 'TRANSFER'
    };

    return map[method];
  }

  private mapPaymentMethodLabel(method: string): string {
    const map: Record<string, string> = {
      CASH: 'cash',
      CARD: 'card',
      TRANSFER: 'transfer'
    };

    return map[method] ?? method.toLowerCase();
  }
}
