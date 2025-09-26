import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { PublicProductsApi, PublicReservationsApi } from '../../../core/api';
import { PublicProductView, PublicReservationCreateRequest } from '../../../core/models';

@Component({
  selector: 'app-reserve',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="d-flex flex-column gap-4">
      <header class="bg-white shadow-sm rounded-4 p-4 border">
        <h1 class="h3 mb-2">Reserva con LIBRERIA LUMEN</h1>
        <p class="text-muted mb-0">
          Completa tus datos y selecciona un producto para enviar la solicitud a
          <code>POST /public/reservations</code>.
        </p>
      </header>

      <div class="row g-4">
        <div class="col-12 col-xl-8">
          <form class="card shadow-sm border-0" [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <div class="card-body p-4">
              <div class="alert alert-success" role="status" *ngIf="successMessage()">
                {{ successMessage() }}
              </div>

              <fieldset class="border-0 p-0" [disabled]="loading()">
                <div class="row g-4">
                  <div class="col-12">
                    <h2 class="h5 text-primary mb-0">Datos de contacto</h2>
                  </div>

                  <div class="col-md-6">
                    <label for="firstName" class="form-label">Nombre</label>
                    <input
                      id="firstName"
                      type="text"
                      class="form-control"
                      formControlName="firstName"
                      required
                      autocomplete="given-name"
                      [class.is-invalid]="hasError('firstName', 'required')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('firstName', 'required')">
                      El nombre es obligatorio.
                    </div>
                  </div>

                  <div class="col-md-6">
                    <label for="lastName" class="form-label">Apellido</label>
                    <input
                      id="lastName"
                      type="text"
                      class="form-control"
                      formControlName="lastName"
                      required
                      autocomplete="family-name"
                      [class.is-invalid]="hasError('lastName', 'required')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('lastName', 'required')">
                      El apellido es obligatorio.
                    </div>
                  </div>

                  <div class="col-md-4">
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

                  <div class="col-md-4">
                    <label for="email" class="form-label">Correo electrónico</label>
                    <input
                      id="email"
                      type="email"
                      class="form-control"
                      formControlName="email"
                      required
                      autocomplete="email"
                      [class.is-invalid]="hasError('email', 'required') || hasError('email', 'email')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('email', 'required')">
                      El correo es obligatorio.
                    </div>
                    <div class="invalid-feedback" *ngIf="hasError('email', 'email')">
                      Ingresa un correo válido.
                    </div>
                  </div>

                  <div class="col-md-4">
                    <label for="phone" class="form-label">Teléfono</label>
                    <input
                      id="phone"
                      type="tel"
                      class="form-control"
                      formControlName="phone"
                      required
                      autocomplete="tel"
                      [class.is-invalid]="hasError('phone', 'required')"
                    />
                    <div class="invalid-feedback" *ngIf="hasError('phone', 'required')">
                      El teléfono es obligatorio.
                    </div>
                  </div>
                </div>

                <hr class="text-secondary-subtle my-4" />

                <div class="row g-4">
                  <div class="col-12">
                    <h2 class="h5 text-primary mb-0">Detalle de la reserva</h2>
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
                        {{ product.title || product.name || 'Sin título' }}
                      </option>
                    </select>
                    <div class="invalid-feedback" *ngIf="hasError('productId', 'required')">
                      Debes seleccionar un producto.
                    </div>
                  </div>

                  <div class="col-md-3">
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

                  <div class="col-md-3">
                    <label for="pickupDeadline" class="form-label">Fecha y hora límite</label>
                    <input
                      id="pickupDeadline"
                      type="datetime-local"
                      class="form-control"
                      formControlName="pickupDeadline"
                      required
                      [min]="pickupDeadlineMinValue"
                      [class.is-invalid]="
                        hasError('pickupDeadline', 'required') || hasError('pickupDeadline', 'futureDateTime')
                      "
                    />
                    <div class="invalid-feedback" *ngIf="hasError('pickupDeadline', 'required')">
                      La fecha límite es obligatoria.
                    </div>
                    <div class="invalid-feedback" *ngIf="hasError('pickupDeadline', 'futureDateTime')">
                      Selecciona una fecha y hora a partir del momento actual.
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
              </fieldset>

              <div class="d-flex justify-content-end mt-4">
                <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
                  <ng-container *ngIf="!loading(); else loadingTpl">Generar reserva</ng-container>
                </button>
              </div>
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

        <div class="col-12 col-xl-4">
          <div class="card shadow-sm border-0 h-100">
            <div class="card-body d-flex flex-column gap-3">
              <h2 class="h5 mb-0">Detalles del endpoint</h2>
              <p class="text-muted mb-0">
                La solicitud se envía a <code>POST /public/reservations</code> con los siguientes campos:
              </p>
              <ul class="list-unstyled small mb-0">
                <li><strong>firstName</strong>: Nombre del solicitante.</li>
                <li><strong>lastName</strong>: Apellido del solicitante.</li>
                <li><strong>dni</strong>: Documento de identidad.</li>
                <li><strong>email</strong>: Correo de contacto.</li>
                <li><strong>phone</strong>: Teléfono de contacto.</li>
                <li><strong>items[0].productId</strong>: Producto a reservar.</li>
                <li><strong>items[0].quantity</strong>: Cantidad solicitada.</li>
                <li><strong>pickupDeadline</strong>: Fecha y hora límite de recojo.</li>
                <li><strong>notes</strong>: Observaciones adicionales (opcional).</li>
              </ul>
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

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    productId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    pickupDeadline: ['', [Validators.required, this.futureDateTimeValidator()]],
    notes: ['']
  });

  readonly loading = signal(false);
  readonly error = signal('');
  readonly products = signal<PublicProductView[]>([]);
  readonly successMessage = signal('');

  readonly pickupDeadlineMinValue = this.toInputLocalValue(new Date());

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
      firstName: raw.firstName,
      lastName: raw.lastName,
      dni: raw.dni,
      email: raw.email,
      phone: raw.phone,
      items: [
        {
          productId: raw.productId,
          quantity: raw.quantity
        }
      ],
      pickupDeadline: this.toIsoString(raw.pickupDeadline),
      ...(raw.notes ? { notes: raw.notes } : {})
    };

    this.loading.set(true);
    this.error.set('');
    this.successMessage.set('');

    this.publicReservationsApi
      .create(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Reserva enviada correctamente. Te contactaremos con la confirmación.');
          this.form.reset({
            firstName: '',
            lastName: '',
            dni: '',
            email: '',
            phone: '',
            productId: '',
            quantity: 1,
            pickupDeadline: '',
            notes: ''
          });
        },
        error: () => {
          this.successMessage.set('');
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
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.products.set(response);
        },
        error: () => {
          this.error.set('No se pudieron cargar los productos.');
        }
      });
  }

  private futureDateTimeValidator(): ValidatorFn {
    return (control: AbstractControl): Record<string, boolean> | null => {
      if (!control.value) {
        return null;
      }

      const selected = new Date(control.value);
      if (Number.isNaN(selected.getTime())) {
        return { futureDateTime: true };
      }

      const now = new Date();
      if (selected < now) {
        return { futureDateTime: true };
      }

      return null;
    };
  }

  private toIsoString(value: string): string {
    return new Date(value).toISOString();
  }

  private toInputLocalValue(date: Date): string {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }
}
