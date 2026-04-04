import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ProductCategory } from '../../../../shared/interfaces/product-category';

export interface CategoryFormDialogData {
  mode: 'create' | 'edit';
  category?: ProductCategory;
}

export interface CategoryFormDialogResult {
  name: string;
  description?: string;
  active: boolean;
}

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule
  ],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.css'
})
export class CategoryFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CategoryFormDialogComponent, CategoryFormDialogResult>);

  readonly data = inject(MAT_DIALOG_DATA) as CategoryFormDialogData;
  readonly form = this.fb.nonNullable.group({
    name: [this.data.category?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    description: [this.data.category?.description ?? '', [Validators.maxLength(255)]],
    active: [this.data.category?.active ?? true]
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();
    this.dialogRef.close({
      name: rawValue.name.trim(),
      description: rawValue.description.trim(),
      active: rawValue.active
    });
  }
}
