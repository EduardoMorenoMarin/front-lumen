import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminCategoriesApi } from '../../../core/api/admin-categories.api';
import { Category } from '../../../core/models/category-management';

@Component({
  selector: 'app-admin-categories-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DatePipe],
  styles: [
    `
      :host {
        display: block;
        padding: 1.5rem;
      }

      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .page-header h1 {
        margin: 0;
      }

      .btn-primary {
        background: #2563eb;
        border: none;
        border-radius: 0.5rem;
        color: #fff;
        cursor: pointer;
        font-weight: 600;
        padding: 0.625rem 1.25rem;
        text-decoration: none;
        transition: background 0.2s ease-in-out;
      }

      .btn-primary:hover {
        background: #1d4ed8;
      }

      form.filters {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-bottom: 1.5rem;
      }

      form.filters label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.95rem;
      }

      form.filters input,
      form.filters select {
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
      }

      .filter-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .filter-actions button {
        border-radius: 0.5rem;
        border: 1px solid transparent;
        cursor: pointer;
        font-weight: 600;
        padding: 0.5rem 1rem;
      }

      .filter-actions button[type='submit'] {
        background: #111827;
        color: #fff;
      }

      .filter-actions button[type='button'] {
        background: #f3f4f6;
        color: #111827;
      }

      .state {
        align-items: center;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        display: flex;
        gap: 0.75rem;
        justify-content: center;
        margin-bottom: 1.5rem;
        min-height: 120px;
        padding: 1.5rem;
        text-align: center;
      }

      .state--error {
        border-color: #ef4444;
        color: #991b1b;
        flex-direction: column;
      }

      .state--empty {
        flex-direction: column;
        color: #4b5563;
      }

      .state--loading {
        color: #1f2937;
      }

      .spinner {
        animation: spin 0.8s linear infinite;
        border: 3px solid #e5e7eb;
        border-radius: 999px;
        border-top-color: #2563eb;
        height: 32px;
        width: 32px;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      table {
        border-collapse: collapse;
        width: 100%;
      }

      thead th {
        background: #f3f4f6;
        color: #374151;
        font-size: 0.9rem;
        font-weight: 600;
        padding: 0.75rem;
        text-align: left;
      }

      tbody td {
        border-bottom: 1px solid #e5e7eb;
        padding: 0.75rem;
        vertical-align: top;
      }

      tbody tr:hover {
        background: #f9fafb;
      }

      .badge {
        border-radius: 999px;
        display: inline-flex;
        font-size: 0.75rem;
        font-weight: 600;
        gap: 0.25rem;
        padding: 0.25rem 0.625rem;
      }

      .badge--success {
        background: #dcfce7;
        color: #166534;
      }

      .badge--muted {
        background: #f1f5f9;
        color: #1e293b;
      }

      .pagination {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
      }

      .pagination button {
        background: #f3f4f6;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        padding: 0.5rem 0.9rem;
      }

      .pagination button[disabled] {
        cursor: not-allowed;
        opacity: 0.5;
      }
    `
  ],
  template: `
    <section class="page-header">
      <h1>Categorías</h1>
      <a routerLink="/admin/categories/new" class="btn-primary">Nueva Categoría</a>
    </section>

    <form class="filters" [formGroup]="filters" (ngSubmit)="applyFilters()">
      <label>
        Nombre
        <input
          type="search"
          formControlName="search"
          placeholder="Buscar por nombre"
          autocomplete="off"
        />
      </label>

      <label>
        Activos
        <select formControlName="active">
          <option value="all">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </label>

      <label>
        Orden
        <select formControlName="sort">
          <option value="desc">Actualizadas recientemente</option>
          <option value="asc">Actualizadas primero</option>
        </select>
      </label>

      <div class="filter-actions">
        <button type="submit">Aplicar</button>
        <button type="button" (click)="resetFilters()">Limpiar</button>
      </div>
    </form>

    <section *ngIf="loading" class="state state--loading" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <span>Cargando categorías…</span>
    </section>

    <section *ngIf="error" class="state state--error" aria-live="assertive">
      <p>{{ error }}</p>
      <button type="button" (click)="retry()">Reintentar</button>
    </section>

    <ng-container *ngIf="!loading && !error">
      <section *ngIf="!pagedCategories.length" class="state state--empty">
        <p>No hay categorías para mostrar.</p>
        <a routerLink="/admin/categories/new" class="btn-primary">Nueva Categoría</a>
      </section>

      <ng-container *ngIf="pagedCategories.length">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Actualizada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let category of pagedCategories">
              <td>{{ category.name }}</td>
              <td>{{ category.description || '—' }}</td>
              <td>
                <span class="badge" [class.badge--success]="category.active" [class.badge--muted]="!category.active">
                  {{ category.active ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td>{{ category.updatedAt | date: 'medium' }}</td>
              <td>
                <a [routerLink]="['/admin/categories', category.id]">Ver detalle</a>
              </td>
            </tr>
          </tbody>
        </table>

        <nav class="pagination" aria-label="Paginación">
          <button type="button" (click)="goToPage(page - 1)" [disabled]="page <= 1">Anterior</button>
          <span>Página {{ page }} de {{ totalPages }}</span>
          <button type="button" (click)="goToPage(page + 1)" [disabled]="page >= totalPages">Siguiente</button>
        </nav>
      </ng-container>
    </ng-container>
  `
})
export class AdminCategoriesListComponent {
  private readonly categoriesApi = inject(AdminCategoriesApi);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  filters = this.fb.group({
    search: ['', [Validators.maxLength(120)]],
    active: ['all'],
    sort: ['desc']
  });

  categories: Category[] = [];
  filteredCategories: Category[] = [];
  pagedCategories: Category[] = [];
  page = 1;
  readonly pageSize = 10;
  totalPages = 1;
  loading = false;
  error: string | null = null;

  private requestController: AbortController | null = null;
  private requestSubscription: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.abortRequest());
    this.loadCategories();
  }

  applyFilters(): void {
    this.page = 1;
    this.updateFilteredData();
  }

  resetFilters(): void {
    this.filters.reset({ search: '', active: 'all', sort: 'desc' });
    this.page = 1;
    this.updateFilteredData();
  }

  retry(): void {
    this.loadCategories();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.page = page;
    this.updatePagedData();
  }

  private loadCategories(): void {
    this.abortRequest();
    const controller = new AbortController();
    this.requestController = controller;
    this.loading = true;
    this.error = null;

    this.requestSubscription = this.categoriesApi
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.requestController === controller) {
            this.loading = false;
            this.requestController = null;
            this.requestSubscription = null;
          }
        })
      )
      .subscribe({
        next: categories => {
          if (this.requestController !== null && this.requestController !== controller) {
            return;
          }
          this.categories = categories;
          this.applyFilters();
        },
        error: _err => {
          if (controller.signal.aborted) {
            return;
          }
          this.categories = [];
          this.filteredCategories = [];
          this.pagedCategories = [];
          this.totalPages = 1;
          this.error = 'No se pudieron cargar las categorías. Intenta nuevamente.';
        }
      });
  }

  private updateFilteredData(): void {
    const { search, active, sort } = this.filters.getRawValue();
    const searchTerm = (search || '').trim().toLowerCase();

    let data = [...this.categories];

    if (searchTerm) {
      data = data.filter(category => category.name.toLowerCase().includes(searchTerm));
    }

    if (active === 'true') {
      data = data.filter(category => category.active);
    } else if (active === 'false') {
      data = data.filter(category => !category.active);
    }

    data.sort((a, b) => {
      const first = new Date(a.updatedAt).getTime();
      const second = new Date(b.updatedAt).getTime();
      return sort === 'asc' ? first - second : second - first;
    });

    this.filteredCategories = data;
    this.totalPages = Math.max(1, Math.ceil(this.filteredCategories.length / this.pageSize));
    this.page = Math.min(this.page, this.totalPages);
    this.updatePagedData();
  }

  private updatePagedData(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedCategories = this.filteredCategories.slice(start, end);
  }

  private abortRequest(): void {
    if (this.requestController) {
      this.requestController.abort();
      this.requestController = null;
    }
    if (this.requestSubscription) {
      this.requestSubscription.unsubscribe();
      this.requestSubscription = null;
    }
  }
}
