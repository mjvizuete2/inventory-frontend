import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Customer, CustomerPayload } from '../../shared/interfaces/customer';

type ApiCustomer = {
  id: number;
  documentType: string;
  identification: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  updatedAt: string;
};

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly customersSubject = new BehaviorSubject<Customer[]>([]);
  private loaded = false;

  getCustomers(): Observable<Customer[]> {
    if (!this.loaded) {
      this.refreshCustomers().subscribe();
    }

    return this.customersSubject.asObservable();
  }

  refreshCustomers(): Observable<Customer[]> {
    return this.http.get<ApiCustomer[]>(`${environment.apiBaseUrl}/clients`).pipe(
      map((customers) => customers.map((customer) => this.mapCustomer(customer))),
      tap((customers) => {
        this.loaded = true;
        this.customersSubject.next(customers);
      })
    );
  }

  searchCustomers(term: string): Observable<Customer[]> {
    const normalizedTerm = term.trim().toLowerCase();

    if (!normalizedTerm) {
      return of([]);
    }

    return this.getCustomers().pipe(
      map((customers) =>
        customers
          .filter((customer) =>
            `${customer.name} ${customer.email} ${customer.documentNumber}`.toLowerCase().includes(normalizedTerm)
          )
          .slice(0, 8)
      )
    );
  }

  findCustomerByDocument(documentNumber: string): Observable<Customer | undefined> {
    const normalizedDocument = documentNumber.trim().toUpperCase();

    if (!normalizedDocument) {
      return of(undefined);
    }

    return this.getCustomers().pipe(
      map((customers) => customers.find((customer) => customer.documentNumber.trim().toUpperCase() === normalizedDocument))
    );
  }

  getCustomerById(id: number): Observable<Customer | undefined> {
    const cached = this.customersSubject.value.find((customer) => customer.id === id);
    if (cached) {
      return of({ ...cached });
    }

    return this.http.get<ApiCustomer>(`${environment.apiBaseUrl}/clients/${id}`).pipe(
      map((customer) => this.mapCustomer(customer))
    );
  }

  createCustomer(payload: CustomerPayload): Observable<Customer> {
    return this.http.post<ApiCustomer>(`${environment.apiBaseUrl}/clients`, this.toApiPayload(payload)).pipe(
      map((customer) => this.mapCustomer(customer)),
      tap((customer) => {
        this.customersSubject.next([customer, ...this.customersSubject.value]);
      })
    );
  }

  updateCustomer(id: number, payload: CustomerPayload): Observable<Customer> {
    return this.http.put<ApiCustomer>(`${environment.apiBaseUrl}/clients/${id}`, this.toApiPayload(payload)).pipe(
      map((customer) => this.mapCustomer(customer)),
      tap((updatedCustomer) => {
        this.customersSubject.next(
          this.customersSubject.value.map((customer) => customer.id === id ? updatedCustomer : customer)
        );
      })
    );
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/clients/${id}`).pipe(
      tap(() => {
        this.customersSubject.next(this.customersSubject.value.filter((customer) => customer.id !== id));
      })
    );
  }

  private toApiPayload(payload: CustomerPayload): Record<string, unknown> {
    return {
      documentType: payload.documentType,
      identification: payload.documentNumber.trim().toUpperCase(),
      name: payload.name.trim(),
      email: payload.email.trim() || undefined,
      phone: payload.phone.trim() || undefined,
      address: [payload.address.trim(), payload.city.trim()].filter(Boolean).join(', ')
    };
  }

  private mapCustomer(customer: ApiCustomer): Customer {
    const [address = '', city = ''] = (customer.address ?? '').split(',').map((value) => value.trim());

    return {
      id: customer.id,
      documentType: (customer.documentType as Customer['documentType']) ?? 'CEDULA',
      name: customer.name,
      documentNumber: customer.identification,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      address,
      city,
      status: 'active',
      updatedAt: customer.updatedAt
    };
  }
}
