import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PublicProductsApi } from '../../../core/api';
import { PublicProductView } from '../../../core/models';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="catalog">
      <form class="catalog__filters" (ngSubmit)="onSearch()">
        <input
          name="search"
          type="search"
          [(ngModel)]="search"
          placeholder="Buscar productos"
          [disabled]="loading"
        />
        <button type="submit" [disabled]="loading">Buscar</button>
      </form>

      <p *ngIf="loading">Cargando productos...</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="!loading && products.length === 0 && !error">No hay productos para mostrar.</p>

      <ul class="catalog__grid">
        <li *ngFor="let product of products" class="catalog__item">
          <article>
            <header>
              <h2>{{ product.name }}</h2>
              <p *ngIf="product.categoryName">{{ product.categoryName }}</p>
            </header>
            <p *ngIf="product.description">{{ product.description }}</p>
            <footer>
              {{ product.price | currency: product.currency }}
            </footer>
          </article>
        </li>
      </ul>

      <nav class="catalog__pagination" *ngIf="totalPages > 1">
        <button type="button" (click)="changePage(-1)" [disabled]="loading || page <= 1">Anterior</button>
        <span>Pagina {{ page }} de {{ totalPages }}</span>
        <button type="button" (click)="changePage(1)" [disabled]="loading || page >= totalPages">Siguiente</button>
      </nav>
    </section>
  `
})
export class CatalogListComponent {
  private readonly api = inject(PublicProductsApi);

  products: PublicProductView[] = [];
  page = 1;
  pageSize = 12;
  totalPages = 0;
  totalItems = 0;
  search = '';
  loading = false;
  error = '';

  constructor() {
    this.fetchProducts();
  }

  onSearch(): void {
    this.page = 1;
    this.fetchProducts();
  }

  changePage(direction: number): void {
    const target = this.page + direction;
    if (target < 1 || (this.totalPages && target > this.totalPages)) {
      return;
    }
    this.page = target;
    this.fetchProducts();
  }

  private fetchProducts(): void {
    this.loading = true;
    this.error = '';

    const params: Record<string, unknown> = {
      page: this.page,
      pageSize: this.pageSize
    };

    if (this.search.trim()) {
      params['search'] = this.search.trim();
    }

    this.api.list(params).subscribe({
      next: (response) => {
        this.products = response.items;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los productos.';
        this.loading = false;
      }
    });
  }
}
