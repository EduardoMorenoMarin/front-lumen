import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { catchError, finalize, map, of, switchMap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomersApi } from '../../../core/api/customers.api';
import { CustomerCreateDTO, CustomerUpdateDTO, CustomerViewDTO } from '../../../core/models/customer';

@Component({
  selector: 'app-admin-customer-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <a routerLink="/admin/customers">&larr; Volver</a>

    <h1>{{ isEdit ? 'Editar cliente' : 'Nuevo cliente' }}</h1>

    <section *ngIf="loading" class="loading">Cargando…</section>
    <section *ngIf="error" class="alert error">{{ error }}</section>
    <section *ngIf="message" class="alert success">{{ message }}</section>

    <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
      <label>
        Nombres
        <input type="text" formControlName="firstName" required />
        <span class="error" *ngIf="form.controls.firstName.invalid && form.controls.firstName.touched">
          Campo obligatorio.
        </span>
      </label>

      <label>
        Apellidos
        <input type="text" formControlName="lastName" required />
        <span class="error" *ngIf="form.controls.lastName.invalid && form.controls.lastName.touched">
          Campo obligatorio.
        </span>
      </label>

      <label>
        Email
        <input type="email" formControlName="email" />
        <span class="error" *ngIf="form.controls.email.invalid && form.controls.email.touched">
          Ingrese un correo válido.
        </span>
      </label>

      <label>
        Teléfono
        <input type="tel" formControlName="phone" />
      </label>

      <label>
        DNI
        <input type="text" formControlName="dni" required maxlength="8" />
        <span class="error" *ngIf="form.controls.dni.hasError('required') && form.controls.dni.touched">
          Campo obligatorio.
        </span>
        <span class="error" *ngIf="form.controls.dni.hasError('pattern') && form.controls.dni.touched">
          Debe tener 8 dígitos numéricos.
        </span>
        <span class="error" *ngIf="form.controls.dni.hasError('dniTaken') && form.controls.dni.touched">
          Ya existe un cliente con este DNI.
        </span>
      </label>

      <div class="form-actions">
        <button type="submit" [disabled]="form.invalid || saving">
          {{ saving ? 'Guardando…' : 'Guardar' }}
        </button>
        <button type="button" (click)="resetForm()" [disabled]="saving">Restablecer</button>
      </div>
    </form>
  `
})
export class AdminCustomerDetailComponent {
  private readonly customersApi = inject(CustomersApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', Validators.email],
    phone: [''],
    dni: [
      '',
      [Validators.required, Validators.pattern(/^\d{8}$/)],
      [this.dniUniqueValidator()]
    ]
  });

  customerId: string | null = null;
  isEdit = false;
  loading = false;
  saving = false;
  message: string | null = null;
  error: string | null = null;

  constructor() {
    this.customerId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.customerId && this.customerId !== 'new';
    if (this.isEdit && this.customerId) {
      this.loadCustomer(this.customerId);
    }
  }

  private loadCustomer(id: string): void {
    this.loading = true;
    this.customersApi
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: customer => this.populateForm(customer),
        error: () => {
          this.error = 'No se pudo cargar el cliente.';
        }
      });
  }

  private populateForm(customer: CustomerViewDTO): void {
    this.form.setValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      dni: customer.dni
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.message = null;
    this.error = null;
    const rawValue = this.form.getRawValue();
    const payload: CustomerCreateDTO = {
      firstName: rawValue.firstName.trim(),
      lastName: rawValue.lastName.trim(),
      email: rawValue.email?.trim() || undefined,
      phone: rawValue.phone?.trim() || undefined,
      dni: rawValue.dni
    };

    const request$ = this.isEdit && this.customerId
      ? this.customersApi.update(this.customerId, payload as CustomerUpdateDTO)
      : this.customersApi.create(payload);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: customer => {
          this.message = 'Cliente guardado correctamente.';
          if (!this.isEdit && customer.id) {
            this.router.navigate(['/admin/customers', customer.id]);
          }
        },
        error: () => {
          this.error = 'No se pudo guardar el cliente.';
        }
      });
  }

  resetForm(): void {
    if (this.isEdit && this.customerId) {
      this.loadCustomer(this.customerId);
    } else {
      this.form.reset({ firstName: '', lastName: '', email: '', phone: '', dni: '' });
    }
  }

  private dniUniqueValidator(): AsyncValidatorFn {
    return (control: AbstractControl): ReturnType<AsyncValidatorFn> => {
      if (!control.value || control.value.length !== 8) {
        return of(null);
      }
      return timer(300).pipe(
        switchMap(() =>
          this.customersApi
            .list({ page: 1, pageSize: 1, dni: control.value })
            .pipe(map(response => response.items), catchError(() => of([] as CustomerViewDTO[])))
        ),
        map(customers => {
          if (!customers.length) {
            return null;
          }
          const found = customers[0];
          if (this.isEdit && this.customerId && found.id === this.customerId) {
            return null;
          }
          return { dniTaken: true } as ValidationErrors;
        })
      );
    };
  }
}
