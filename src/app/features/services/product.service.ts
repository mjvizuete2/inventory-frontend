import { Injectable } from '@angular/core';
import { Product } from '../../shared/interfaces/product';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private api = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Product[]>(this.api);
  }

  create(product: Product) {
    return this.http.post<Product>(this.api, product);
  }

  update(id: number, product: Product) {
    return this.http.put(`${this.api}/${id}`, product);
  }
}