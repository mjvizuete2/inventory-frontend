import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Customer, CustomerPayload } from '../../../../shared/interfaces/customer';
import { CustomerService } from '../../../services/customer.service';

export interface CustomerFormDialogData {
  mode: 'create' | 'edit';
  customer?: Customer;
}

type CustomerDialogResult = Customer | CustomerPayload;

@Component({
  selector: 'app-customer-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './customer-form-dialog.component.html',
  styleUrl: './customer-form-dialog.component.css'
})
export class CustomerFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CustomerFormDialogComponent, CustomerDialogResult>);
  private readonly customerService = inject(CustomerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = inject(MAT_DIALOG_DATA) as CustomerFormDialogData;
  readonly existingCustomer = signal<Customer | null>(null);
  readonly isExistingCustomer = computed(() => this.existingCustomer() !== null);

  readonly form = this.fb.nonNullable.group({
    name: [this.data.customer?.name ?? '', [Validators.required, Validators.maxLength(90)]],
    documentType: [this.data.customer?.documentType ?? 'CEDULA', Validators.required],
    documentNumber: [this.data.customer?.documentNumber ?? '', [Validators.required, Validators.maxLength(20)]],
    email: [this.data.customer?.email ?? '', [Validators.email]],
    phone: [this.data.customer?.phone ?? '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    address: [this.data.customer?.address ?? '', [Validators.required, Validators.maxLength(120)]],
    city: [this.data.customer?.city ?? '', [Validators.required, Validators.maxLength(60)]],
    status: [this.data.customer?.status ?? ('active' as const), Validators.required]
  });

  constructor() {
    if (this.data.mode === 'edit') {
      return;
    }

    this.form.controls.documentType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((documentType) => {
        if (documentType !== 'CEDULA') {
          this.clearExistingCustomer(false);
        }
      });

    this.form.controls.documentNumber.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((value) => {
          const documentType = this.form.controls.documentType.getRawValue();
          const normalizedValue = `${value ?? ''}`.trim();

          if (documentType !== 'CEDULA') {
            return of(undefined);
          }

          if (normalizedValue.length !== 10) {
            return of(undefined);
          }

          return this.customerService.findCustomerByDocument(normalizedValue);
        })
      )
      .subscribe((customer) => {
        if (customer) {
          this.applyExistingCustomer(customer);
          return;
        }

        this.clearExistingCustomer(true);
      });
  }

  save(): void {
    if (this.existingCustomer()) {
      this.dialogRef.close(this.existingCustomer()!);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    this.dialogRef.close({
      ...rawValue,
      name: rawValue.name.trim(),
      documentNumber: rawValue.documentNumber.trim().toUpperCase(),
      email: rawValue.email.trim(),
      phone: rawValue.phone.trim(),
      address: rawValue.address.trim(),
      city: rawValue.city.trim()
    });
  }

  private applyExistingCustomer(customer: Customer): void {
    this.existingCustomer.set(customer);
    this.form.patchValue({
      name: customer.name,
      documentType: customer.documentType,
      documentNumber: customer.documentNumber,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      status: customer.status
    }, { emitEvent: false });

    this.setLockedFields(true);
  }

  private clearExistingCustomer(keepDocument: boolean): void {
    const currentDocument = this.form.controls.documentNumber.getRawValue();
    const currentDocumentType = this.form.controls.documentType.getRawValue();
    if (this.existingCustomer()) {
      this.existingCustomer.set(null);
      this.setLockedFields(false);
      this.form.patchValue({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        status: 'active'
      }, { emitEvent: false });
    }

    if (keepDocument) {
      this.form.controls.documentNumber.setValue(currentDocument, { emitEvent: false });
      this.form.controls.documentType.setValue(currentDocumentType, { emitEvent: false });
    }
  }

  private setLockedFields(locked: boolean): void {
    const controls = [
      this.form.controls.name,
      this.form.controls.email,
      this.form.controls.phone,
      this.form.controls.address,
      this.form.controls.city,
      this.form.controls.status
    ];

    controls.forEach((control) => {
      if (locked) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    });
  }
}
