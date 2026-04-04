import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, map, of } from 'rxjs';
import { Product } from '../../shared/interfaces/product';
import { Sale, SaleItem, SaleItemPayload, SalePayload } from '../../shared/interfaces/sale';
import { CustomerService } from './customer.service';
import { ProductService } from './product.service';

const INITIAL_SALES: Sale[] = [
  {
    id: 1,
    date: '2026-04-01T14:15:00.000Z',
    customerId: 1,
    customerName: 'Comercial Andina SAS',
    documentNumber: '901245778',
    createdBy: 'Admin Principal',
    paymentMethod: 'transfer',
    subtotal: 1240000,
    iva: 235600,
    total: 1475600,
    items: [
      {
        productId: 3,
        productName: 'Silla Ergonómica Nexus',
        quantity: 1,
        price: 1240000,
        iva: true,
        subtotal: 1240000,
        ivaAmount: 235600,
        total: 1475600
      }
    ]
  },
  {
    id: 2,
    date: '2026-04-02T10:40:00.000Z',
    customerId: 2,
    customerName: 'Distribuciones Nova',
    documentNumber: '800456123',
    createdBy: 'Laura Mejia',
    paymentMethod: 'card',
    subtotal: 508000,
    iva: 96520,
    total: 604520,
    items: [
      {
        productId: 2,
        productName: 'Teclado Mecánico Pro',
        quantity: 1,
        price: 329000,
        iva: true,
        subtotal: 329000,
        ivaAmount: 62510,
        total: 391510
      },
      {
        productId: 5,
        productName: 'Mouse Vertical Silent',
        quantity: 1,
        price: 179000,
        iva: true,
        subtotal: 179000,
        ivaAmount: 34010,
        total: 213010
      }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private readonly salesSubject = new BehaviorSubject<Sale[]>(INITIAL_SALES);
  private readonly responseDelay = 150;

  constructor(
    private readonly productService: ProductService,
    private readonly customerService: CustomerService
  ) {}

  getSales(): Observable<Sale[]> {
    return this.salesSubject.asObservable().pipe(delay(this.responseDelay));
  }

  getSaleById(id: number): Observable<Sale | undefined> {
    return this.getSales().pipe(
      map((sales) => sales.find((sale) => sale.id === id))
    );
  }

  createSale(payload: SalePayload): Observable<Sale> {
    const products = this.productService.getProductsSnapshot();
    const customer = this.customerService.getCustomersSnapshot().find((entry) => entry.id === payload.customerId);
    const items = payload.items.map((item) => this.buildSaleItem(item, products));

    const sale: Sale = {
      id: this.getNextId(),
      date: new Date().toISOString(),
      customerId: payload.customerId,
      customerName: customer?.name ?? 'Cliente',
      documentNumber: customer?.documentNumber ?? '',
      createdBy: payload.createdBy,
      paymentMethod: payload.paymentMethod,
      subtotal: payload.subtotal,
      iva: payload.iva,
      total: payload.total,
      items
    };

    this.salesSubject.next([sale, ...this.salesSubject.value]);

    return of(sale).pipe(delay(this.responseDelay));
  }

  private buildSaleItem(item: SaleItemPayload, products: Product[]): SaleItem {
    const product = products.find((entry) => entry.id === item.productId);
    const price = product?.price ?? 0;
    const subtotal = price * item.quantity;
    const itemIva = product?.iva ? subtotal * 0.19 : 0;

    return {
      productId: item.productId,
      productName: product?.name ?? 'Producto',
      quantity: item.quantity,
      price,
      iva: product?.iva ?? false,
      subtotal,
      ivaAmount: itemIva,
      total: subtotal + itemIva
    };
  }

  private getNextId(): number {
    return this.salesSubject.value.reduce((maxId, sale) => Math.max(maxId, sale.id), 0) + 1;
  }
}
