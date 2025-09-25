import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SalesApi } from '../../../core/api/sales.api';
import { SaleViewDTO } from '../../../core/models/sale';

@Component({
  selector: 'app-admin-sale-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, CurrencyPipe],
  template: `
    <a routerLink="/admin/sales">&larr; Volver</a>

    <h1>Detalle de venta</h1>

    <section *ngIf="loading" class="loading">Cargando venta…</section>
    <section *ngIf="error" class="alert error">{{ error }}</section>

    <article *ngIf="!loading && sale" class="card">
      <header>
        <h2>Venta #{{ sale.id }}</h2>
        <p>Creada el {{ sale.createdAt | date: 'medium' }} por {{ sale.createdBy }}</p>
      </header>

      <dl class="sale-summary">
        <div>
          <dt>Reserva asociada</dt>
          <dd>{{ sale.reservationId || 'N/A' }}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{{ sale.total | currency: sale.currency }}</dd>
        </div>
      </dl>

      <section>
        <h3>Ítems</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of sale.items">
              <td>{{ item.productId }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice | currency: item.currency }}</td>
              <td>{{ (item.unitPrice * item.quantity) | currency: item.currency }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </article>
  `
})
export class AdminSaleDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly salesApi = inject(SalesApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly saleId = this.route.snapshot.paramMap.get('id');

  sale: SaleViewDTO | null = null;
  loading = false;
  error: string | null = null;

  constructor() {
    if (this.saleId) {
      this.loadSale(this.saleId);
    } else {
      this.error = 'Identificador de venta no válido.';
    }
  }

  private loadSale(id: string): void {
    this.loading = true;
    this.error = null;
    this.salesApi
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: sale => {
          this.sale = sale;
        },
        error: () => {
          this.error = 'No se pudo cargar la venta solicitada.';
        }
      });
  }
}
