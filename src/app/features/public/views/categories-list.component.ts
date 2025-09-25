import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublicCategoriesApi, PublicProductsApi } from '../../../core/api';
import { PublicCategoryView, PublicProductView } from '../../../core/models';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="d-flex flex-column gap-4">
      <header class="bg-white shadow-sm rounded-4 p-4 border">
        <h1 class="h3 mb-3">Categorías disponibles</h1>
        <p class="text-muted mb-0">
          Consulta las colecciones públicas sin necesidad de iniciar sesión. Selecciona una categoría
          para conocer sus detalles y descubrir los títulos disponibles.
        </p>
      </header>

      <div class="row g-4">
        <div class="col-12 col-lg-4">
          <div class="bg-white shadow-sm rounded-4 p-4 border h-100 d-flex flex-column gap-3">
            <div class="d-flex align-items-center justify-content-between">
              <h2 class="h5 mb-0">Explorar</h2>
              <button
                type="button"
                class="btn btn-link p-0"
                (click)="clearSelection()"
                [disabled]="!selectedCategoryId"
              >
                Ver todas
              </button>
            </div>

            <div *ngIf="loadingCategories" class="d-flex align-items-center gap-2 text-muted">
              <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
              Cargando categorías…
            </div>

            <div *ngIf="categoriesError" class="alert alert-danger" role="alert">
              {{ categoriesError }}
            </div>

            <div class="d-flex flex-wrap gap-2" *ngIf="!loadingCategories && categories.length">
              <button
                *ngFor="let category of categories; trackBy: trackByCategory"
                type="button"
                class="btn btn-sm"
                [ngClass]="category.id === selectedCategoryId ? 'btn-primary' : 'btn-outline-primary'"
                (click)="selectCategory(category)"
              >
                {{ category.name }}
                <span *ngIf="category.productCount !== undefined" class="badge text-bg-light ms-1">
                  {{ category.productCount }}
                </span>
              </button>
            </div>

            <p *ngIf="!loadingCategories && !categories.length" class="text-muted mb-0">
              No hay categorías registradas.
            </p>

            <nav *ngIf="!loadingCategories && totalPages > 1" class="pt-2" aria-label="Paginación de categorías">
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" [class.disabled]="page <= 1">
                  <button class="page-link" type="button" (click)="changePage(-1)" [disabled]="page <= 1">
                    Anterior
                  </button>
                </li>
                <li class="page-item disabled">
                  <span class="page-link">Página {{ page }} de {{ totalPages }}</span>
                </li>
                <li class="page-item" [class.disabled]="page >= totalPages">
                  <button class="page-link" type="button" (click)="changePage(1)" [disabled]="page >= totalPages">
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div class="col-12 col-lg-8">
          <div class="card shadow-sm border-0 h-100">
            <ng-container *ngIf="selectedCategory; else emptyState">
              <div class="card-body d-flex flex-column gap-4">
                <div>
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <h2 class="h4 mb-0">{{ selectedCategory.name }}</h2>
                    <div
                      class="spinner-border spinner-border-sm text-primary"
                      role="status"
                      aria-hidden="true"
                      *ngIf="loadingCategoryDetail"
                    ></div>
                  </div>
                  <p class="text-muted mb-3" *ngIf="selectedCategory.description">
                    {{ selectedCategory.description }}
                  </p>
                  <div class="d-flex flex-wrap gap-2">
                    <span class="badge text-bg-primary">{{ selectedCategory.productCount ?? 0 }} productos</span>
                    <span class="badge text-bg-secondary" *ngIf="selectedCategory.slug">Slug: {{ selectedCategory.slug }}</span>
                  </div>
                </div>

                <div *ngIf="categoryDetailError" class="alert alert-warning" role="alert">
                  {{ categoryDetailError }}
                </div>

                <section class="d-flex flex-column gap-3">
                  <header class="d-flex align-items-center justify-content-between">
                    <h3 class="h5 mb-0">Títulos destacados</h3>
                    <a
                      class="btn btn-outline-primary btn-sm"
                      [routerLink]="['/catalog']"
                      [queryParams]="{ categoryId: selectedCategory.id }"
                    >
                      Ver catálogo filtrado
                    </a>
                  </header>

                  <div *ngIf="loadingProducts" class="d-flex align-items-center gap-2 text-muted">
                    <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
                    Buscando libros…
                  </div>

                  <div *ngIf="productsError" class="alert alert-danger" role="alert">
                    {{ productsError }}
                  </div>

                  <div
                    class="alert alert-info"
                    role="status"
                    *ngIf="!loadingProducts && !productsError && categoryProducts.length === 0"
                  >
                    Aún no hay productos asociados a esta categoría.
                  </div>

                  <div class="row g-3" *ngIf="!loadingProducts && !productsError">
                    <div class="col-12 col-md-6" *ngFor="let product of categoryProducts; trackBy: trackByProduct">
                      <article class="border rounded-4 p-3 h-100 position-relative">
                        <h4 class="h6 mb-1">{{ product.name }}</h4>
                        <p class="text-muted small mb-2" *ngIf="product.author">{{ product.author }}</p>
                        <p class="small text-truncate" *ngIf="product.description">{{ product.description }}</p>
                        <p class="fw-semibold mb-2">
                          {{ product.price | currency: product.currency }}
                          <span class="text-muted" *ngIf="product.availableStock !== undefined">
                            · {{ product.availableStock }} en stock
                          </span>
                        </p>
                        <a class="stretched-link" [routerLink]="['/product', product.id]">Ver detalle</a>
                      </article>
                    </div>
                  </div>
                </section>
              </div>
            </ng-container>

            <ng-template #emptyState>
              <div class="card-body d-flex flex-column align-items-center justify-content-center text-center text-muted py-5">
                <p class="mb-0">Selecciona una categoría para ver su información.</p>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </section>
  `
})
export class CategoriesListComponent {
  private readonly categoriesApi = inject(PublicCategoriesApi);
  private readonly productsApi = inject(PublicProductsApi);

  categories: PublicCategoryView[] = [];
  loadingCategories = false;
  categoriesError = '';
  page = 1;
  pageSize = 20;
  totalPages = 0;

  selectedCategoryId: string | null = null;
  selectedCategory: PublicCategoryView | null = null;
  loadingCategoryDetail = false;
  categoryDetailError = '';

  categoryProducts: PublicProductView[] = [];
  loadingProducts = false;
  productsError = '';

  constructor() {
    this.fetchCategories();
  }

  changePage(direction: number): void {
    const target = this.page + direction;
    if (target < 1 || (this.totalPages && target > this.totalPages)) {
      return;
    }

    this.page = target;
    this.fetchCategories();
  }

  clearSelection(): void {
    if (!this.selectedCategoryId) {
      return;
    }

    this.selectedCategoryId = null;
    this.selectedCategory = null;
    this.categoryProducts = [];
    this.categoryDetailError = '';
    this.productsError = '';
  }

  selectCategory(category: PublicCategoryView): void {
    if (this.selectedCategoryId === category.id) {
      return;
    }

    this.selectedCategoryId = category.id;
    this.selectedCategory = category;
    this.categoryDetailError = '';
    this.productsError = '';

    this.loadCategoryDetail(category.id);
    this.loadProductsForCategory(category.id);
  }

  trackByCategory(_: number, category: PublicCategoryView): string {
    return category.id;
  }

  trackByProduct(_: number, product: PublicProductView): string {
    return product.id;
  }

  private fetchCategories(): void {
    this.loadingCategories = true;
    this.categoriesError = '';

    this.categoriesApi.list({ page: this.page, pageSize: this.pageSize }).subscribe({
      next: (response) => {
        this.categories = response.items;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.totalPages = response.totalPages;
        this.loadingCategories = false;

        if (!this.selectedCategoryId && this.categories.length) {
          this.selectCategory(this.categories[0]);
        }
      },
      error: () => {
        this.loadingCategories = false;
        this.categoriesError = 'No se pudieron cargar las categorías públicas.';
      }
    });
  }

  private loadCategoryDetail(id: string): void {
    this.loadingCategoryDetail = true;
    this.categoriesApi.getById(id).subscribe({
      next: (category) => {
        this.selectedCategory = category;
        this.loadingCategoryDetail = false;
      },
      error: () => {
        this.loadingCategoryDetail = false;
        this.categoryDetailError = 'No se pudo obtener la información detallada de la categoría.';
      }
    });
  }

  private loadProductsForCategory(categoryId: string): void {
    this.loadingProducts = true;
    this.productsError = '';

    this.productsApi.list({ page: 1, pageSize: 6, categoryId }).subscribe({
      next: (response) => {
        this.categoryProducts = response.items;
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
        this.productsError = 'No se pudieron listar los productos de esta categoría.';
      }
    });
  }
}
