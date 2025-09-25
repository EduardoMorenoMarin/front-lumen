import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { PublicProductsApi } from '../../../core/api';
import { PublicProductView } from '../../../core/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="d-flex flex-column gap-4">
      <a class="btn btn-link px-0" routerLink="/catalog">&larr; Volver al catálogo</a>

      <div *ngIf="loading" class="text-center text-muted py-5" role="status">
        <div class="spinner-border" role="status" aria-hidden="true"></div>
        <p class="mt-3">Cargando información del producto…</p>
      </div>

      <div *ngIf="!loading && error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <article *ngIf="!loading && product" class="card shadow-sm border-0">
        <div class="card-body d-flex flex-column gap-4">
          <header class="d-flex flex-column flex-lg-row gap-3 align-items-lg-start">
            <div class="flex-grow-1">
              <h1 class="h3 mb-2">{{ product.name }}</h1>
              <p class="text-primary fw-semibold mb-2" *ngIf="product.author">{{ product.author }}</p>
              <span class="badge text-bg-secondary" *ngIf="product.categoryName">
                {{ product.categoryName }}
              </span>
            </div>
            <div class="text-lg-end">
              <p class="display-6 fw-bold mb-1">
                {{ product.price | currency: product.currency }}
              </p>
              <p class="text-muted mb-0" *ngIf="product.availableStock !== undefined">
                {{ product.availableStock }} unidades disponibles
              </p>
            </div>
          </header>

          <p class="lead" *ngIf="product.description">{{ product.description }}</p>

          <dl class="row mb-0">
            <dt class="col-sm-3">Autor</dt>
            <dd class="col-sm-9">{{ product.author || 'Sin autor registrado' }}</dd>

            <dt class="col-sm-3">Categoría</dt>
            <dd class="col-sm-9">{{ product.categoryName || 'Sin categoría' }}</dd>

            <dt class="col-sm-3">Disponibilidad</dt>
            <dd class="col-sm-9">
              <span
                [ngClass]="{
                  'text-success fw-semibold': product.availableStock !== undefined && product.availableStock > 0,
                  'text-danger fw-semibold': product.availableStock !== undefined && product.availableStock === 0
                }"
              >
                {{ product.availableStock !== undefined ? product.availableStock + ' unidades' : 'Consultar en tienda' }}
              </span>
            </dd>
          </dl>

          <div class="d-flex flex-wrap gap-2">
            <a class="btn btn-primary" routerLink="/reserve">Reservar este título</a>
            <a
              class="btn btn-outline-secondary"
              routerLink="/categories"
            >
              Explorar categorías
            </a>
          </div>
        </div>
      </article>
    </section>
  `
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PublicProductsApi);

  product: PublicProductView | null = null;
  loading = false;
  error = '';

  private subscription?: Subscription;

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.product = null;
        this.error = 'Producto no encontrado.';
        return;
      }
      this.fetchProduct(id);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private fetchProduct(id: string): void {
    this.loading = true;
    this.error = '';
    this.product = null;

    this.api.getById(id).subscribe({
      next: (res) => {
        this.product = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el producto.';
        this.loading = false;
      }
    });
  }
}
