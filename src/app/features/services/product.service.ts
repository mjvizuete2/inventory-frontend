import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Product, ProductPayload } from '../../shared/interfaces/product';
import { ProductCategory } from '../../shared/interfaces/product-category';

type ApiProduct = {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  category: { id: number; name: string };
  description: string | null;
  provider: string | null;
  price: string;
  stock: number;
  ivaRate: string;
  active: boolean;
  updatedAt: string;
};

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly productsSubject = new BehaviorSubject<Product[]>([]);
  private readonly categoriesSubject = new BehaviorSubject<ProductCategory[]>([]);
  private loaded = false;

  getProducts(): Observable<Product[]> {
    if (!this.loaded) {
      this.refreshProducts().subscribe();
    }

    return this.productsSubject.asObservable();
  }

  refreshProducts(): Observable<Product[]> {
    return this.http.get<ApiProduct[]>(`${environment.apiBaseUrl}/products`).pipe(
      map((products) => products.map((product) => this.mapProduct(product))),
      tap((products) => {
        this.loaded = true;
        this.productsSubject.next(products);
      })
    );
  }

  setCategories(categories: ProductCategory[]): void {
    this.categoriesSubject.next(categories);
  }

  getCategoriesSnapshot(): ProductCategory[] {
    return this.categoriesSubject.value.map((category) => ({ ...category }));
  }

  searchProducts(term: string): Observable<Product[]> {
    const normalizedTerm = term.trim().toLowerCase();

    if (!normalizedTerm) {
      return of([]);
    }

    return this.getProducts().pipe(
      map((products) =>
        products
          .filter((product) =>
            product.status === 'active' &&
            `${product.name} ${product.sku}`.toLowerCase().includes(normalizedTerm)
          )
          .slice(0, 8)
      )
    );
  }

  createProduct(payload: ProductPayload): Observable<Product> {
    return this.http.post<ApiProduct>(`${environment.apiBaseUrl}/products`, this.toApiPayload(payload)).pipe(
      map((product) => this.mapProduct(product)),
      tap((product) => {
        this.productsSubject.next([product, ...this.productsSubject.value]);
      })
    );
  }

  updateProduct(id: number, payload: ProductPayload): Observable<Product> {
    return this.http.put<ApiProduct>(`${environment.apiBaseUrl}/products/${id}`, this.toApiPayload(payload)).pipe(
      map((product) => this.mapProduct(product)),
      tap((updatedProduct) => {
        this.productsSubject.next(
          this.productsSubject.value.map((product) => product.id === id ? updatedProduct : product)
        );
      })
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/products/${id}`).pipe(
      tap(() => {
        this.productsSubject.next(this.productsSubject.value.filter((product) => product.id !== id));
      })
    );
  }

  getProductById(id: number): Observable<Product | undefined> {
    const cached = this.productsSubject.value.find((product) => product.id === id);
    if (cached) {
      return of({ ...cached });
    }

    return this.http.get<ApiProduct>(`${environment.apiBaseUrl}/products/${id}`).pipe(
      map((product) => this.mapProduct(product))
    );
  }

  private toApiPayload(payload: ProductPayload): Record<string, unknown> {
    return {
      sku: payload.sku.trim().toUpperCase(),
      name: payload.name.trim(),
      categoryId: Number(payload.categoryId),
      description: payload.description.trim() || undefined,
      provider: payload.supplier.trim() || undefined,
      price: Number(Number(payload.price).toFixed(2)),
      stock: Number(payload.stock),
      ivaRate: payload.iva ? 12 : 0,
      active: payload.status === 'active'
    };
  }

  private mapProduct(product: ApiProduct): Product {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      categoryId: product.categoryId,
      category: product.category?.name ?? '',
      description: product.description ?? '',
      price: Number(product.price ?? 0),
      stock: product.stock,
      iva: Number(product.ivaRate) > 0,
      status: product.active ? 'active' : 'inactive',
      supplier: product.provider ?? '',
      updatedAt: product.updatedAt
    };
  }
}
