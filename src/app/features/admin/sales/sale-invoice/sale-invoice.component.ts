import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Sale } from '../../../../shared/interfaces/sale';
import { SalesService } from '../../../services/sales.service';

@Component({
  selector: 'app-sale-invoice',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './sale-invoice.component.html',
  styleUrl: './sale-invoice.component.css'
})
export class SaleInvoiceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly salesService = inject(SalesService);
  private readonly destroyRef = inject(DestroyRef);

  sale?: Sale;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.salesService.getSaleById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sale) => {
        this.sale = sale;
      });
  }

  print(): void {
    document.body.classList.add('printing-invoice');
    document.documentElement.classList.add('printing-invoice');

    const clearPrintMode = () => {
      document.body.classList.remove('printing-invoice');
      document.documentElement.classList.remove('printing-invoice');
      window.removeEventListener('afterprint', clearPrintMode);
    };

    window.addEventListener('afterprint', clearPrintMode);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.print();
        }, 80);
      });
    });
  }
}
