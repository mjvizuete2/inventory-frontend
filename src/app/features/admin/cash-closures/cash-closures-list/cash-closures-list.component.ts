import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { CashClosure } from '../../../../shared/interfaces/cash-closure';
import { CashClosureService } from '../../../services/cash-closure.service';

@Component({
  selector: 'app-cash-closures-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule
  ],
  templateUrl: './cash-closures-list.component.html',
  styleUrl: './cash-closures-list.component.css'
})
export class CashClosuresListComponent implements OnInit {
  private readonly cashClosureService = inject(CashClosureService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns = ['dateRange', 'users', 'openingAmount', 'breakdown', 'closingAmount', 'total'];
  readonly methodOptions = [
    { value: '', label: 'Todos' },
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transferencia' }
  ];

  currentClosure: CashClosure | null = null;
  allClosures: CashClosure[] = [];
  filteredClosures: CashClosure[] = [];
  dateFrom = '';
  dateTo = '';
  userFilter = '';
  methodFilter = '';
  openingAmount = 0;
  reopenOnClose = false;
  nextOpeningAmount = 0;
  loading = true;
  refreshing = false;
  actionLoading = false;

  ngOnInit(): void {
    this.loadState();
  }

  refreshClosures(): void {
    this.refreshing = true;
    this.loadState(() => {
      this.refreshing = false;
      this.openSnackBar('Caja actualizada.');
    }, () => {
      this.refreshing = false;
      this.openSnackBar('No se pudo actualizar la caja.');
    });
  }

  openCashBox(): void {
    const openingAmount = Number(this.openingAmount);
    if (Number.isNaN(openingAmount) || openingAmount < 0) {
      this.openSnackBar('Ingresa un monto inicial valido.');
      return;
    }

    this.actionLoading = true;
    this.cashClosureService.openCashBox(openingAmount)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.openingAmount = 0;
          this.loadState(() => {
            this.actionLoading = false;
            this.openSnackBar('Caja abierta correctamente.');
          }, () => {
            this.actionLoading = false;
            this.openSnackBar('No se pudo actualizar la caja.');
          });
        },
        error: (error) => {
          this.actionLoading = false;
          this.openSnackBar(error.error?.message ?? 'No se pudo abrir la caja.');
        }
      });
  }

  closeCashBox(): void {
    const nextOpeningAmount = Number(this.nextOpeningAmount);
    if (this.reopenOnClose && (Number.isNaN(nextOpeningAmount) || nextOpeningAmount < 0)) {
      this.openSnackBar('Ingresa un monto valido para la nueva apertura.');
      return;
    }

    this.actionLoading = true;
    this.cashClosureService.closeCashBox(this.reopenOnClose, this.reopenOnClose ? nextOpeningAmount : 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (!this.reopenOnClose) {
            this.nextOpeningAmount = 0;
          }
          this.loadState(() => {
            this.actionLoading = false;
            this.openSnackBar('Caja cerrada correctamente.');
          }, () => {
            this.actionLoading = false;
            this.openSnackBar('No se pudo actualizar la caja.');
          });
        },
        error: (error) => {
          this.actionLoading = false;
          this.openSnackBar(error.error?.message ?? 'No se pudo cerrar la caja.');
        }
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

  private loadState(onSuccess?: () => void, onError?: () => void): void {
    this.loading = true;
    forkJoin({
      currentClosure: this.cashClosureService.getCurrentClosure(),
      closures: this.cashClosureService.getClosures()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ currentClosure, closures }) => {
          this.currentClosure = currentClosure;
          this.allClosures = closures;
          this.applyFilters();
          this.loading = false;
          if (this.currentClosure) {
            this.nextOpeningAmount = this.currentClosure.openingAmount;
          }
          onSuccess?.();
        },
        error: () => {
          this.loading = false;
          onError?.();
        }
      });
  }

  private applyFilters(): void {
    const fromDate = this.dateFrom ? new Date(`${this.dateFrom}T00:00:00`) : undefined;
    const toDate = this.dateTo ? new Date(`${this.dateTo}T23:59:59`) : undefined;
    const user = this.userFilter.trim().toLowerCase();

    this.filteredClosures = this.allClosures.filter((closure) => {
      const closureDate = new Date(closure.endDate ?? closure.startDate);
      const matchesFrom = !fromDate || closureDate >= fromDate;
      const matchesTo = !toDate || closureDate <= toDate;
      const matchesUser =
        !user ||
        closure.openedBy.toLowerCase().includes(user) ||
        (closure.closedBy ?? '').toLowerCase().includes(user);
      const matchesMethod =
        !this.methodFilter ||
        (this.methodFilter === 'cash' && closure.cashTotal > 0) ||
        (this.methodFilter === 'card' && closure.cardTotal > 0) ||
        (this.methodFilter === 'transfer' && closure.transferTotal > 0);

      return matchesFrom && matchesTo && matchesUser && matchesMethod;
    });
  }

  private openSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 2500 });
  }
}
