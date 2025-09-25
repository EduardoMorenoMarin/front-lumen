import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ReservationsApi } from '../../../core/api/reservations.api';
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
        <label>
          Modo de selección
          <select formControlName="customerMode">
            <option value="existing">Cliente existente (ID)</option>
            <option value="new">Cliente nuevo</option>
          </select>
        </label>

        <ng-container [ngSwitch]="reservationForm.controls.customerMode.value">
          <div *ngSwitchCase="'existing'" class="inline">
            <label>
              ID de cliente
              <input formControlName="customerId" placeholder="UUID v4" />
              <span class="error" *ngIf="showError('customerId')">
                Debe ingresar un UUID válido.
              </span>
            </label>
          </div>

          <div *ngSwitchCase="'new'" class="inline" formGroupName="customerData">
            <label>
              Nombre
              <input formControlName="firstName" />
              <span class="error" *ngIf="showError('customerData.firstName')">Ingrese el nombre.</span>
            </label>
            <label>
              Apellido
              <input formControlName="lastName" />
              <span class="error" *ngIf="showError('customerData.lastName')">Ingrese el apellido.</span>
            </label>
            <label>
              DNI
              <input formControlName="dni" placeholder="8 dígitos" />
              <span class="error" *ngIf="showError('customerData.dni')">Ingrese un DNI válido.</span>
            </label>
            <label>
              Email
              <input formControlName="email" type="email" />
              <span class="error" *ngIf="showError('customerData.email')">Ingrese un email válido.</span>
            </label>
            <label>
              Teléfono
              <input formControlName="phone" />
              <span class="error" *ngIf="showError('customerData.phone')">Ingrese un teléfono.</span>
            </label>
          </div>
        </ng-container>
      </fieldset>

      <fieldset [formGroup]="itemForm">
        <legend>Productos</legend>
        <div class="inline">
          <label>
            Producto
            <select formControlName="productId">
              <option value="" disabled>Seleccione un producto</option>
              <option *ngFor="let product of productCatalog" [value]="product.id">
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
        <legend>Programación</legend>
        <div class="inline">
          <label>
            Fecha límite de retiro
            <input type="datetime-local" formControlName="pickupDeadline" />
            <span class="error" *ngIf="showError('pickupDeadline')">Seleccione una fecha válida.</span>
          </label>
        </div>
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
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly submitting = signal(false);
  readonly items = signal<ReservationItemDraft[]>([]);

  readonly productCatalog: ProductOption[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Producto clásico',
      unitPrice: 49.99
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Producto premium',
      unitPrice: 89.99
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      title: 'Accesorio destacado',
      unitPrice: 19.99
    }
  ];

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
    pickupDeadline: ['', [Validators.required]],
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
    this.reservationForm.controls.customerMode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mode) => this.updateCustomerValidators(mode));
    this.updateCustomerValidators(this.reservationForm.controls.customerMode.value);
  }

  addItem(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    const { productId, quantity } = this.itemForm.getRawValue();
    const product = this.productCatalog.find((option) => option.id === productId);
    if (!product) {
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
        error: () => {
          this.toast.error('No fue posible crear la reserva.');
        }
      });
  }

  showError(controlPath: string): boolean {
    const control = this.getControl(controlPath);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private buildRequest(): ReservationCreateRequest | null {
    const { customerMode, customerId, customerData, pickupDeadline, notes } =
      this.reservationForm.getRawValue();

    const pickupDeadlineIso = pickupDeadline ? new Date(pickupDeadline).toISOString() : '';
    if (!pickupDeadlineIso) {
      this.toast.error('Seleccione una fecha de retiro válida.');
      return null;
    }
    const payload: ReservationCreateRequest = {
      items: this.items().map((item) => ({ productId: item.productId, quantity: item.quantity })),
      pickupDeadline: pickupDeadlineIso,
      notes: notes?.trim() ? notes.trim() : undefined
    };

    if (customerMode === 'existing') {
      if (!customerId?.trim()) {
        this.toast.error('Debe indicar el ID de cliente.');
        return null;
      }
      payload.customerId = customerId.trim();
    } else {
      if (!customerData) {
        return null;
      }
      payload.customerData = {
        firstName: customerData.firstName!.trim(),
        lastName: customerData.lastName!.trim(),
        dni: customerData.dni!.trim(),
        email: customerData.email!.trim(),
        phone: this.sanitizePhone(customerData.phone ?? '')
      };
    }

    return payload;
  }

  private updateCustomerValidators(mode: 'existing' | 'new'): void {
    const customerIdControl = this.reservationForm.controls.customerId;
    const customerDataGroup = this.reservationForm.controls.customerData;

    if (mode === 'existing') {
      customerIdControl.setValidators([
        Validators.required,
        Validators.pattern(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/)
      ]);
      Object.values(customerDataGroup.controls).forEach((control) => {
        control.clearValidators();
        control.updateValueAndValidity({ emitEvent: false });
      });
    } else {
      customerIdControl.clearValidators();
      customerIdControl.updateValueAndValidity({ emitEvent: false });
      customerDataGroup.controls.firstName.setValidators([Validators.required]);
      customerDataGroup.controls.lastName.setValidators([Validators.required]);
      customerDataGroup.controls.dni.setValidators([
        Validators.required,
        Validators.pattern(/^\d{8}$/)
      ]);
      customerDataGroup.controls.email.setValidators([Validators.required, Validators.email]);
      customerDataGroup.controls.phone.setValidators([Validators.required]);
      Object.values(customerDataGroup.controls).forEach((control) =>
        control.updateValueAndValidity({ emitEvent: false })
      );
    }
    customerIdControl.updateValueAndValidity({ emitEvent: false });
  }

  private sanitizePhone(value: string): string {
    return value.replace(/[^+\d]/g, '');
  }

  private getControl(path: string) {
    return this.reservationForm.get(path);
  }
}
