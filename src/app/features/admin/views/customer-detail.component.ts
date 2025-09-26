import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomersApi } from '../../../core/api/customers.api';
import {
  CustomerCreateDTO,
  CustomerPatchDTO,
  CustomerPutDTO,
  CustomerViewDTO
} from '../../../core/models/customer';

const TIMEOUT_MS = 10000;

@Component({
  selector: 'app-admin-customer-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <a routerLink="/admin/customers">&larr; Back to customers</a>

    <h1 *ngIf="isCreate">New customer</h1>
    <h1 *ngIf="!isCreate">Customer</h1>

    <section *ngIf="loading" class="loading">Loading…</section>

    <section *ngIf="error" class="alert error">
      {{ error }}
      <button type="button" *ngIf="!isCreate" (click)="reload()">Retry</button>
    </section>

    <section *ngIf="message()" class="alert success">{{ message() }}</section>
    <section *ngIf="formError" class="alert error">{{ formError }}</section>
    <section *ngIf="notesError" class="alert error">{{ notesError }}</section>
    <section *ngIf="deleteError" class="alert error">{{ deleteError }}</section>

    <form
      *ngIf="showForm()"
      [formGroup]="form"
      (ngSubmit)="submit()"
      class="form-grid"
      novalidate
    >
      <label>
        First name
        <input type="text" formControlName="firstName" required />
        <span class="error" *ngIf="hasError('firstName', 'required')">Required field.</span>
        <span class="error" *ngIf="hasError('firstName', 'minlength')">Minimum 2 characters.</span>
      </label>

      <label>
        Last name
        <input type="text" formControlName="lastName" required />
        <span class="error" *ngIf="hasError('lastName', 'required')">Required field.</span>
        <span class="error" *ngIf="hasError('lastName', 'minlength')">Minimum 2 characters.</span>
      </label>

      <label>
        Email
        <input type="email" formControlName="email" />
        <span class="error" *ngIf="hasError('email', 'email')">Enter a valid email.</span>
      </label>

      <label>
        Phone
        <input type="tel" formControlName="phone" />
      </label>

      <label>
        DNI
        <input type="text" formControlName="dni" required maxlength="8" />
        <span class="error" *ngIf="hasError('dni', 'required')">Required field.</span>
        <span class="error" *ngIf="hasError('dni', 'pattern')">Must contain 8 digits.</span>
      </label>

      <label class="notes-field">
        Notes
        <textarea formControlName="notes" rows="4"></textarea>
      </label>

      <div class="form-actions">
        <button type="submit" [disabled]="form.invalid || saving">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
        <button type="button" (click)="cancelEdit()" [disabled]="saving">Cancel</button>
      </div>
    </form>

    <section *ngIf="!isCreate && !showForm() && customer" class="customer-detail">
      <dl>
        <div>
          <dt>Full name</dt>
          <dd>{{ customer.firstName }} {{ customer.lastName }}</dd>
        </div>
        <div>
          <dt>DNI</dt>
          <dd>{{ customer.dni }}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{{ customer.email || '—' }}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{{ customer.phone || '—' }}</dd>
        </div>
        <div>
          <dt>Notes</dt>
          <dd>{{ customer.notes || '—' }}</dd>
        </div>
        <div>
          <dt>Created at</dt>
          <dd>{{ customer.createdAt | date: 'medium' }}</dd>
        </div>
        <div>
          <dt>Updated at</dt>
          <dd>{{ customer.updatedAt | date: 'medium' }}</dd>
        </div>
      </dl>

      <div class="detail-actions">
        <button type="button" (click)="startEdit()">Edit</button>
        <button type="button" class="danger" (click)="confirmDelete()" [disabled]="deleting">
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>
      </div>
    </section>

    <section *ngIf="!isCreate && customer && !showForm()" class="notes-editor">
      <button *ngIf="!notesEditing" type="button" (click)="startNotesEdit()">Add note</button>

      <div *ngIf="notesEditing" class="notes-form">
        <label>
          Notes
          <textarea [formControl]="noteControl" rows="4"></textarea>
        </label>
        <div class="form-actions">
          <button type="button" (click)="saveNotes()" [disabled]="notesSaving">
            {{ notesSaving ? 'Saving…' : 'Save note' }}
          </button>
          <button type="button" (click)="cancelNotesEdit()" [disabled]="notesSaving">Cancel</button>
        </div>
      </div>
    </section>
  `
})
export class AdminCustomerDetailComponent {
  private readonly customersApi = inject(CustomersApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', Validators.email],
    phone: [''],
    dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
    notes: ['']
  });

  readonly noteControl: FormControl<string> = this.fb.nonNullable.control('');

  customer: CustomerViewDTO | null = null;
  loading = false;
  saving = false;
  deleting = false;
  notesSaving = false;
  notesEditing = false;
  error: string | null = null;
  formError: string | null = null;
  notesError: string | null = null;
  deleteError: string | null = null;
  private readonly messageSignal = signal<string | null>(null);

  readonly message = computed(() => this.messageSignal());

  private readonly customerId = this.route.snapshot.paramMap.get('id');
  readonly isCreate = !this.customerId || this.customerId === 'new';
  private readonly isEditRoute = (this.route.snapshot.routeConfig?.path ?? '').endsWith('/edit');
  private editing = this.isCreate || this.isEditRoute;

  constructor() {
    if (!this.isCreate && this.customerId) {
      this.loadCustomer(this.customerId);
    }
  }

  showForm(): boolean {
    return this.editing && !this.loading;
  }

  hasError(controlName: keyof typeof this.form.controls, errorName: string): boolean {
    const control = this.form.controls[controlName];
    return control.touched && control.hasError(errorName);
  }

  startEdit(): void {
    if (!this.customer) return;
    this.editing = true;
    this.notesEditing = false;
    this.messageSignal.set(null);
    this.form.setValue({
      firstName: this.customer.firstName,
      lastName: this.customer.lastName,
      email: this.customer.email ?? '',
      phone: this.customer.phone ?? '',
      dni: this.customer.dni,
      notes: this.customer.notes ?? ''
    });
    this.form.markAsPristine();
  }

  cancelEdit(): void {
    if (this.isCreate) {
      this.router.navigate(['/admin/customers']);
      return;
    }
    this.editing = false;
    this.formError = null;
    if (this.isEditRoute && this.customerId) {
      this.router.navigate(['/admin/customers', this.customerId]);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: CustomerCreateDTO = {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: this.normalizeEmail(raw.email),
      phone: this.normalizePhone(raw.phone),
      dni: raw.dni,
      notes: this.normalizeNotes(raw.notes)
    };

    this.saving = true;
    this.formError = null;
    this.messageSignal.set(null);

    if (this.isCreate) {
      this.customersApi
        .create(payload)
        .pipe(
          timeout({ each: TIMEOUT_MS }),
          takeUntilDestroyed(this.destroyRef),
          finalize(() => {
            this.saving = false;
          })
        )
        .subscribe({
          next: customer => {
            this.messageSignal.set('Customer created successfully.');
            this.router.navigate(['/admin/customers', customer.id]);
          },
          error: () => {
            this.formError = 'Unable to create the customer.';
          }
        });
      return;
    }

    if (!this.customerId) return;
    const replacePayload: CustomerPutDTO = payload;
    this.customersApi
      .replace(this.customerId, replacePayload)
      .pipe(
        timeout({ each: TIMEOUT_MS }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: customer => {
          this.customer = customer;
          if (this.isEditRoute && this.customerId) {
            this.router.navigate(['/admin/customers', customer.id]);
          } else {
            this.editing = false;
          }
          this.messageSignal.set('Customer updated successfully.');
        },
        error: () => {
          this.formError = 'Unable to update the customer.';
        }
      });
  }

  startNotesEdit(): void {
    if (!this.customer) return;
    this.notesEditing = true;
    this.notesError = null;
    this.messageSignal.set(null);
    this.noteControl.setValue(this.customer.notes ?? '');
  }

  cancelNotesEdit(): void {
    this.notesEditing = false;
    this.notesError = null;
    this.noteControl.setValue(this.customer?.notes ?? '');
  }

  saveNotes(): void {
    if (!this.customer || !this.customerId) return;
    const notes = this.normalizeNotes(this.noteControl.value);
    const payload: CustomerPatchDTO = { notes };
    this.notesSaving = true;
    this.notesError = null;
    this.messageSignal.set(null);

    this.customersApi
      .updatePartial(this.customerId, payload)
      .pipe(
        timeout({ each: TIMEOUT_MS }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.notesSaving = false;
        })
      )
      .subscribe({
        next: customer => {
          this.customer = customer;
          this.noteControl.setValue(customer.notes ?? '');
          this.notesEditing = false;
          this.messageSignal.set('Notes updated successfully.');
        },
        error: () => {
          this.notesError = 'Unable to update notes.';
        }
      });
  }

  confirmDelete(): void {
    if (!this.customerId) return;
    const confirmed = window.confirm('Delete this customer? This action cannot be undone.');
    if (!confirmed) return;
    this.deleteCustomer();
  }

  private deleteCustomer(): void {
    if (!this.customerId) return;
    this.deleting = true;
    this.deleteError = null;
    this.customersApi
      .delete(this.customerId)
      .pipe(
        timeout({ each: TIMEOUT_MS }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.deleting = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/admin/customers']);
        },
        error: () => {
          this.deleteError = 'Unable to delete the customer.';
        }
      });
  }

  reload(): void {
    if (this.customerId) {
      this.loadCustomer(this.customerId);
    }
  }

  private loadCustomer(id: string): void {
    this.loading = true;
    this.error = null;
    this.customersApi
      .getById(id)
      .pipe(
        timeout({ each: TIMEOUT_MS }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: customer => {
          this.customer = customer;
          this.form.setValue({
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email ?? '',
            phone: customer.phone ?? '',
            dni: customer.dni,
            notes: customer.notes ?? ''
          });
          this.editing = this.isEditRoute;
          this.notesEditing = false;
        },
        error: () => {
          this.error = 'Unable to load the customer.';
        }
      });
  }

  private normalizeEmail(value: string): string {
    return value ? value.trim().toLowerCase() : '';
  }

  private normalizePhone(value: string): string {
    if (!value) return '';
    return value.replace(/\s+/g, ' ').trim();
  }

  private normalizeNotes(value: string): string {
    return value ? value.trim() : '';
  }
}
