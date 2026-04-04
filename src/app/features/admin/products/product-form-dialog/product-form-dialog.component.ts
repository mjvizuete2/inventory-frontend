import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Product, ProductPayload, ProductStatus } from '../../../../shared/interfaces/product';
import { ProductCategory } from '../../../../shared/interfaces/product-category';

export interface ProductFormDialogData {
  mode: 'create' | 'edit';
  product?: Product;
  categories: ProductCategory[];
}

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  templateUrl: './product-form-dialog.component.html',
  styleUrl: './product-form-dialog.component.css'
})
export class ProductFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProductFormDialogComponent, ProductPayload>);

  readonly data = inject(MAT_DIALOG_DATA) as ProductFormDialogData;
  readonly statuses: Array<{ value: ProductStatus; label: string }> = [
    { value: 'active', label: 'Activo' },
    { value: 'inactive', label: 'Inactivo' }
  ];

  readonly form = this.fb.nonNullable.group({
    name: [this.data.product?.name ?? '', [Validators.required, Validators.maxLength(80)]],
    sku: [this.data.product?.sku ?? '', [Validators.required, Validators.maxLength(30)]],
    categoryId: [this.data.product?.categoryId ?? this.data.categories[0]?.id ?? 0, [Validators.required, Validators.min(1)]],
    price: [this.data.product?.price ?? 0, [Validators.required, Validators.min(0.01)]],
    stock: [this.data.product?.stock ?? 0, [Validators.required, Validators.min(0)]],
    status: [this.data.product?.status ?? ('active' as ProductStatus), [Validators.required]],
    supplier: [this.data.product?.supplier ?? '', [Validators.maxLength(60)]],
    description: [this.data.product?.description ?? '', [Validators.maxLength(240)]],
    iva: [this.data.product?.iva ?? true]
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    this.dialogRef.close({
      ...rawValue,
      name: rawValue.name.trim(),
      sku: rawValue.sku.trim().toUpperCase(),
      categoryId: Number(rawValue.categoryId),
      price: Number(Number(rawValue.price).toFixed(2)),
      stock: Number(rawValue.stock),
      supplier: rawValue.supplier.trim(),
      description: rawValue.description.trim()
    });
  }
}
