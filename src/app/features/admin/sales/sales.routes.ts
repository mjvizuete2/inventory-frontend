import { Routes } from '@angular/router';

export const salesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./sales-list/sales-list.component').then((m) => m.SalesListComponent)
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./sale-create/sale-create.component').then((m) => m.SaleCreateComponent)
  },
  {
    path: ':id/invoice',
    loadComponent: () =>
      import('./sale-invoice/sale-invoice.component').then((m) => m.SaleInvoiceComponent)
  }
];
