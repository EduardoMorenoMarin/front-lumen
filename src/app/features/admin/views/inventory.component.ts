import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InventoryApi } from '../../../core/api/inventory.api';
import { ProductsApi } from '../../../core/api/products.api';
import { InventoryAdjustmentRequest, InventoryAdjustmentResponse, ProductStockResponse } from '../../../core/models/inventory';
import { ProductViewDTO } from '../../../core/models/product';

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="page-header">
      <h1>Inventario</h1>
    </section>

    <section class="card">
      <h2>Consultar stock</h2>
      <form [formGroup]="stockForm" (ngSubmit)="onQueryStock()" class="form-grid">
        <label>
          Producto
          <select formControlName="productId" required>
            <option value="" disabled>Selecciona un producto</option>
            <option *ngFor="let product of products()" [value]="product.id">{{ product.title }}</option>
          </select>
        </label>
        <button type="submit" [disabled]="stockForm.invalid || queryingStock()">Consultar</button>
      </form>

      <p *ngIf="queryingStock()" class="loading">Consultando stock…</p>
      <section *ngIf="stockError()" class="alert error">{{ stockError() }}</section>
      <dl *ngIf="stockInfo()" class="stock-summary">
        <div>
          <dt>Stock actual</dt>
          <dd>{{ stockInfo()!.stock }}</dd>
        </div>
        <div>
          <dt>Última actualización</dt>
          <dd>{{ stockInfo()!.updatedAt | date: 'short' }}</dd>
        </div>
      </dl>
    </section>

    <section class="card">
      <h2>Ajustar stock</h2>
      <form [formGroup]="adjustmentForm" (ngSubmit)="onSubmitAdjustment()" class="form-grid">
        <label>
          Producto
          <select formControlName="productId" required>
            <option value="" disabled>Selecciona un producto</option>
            <option *ngFor="let product of products()" [value]="product.id">{{ product.title }}</option>
          </select>
        </label>

        <label>
          Cambio
          <input type="number" formControlName="change" placeholder="Ej. 5 o -2" />
        </label>

        <label>
          Motivo
          <input type="text" formControlName="reason" placeholder="Opcional" />
        </label>

        <button type="submit" [disabled]="adjustmentForm.invalid || submittingAdjustment()">Registrar ajuste</button>
      </form>

      <p *ngIf="submittingAdjustment()" class="loading">Registrando ajuste…</p>
      <section *ngIf="adjustmentMessage()" class="alert success">{{ adjustmentMessage() }}</section>
      <section *ngIf="adjustmentError()" class="alert error">{{ adjustmentError() }}</section>

      <dl *ngIf="lastAdjustment()" class="stock-summary">
        <div>
          <dt>Último cambio</dt>
          <dd>{{ lastAdjustment()!.change }}</dd>
        </div>
        <div>
          <dt>Registrado</dt>
          <dd>{{ lastAdjustment()!.createdAt | date: 'short' }}</dd>
        </div>
        <div>
          <dt>Por</dt>
          <dd>{{ lastAdjustment()!.createdBy }}</dd>
        </div>
      </dl>
    </section>
  `
})
export class AdminInventoryComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inventoryApi = inject(InventoryApi);
  private readonly productsApi = inject(ProductsApi);

  readonly stockForm = this.fb.nonNullable.group({
    productId: ['', Validators.required]
  });

  readonly adjustmentForm = this.fb.nonNullable.group({
    productId: ['', Validators.required],
    change: [0, [Validators.required]],
    reason: ['']
  });

  private readonly productsSignal = signal<ProductViewDTO[]>([]);
  readonly products = computed(() => this.productsSignal());

  private readonly stockInfoSignal = signal<ProductStockResponse | null>(null);
  readonly stockInfo = computed(() => this.stockInfoSignal());

  private readonly queryingStockSignal = signal(false);
  readonly queryingStock = computed(() => this.queryingStockSignal());

  private readonly stockErrorSignal = signal<string | null>(null);
  readonly stockError = computed(() => this.stockErrorSignal());

  private readonly submittingAdjustmentSignal = signal(false);
  readonly submittingAdjustment = computed(() => this.submittingAdjustmentSignal());

  private readonly adjustmentMessageSignal = signal<string | null>(null);
  readonly adjustmentMessage = computed(() => this.adjustmentMessageSignal());

  private readonly adjustmentErrorSignal = signal<string | null>(null);
  readonly adjustmentError = computed(() => this.adjustmentErrorSignal());

  private readonly lastAdjustmentSignal = signal<InventoryAdjustmentResponse | null>(null);
  readonly lastAdjustment = computed(() => this.lastAdjustmentSignal());

  constructor() {
    this.loadProducts();
  }

  onQueryStock(): void {
    if (this.stockForm.invalid) return;
    const { productId } = this.stockForm.getRawValue();
    this.queryingStockSignal.set(true);
    this.stockErrorSignal.set(null);
    this.stockInfoSignal.set(null);
    this.inventoryApi
      .getProductStock(productId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.queryingStockSignal.set(false))
      )
      .subscribe({
        next: response => {
          this.stockInfoSignal.set(response);
        },
        error: () => {
          this.stockErrorSignal.set('No se pudo consultar el stock del producto.');
          this.stockInfoSignal.set(null);
        }
      });
  }

  onSubmitAdjustment(): void {
    if (this.adjustmentForm.invalid) return;
    const payload = this.prepareAdjustmentPayload();
    if (!Number.isFinite(payload.change) || payload.change === 0) {
      this.adjustmentErrorSignal.set('El cambio debe ser distinto de cero.');
      return;
    }
    this.submittingAdjustmentSignal.set(true);
    this.adjustmentErrorSignal.set(null);
    this.adjustmentMessageSignal.set(null);

    this.inventoryApi
      .adjust(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submittingAdjustmentSignal.set(false))
      )
      .subscribe({
        next: response => {
          this.lastAdjustmentSignal.set(response);
          this.adjustmentMessageSignal.set('Ajuste registrado correctamente.');
          const productId = this.adjustmentForm.controls.productId.value;
          if (productId) {
            this.inventoryApi
              .getProductStock(productId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: stock => this.stockInfoSignal.set(stock)
              });
          }
          this.adjustmentForm.patchValue({ change: 0, reason: '' });
        },
        error: () => {
          this.adjustmentErrorSignal.set('No se pudo registrar el ajuste.');
        }
      });
  }

  private loadProducts(): void {
    this.productsApi
      .list({ page: 1, pageSize: 100, sort: 'title,asc', active: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => this.productsSignal.set(response.items),
        error: () => this.productsSignal.set([])
      });
  }

  private prepareAdjustmentPayload(): InventoryAdjustmentRequest {
    const { productId, change, reason } = this.adjustmentForm.getRawValue();
    return {
      productId,
      change: Number(change),
      reason: reason?.trim() || undefined
    };
  }
}
