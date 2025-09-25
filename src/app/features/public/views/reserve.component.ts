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
    <section class="d-flex flex-column gap-4">
      <header class="bg-white shadow-sm rounded-4 p-4 border">
        <h1 class="h3 mb-2">Reserva con DNI</h1>
        <p class="text-muted mb-0">
          Completa tus datos y selecciona un producto para apartarlo. Todos los campos son obligatorios
          salvo las observaciones.
        </p>
      </header>

      <div class="row g-4">
        <div class="col-12 col-lg-8">
          <form class="card shadow-sm border-0" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="card-body">
              <fieldset class="border-0 p-0" [disabled]="loading()">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label for="dni" class="form-label">DNI</label>
                    <input
                      id="dni"
                      type="text"
                      class="form-control"
                      formControlName="dni"
                      maxlength="8"
                      inputmode="numeric"
                      placeholder="12345678"
                      required
                      [class.is-invalid]="hasError('dni', 'required') || hasError('dni', 'pattern')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('dni', 'required')">
                      El DNI es obligatorio.
                    </div>
                    <div class="invalid-feedback" *ngIf="hasError('dni', 'pattern')">
                      Debe contener exactamente 8 dígitos.
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="name" class="form-label">Nombre completo</label>
                    <input
                      id="name"
                      type="text"
                      class="form-control"
                      formControlName="customerName"
                      required
                      [class.is-invalid]="hasError('customerName', 'required')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('customerName', 'required')">
                      El nombre es obligatorio.
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="email" class="form-label">Correo electrónico</label>
                    <input
                      id="email"
                      type="email"
                      class="form-control"
                      formControlName="customerEmail"
                      required
                      [class.is-invalid]="hasError('customerEmail', 'required') || hasError('customerEmail', 'email')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('customerEmail', 'required')">
                      El correo es obligatorio.
                    </div>
                    <div class="invalid-feedback" *ngIf="hasError('customerEmail', 'email')">
                      Ingresa un correo válido.
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="phone" class="form-label">Teléfono</label>
                    <input
                      id="phone"
                      type="tel"
                      class="form-control"
                      formControlName="customerPhone"
                      required
                      [class.is-invalid]="hasError('customerPhone', 'required')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('customerPhone', 'required')">
                      El teléfono es obligatorio.
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="product" class="form-label">Producto</label>
                    <select
                      id="product"
                      class="form-select"
                      formControlName="productId"
                      required
                      [class.is-invalid]="hasError('productId', 'required')"
                    >
                      <option value="" disabled>Selecciona un producto</option>
                      <option *ngFor="let product of products(); trackBy: trackByProduct" [value]="product.id">
                        {{ product.name }}
                        <ng-container *ngIf="product.availableStock !== undefined">
                          ({{ product.availableStock }} disponibles)
                        </ng-container>
                      </option>
                    </select>
                    <div class="invalid-feedback" *ngIf="hasError('productId', 'required')">
                      Debes seleccionar un producto.
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="quantity" class="form-label">Cantidad</label>
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      class="form-control"
                      formControlName="quantity"
                      required
                      [class.is-invalid]="hasError('quantity', 'required') || hasError('quantity', 'min')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('quantity', 'required')">
                      La cantidad es obligatoria.
                    </div>
                    <div class="invalid-feedback" *ngIf="hasError('quantity', 'min')">
                      Debe ser al menos 1 unidad.
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="pickup" class="form-label">Fecha límite de retiro</label>
                    <input
                      id="pickup"
                      type="date"
                      class="form-control"
                      formControlName="desiredPickupDate"
                      [min]="today"
                      [class.is-invalid]="hasError('desiredPickupDate', 'minDate')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('desiredPickupDate', 'minDate')">
                      Selecciona una fecha desde hoy en adelante.
                    </div>
                  </div>

                  <div class="col-12">
                    <label for="notes" class="form-label">Observaciones</label>
                    <textarea
                      id="notes"
                      class="form-control"
                      formControlName="notes"
                      rows="3"
                      placeholder="Instrucciones adicionales"
                    ></textarea>
                  </div>
                </div>

                <div class="d-flex justify-content-end mt-4">
                  <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
                    <ng-container *ngIf="!loading(); else loadingTpl">Reservar</ng-container>
                  </button>
                </div>
              </fieldset>
            </div>
          </form>

          <div
            class="alert alert-warning mt-3"
            role="alert"
            *ngIf="!error() && !loading() && products().length === 0"
          >
            No hay productos disponibles para reservar en este momento.
          </div>

          <div class="alert alert-danger mt-3" role="alert" *ngIf="error()">
            {{ error() }}
          </div>
        </div>

        <div class="col-12 col-lg-4">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-body d-flex flex-column gap-3">
              <h2 class="h5 mb-0">Resumen de tu reserva</h2>
              <p class="text-muted mb-0">
                Recibirás un correo con el código y la fecha límite una vez confirmada la reserva.
              </p>

              <div *ngIf="confirmation() as result; else pending">
                <div class="alert alert-success" role="status">
                  <h3 class="h6 fw-semibold">Reserva generada</h3>
                  <p class="mb-1"><strong>Código:</strong> {{ result.code }}</p>
                  <p class="mb-1"><strong>ID interno:</strong> {{ result.reservationId }}</p>
                  <p class="mb-0" *ngIf="result.expiresAt">
                    <strong>Vence:</strong> {{ result.expiresAt | date: 'longDate' }}
                  </p>
                </div>
              </div>

              <ng-template #pending>
                <p class="text-muted">Completa el formulario para generar el código de retiro.</p>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <ng-template #loadingTpl>
        <span class="d-inline-flex align-items-center gap-2">
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Procesando…
        </span>
      </ng-template>
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

  trackByProduct(_: number, product: PublicProductView): string {
    return product.id;
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
