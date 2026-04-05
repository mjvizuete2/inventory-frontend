import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/auth.service';
import { Customer, CustomerPayload } from '../../../../shared/interfaces/customer';
import { Product } from '../../../../shared/interfaces/product';
import { SaleItemPayload, SalePayload } from '../../../../shared/interfaces/sale';
import { CustomerFormDialogComponent } from '../../customers/customer-form-dialog/customer-form-dialog.component';
import { CashClosureService } from '../../../services/cash-closure.service';
import { CustomerService } from '../../../services/customer.service';
import { ProductService } from '../../../services/product.service';
import { SalesService } from '../../../services/sales.service';

type SaleItemForm = FormGroup<{
  productId: FormControl<number>;
  productQuery: FormControl<string>;
  quantity: FormControl<number>;
  applyDiscount: FormControl<boolean>;
  finalPrice: FormControl<number>;
  hasIva: FormControl<boolean>;
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
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  templateUrl: './sale-create.component.html',
  styleUrl: './sale-create.component.css'
})
export class SaleCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly salesService = inject(SalesService);
  private readonly cashClosureService = inject(CashClosureService);
  private readonly authService = inject(AuthService);
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
    paymentMethod: ['cash' as 'cash' | 'card' | 'transfer', Validators.required],
    paymentReference: [''],
    receivedAmount: [0],
    items: this.fb.array<SaleItemForm>([this.createItemGroup()])
  });

  selectedCustomer?: Customer;
  saving = false;
  cashBoxLoading = true;
  hasOpenCashBox = false;

  constructor() {
    this.form.controls.paymentMethod.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((method) => {
        if (method === 'cash') {
          this.form.controls.receivedAmount.setValidators([Validators.required, Validators.min(this.total || 0.01)]);
          this.form.controls.paymentReference.clearValidators();
        } else if (method === 'transfer') {
          this.form.controls.paymentReference.setValidators([Validators.required, Validators.maxLength(120)]);
          this.form.controls.receivedAmount.clearValidators();
        } else {
          this.form.controls.paymentReference.clearValidators();
          this.form.controls.receivedAmount.clearValidators();
        }

        this.form.controls.paymentReference.updateValueAndValidity({ emitEvent: false });
        this.form.controls.receivedAmount.updateValueAndValidity({ emitEvent: false });
      });
  }

  ngOnInit(): void {
    this.cashClosureService.getCurrentClosure()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currentClosure) => {
        this.hasOpenCashBox = !!currentClosure && currentClosure.status === 'OPEN';
        this.cashBoxLoading = false;
      });
  }

  get items(): FormArray<SaleItemForm> {
    return this.form.controls.items;
  }

  get isCashPayment(): boolean {
    return this.form.controls.paymentMethod.getRawValue() === 'cash';
  }

  get isTransferPayment(): boolean {
    return this.form.controls.paymentMethod.getRawValue() === 'transfer';
  }

  get canSubmit(): boolean {
    return !this.saving && !this.cashBoxLoading && this.hasOpenCashBox;
  }

  get changeAmount(): number {
    if (!this.isCashPayment) {
      return 0;
    }

    return Math.max(Number(this.form.controls.receivedAmount.getRawValue() || 0) - this.total, 0);
  }

  get subtotal(): number {
    return Number(this.items.controls.reduce((total, _, index) => total + this.getItemSubtotal(index), 0).toFixed(2));
  }

  get base(): number {
    return Number(this.items.controls.reduce((total, _, index) => total + this.getItemBase(index), 0).toFixed(2));
  }

  get iva(): number {
    return Number(this.items.controls.reduce((total, _, index) => total + this.getItemIva(index), 0).toFixed(2));
  }

  get total(): number {
    return Number(this.subtotal.toFixed(2));
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

  openCreateCustomerDialog(): void {
    this.dialog.open(CustomerFormDialogComponent, {
      width: '720px',
      data: { mode: 'create' }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: Customer | CustomerPayload) => {
        if (!result) {
          return;
        }

        if (this.isExistingCustomer(result)) {
          this.selectedCustomer = result;
          this.form.controls.customerId.setValue(result.id);
          this.snackBar.open('Cliente seleccionado correctamente.', 'Cerrar', { duration: 2500 });
          return;
        }

        this.customerService.createCustomer(result).subscribe({
          next: (customer) => {
            this.selectedCustomer = customer;
            this.form.controls.customerId.setValue(customer.id);
            this.snackBar.open('Cliente creado correctamente.', 'Cerrar', { duration: 2500 });
          },
          error: (error) => {
            this.snackBar.open(error.error?.message ?? 'No se pudo guardar el cliente.', 'Cerrar', { duration: 3000 });
          }
        });
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
        control.controls.hasIva.setValue(product.iva, { emitEvent: false });
        control.controls.applyDiscount.setValue(false, { emitEvent: false });
        control.controls.finalPrice.setValue(Number(product.price), { emitEvent: false });
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
          parentControl.controls.finalPrice.setValue(0, { emitEvent: false });
          parentControl.controls.hasIva.setValue(true, { emitEvent: false });
          parentControl.controls.applyDiscount.setValue(false, { emitEvent: false });
          this.selectedProducts.delete(parentControl);
        }
      }),
      switchMap((term) => term.trim() ? this.productService.searchProducts(term) : of([])),
      map((products) => products.filter((product) => this.canUseProduct(parentControl, product.id))),
      shareReplay(1)
    );

    this.productOptionsMap.set(parentControl, options$);
    return options$;
  }

  getSelectedProduct(index: number): Product | undefined {
    return this.selectedProducts.get(this.items.at(index));
  }

  getOriginalItemPrice(itemIndex: number): number {
    return Number(this.getSelectedProduct(itemIndex)?.price ?? 0);
  }

  getItemPrice(itemIndex: number): number {
    return Number(this.items.at(itemIndex).controls.finalPrice.getRawValue() || 0);
  }

  getItemSubtotal(itemIndex: number): number {
    const quantity = Number(this.items.at(itemIndex).controls.quantity.getRawValue() || 0);
    const finalPrice = Number(this.getItemPrice(itemIndex));
    return Number((finalPrice * quantity).toFixed(2));
  }

  getItemBase(itemIndex: number): number {
    const subtotal = Number(this.getItemSubtotal(itemIndex));
    return this.itemHasIva(itemIndex) ? Number((subtotal / 1.12).toFixed(2)) : subtotal;
  }

  getItemIva(itemIndex: number): number {
    const subtotal = Number(this.getItemSubtotal(itemIndex));
    const base = Number(this.getItemBase(itemIndex));
    return this.itemHasIva(itemIndex) ? Number((subtotal - base).toFixed(2)) : 0;
  }

  itemHasIva(itemIndex: number): boolean {
    return this.items.at(itemIndex).controls.hasIva.getRawValue();
  }

  isDiscountEnabled(itemIndex: number): boolean {
    return this.items.at(itemIndex).controls.applyDiscount.getRawValue();
  }

  submit(): void {
    if (!this.hasOpenCashBox) {
      this.snackBar.open('Debes abrir la caja antes de registrar una venta.', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.saving || this.form.invalid || !this.selectedCustomer || !this.items.length || this.hasUnselectedProducts()) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isCashPayment && Number(this.form.controls.receivedAmount.getRawValue() || 0) < this.total) {
      this.snackBar.open('El valor recibido debe cubrir el total.', 'Cerrar', { duration: 3000 });
      return;
    }

    const payload: SalePayload = {
      customerId: this.form.controls.customerId.getRawValue(),
      createdBy: this.authService.getUserEmail(),
      paymentMethod: this.form.controls.paymentMethod.getRawValue(),
      paymentReference: this.form.controls.paymentReference.getRawValue() || undefined,
      receivedAmount: this.isCashPayment ? Number(this.form.controls.receivedAmount.getRawValue()) : undefined,
      subtotal: this.base,
      iva: this.iva,
      total: this.total,
      items: this.items.controls.map((item) => ({
        productId: item.controls.productId.getRawValue(),
        quantity: Number(item.controls.quantity.getRawValue()),
        finalPrice: Number(item.controls.finalPrice.getRawValue() || 0),
        hasIva: item.controls.hasIva.getRawValue()
      })) as SaleItemPayload[]
    };

    this.saving = true;
    this.salesService.createSale(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sale) => {
          this.saving = false;
          this.snackBar.open('Venta registrada correctamente.', 'Cerrar', { duration: 2500 });
          void this.router.navigate(['/admin/sales', sale.id, 'invoice']);
        },
        error: (error) => {
          this.saving = false;
          this.snackBar.open(error.error?.message ?? 'No se pudo registrar la venta.', 'Cerrar', { duration: 3000 });
        }
      });
  }

  trackByIndex(index: number): number {
    return index;
  }

  formatProduct(product: Product): string {
    return product.name;
  }

  private createItemGroup(): SaleItemForm {
    const group = this.fb.nonNullable.group({
      productId: [0, [Validators.required, Validators.min(1)]],
      productQuery: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      applyDiscount: [false],
      finalPrice: [0, [Validators.required, Validators.min(0.01)]],
      hasIva: [true]
    });

    group.controls.productQuery.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const selectedProduct = this.selectedProducts.get(group);
        if (selectedProduct && `${value ?? ''}` !== this.formatProduct(selectedProduct)) {
          group.controls.productId.setValue(0, { emitEvent: false });
          group.controls.finalPrice.setValue(0, { emitEvent: false });
          group.controls.hasIva.setValue(true, { emitEvent: false });
          group.controls.applyDiscount.setValue(false, { emitEvent: false });
          this.selectedProducts.delete(group);
        }
      });

    group.controls.applyDiscount.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((applyDiscount) => {
        const selectedProduct = this.selectedProducts.get(group);
        if (!applyDiscount && selectedProduct) {
          group.controls.finalPrice.setValue(Number(selectedProduct.price), { emitEvent: false });
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
    return this.items.controls.some((item) => item.controls.productId.getRawValue() <= 0 || Number(item.controls.finalPrice.getRawValue() || 0) <= 0);
  }

  private isExistingCustomer(value: Customer | CustomerPayload): value is Customer {
    return 'id' in value;
  }
}
