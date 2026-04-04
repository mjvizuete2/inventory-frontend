import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Customer, CustomerPayload } from '../../../../shared/interfaces/customer';

export interface CustomerFormDialogData {
  mode: 'create' | 'edit';
  customer?: Customer;
}

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
  private readonly dialogRef = inject(MatDialogRef<CustomerFormDialogComponent, CustomerPayload>);

  readonly data = inject(MAT_DIALOG_DATA) as CustomerFormDialogData;

  readonly form = this.fb.nonNullable.group({
    name: [this.data.customer?.name ?? '', [Validators.required, Validators.maxLength(90)]],
    documentNumber: [this.data.customer?.documentNumber ?? '', [Validators.required, Validators.maxLength(25)]],
    email: [this.data.customer?.email ?? '', [Validators.required, Validators.email]],
    phone: [this.data.customer?.phone ?? '', [Validators.required, Validators.maxLength(20)]],
    address: [this.data.customer?.address ?? '', [Validators.required, Validators.maxLength(120)]],
    city: [this.data.customer?.city ?? '', [Validators.required, Validators.maxLength(60)]],
    status: [this.data.customer?.status ?? ('active' as const), Validators.required]
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }
}
