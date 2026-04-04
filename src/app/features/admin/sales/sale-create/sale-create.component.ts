import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { Customer } from '../../../../shared/interfaces/customer';
import { Product } from '../../../../shared/interfaces/product';
import { SaleItemPayload, SalePayload } from '../../../../shared/interfaces/sale';
import { CustomerService } from '../../../services/customer.service';
import { ProductService } from '../../../services/product.service';
import { SalesService } from '../../../services/sales.service';

type SaleItemForm = FormGroup<{
  productId: FormControl<number>;
  productQuery: FormControl<string>;
  quantity: FormControl<number>;
}>;

@Component({
  selector: 'app-sale-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './sale-create.component.html',
  styleUrl: './sale-create.component.css'
})
export class SaleCreateComponent {
  private readonly currentUser = 'Admin Principal';
  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly salesService = inject(SalesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly selectedProducts = new Map<AbstractControl, Product>();
  private readonly productOptionsMap = new Map<AbstractControl, Observable<Product[]>>();

  readonly paymentMethods = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transferencia' }
  ];

  readonly form = this.fb.nonNullable.group({
    customerId: [0, [Validators.required, Validators.min(1)]],
    customerQuery: ['', Validators.required],
    paymentMethod: ['cash' as 'cash' | 'card' | 'transfer', Validators.required],
    items: this.fb.array<SaleItemForm>([this.createItemGroup()])
  });

  readonly customerOptions$ = this.form.controls.customerQuery.valueChanges.pipe(
    startWith(this.form.controls.customerQuery.value),
    map((value) => `${value ?? ''}`),
    debounceTime(250),
    distinctUntilChanged(),
    tap((value) => {
      if (!value.trim()) {
        this.form.controls.customerId.setValue(0);
        this.selectedCustomer = undefined;
      }
    }),
    switchMap((term) => this.customerService.searchCustomers(term)),
    shareReplay(1)
  );

  selectedCustomer?: Customer;

  constructor() {
    this.form.controls.customerQuery.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (this.selectedCustomer && `${value ?? ''}` !== this.formatCustomer(this.selectedCustomer)) {
          this.form.controls.customerId.setValue(0, { emitEvent: false });
          this.selectedCustomer = undefined;
        }
      });
  }

  get items(): FormArray<SaleItemForm> {
    return this.form.controls.items;
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length === 1) {
      return;
    }

    const control = this.items.at(index);
    this.selectedProducts.delete(control);
    this.productOptionsMap.delete(control);
    this.items.removeAt(index);
  }

  onCustomerSelected(event: MatAutocompleteSelectedEvent): void {
    const customerId = Number(event.option.value);

    this.customerService.getCustomerById(customerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customer) => {
        if (!customer) {
          return;
        }

        this.selectedCustomer = customer;
        this.form.controls.customerId.setValue(customer.id);
        this.form.controls.customerQuery.setValue(this.formatCustomer(customer), { emitEvent: false });
      });
  }

  onProductSelected(index: number, event: MatAutocompleteSelectedEvent): void {
    const productId = Number(event.option.value);
    const control = this.items.at(index);

    this.productService.getProductById(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((product) => {
        if (!product) {
          return;
        }

        this.selectedProducts.set(control, product);
        control.controls.productId.setValue(product.id);
        control.controls.productQuery.setValue(this.formatProduct(product), { emitEvent: false });
      });
  }

  getProductOptions(index: number): Observable<Product[]> {
    const control = this.items.at(index).controls.productQuery;
    const parentControl = this.items.at(index);
    const cached = this.productOptionsMap.get(parentControl);

    if (cached) {
      return cached;
    }

    const options$ = control.valueChanges.pipe(
      startWith(control.value),
      map((value) => `${value ?? ''}`),
      debounceTime(250),
      distinctUntilChanged(),
      tap((value) => {
        if (!value.trim()) {
          parentControl.controls.productId.setValue(0);
          this.selectedProducts.delete(parentControl);
        }
      }),
      switchMap((term) =>
        term.trim()
          ? this.productService.searchProducts(term)
          : of([])
      ),
      map((products) => products.filter((product) => this.canUseProduct(parentControl, product.id))),
      shareReplay(1)
    );

    this.productOptionsMap.set(parentControl, options$);
    return options$;
  }

  getSelectedProduct(index: number): Product | undefined {
    return this.selectedProducts.get(this.items.at(index));
  }

  getItemSubtotal(itemIndex: number): number {
    const product = this.getSelectedProduct(itemIndex);
    const quantity = Number(this.items.at(itemIndex).controls.quantity.value ?? 0);
    return (product?.price ?? 0) * quantity;
  }

  getItemIva(itemIndex: number): number {
    const product = this.getSelectedProduct(itemIndex);
    const subtotal = this.getItemSubtotal(itemIndex);
    return product?.iva ? subtotal * 0.19 : 0;
  }

  get subtotal(): number {
    return this.items.controls.reduce((total, _, index) => total + this.getItemSubtotal(index), 0);
  }

  get iva(): number {
    return this.items.controls.reduce((total, _, index) => total + this.getItemIva(index), 0);
  }

  get total(): number {
    return this.subtotal + this.iva;
  }

  submit(): void {
    if (this.form.invalid || !this.items.length || this.hasUnselectedProducts()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: SalePayload = {
      customerId: this.form.controls.customerId.getRawValue(),
      createdBy: this.currentUser,
      paymentMethod: this.form.controls.paymentMethod.getRawValue(),
      subtotal: this.subtotal,
      iva: this.iva,
      total: this.total,
      items: this.items.controls.map((item) => ({
        productId: item.controls.productId.getRawValue(),
        quantity: item.controls.quantity.getRawValue()
      })) as SaleItemPayload[]
    };

    this.salesService.createSale(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sale) => {
        this.snackBar.open('Venta registrada correctamente.', 'Cerrar', { duration: 2500 });
        void this.router.navigate(['/admin/sales', sale.id, 'invoice']);
      });
  }

  trackByIndex(index: number): number {
    return index;
  }

  formatCustomer(customer: Customer): string {
    return `${customer.name} · ${customer.documentNumber} · ${customer.email}`;
  }

  formatProduct(product: Product): string {
    return `${product.name} · ${product.sku}`;
  }

  private createItemGroup(): SaleItemForm {
    const group = this.fb.nonNullable.group({
      productId: [0, [Validators.required, Validators.min(1)]],
      productQuery: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });

    group.controls.productQuery.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const selectedProduct = this.selectedProducts.get(group);
        if (selectedProduct && `${value ?? ''}` !== this.formatProduct(selectedProduct)) {
          group.controls.productId.setValue(0, { emitEvent: false });
          this.selectedProducts.delete(group);
        }
      });

    return group;
  }

  private canUseProduct(control: AbstractControl, productId: number): boolean {
    return !Array.from(this.selectedProducts.entries()).some(
      ([itemControl, product]) => itemControl !== control && product.id === productId
    );
  }

  private hasUnselectedProducts(): boolean {
    return this.items.controls.some((item) => item.controls.productId.getRawValue() <= 0);
  }
}
