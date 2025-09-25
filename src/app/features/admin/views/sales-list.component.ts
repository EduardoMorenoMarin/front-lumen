import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SalesApi } from '../../../core/api/sales.api';
import { ProductsApi } from '../../../core/api/products.api';
import { SaleCreateDTO, SaleDTO } from '../../../core/models/sale';
import { ProductViewDTO } from '../../../core/models/product';

function createSaleItemGroup(fb: FormBuilder) {
  return fb.nonNullable.group({
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]],
    currency: ['PEN', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]]
  });
}

type SaleItemFormGroup = ReturnType<typeof createSaleItemGroup>;

@Component({
  selector: 'app-admin-sales-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, CurrencyPipe, DatePipe],
  template: `
    <section class="page-header">
      <h1>Ventas</h1>
    </section>

    <section class="card">
      <h2>Crear venta</h2>
      <form [formGroup]="saleForm" (ngSubmit)="onCreateSale()" class="form-grid">
        <label class="full-width">
          ID de reserva (opcional)
          <input type="text" formControlName="reservationId" placeholder="Reserva relacionada" />
        </label>

        <div formArrayName="items" class="full-width item-list">
          <article *ngFor="let item of saleItems.controls; let i = index" [formGroupName]="i" class="item-row">
            <label>
              Producto
              <select formControlName="productId" required>
                <option value="" disabled>Selecciona un producto</option>
                <option *ngFor="let product of products" [value]="product.id">{{ product.title }}</option>
              </select>
            </label>

            <label>
              Cantidad
              <input type="number" formControlName="quantity" min="1" />
            </label>

            <label>
              Precio unitario
              <input type="number" step="0.01" formControlName="unitPrice" min="0" />
            </label>

            <label>
              Moneda
              <input type="text" maxlength="3" formControlName="currency" />
            </label>

            <button type="button" class="link" (click)="removeItem(i)" *ngIf="saleItems.length > 1">Eliminar</button>
          </article>
        </div>

        <div class="form-actions full-width">
          <button type="button" (click)="addItem()">Agregar ítem</button>
          <button type="submit" [disabled]="saleForm.invalid || creatingSale">{{ creatingSale ? 'Creando…' : 'Crear venta' }}</button>
        </div>
      </form>

      <section *ngIf="createMessage" class="alert success">{{ createMessage }}</section>
      <section *ngIf="createError" class="alert error">{{ createError }}</section>
    </section>

    <section class="card">
      <h2>Buscar ventas</h2>
      <form [formGroup]="filterForm" (ngSubmit)="onFilterSales()" class="form-grid">
        <label>
          Desde
          <input type="date" formControlName="start" />
        </label>
        <label>
          Hasta
          <input type="date" formControlName="end" />
        </label>
        <button type="submit" [disabled]="filterForm.invalid || loadingSales">Buscar</button>
      </form>

      <section *ngIf="listError" class="alert error">{{ listError }}</section>
      <p *ngIf="loadingSales" class="loading">Cargando ventas…</p>

      <table *ngIf="!loadingSales && sales.length" class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Reserva</th>
            <th>Total</th>
            <th>Creada</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let sale of sales">
            <td>{{ sale.id }}</td>
            <td>{{ sale.reservationId || '—' }}</td>
            <td>{{ sale.total | currency: sale.currency }}</td>
            <td>{{ sale.createdAt | date: 'short' }}</td>
            <td><a [routerLink]="['/admin/sales', sale.id]">Ver detalle</a></td>
          </tr>
        </tbody>
      </table>

      <p *ngIf="!loadingSales && !sales.length" class="empty-state">No se encontraron ventas para el rango indicado.</p>
    </section>
  `
})
export class AdminSalesListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly salesApi = inject(SalesApi);
  private readonly productsApi = inject(ProductsApi);

  readonly filterForm = this.fb.nonNullable.group({
    start: [this.formatDate(this.daysAgo(7)), Validators.required],
    end: [this.formatDate(new Date()), Validators.required]
  });

  readonly saleForm = this.fb.nonNullable.group({
    reservationId: [''],
    items: this.fb.array<SaleItemFormGroup>([createSaleItemGroup(this.fb)])
  });

  products: ProductViewDTO[] = [];
  sales: SaleDTO[] = [];
  loadingSales = false;
  creatingSale = false;
  listError: string | null = null;
  createMessage: string | null = null;
  createError: string | null = null;

  constructor() {
    this.loadProducts();
    this.loadSales();
  }

  get saleItems(): FormArray<SaleItemFormGroup> {
    return this.saleForm.controls.items;
  }

  addItem(): void {
    this.saleItems.push(createSaleItemGroup(this.fb));
  }

  removeItem(index: number): void {
    if (this.saleItems.length <= 1) return;
    this.saleItems.removeAt(index);
  }

  onFilterSales(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    this.loadSales();
  }

  onCreateSale(): void {
    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      return;
    }

    const payload = this.buildSalePayload();
    if (!payload.items.length) {
      this.createError = 'Agrega al menos un ítem a la venta.';
      return;
    }

    const hasInvalidItem = payload.items.some(
      item => !item.productId || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0
    );
    if (hasInvalidItem) {
      this.createError = 'Revisa los datos de los ítems antes de crear la venta.';
      return;
    }

    this.creatingSale = true;
    this.createError = null;
    this.createMessage = null;

    this.salesApi
      .create(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.creatingSale = false;
        })
      )
      .subscribe({
        next: sale => {
          this.createMessage = 'Venta creada correctamente.';
          this.resetSaleForm();
          this.loadSales();
        },
        error: () => {
          this.createError = 'No se pudo crear la venta.';
        }
      });
  }

  private loadSales(): void {
    const { start, end } = this.filterForm.getRawValue();
    if (!start || !end) {
      this.listError = 'Selecciona el rango de fechas a consultar.';
      this.sales = [];
      return;
    }

    if (new Date(start) > new Date(end)) {
      this.listError = 'La fecha inicial debe ser anterior o igual a la final.';
      this.sales = [];
      return;
    }

    this.loadingSales = true;
    this.listError = null;

    this.salesApi
      .listByDateRange(start, end)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingSales = false;
        })
      )
      .subscribe({
        next: sales => {
          this.sales = sales;
        },
        error: () => {
          this.listError = 'No se pudieron cargar las ventas.';
          this.sales = [];
        }
      });
  }

  private loadProducts(): void {
    this.productsApi
      .list({ page: 1, pageSize: 100, sort: 'title,asc', active: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => (this.products = response.items),
        error: () => (this.products = [])
      });
  }

  private buildSalePayload(): SaleCreateDTO {
    const { reservationId } = this.saleForm.getRawValue();
    const items = this.saleItems.controls.map(control => {
      const value = control.getRawValue();
      return {
        productId: value.productId,
        quantity: Number(value.quantity),
        unitPrice: Number(value.unitPrice),
        currency: value.currency.trim().toUpperCase()
      };
    });

    return {
      reservationId: reservationId?.trim() || undefined,
      items: items.filter(item => !!item.productId)
    };
  }

  private resetSaleForm(): void {
    this.saleForm.reset({ reservationId: '' });
    while (this.saleItems.length) {
      this.saleItems.removeAt(0);
    }
    this.saleItems.push(createSaleItemGroup(this.fb));
  }

  private daysAgo(days: number): Date {
    const today = new Date();
    today.setDate(today.getDate() - days);
    return today;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
