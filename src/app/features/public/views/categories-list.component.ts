import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { PublicCategoriesApi } from '../../../core/api';
import { PublicCategoryView } from '../../../core/models';

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="categories">
      <p *ngIf="loading">Cargando categorias...</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="!loading && !error && categories.length === 0">No hay categorias para mostrar.</p>

      <ul>
        <li *ngFor="let category of categories">
          <strong>{{ category.name }}</strong>
          <span *ngIf="category.description"> - {{ category.description }}</span>
        </li>
      </ul>

      <nav *ngIf="totalPages > 1" class="categories__pagination">
        <button type="button" (click)="changePage(-1)" [disabled]="loading || page <= 1">Anterior</button>
        <span>Pagina {{ page }} de {{ totalPages }}</span>
        <button type="button" (click)="changePage(1)" [disabled]="loading || page >= totalPages">Siguiente</button>
      </nav>
    </section>
  `
})
export class CategoriesListComponent {
  private readonly api = inject(PublicCategoriesApi);

  categories: PublicCategoryView[] = [];
  page = 1;
  pageSize = 20;
  totalPages = 0;
  loading = false;
  error = '';

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

  private fetchCategories(): void {
    this.loading = true;
    this.error = '';

    this.api.list({ page: this.page, pageSize: this.pageSize }).subscribe({
      next: (response) => {
        this.categories = response.items;
        this.page = response.page;
        this.pageSize = response.pageSize;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar las categorias.';
        this.loading = false;
      }
    });
  }
}
