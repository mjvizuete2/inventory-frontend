import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './core/main-layout/main-layout.component';
import { adminRoutes } from './features/admin/admin.routes';
import { authRoutes } from './features/auth/auth.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'admin/products'
  },
  {
    path: 'admin',
    component: MainLayoutComponent,
    children: adminRoutes
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: authRoutes
  },
  {
    path: '**',
    redirectTo: 'admin/products'
  }
];
