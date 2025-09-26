import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './publicLayout.component';

export const publicRoutes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./views/home.component').then(m => m.PublicHomeComponent)
      },
      {
        path: 'catalog',
        loadComponent: () => import('./views/catalog-list.component').then(m => m.CatalogListComponent)
      },
      {
        path: 'product/:id',
        loadComponent: () => import('./views/product-detail.component').then(m => m.ProductDetailComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./views/categories-list.component').then(m => m.CategoriesListComponent)
      },
      {
        path: 'reserve',
        loadComponent: () => import('./views/reserve.component').then(m => m.ReserveComponent)
      }
    ]
  }
];
