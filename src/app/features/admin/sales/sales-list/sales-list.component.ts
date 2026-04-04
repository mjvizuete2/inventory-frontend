import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Sale } from '../../../../shared/interfaces/sale';
import { SalesService } from '../../../services/sales.service';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule
  ],
  templateUrl: './sales-list.component.html',
  styleUrl: './sales-list.component.css'
})
export class SalesListComponent implements OnInit, AfterViewInit {
  private readonly salesService = inject(SalesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns = ['id', 'date', 'customer', 'createdBy', 'items', 'paymentMethod', 'iva', 'total', 'actions'];
  readonly dataSource = new MatTableDataSource<Sale>([]);

  allSales: Sale[] = [];
  searchTerm = '';
  dateFrom = '';
  dateTo = '';
  userFilter = '';

  @ViewChild(MatPaginator) paginator?: MatPaginator;
  @ViewChild(MatSort) sort?: MatSort;

  ngOnInit(): void {
    this.dataSource.sortingDataAccessor = (sale, property) => {
      switch (property) {
        case 'date':
          return new Date(sale.date).getTime();
        case 'items':
          return sale.items.length;
        case 'iva':
          return sale.iva;
        case 'total':
          return sale.total;
        default:
          return `${sale[property as keyof Sale] ?? ''}`.toLowerCase();
      }
    };

    this.salesService.getSales()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sales) => {
        this.allSales = sales;
        this.applyFilters();
        this.attachTableHelpers();
      });
  }

  ngAfterViewInit(): void {
    this.attachTableHelpers();
  }

  applyFilter(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value ?? '';
    this.applyFilters();
  }

  onDateFromChange(value: string): void {
    this.dateFrom = value;
    this.applyFilters();
  }

  onDateToChange(value: string): void {
    this.dateTo = value;
    this.applyFilters();
  }

  onUserFilterChange(value: string): void {
    this.userFilter = value;
    this.applyFilters();
  }

  get todayTotal(): number {
    const today = new Date().toDateString();
    return this.dataSource.data
      .filter((sale) => new Date(sale.date).toDateString() === today)
      .reduce((total, sale) => total + sale.total, 0);
  }

  private attachTableHelpers(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  private applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();
    const user = this.userFilter.trim().toLowerCase();
    const fromDate = this.dateFrom ? new Date(`${this.dateFrom}T00:00:00`) : undefined;
    const toDate = this.dateTo ? new Date(`${this.dateTo}T23:59:59`) : undefined;

    this.dataSource.data = this.allSales.filter((sale) => {
      const searchHaystack = [
        sale.customerName,
        sale.documentNumber,
        sale.paymentMethod,
        sale.id
      ].join(' ').toLowerCase();
      const saleDate = new Date(sale.date);
      const matchesSearch = !search || searchHaystack.includes(search);
      const matchesUser = !user || sale.createdBy.toLowerCase().includes(user);
      const matchesFrom = !fromDate || saleDate >= fromDate;
      const matchesTo = !toDate || saleDate <= toDate;

      return matchesSearch && matchesUser && matchesFrom && matchesTo;
    });

    this.paginator?.firstPage();
  }
}
