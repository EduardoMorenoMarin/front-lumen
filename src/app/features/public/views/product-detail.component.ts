import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { PublicProductsApi } from '../../../core/api';
import { PublicProductView } from '../../../core/models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="product-detail" *ngIf="!loading && product; else loadingOrError">
      <h1>{{ product.name }}</h1>
      <p *ngIf="product.description">{{ product.description }}</p>
      <p><strong>Precio:</strong> {{ product.price | currency: product.currency }}</p>
      <p *ngIf="product.categoryName"><strong>Categoria:</strong> {{ product.categoryName }}</p>
      <p *ngIf="product.availableStock !== undefined">
        <strong>Stock:</strong> {{ product.availableStock }}
      </p>
    </section>

    <ng-template #loadingOrError>
      <p *ngIf="loading">Cargando producto...</p>
      <p *ngIf="!loading && error" class="error">{{ error }}</p>
    </ng-template>
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
