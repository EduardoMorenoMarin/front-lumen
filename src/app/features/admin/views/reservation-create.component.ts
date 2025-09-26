import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { CustomersApi } from '../../../core/api/customers.api';
import { ProductsApi } from '../../../core/api/products.api';
import { ReservationsApi } from '../../../core/api/reservations.api';
import { CustomerViewDTO } from '../../../core/models/customer';
import { ReservationCreateRequest } from '../../../core/models/reservation';
import { ToastService } from '../../../shared/services/toast.service';

interface ReservationItemDraft {
  id: string;
  productId: string;
  productTitle: string;
  unitPrice: number;
  quantity: number;
}

interface ProductOption {
  id: string;
  title: string;
  unitPrice: number;
}

@Component({
  selector: 'app-admin-reservation-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  styles: [
    `
      :host {
        display: block;
        padding: 2rem;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        text-decoration: none;
        color: #2563eb;
        font-weight: 600;
        margin-bottom: 1rem;
      }

      form {
        display: grid;
        gap: 1.5rem;
      }

      fieldset {
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        padding: 1.5rem;
      }

      legend {
        font-weight: 600;
        padding: 0 0.5rem;
      }

      label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.95rem;
      }

      input,
      select,
      textarea {
        padding: 0.6rem 0.75rem;
        border-radius: 0.375rem;
        border: 1px solid #d1d5db;
      }

      .inline {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .existing-customer {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .link-button {
        align-self: flex-start;
        background: transparent;
        border: none;
        color: #2563eb;
        cursor: pointer;
        font-weight: 600;
        padding: 0;
      }

      .link-button[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .helper {
        font-size: 0.85rem;
        color: #6b7280;
      }

      .items-table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 1rem;
      }

      .items-table th,
      .items-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e5e7eb;
        text-align: left;
      }

      .items-table button {
        background: transparent;
        border: none;
        color: #dc2626;
        cursor: pointer;
        font-weight: 600;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }

      .actions button {
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        background: #2563eb;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }

      .actions button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .error {
        color: #dc2626;
        font-size: 0.85rem;
      }

      .summary {
        display: flex;
        justify-content: flex-end;
        font-weight: 600;
        font-size: 1.1rem;
      }
    `
  ],
  template: `
    <a routerLink="/admin/reservations" class="back-link">← Volver</a>
    <h1>Nueva reserva</h1>

    <form [formGroup]="reservationForm" (ngSubmit)="submit()">
      <fieldset>
        <legend>Cliente</legend>
        <div class="existing-customer">
          <label>
            Cliente
            <select
              formControlName="customerId"
              [disabled]="customersLoading() && !customers().length"
            >
              <option value="">Selecciona un cliente</option>
              <option *ngFor="let customer of customers()" [value]="customer.id">
                {{ getCustomerLabel(customer) }}
              </option>
            </select>
            <span class="error" *ngIf="showError('customerId')">
              Selecciona un cliente válido.
            </span>
          </label>
          <p class="helper" *ngIf="customersLoading()">Cargando clientes…</p>
          <p class="helper" *ngIf="!customersLoading() && !customers().length && !customersError()">
            No hay clientes registrados.
          </p>
          <button
            type="button"
            class="link-button"
            (click)="refreshCustomers()"
            [disabled]="customersLoading()"
          >
            Actualizar lista
          </button>
          <p class="error" *ngIf="customersError()">{{ customersError() }}</p>
        </div>
      </fieldset>

      <fieldset [formGroup]="itemForm">
        <legend>Productos</legend>
        <div class="inline">
          <label>
            Producto
            <select
              formControlName="productId"
              [disabled]="productsLoading() && !productOptions().length"
            >
              <option value="" disabled>Seleccione un producto</option>
              <option *ngFor="let product of productOptions()" [value]="product.id">
                {{ product.title }} — {{ product.unitPrice | currency: 'USD' }}
              </option>
            </select>
            <span class="error" *ngIf="itemForm.controls.productId.touched && itemForm.controls.productId.invalid">
              Seleccione un producto.
            </span>
          </label>
          <label>
            Cantidad
            <input type="number" min="1" formControlName="quantity" />
            <span class="error" *ngIf="itemForm.controls.quantity.touched && itemForm.controls.quantity.invalid">
              Ingrese una cantidad válida.
            </span>
          </label>
        </div>
        <p class="helper" *ngIf="productsLoading()">Cargando productos…</p>
        <p class="error" *ngIf="productsError()">{{ productsError() }}</p>
        <p
          class="helper"
          *ngIf="!productsLoading() && !productOptions().length && !productsError()"
        >
          No hay productos disponibles.
        </p>
        <button
          type="button"
          class="link-button"
          (click)="refreshProducts()"
          [disabled]="productsLoading()"
        >
          Actualizar productos
        </button>
        <button type="button" (click)="addItem()">Agregar ítem</button>

        <table class="items-table" *ngIf="items().length">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of items()">
              <td>{{ item.productTitle }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice | currency: 'USD' }}</td>
              <td>{{ (item.unitPrice * item.quantity) | currency: 'USD' }}</td>
              <td><button type="button" (click)="removeItem(item.id)">Eliminar</button></td>
            </tr>
          </tbody>
        </table>
      </fieldset>

      <fieldset>
        <legend>Notas</legend>
        <label>
          Notas
          <textarea rows="3" formControlName="notes"></textarea>
        </label>
      </fieldset>

      <div class="summary">Total estimado: {{ totalAmount() | currency: 'USD' }}</div>

      <div class="actions">
        <button type="submit" [disabled]="submitting()">Crear reserva</button>
      </div>
    </form>
  `
})
export class AdminReservationCreateComponent {
  private readonly reservationsApi = inject(ReservationsApi);
  private readonly customersApi = inject(CustomersApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly submitting = signal(false);
  readonly items = signal<ReservationItemDraft[]>([]);
  readonly customers = signal<CustomerViewDTO[]>([]);
  readonly customersLoading = signal(false);
  readonly customersError = signal<string | null>(null);
  readonly productOptions = signal<ProductOption[]>([]);
  readonly productsLoading = signal(false);
  readonly productsError = signal<string | null>(null);

  readonly reservationForm = this.fb.nonNullable.group({
    customerMode: this.fb.nonNullable.control<'existing' | 'new'>('existing'),
    customerId: this.fb.control('', []),
    customerData: this.fb.group({
      firstName: ['', []],
      lastName: ['', []],
      dni: ['', []],
      email: ['', []],
      phone: ['', []]
    }),
    notes: ['']
  });

  readonly itemForm = this.fb.nonNullable.group({
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]]
  });

  readonly totalAmount = computed(() =>
    this.items().reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  );

  constructor() {
    this.loadCustomers();
    this.loadProducts();
  }

  addItem(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    const { productId, quantity } = this.itemForm.getRawValue();
    const product = this.productOptions().find((option) => option.id === productId);
    if (!product) {
      this.toast.error('Seleccione un producto válido.');
      return;
    }
    const draft: ReservationItemDraft = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      productId: product.id,
      productTitle: product.title,
      unitPrice: product.unitPrice,
      quantity: quantity ?? 1
    };
    this.items.update((items) => [...items, draft]);
    this.itemForm.reset({ productId: '', quantity: 1 });
  }

  removeItem(id: string): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  submit(): void {
    if (!this.items().length) {
      this.toast.error('Agregue al menos un producto a la reserva.');
      return;
    }

    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    const request = this.buildRequest();
    if (!request) {
      return;
    }

    this.submitting.set(true);
    this.reservationsApi
      .create(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false))
      )
      .subscribe({
        next: (reservation) => {
          this.toast.success('Reserva creada correctamente.');
          this.router.navigate(['/admin/reservations', reservation.id]);
        },
        error: (err) => {
          if (err?.status === 400) {
            console.error('Reserva - payload enviado', request);
          }
          this.toast.error('No fue posible crear la reserva.');
        }
      });
  }

  refreshCustomers(): void {
    this.loadCustomers();
  }

  refreshProducts(): void {
    this.loadProducts();
  }

  showError(controlPath: string): boolean {
    const control = this.getControl(controlPath);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private buildRequest(): ReservationCreateRequest | null {
    const { customerMode, customerId, customerData, notes } = this.reservationForm.getRawValue();

    const items = this.items().map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }));

    const trimmedNotes = notes?.trim();

    if (customerMode === 'existing') {
      const trimmedId = customerId?.trim();
      if (!trimmedId) {
        this.toast.error('Selecciona un cliente válido.');
        return null;
      }

      const customer = this.customers().find((option) => option.id === trimmedId);
      if (!customer) {
        this.toast.error('Selecciona un cliente válido.');
        return null;
      }

      const sanitizedPhone = this.sanitizePhone(customer.phone ?? '');
      const phone = sanitizedPhone || customer.phone?.trim() || '';
      if (!phone) {
        this.toast.error('El cliente seleccionado no tiene teléfono configurado.');
        return null;
      }

      return {
        customerId: trimmedId,
        customerData: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          dni: customer.dni,
          email: customer.email,
          phone
        },
        items,
        pickupDeadline: this.buildPickupDeadline(),
        notes: trimmedNotes ? trimmedNotes : undefined
      };
    }

    const firstName = customerData?.firstName?.trim() ?? '';
    const lastName = customerData?.lastName?.trim() ?? '';
    const dni = customerData?.dni?.trim() ?? '';
    const email = customerData?.email?.trim() ?? '';
    const sanitizedPhone = this.sanitizePhone(customerData?.phone ?? '');
    const phone = sanitizedPhone || customerData?.phone?.trim() || '';

    if (!firstName || !lastName || !phone) {
      this.toast.error('Completa los datos del nuevo cliente.');
      return null;
    }

    return {
      customerData: {
        firstName,
        lastName,
        dni,
        email,
        phone
      },
      items,
      pickupDeadline: this.buildPickupDeadline(),
      notes: trimmedNotes ? trimmedNotes : undefined
    };
  }

  private sanitizePhone(value: string): string {
    return value.replace(/[^+\d]/g, '');
  }

  private getControl(path: string) {
    return this.reservationForm.get(path);
  }

  private buildPickupDeadline(): string {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    return deadline.toISOString();
  }

  private loadCustomers(): void {
    this.customersLoading.set(true);
    this.customersError.set(null);
    this.customersApi
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.customersLoading.set(false))
      )
      .subscribe({
        next: (customers) => {
          this.customers.set(customers);
          const selectedId = this.reservationForm.controls.customerId.value;
          if (selectedId && !customers.some((customer) => customer.id === selectedId)) {
            this.reservationForm.controls.customerId.setValue('', { emitEvent: false });
          }
        },
        error: () => {
          this.customersError.set('No se pudieron cargar los clientes.');
          this.toast.error('No se pudieron cargar los clientes.');
        }
      });
  }

  private loadProducts(): void {
    this.productsLoading.set(true);
    this.productsError.set(null);
    this.productsApi
      .list({ page: 1, pageSize: 100, active: true })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.productsLoading.set(false))
      )
      .subscribe({
        next: (page) => {
          const options = (page.items ?? []).map((product) => ({
            id: product.id,
            title: product.title,
            unitPrice: product.price
          }));
          this.productOptions.set(options);
          const selectedProductId = this.itemForm.controls.productId.value;
          if (selectedProductId && !options.some((option) => option.id === selectedProductId)) {
            this.itemForm.controls.productId.setValue('', { emitEvent: false });
          }
        },
        error: () => {
          this.productsError.set('No se pudieron cargar los productos.');
          this.toast.error('No se pudieron cargar los productos.');
        }
      });
  }

  getCustomerLabel(customer: CustomerViewDTO): string {
    const fullName = `${customer.firstName} ${customer.lastName}`.trim();
    return customer.dni ? `${fullName} (${customer.dni})` : fullName;
  }
}
