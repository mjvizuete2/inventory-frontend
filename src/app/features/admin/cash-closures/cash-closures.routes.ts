import { Routes } from '@angular/router';

export const cashClosuresRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./cash-closures-list/cash-closures-list.component').then((m) => m.CashClosuresListComponent)
  }
];
