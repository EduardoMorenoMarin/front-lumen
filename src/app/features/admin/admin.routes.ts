import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './adminLayout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./views/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'productos',
        redirectTo: 'products',
        pathMatch: 'full'
      },
      {
        path: 'productos/new',
        redirectTo: 'products/new',
        pathMatch: 'full'
      },
      {
        path: 'productos/:id',
        redirectTo: 'products/:id',
        pathMatch: 'full'
      },
      {
        path: 'reservations',
        loadComponent: () => import('./views/reservations-list.component').then(m => m.AdminReservationsListComponent)
      },
      {
        path: 'reservations/new',
        loadComponent: () => import('./views/reservation-create.component').then(m => m.AdminReservationCreateComponent)
      },
      {
        path: 'reservations/:id',
        loadComponent: () => import('./views/reservation-detail.component').then(m => m.AdminReservationDetailComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./views/products-list.component').then(m => m.AdminProductsListComponent)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./views/product-detail.component').then(m => m.AdminProductDetailComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./views/categories-list.component').then(m => m.AdminCategoriesListComponent)
      },
      {
        path: 'categories/:id',
        loadComponent: () => import('./views/category-detail.component').then(m => m.AdminCategoryDetailComponent)
      },
      {
        path: 'customers',
        loadComponent: () => import('./views/customers-list.component').then(m => m.AdminCustomersListComponent)
      },
      {
        path: 'customers/:id',
        loadComponent: () => import('./views/customer-detail.component').then(m => m.AdminCustomerDetailComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./views/inventory.component').then(m => m.AdminInventoryComponent)
      },
      {
        path: 'sales',
        loadComponent: () => import('./views/sales-list.component').then(m => m.AdminSalesListComponent)
      },
      {
        path: 'sales/:id',
        loadComponent: () => import('./views/sale-detail.component').then(m => m.AdminSaleDetailComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./views/reports.component').then(m => m.AdminReportsComponent)
      }
    ]
  }
];
