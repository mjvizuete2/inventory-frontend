import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Customer, CustomerPayload } from '../../../../shared/interfaces/customer';
import { CustomerService } from '../../../services/customer.service';
import { CustomerDeleteDialogComponent } from '../customer-delete-dialog/customer-delete-dialog.component';
import { CustomerFormDialogComponent } from '../customer-form-dialog/customer-form-dialog.component';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule
  ],
  templateUrl: './customers-list.component.html',
  styleUrl: './customers-list.component.css'
})
export class CustomersListComponent implements OnInit, AfterViewInit {
  private readonly customerService = inject(CustomerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns = ['name', 'documentNumber', 'email', 'phone', 'city', 'status', 'updatedAt', 'actions'];
  readonly dataSource = new MatTableDataSource<Customer>([]);

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  ngOnInit(): void {
    this.dataSource.filterPredicate = (customer, filter) =>
      [
        customer.name,
        customer.documentNumber,
        customer.email,
        customer.phone,
        customer.city,
        customer.status
      ].join(' ').toLowerCase().includes(filter.trim().toLowerCase());

    this.customerService.getCustomers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((customers) => {
        this.dataSource.data = customers;
        this.attachTableHelpers();
      });
  }

  ngAfterViewInit(): void {
    this.attachTableHelpers();
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value ?? '';
    this.paginator?.firstPage();
  }

  openCreateDialog(): void {
    this.dialog.open(CustomerFormDialogComponent, {
      width: '720px',
      data: { mode: 'create' }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: CustomerPayload) => {
        if (!result) {
          return;
        }

        this.customerService.createCustomer(result)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.snackBar.open('Cliente creado.', 'Cerrar', { duration: 2400 }));
      });
  }

  openEditDialog(customer: Customer): void {
    this.dialog.open(CustomerFormDialogComponent, {
      width: '720px',
      data: { mode: 'edit', customer }
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: CustomerPayload) => {
        if (!result) {
          return;
        }

        this.customerService.updateCustomer(customer.id, result)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.snackBar.open('Cliente actualizado.', 'Cerrar', { duration: 2400 }));
      });
  }

  openDeleteDialog(customer: Customer): void {
    this.dialog.open(CustomerDeleteDialogComponent, {
      width: '420px',
      data: customer
    }).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed?: boolean) => {
        if (!confirmed) {
          return;
        }

        this.customerService.deleteCustomer(customer.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.snackBar.open('Cliente eliminado.', 'Cerrar', { duration: 2400 }));
      });
  }

  get activeCustomersCount(): number {
    return this.dataSource.data.filter((customer) => customer.status === 'active').length;
  }

  private attachTableHelpers(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }
}
