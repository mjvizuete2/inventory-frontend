import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Product } from '../../../../shared/interfaces/product';

@Component({
  selector: 'app-product-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './product-delete-dialog.component.html',
  styleUrl: './product-delete-dialog.component.css'
})
export class ProductDeleteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ProductDeleteDialogComponent, boolean>);

  readonly product = inject(MAT_DIALOG_DATA) as Product;

  confirm(): void {
    this.dialogRef.close(true);
  }
}
