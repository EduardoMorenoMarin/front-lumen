import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductsApi } from '../../../core/api/products.api';
import { CategoriesApi } from '../../../core/api/categories.api';
import { ProductViewDTO } from '../../../core/models/product';
import { CategoryViewDTO } from '../../../core/models/category';
import { PageResponse } from '../../../core/models/pagination';

@Component({
  selector: 'app-admin-products-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    <section class="page-header">
      <h1>Productos</h1>
      <a routerLink="/admin/products/new" class="btn">Crear producto</a>
    </section>

    <form class="filters" [formGroup]="filterForm" (ngSubmit)="applyFilters()">
      <label>
        Búsqueda
        <input type="text" formControlName="search" placeholder="Nombre o SKU" />
      </label>

      <label>
        Categoría
        <select formControlName="categoryId">
          <option value="">Todas</option>
          <option *ngFor="let category of categories" [value]="category.id">{{ category.name }}</option>
        </select>
      </label>

      <label>
        Estado
        <select formControlName="isActive">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </label>

      <div class="filter-actions">
        <button type="submit">Aplicar</button>
        <button type="button" (click)="resetFilters()">Limpiar</button>
      </div>
    </form>

    <section *ngIf="error" class="alert error">{{ error }}</section>
    <section *ngIf="message" class="alert success">{{ message }}</section>
    <section *ngIf="loading" class="loading">Cargando productos…</section>

    <table *ngIf="!loading && products.length" class="data-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>SKU</th>
          <th>Precio</th>
          <th>Categoría</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let product of products">
          <td>{{ product.name }}</td>
          <td>{{ product.sku }}</td>
          <td>{{ product.price | currency: product.currency }}</td>
          <td>{{ product.categoryName || 'Sin categoría' }}</td>
          <td>{{ product.isActive ? 'Activo' : 'Inactivo' }}</td>
          <td>
            <a [routerLink]="['/admin/products', product.id]">Editar</a>
          </td>
        </tr>
      </tbody>
    </table>

    <p *ngIf="!loading && !products.length" class="empty-state">No hay productos para mostrar.</p>

    <nav class="pagination" *ngIf="!loading && totalPages > 1">
      <button type="button" (click)="goToPage(page - 1)" [disabled]="page <= 1">Anterior</button>
      <span>Página {{ page }} de {{ totalPages }}</span>
      <button type="button" (click)="goToPage(page + 1)" [disabled]="page >= totalPages">Siguiente</button>
    </nav>
  `
})
export class AdminProductsListComponent {
  private readonly productsApi = inject(ProductsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    categoryId: [''],
    isActive: ['']
  });

  products: ProductViewDTO[] = [];
  categories: CategoryViewDTO[] = [];
  loading = false;
  message: string | null = null;
  error: string | null = null;
  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;

  constructor() {
    this.loadCategories();
    this.loadProducts(1);
  }

  applyFilters(): void {
    this.loadProducts(1);
  }

  resetFilters(): void {
    this.filterForm.reset({ search: '', categoryId: '', isActive: '' });
    this.loadProducts(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadProducts(page);
  }

  private loadCategories(): void {
    this.categoriesApi
      .list({ page: 1, pageSize: 100, sort: 'name,asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.categories = response.items;
        }
      });
  }

  private loadProducts(page: number): void {
    this.loading = true;
    this.error = null;
    const { search, categoryId, isActive } = this.filterForm.getRawValue();
    this.productsApi
      .list({
        page,
        pageSize: this.pageSize,
        search: search || undefined,
        categoryId: categoryId || undefined,
        isActive: isActive ? isActive === 'true' : undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: response => this.handlePageResponse(response),
        error: () => {
          this.error = 'No se pudieron cargar los productos.';
        }
      });
  }

  private handlePageResponse(response: PageResponse<ProductViewDTO>): void {
    this.products = response.items;
    this.page = response.page;
    this.pageSize = response.pageSize;
    this.totalPages = response.totalPages;
    this.totalItems = response.totalItems;
  }
}
