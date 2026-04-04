import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ProductCategory } from '../../../../shared/interfaces/product-category';

@Component({
  selector: 'app-category-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './category-delete-dialog.component.html',
  styleUrl: './category-delete-dialog.component.css'
})
export class CategoryDeleteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CategoryDeleteDialogComponent, boolean>);

  readonly category = inject(MAT_DIALOG_DATA) as ProductCategory;

  confirm(): void {
    this.dialogRef.close(true);
  }
}
