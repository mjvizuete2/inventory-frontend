import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, map, of } from 'rxjs';
import { Customer, CustomerPayload } from '../../shared/interfaces/customer';

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'Comercial Andina SAS',
    documentNumber: '901245778',
    email: 'compras@comercialandina.co',
    phone: '3204567890',
    address: 'Calle 85 # 14-22',
    city: 'Bogota',
    status: 'active',
    updatedAt: '2026-03-25T08:30:00.000Z'
  },
  {
    id: 2,
    name: 'Distribuciones Nova',
    documentNumber: '800456123',
    email: 'pedidos@nova.com.co',
    phone: '3159876541',
    address: 'Carrera 43A # 5A-113',
    city: 'Medellin',
    status: 'active',
    updatedAt: '2026-03-29T13:20:00.000Z'
  },
  {
    id: 3,
    name: 'Papeleria Horizonte',
    documentNumber: '860112009',
    email: 'admin@horizonte.co',
    phone: '3102223344',
    address: 'Avenida 30 de Agosto # 40-18',
    city: 'Pereira',
    status: 'inactive',
    updatedAt: '2026-03-17T10:10:00.000Z'
  }
];

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly customersSubject = new BehaviorSubject<Customer[]>(MOCK_CUSTOMERS);
  private readonly responseDelay = 150;

  getCustomers(): Observable<Customer[]> {
    return this.customersSubject.asObservable().pipe(delay(this.responseDelay));
  }

  searchCustomers(term: string): Observable<Customer[]> {
    const normalizedTerm = term.trim().toLowerCase();

    if (!normalizedTerm) {
      return of([]).pipe(delay(this.responseDelay));
    }

    return of(
      this.customersSubject.value
        .filter((customer) =>
          customer.status === 'active' &&
          [
            customer.name,
            customer.email,
            customer.documentNumber
          ].join(' ').toLowerCase().includes(normalizedTerm)
        )
        .slice(0, 8)
        .map((customer) => ({ ...customer }))
    ).pipe(delay(this.responseDelay));
  }

  getCustomersSnapshot(): Customer[] {
    return this.customersSubject.value.map((customer) => ({ ...customer }));
  }

  getActiveCustomersSnapshot(): Customer[] {
    return this.getCustomersSnapshot().filter((customer) => customer.status === 'active');
  }

  getCustomerById(id: number): Observable<Customer | undefined> {
    return this.getCustomers().pipe(
      map((customers) => customers.find((customer) => customer.id === id))
    );
  }

  createCustomer(payload: CustomerPayload): Observable<Customer> {
    const customer: Customer = {
      ...payload,
      id: this.getNextId(),
      updatedAt: new Date().toISOString()
    };

    this.customersSubject.next([...this.customersSubject.value, customer]);
    return of(customer).pipe(delay(this.responseDelay));
  }

  updateCustomer(id: number, payload: CustomerPayload): Observable<Customer> {
    let updatedCustomer!: Customer;

    const customers = this.customersSubject.value.map((customer) => {
      if (customer.id !== id) {
        return customer;
      }

      updatedCustomer = {
        ...customer,
        ...payload,
        updatedAt: new Date().toISOString()
      };

      return updatedCustomer;
    });

    this.customersSubject.next(customers);
    return of(updatedCustomer).pipe(delay(this.responseDelay));
  }

  deleteCustomer(id: number): Observable<void> {
    this.customersSubject.next(this.customersSubject.value.filter((customer) => customer.id !== id));
    return of(void 0).pipe(delay(this.responseDelay));
  }

  private getNextId(): number {
    return this.customersSubject.value.reduce((maxId, customer) => Math.max(maxId, customer.id), 0) + 1;
  }
}
