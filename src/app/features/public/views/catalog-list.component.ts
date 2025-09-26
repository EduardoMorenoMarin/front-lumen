import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PublicCategoriesApi, PublicProductsApi } from '../../../core/api';
import { PublicCategoryView, PublicProductView } from '../../../core/models';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="d-flex flex-column gap-4">
      <header class="bg-white shadow-sm rounded-4 p-4 border">
        <h1 class="h3 mb-3">Explora nuestro catálogo</h1>
        <p class="text-muted mb-4">
          Revisa los productos disponibles y utiliza el filtro de categorías para ver los títulos
          asociados a cada una.
        </p>

        <form class="row g-3 align-items-end" (ngSubmit)="onSearch()" role="search">
          <div class="col-12 col-lg-6">
            <label class="form-label fw-semibold" for="search">Buscar</label>
            <input
              id="search"
              name="search"
              type="search"
              class="form-control"
              [(ngModel)]="search"
              placeholder="Título, autor o palabras clave"
              [disabled]="loading"
            />
          </div>

          <div class="col-12 col-lg-6 d-flex gap-2 justify-content-lg-end">
            <button type="submit" class="btn btn-primary" [disabled]="loading">
              Buscar
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              (click)="resetFilters()"
              [disabled]="loading"
            >
              Limpiar
            </button>
          </div>
        </form>

        <div class="mt-4">
          <p class="fw-semibold mb-2">Filtrar por categoría</p>
          <div class="d-flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-sm"
              [ngClass]="{
                'btn-outline-primary': selectedCategoryId !== null,
                'btn-primary': selectedCategoryId === null
              }"
              (click)="selectCategory(null)"
              [disabled]="loadingCategories"
            >
              Todas
            </button>

            <ng-container *ngIf="!loadingCategories; else loadingCategoriesTpl">
              <button
                *ngFor="let category of categories; trackBy: trackByCategory"
                type="button"
                class="btn btn-sm"
                [ngClass]="
                  category.id === selectedCategoryId ? 'btn-primary' : 'btn-outline-primary'
                "
                (click)="selectCategory(category.id)"
              >
                {{ category.name }}
                <span *ngIf="category.productCount !== undefined" class="badge text-bg-light ms-1">
                  {{ category.productCount }}
                </span>
              </button>
            </ng-container>
          </div>

          <ng-template #loadingCategoriesTpl>
            <div class="d-flex align-items-center gap-2 text-muted">
              <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
              Cargando categorías…
            </div>
          </ng-template>

          <div *ngIf="categoriesError" class="alert alert-warning mt-3" role="alert">
            {{ categoriesError }}
          </div>

          <div *ngIf="selectedCategory" class="alert alert-info mt-3" role="status">
            <div class="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
              <div>
                <strong>{{ selectedCategory.name }}</strong>
                <p class="mb-0 small text-muted" *ngIf="selectedCategory.description">
                  {{ selectedCategory.description }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div *ngIf="loading" class="text-center text-muted py-5" role="status">
        <div class="spinner-border" role="status" aria-hidden="true"></div>
        <p class="mt-3">Cargando productos…</p>
      </div>

      <div *ngIf="error" class="alert alert-danger" role="alert">{{ error }}</div>

      <div *ngIf="!loading && !error && products.length === 0" class="alert alert-warning" role="alert">
        No encontramos resultados para tu búsqueda. Prueba con otros términos o selecciona otra
        categoría.
      </div>

      <div class="row g-4" *ngIf="!loading && !error">
        <div class="col-12 col-md-6 col-xl-4" *ngFor="let product of products; trackBy: trackByProduct">
          <article class="card h-100 shadow-sm border-0">
            <div class="card-body d-flex flex-column">
              <div class="d-flex flex-column gap-1 mb-3">
                <h2 class="h5 mb-0">{{ product.title || product.name || 'Sin título' }}</h2>
                <span class="text-primary fw-semibold" *ngIf="product.author">{{ product.author }}</span>
                <span class="badge text-bg-secondary align-self-start" *ngIf="product.categoryName">
                  {{ product.categoryName }}
                </span>
              </div>

              <p class="card-text text-muted flex-grow-1" *ngIf="product.description">
                {{ product.description }}
              </p>

              <ul class="list-unstyled small text-muted mb-3">
                <li>
                  <strong>Precio:</strong>
                  {{ product.price | currency: (product.currency || 'MXN') }}
                </li>
              </ul>

              <a
                class="btn btn-outline-primary mt-auto"
                [routerLink]="['/product', product.id]"
                >Ver detalles</a
              >
            </div>
          </article>
        </div>
      </div>

    </section>
  `
})
export class CatalogListComponent {
  private readonly api = inject(PublicProductsApi);
  private readonly categoriesApi = inject(PublicCategoriesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  allProducts: PublicProductView[] = [];
  products: PublicProductView[] = [];
  search = '';
  loading = false;
  error = '';
  categories: PublicCategoryView[] = [];
  selectedCategoryId: string | null = null;
  selectedCategory: PublicCategoryView | null = null;
  loadingCategories = false;
  categoriesError = '';

  constructor() {
    const params = this.route.snapshot.queryParamMap;
    const initialSearch = params.get('search');
    const initialCategory = params.get('categoryId');

    if (initialSearch) {
      this.search = initialSearch;
    }

    if (initialCategory) {
      this.selectedCategoryId = initialCategory;
      this.fetchCategoryDetail(initialCategory);
    }

    this.loadCategories();
    this.fetchProducts();
  }

  onSearch(): void {
    this.updateQueryParams();
    this.applyFilters();
  }

  resetFilters(): void {
    this.search = '';
    this.selectedCategoryId = null;
    this.selectedCategory = null;
    this.updateQueryParams();
    this.applyFilters();
  }

  selectCategory(categoryId: string | null): void {
    if (this.selectedCategoryId === categoryId) {
      return;
    }
    this.selectedCategoryId = categoryId;
    this.selectedCategory = null;
    this.categoriesError = '';
    if (categoryId) {
      const cached = this.categories.find(category => category.id === categoryId);
      if (cached) {
        this.selectedCategory = cached;
      }
      this.fetchCategoryDetail(categoryId);
    }
    this.updateQueryParams();
    this.applyFilters();
  }

  trackByProduct(_: number, item: PublicProductView): string {
    return item.id;
  }

  trackByCategory(_: number, item: PublicCategoryView): string {
    return item.id;
  }

  private loadCategories(): void {
    this.loadingCategories = true;
    this.categoriesError = '';
    this.categoriesApi.list().subscribe({
      next: response => {
        this.categories = response;
        if (this.selectedCategoryId) {
          const match = this.categories.find(category => category.id === this.selectedCategoryId);
          if (match) {
            this.selectedCategory = match;
          }
        }
        this.loadingCategories = false;
      },
      error: () => {
        this.loadingCategories = false;
        this.categoriesError = 'No se pudieron cargar las categorías en este momento.';
      }
    });
  }

  private fetchCategoryDetail(categoryId: string): void {
    this.categoriesApi.getById(categoryId).subscribe({
      next: category => {
        this.selectedCategory = category;
      },
      error: () => {
        this.categoriesError = 'No se pudo cargar la información de la categoría seleccionada.';
      }
    });
  }

  private fetchProducts(): void {
    this.loading = true;
    this.error = '';

    this.api.list().subscribe({
      next: (response) => {
        this.allProducts = response;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los productos.';
        this.loading = false;
      }
    });
  }

  private updateQueryParams(): void {
    const queryParams: Record<string, unknown> = {};

    if (this.search.trim()) {
      queryParams['search'] = this.search.trim();
    }

    if (this.selectedCategoryId) {
      queryParams['categoryId'] = this.selectedCategoryId;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }

  private applyFilters(): void {
    const term = this.search.trim().toLowerCase();
    this.products = this.allProducts.filter(product => {
      const matchesCategory = !this.selectedCategoryId || product.categoryId === this.selectedCategoryId;
      if (!matchesCategory) {
        return false;
      }

      if (!term) {
        return true;
      }

      const title = product.title ?? product.name ?? '';
      const author = product.author ?? '';
      const description = product.description ?? '';
      const combined = `${title} ${author} ${description}`.toLowerCase();
      return combined.includes(term);
    });
  }
}
