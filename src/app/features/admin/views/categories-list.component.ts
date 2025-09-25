import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoriesApi } from '../../../core/api/categories.api';
import { CategoryViewDTO } from '../../../core/models/category';
import { PageResponse } from '../../../core/models/pagination';

@Component({
  selector: 'app-admin-categories-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <section class="page-header">
      <h1>Categorías</h1>
      <a routerLink="/admin/categories/new" class="btn">Crear categoría</a>
    </section>

    <form class="filters" [formGroup]="filterForm" (ngSubmit)="applyFilters()">
      <label>
        Búsqueda
        <input type="text" formControlName="search" placeholder="Nombre o slug" />
      </label>

      <label>
        Estado
        <select formControlName="isActive">
          <option value="">Todos</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </label>

      <div class="filter-actions">
        <button type="submit">Aplicar</button>
        <button type="button" (click)="resetFilters()">Limpiar</button>
      </div>
    </form>

    <section *ngIf="error" class="alert error">{{ error }}</section>
    <section *ngIf="loading" class="loading">Cargando categorías…</section>

    <table *ngIf="!loading && categories.length" class="data-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Slug</th>
          <th>Estado</th>
          <th>Productos</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let category of categories">
          <td>{{ category.name }}</td>
          <td>{{ category.slug }}</td>
          <td>{{ category.isActive ? 'Activa' : 'Inactiva' }}</td>
          <td>{{ category.productCount ?? '—' }}</td>
          <td>
            <a [routerLink]="['/admin/categories', category.id]">Editar</a>
          </td>
        </tr>
      </tbody>
    </table>

    <p *ngIf="!loading && !categories.length" class="empty-state">No hay categorías para mostrar.</p>

    <nav class="pagination" *ngIf="!loading && totalPages > 1">
      <button type="button" (click)="goToPage(page - 1)" [disabled]="page <= 1">Anterior</button>
      <span>Página {{ page }} de {{ totalPages }}</span>
      <button type="button" (click)="goToPage(page + 1)" [disabled]="page >= totalPages">Siguiente</button>
    </nav>
  `
})
export class AdminCategoriesListComponent {
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    isActive: ['']
  });

  categories: CategoryViewDTO[] = [];
  loading = false;
  error: string | null = null;
  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;

  constructor() {
    this.loadCategories(1);
  }

  applyFilters(): void {
    this.loadCategories(1);
  }

  resetFilters(): void {
    this.filterForm.reset({ search: '', isActive: '' });
    this.loadCategories(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadCategories(page);
  }

  private loadCategories(page: number): void {
    this.loading = true;
    this.error = null;
    const { search, isActive } = this.filterForm.getRawValue();
    this.categoriesApi
      .list({
        page,
        pageSize: this.pageSize,
        search: search || undefined,
        isActive: isActive ? isActive === 'true' : undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: response => this.handleResponse(response),
        error: () => {
          this.error = 'No se pudieron cargar las categorías.';
        }
      });
  }

  private handleResponse(response: PageResponse<CategoryViewDTO>): void {
    this.categories = response.items;
    this.page = response.page;
    this.pageSize = response.pageSize;
    this.totalPages = response.totalPages;
    this.totalItems = response.totalItems;
  }
}
