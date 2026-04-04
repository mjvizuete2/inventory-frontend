import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Customer } from '../../../../shared/interfaces/customer';

@Component({
  selector: 'app-customer-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './customer-delete-dialog.component.html',
  styleUrl: './customer-delete-dialog.component.css'
})
export class CustomerDeleteDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CustomerDeleteDialogComponent, boolean>);

  readonly customer = inject(MAT_DIALOG_DATA) as Customer;

  confirm(): void {
    this.dialogRef.close(true);
  }
}
