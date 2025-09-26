import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SalesApi } from '../../../core/api/sales.api';
import { SaleViewDTO } from '../../../core/models/sale';

@Component({
  selector: 'app-admin-sale-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    <a routerLink="/admin/sales">&larr; Volver</a>

    <h1>Detalle de venta</h1>

    <section *ngIf="loading" class="loading">Cargando venta…</section>
    <section *ngIf="error" class="alert error">{{ error }}</section>

    <article *ngIf="!loading && sale" class="card">
      <header>
        <h2>Venta #{{ sale.id }}</h2>
        <p>Estado: {{ sale.status }} · Registrada el {{ sale.saleDate | date: 'medium' }}</p>
      </header>

      <dl class="sale-summary">
        <div>
          <dt>Total</dt>
          <dd>{{ sale.totalAmount | number: '1.2-2' }}</dd>
        </div>
        <div>
          <dt>Impuestos</dt>
          <dd>{{ sale.taxAmount | number: '1.2-2' }}</dd>
        </div>
        <div>
          <dt>Descuento</dt>
          <dd>{{ sale.discountAmount | number: '1.2-2' }}</dd>
        </div>
      </dl>

      <section class="sale-details">
        <div>
          <h3>Cliente</h3>
          <p>{{ sale.customerFirstName }} {{ sale.customerLastName }}</p>
          <p>ID: {{ sale.customerId }}</p>
        </div>
        <div>
          <h3>Cajero</h3>
          <p>{{ sale.cashierEmail }}</p>
          <p>ID: {{ sale.cashierId }}</p>
        </div>
      </section>

      <section>
        <h3>Ítems</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of sale.items">
              <td>{{ item.productTitle }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice | number: '1.2-2' }}</td>
              <td>{{ item.totalPrice | number: '1.2-2' }}</td>
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
