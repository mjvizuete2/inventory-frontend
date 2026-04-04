import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, map, of } from 'rxjs';
import { Product, ProductPayload } from '../../shared/interfaces/product';
import { ProductCategory } from '../../shared/interfaces/product-category';

const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 1, name: 'Electrónica' },
  { id: 2, name: 'Accesorios' },
  { id: 3, name: 'Oficina' },
  { id: 4, name: 'Hogar' }
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Monitor UltraWide 34"',
    sku: 'MON-3400',
    categoryId: 1,
    category: 'Electrónica',
    description: 'Monitor curvo con panel IPS y resolución QHD para estaciones de trabajo.',
    price: 1890000,
    stock: 12,
    iva: true,
    status: 'active',
    supplier: 'VisualTech',
    updatedAt: '2026-03-24T10:00:00.000Z'
  },
  {
    id: 2,
    name: 'Teclado Mecánico Pro',
    sku: 'KEY-7781',
    categoryId: 2,
    category: 'Accesorios',
    description: 'Teclado con switches rojos, layout en español y retroiluminación.',
    price: 329000,
    stock: 28,
    iva: true,
    status: 'active',
    supplier: 'Input Labs',
    updatedAt: '2026-03-27T14:35:00.000Z'
  },
  {
    id: 3,
    name: 'Silla Ergonómica Nexus',
    sku: 'CHR-1008',
    categoryId: 4,
    category: 'Hogar',
    description: 'Silla con soporte lumbar ajustable y cabecero para jornada extendida.',
    price: 1240000,
    stock: 6,
    iva: true,
    status: 'active',
    supplier: 'Workspace Studio',
    updatedAt: '2026-03-18T09:20:00.000Z'
  },
  {
    id: 4,
    name: 'Archivador Modular A4',
    sku: 'OFF-5560',
    categoryId: 3,
    category: 'Oficina',
    description: 'Archivador de 5 bandejas apilables para documentos y formularios.',
    price: 119000,
    stock: 0,
    iva: false,
    status: 'inactive',
    supplier: 'Paper House',
    updatedAt: '2026-03-15T11:10:00.000Z'
  },
  {
    id: 5,
    name: 'Mouse Vertical Silent',
    sku: 'MOU-2150',
    categoryId: 2,
    category: 'Accesorios',
    description: 'Mouse ergonómico inalámbrico con conexión dual y clic silencioso.',
    price: 179000,
    stock: 19,
    iva: true,
    status: 'active',
    supplier: 'Input Labs',
    updatedAt: '2026-03-29T16:45:00.000Z'
  }
];

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly productsSubject = new BehaviorSubject<Product[]>(MOCK_PRODUCTS);
  private readonly responseDelay = 150;

  getProducts(): Observable<Product[]> {
    return this.productsSubject.asObservable().pipe(delay(this.responseDelay));
  }

  searchProducts(term: string): Observable<Product[]> {
    const normalizedTerm = term.trim().toLowerCase();

    if (!normalizedTerm) {
      return of([]).pipe(delay(this.responseDelay));
    }

    return of(
      this.productsSubject.value
        .filter((product) =>
          product.status === 'active' &&
          [
            product.name,
            product.sku
          ].join(' ').toLowerCase().includes(normalizedTerm)
        )
        .slice(0, 8)
        .map((product) => ({ ...product }))
    ).pipe(delay(this.responseDelay));
  }

  getProductsSnapshot(): Product[] {
    return this.productsSubject.value.map((product) => ({ ...product }));
  }

  getCategories(): ProductCategory[] {
    return PRODUCT_CATEGORIES.map((category) => ({ ...category }));
  }

  createProduct(payload: ProductPayload): Observable<Product> {
    const createdProduct: Product = {
      ...payload,
      id: this.getNextId(),
      category: this.resolveCategoryName(payload.categoryId),
      updatedAt: new Date().toISOString()
    };

    this.productsSubject.next([...this.productsSubject.value, createdProduct]);

    return of(createdProduct).pipe(delay(this.responseDelay));
  }

  updateProduct(id: number, payload: ProductPayload): Observable<Product> {
    let updatedProduct!: Product;

    const products = this.productsSubject.value.map((product) => {
      if (product.id !== id) {
        return product;
      }

      updatedProduct = {
        ...product,
        ...payload,
        category: this.resolveCategoryName(payload.categoryId),
        updatedAt: new Date().toISOString()
      };

      return updatedProduct;
    });

    this.productsSubject.next(products);

    return of(updatedProduct).pipe(delay(this.responseDelay));
  }

  deleteProduct(id: number): Observable<void> {
    this.productsSubject.next(this.productsSubject.value.filter((product) => product.id !== id));
    return of(void 0).pipe(delay(this.responseDelay));
  }

  getProductById(id: number): Observable<Product | undefined> {
    return this.getProducts().pipe(
      map((products) => products.find((product) => product.id === id))
    );
  }

  private getNextId(): number {
    return this.productsSubject.value.reduce((maxId, product) => Math.max(maxId, product.id), 0) + 1;
  }

  private resolveCategoryName(categoryId: number): string {
    return PRODUCT_CATEGORIES.find((category) => category.id === categoryId)?.name ?? 'Sin categoría';
  }
}
