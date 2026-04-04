import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'products'
  },
  {
    path: 'products',
    loadChildren: () =>
      import('./products/products.routes').then((m) => m.productsRoutes)
  },
  {
    path: 'customers',
    loadChildren: () =>
      import('./customers/customers.routes').then((m) => m.customersRoutes)
  },
  {
    path: 'sales',
    loadChildren: () =>
      import('./sales/sales.routes').then((m) => m.salesRoutes)
  },
  {
    path: 'cash-closures',
    loadChildren: () =>
      import('./cash-closures/cash-closures.routes').then((m) => m.cashClosuresRoutes)
  }
];
