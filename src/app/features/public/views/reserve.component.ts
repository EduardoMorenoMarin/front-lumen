import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PublicProductsApi, PublicReservationsApi } from '../../../core/api';
import {
  PublicProductView,
  PublicReservationCreatedResponse,
  PublicReservationCreateRequest
} from '../../../core/models';

@Component({
  selector: 'app-reserve',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="reserve">
      <h1>Reserva con DNI</h1>

      <p class="reserve__intro">
        Completa tus datos y selecciona el producto para generar una reserva. Todos los campos son
        obligatorios salvo observaciones.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()" class="reserve__form" novalidate>
        <fieldset [disabled]="loading()">
          <div class="reserve__field">
            <label for="dni">DNI</label>
            <input
              id="dni"
              type="text"
              formControlName="dni"
              maxlength="8"
              inputmode="numeric"
              placeholder="12345678"
              required
            />
            <small class="error" *ngIf="hasError('dni', 'required')">El DNI es obligatorio.</small>
            <small class="error" *ngIf="hasError('dni', 'pattern')">Debe contener 8 dígitos.</small>
          </div>

          <div class="reserve__field">
            <label for="name">Nombre completo</label>
            <input id="name" type="text" formControlName="customerName" required />
            <small class="error" *ngIf="hasError('customerName', 'required')">
              El nombre es obligatorio.
            </small>
          </div>

          <div class="reserve__field">
            <label for="email">Correo electrónico</label>
            <input id="email" type="email" formControlName="customerEmail" required />
            <small class="error" *ngIf="hasError('customerEmail', 'required')">
              El correo es obligatorio.
            </small>
            <small class="error" *ngIf="hasError('customerEmail', 'email')">
              Ingresa un correo válido.
            </small>
          </div>

          <div class="reserve__field">
            <label for="phone">Teléfono</label>
            <input id="phone" type="tel" formControlName="customerPhone" required />
            <small class="error" *ngIf="hasError('customerPhone', 'required')">
              El teléfono es obligatorio.
            </small>
          </div>

          <div class="reserve__field">
            <label for="product">Producto</label>
            <select id="product" formControlName="productId" required>
              <option value="" disabled>Selecciona un producto</option>
              <option *ngFor="let product of products()" [value]="product.id">
                {{ product.name }}
              </option>
            </select>
            <small class="error" *ngIf="hasError('productId', 'required')">
              Debes seleccionar un producto.
            </small>
          </div>

          <div class="reserve__field">
            <label for="quantity">Cantidad</label>
            <input id="quantity" type="number" min="1" formControlName="quantity" required />
            <small class="error" *ngIf="hasError('quantity', 'required')">
              La cantidad es obligatoria.
            </small>
            <small class="error" *ngIf="hasError('quantity', 'min')">
              Debe ser al menos 1.
            </small>
          </div>

          <div class="reserve__field">
            <label for="pickup">Fecha de retiro</label>
            <input id="pickup" type="date" formControlName="desiredPickupDate" [min]="today" />
            <small class="error" *ngIf="hasError('desiredPickupDate', 'minDate')">
              La fecha debe ser desde hoy en adelante.
            </small>
          </div>

          <div class="reserve__field">
            <label for="notes">Observaciones</label>
            <textarea id="notes" formControlName="notes" rows="3"></textarea>
          </div>

          <button type="submit" [disabled]="form.invalid || loading()">Reservar</button>
        </fieldset>
      </form>

      <p class="reserve__status" *ngIf="error()">{{ error() }}</p>
      <p class="reserve__status" *ngIf="!error() && !loading() && products().length === 0">
        No hay productos disponibles para reserva en este momento.
      </p>

      <section class="reserve__confirmation" *ngIf="confirmation() as result">
        <h2>Reserva creada correctamente</h2>
        <p><strong>ID:</strong> {{ result.reservationId }}</p>
        <p><strong>Código:</strong> {{ result.code }}</p>
        <p *ngIf="result.expiresAt"><strong>Vence:</strong> {{ result.expiresAt | date }}</p>
      </section>
    </section>
  `
})
export class ReserveComponent {
  private readonly fb = inject(FormBuilder);
  private readonly publicReservationsApi = inject(PublicReservationsApi);
  private readonly publicProductsApi = inject(PublicProductsApi);

  readonly today = new Date().toISOString().split('T')[0];

  readonly form = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    customerName: ['', Validators.required],
    customerEmail: ['', [Validators.required, Validators.email]],
    customerPhone: ['', Validators.required],
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    desiredPickupDate: ['', this.minDateValidator()],
    notes: ['']
  });

  readonly loading = signal(false);
  readonly error = signal('');
  readonly products = signal<PublicProductView[]>([]);
  readonly confirmation = signal<PublicReservationCreatedResponse | null>(null);

  constructor() {
    this.fetchProducts();
  }

  hasError(controlName: keyof typeof this.form.controls, errorCode: string): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(errorCode);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const request: PublicReservationCreateRequest = {
      productId: raw.productId,
      quantity: raw.quantity,
      desiredPickupDate: raw.desiredPickupDate ? new Date(raw.desiredPickupDate).toISOString() : undefined,
      customerDocument: raw.dni,
      customerName: raw.customerName,
      customerEmail: raw.customerEmail,
      customerPhone: raw.customerPhone,
      notes: raw.notes || undefined
    };

    this.loading.set(true);
    this.error.set('');
    this.confirmation.set(null);

    this.publicReservationsApi
      .create(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.confirmation.set(response);
          this.form.reset({
            dni: '',
            customerName: '',
            customerEmail: '',
            customerPhone: '',
            productId: '',
            quantity: 1,
            desiredPickupDate: '',
            notes: ''
          });
        },
        error: () => {
          this.error.set('No se pudo crear la reserva. Intenta nuevamente.');
        }
      });
  }

  private fetchProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.publicProductsApi
      .list({ page: 1, pageSize: 50 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.products.set(response.items);
        },
        error: () => {
          this.error.set('No se pudieron cargar los productos.');
        }
      });
  }

  private minDateValidator(): ValidatorFn {
    return (control: AbstractControl): Record<string, boolean> | null => {
      if (!control.value) {
        return null;
      }

      const selected = new Date(control.value);
      const today = new Date(this.today);

      if (selected < today) {
        return { minDate: true };
      }

      return null;
    };
  }

}
