import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SalesApi } from '../../../core/api/sales.api';
import { ProductsApi } from '../../../core/api/products.api';
import { SaleCreateDTO, SaleViewDTO } from '../../../core/models/sale';
import { ProductViewDTO } from '../../../core/models/product';

function createSaleItemGroup(fb: FormBuilder) {
  return fb.nonNullable.group({
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]]
  });
}

type SaleItemFormGroup = ReturnType<typeof createSaleItemGroup>;

@Component({
  selector: 'app-admin-sales-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DatePipe],
  template: `
    <section class="page-header">
      <h1>Ventas</h1>
    </section>

    <section class="card">
      <h2>Crear venta</h2>
      <form [formGroup]="saleForm" (ngSubmit)="onCreateSale()" class="form-grid">
        <label>
          Cliente (UUID v4)
          <input type="text" formControlName="customerId" placeholder="ID del cliente" />
        </label>

        <label>
          Método de pago
          <input type="text" formControlName="paymentMethod" placeholder="Método de pago" />
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

            <button type="button" class="link" (click)="removeItem(i)" *ngIf="saleItems.length > 1">Eliminar</button>
          </article>
        </div>

        <div class="form-actions full-width">
          <button type="button" (click)="addItem()">Agregar ítem</button>
          <button type="submit" [disabled]="saleForm.invalid || creatingSale">{{ creatingSale ? 'Creando…' : 'Crear venta' }}</button>
        </div>
      </form>

      <section *ngIf="createError" class="alert error">{{ createError }}</section>
    </section>

    <section class="card">
      <h2>Consultar venta</h2>
      <form [formGroup]="findForm" (ngSubmit)="onFindSale()" class="form-grid">
        <label class="full-width">
          ID de la venta
          <input type="text" formControlName="saleId" placeholder="Ingresa el ID de la venta" />
        </label>
        <button type="submit" [disabled]="findForm.invalid || loadingSale">Buscar</button>
      </form>

      <section *ngIf="findError" class="alert error">{{ findError }}</section>
      <p *ngIf="loadingSale" class="loading">Buscando venta…</p>

      <article *ngIf="!loadingSale && saleResult" class="card sale-preview">
        <header>
          <h3>Venta #{{ saleResult.id }}</h3>
          <p>Registrada el {{ saleResult.saleDate | date: 'medium' }}</p>
        </header>

        <dl class="sale-summary">
          <div>
            <dt>Cliente</dt>
            <dd>{{ saleResult.customerFirstName }} {{ saleResult.customerLastName }}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{{ saleResult.totalAmount | number: '1.2-2' }}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{{ saleResult.status }}</dd>
          </div>
        </dl>

        <a [routerLink]="['/admin/sales', saleResult.id]">Ver detalle completo</a>
      </article>

      <p *ngIf="!loadingSale && !saleResult && !findError" class="empty-state">
        Ingresa un ID de venta para consultar la información.
      </p>
    </section>
  `
})
export class AdminSalesListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly salesApi = inject(SalesApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly router = inject(Router);

  readonly saleForm = this.fb.nonNullable.group({
    customerId: ['', [Validators.required, Validators.pattern(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)]],
    paymentMethod: ['', Validators.required],
    items: this.fb.array<SaleItemFormGroup>([createSaleItemGroup(this.fb)])
  });

  readonly findForm = this.fb.nonNullable.group({
    saleId: ['', Validators.required]
  });

  products: ProductViewDTO[] = [];
  saleResult: SaleViewDTO | null = null;
  loadingSale = false;
  creatingSale = false;
  findError: string | null = null;
  createError: string | null = null;

  constructor() {
    this.loadProducts();
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

  onFindSale(): void {
    if (this.findForm.invalid) {
      this.findForm.markAllAsTouched();
      return;
    }

    const saleId = this.findForm.controls.saleId.value.trim();
    if (!saleId) {
      this.findError = 'Ingresa un identificador de venta válido.';
      this.saleResult = null;
      return;
    }

    this.loadSaleById(saleId);
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
          this.resetSaleForm();
          this.router.navigate(['/admin/sales', sale.id]);
        },
        error: error => {
          if (error.status === 400 && error.error?.message) {
            this.createError = error.error.message;
            return;
          }
          this.createError = 'No se pudo crear la venta.';
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
    const items = this.saleItems.controls.map(control => {
      const value = control.getRawValue();
      return {
        productId: value.productId,
        quantity: Number(value.quantity),
        unitPrice: Number(value.unitPrice)
      };
    });

    return {
      customerId: this.saleForm.controls.customerId.value.trim(),
      paymentMethod: this.saleForm.controls.paymentMethod.value.trim(),
      items: items.filter(item => !!item.productId)
    };
  }

  private resetSaleForm(): void {
    this.saleForm.reset({ customerId: '', paymentMethod: '' });
    while (this.saleItems.length) {
      this.saleItems.removeAt(0);
    }
    this.saleItems.push(createSaleItemGroup(this.fb));
  }

  private loadSaleById(id: string): void {
    this.loadingSale = true;
    this.findError = null;
    this.saleResult = null;

    this.salesApi
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingSale = false;
        })
      )
      .subscribe({
        next: sale => {
          this.saleResult = sale;
        },
        error: error => {
          if (error.status === 400 && error.error?.message) {
            this.findError = error.error.message;
            return;
          }
          this.findError = 'No se pudo encontrar la venta solicitada.';
        }
      });
  }
}
