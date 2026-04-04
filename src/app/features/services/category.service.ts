import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { ProductCategory } from '../../shared/interfaces/product-category';

type ApiCategory = {
  id: number;
  name: string;
  description: string;
  active: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly http = inject(HttpClient);

  getCategories(): Observable<ProductCategory[]> {
    return this.http.get<ApiCategory[]>(`${environment.apiBaseUrl}/categories`);
  }

  createCategory(payload: { name: string; description?: string; active?: boolean }): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(`${environment.apiBaseUrl}/categories`, payload);
  }

  updateCategory(id: number, payload: { name: string; description?: string; active?: boolean }): Observable<ProductCategory> {
    return this.http.put<ProductCategory>(`${environment.apiBaseUrl}/categories/${id}`, payload);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/categories/${id}`);
  }
}
