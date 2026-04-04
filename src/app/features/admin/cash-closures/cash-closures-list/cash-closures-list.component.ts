import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { CashClosure } from '../../../../shared/interfaces/cash-closure';
import { CashClosureService } from '../../../services/cash-closure.service';

@Component({
  selector: 'app-cash-closures-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule
  ],
  templateUrl: './cash-closures-list.component.html',
  styleUrl: './cash-closures-list.component.css'
})
export class CashClosuresListComponent implements OnInit {
  private readonly cashClosureService = inject(CashClosureService);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns = ['date', 'transactions', 'users', 'breakdown', 'total'];
  readonly methodOptions = [
    { value: '', label: 'Todos' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transferencia' }
  ];

  allClosures: CashClosure[] = [];
  filteredClosures: CashClosure[] = [];
  dateFrom = '';
  dateTo = '';
  userFilter = '';
  methodFilter = '';

  ngOnInit(): void {
    this.cashClosureService.getClosures()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((closures) => {
        this.allClosures = closures;
        this.applyFilters();
      });
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

  onMethodFilterChange(value: string): void {
    this.methodFilter = value;
    this.applyFilters();
  }

  get filteredTotal(): number {
    return this.filteredClosures.reduce((total, closure) => total + closure.total, 0);
  }

  private applyFilters(): void {
    const fromDate = this.dateFrom ? new Date(`${this.dateFrom}T00:00:00`) : undefined;
    const toDate = this.dateTo ? new Date(`${this.dateTo}T23:59:59`) : undefined;
    const user = this.userFilter.trim().toLowerCase();

    this.filteredClosures = this.allClosures.filter((closure) => {
      const closureDate = new Date(closure.date);
      const matchesFrom = !fromDate || closureDate >= fromDate;
      const matchesTo = !toDate || closureDate <= toDate;
      const matchesUser = !user || closure.users.some((entry) => entry.toLowerCase().includes(user));
      const matchesMethod =
        !this.methodFilter ||
        (this.methodFilter === 'cash' && closure.cashTotal > 0) ||
        (this.methodFilter === 'card' && closure.cardTotal > 0) ||
        (this.methodFilter === 'transfer' && closure.transferTotal > 0);

      return matchesFrom && matchesTo && matchesUser && matchesMethod;
    });
  }
}
