import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminCategoriesApi } from '../../../core/api/admin-categories.api';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-category-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  styles: [
    `
      :host {
        display: block;
        padding: 1.5rem;
      }

      a.back-link {
        color: #2563eb;
        display: inline-flex;
        gap: 0.25rem;
        text-decoration: none;
      }

      form {
        background: #fff;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        margin-top: 1.5rem;
        padding: 1.5rem;
        display: grid;
        gap: 1.25rem;
      }

      form h1 {
        margin: 0;
      }

      label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      input[type='text'],
      textarea,
      select {
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        padding: 0.625rem 0.75rem;
        font-size: 1rem;
      }

      textarea {
        min-height: 120px;
        resize: vertical;
      }

      .error-message {
        color: #b91c1c;
        font-size: 0.85rem;
      }

      .form-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      .form-actions button {
        border-radius: 0.5rem;
        border: none;
        cursor: pointer;
        font-weight: 600;
        padding: 0.5rem 1.25rem;
      }

      .form-actions button[type='submit'] {
        background: #2563eb;
        color: #fff;
      }

      .form-actions button[type='button'] {
        background: #f3f4f6;
        color: #111827;
      }

      .state {
        align-items: center;
        border: 1px solid #e5e7eb;
        border-radius: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        justify-content: center;
        margin-top: 1.5rem;
        min-height: 180px;
        padding: 1.5rem;
        text-align: center;
      }

      .state--error {
        border-color: #ef4444;
        color: #991b1b;
      }

      .spinner {
        animation: spin 0.8s linear infinite;
        border: 3px solid #e5e7eb;
        border-radius: 999px;
        border-top-color: #2563eb;
        height: 36px;
        width: 36px;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `
  ],
  template: `
    <a routerLink="/admin/categories" class="back-link">&larr; Volver al listado</a>

    <section *ngIf="loading" class="state" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <span>Cargando categoría…</span>
    </section>

    <section *ngIf="error" class="state state--error" aria-live="assertive">
      <p>{{ error }}</p>
      <button type="button" (click)="reload()">Reintentar</button>
    </section>

    <form *ngIf="!loading && !error" [formGroup]="form" (ngSubmit)="submit()">
      <h1>{{ isEdit ? 'Editar categoría' : 'Nueva categoría' }}</h1>

      <label>
        Nombre
        <input
          type="text"
          formControlName="name"
          placeholder="Ingresa el nombre"
          autocomplete="off"
          [attr.aria-invalid]="form.controls.name.invalid && form.controls.name.touched"
          required
        />
        <span class="error-message" *ngIf="form.controls.name.hasError('required') && form.controls.name.touched">
          El nombre es obligatorio.
        </span>
        <span class="error-message" *ngIf="form.controls.name.hasError('minlength') && form.controls.name.touched">
          Debe tener al menos 2 caracteres.
        </span>
      </label>

      <label>
        Descripción
        <textarea formControlName="description" placeholder="Descripción opcional"></textarea>
      </label>

      <label>
        Estado
        <select formControlName="active">
          <option [ngValue]="true">Activa</option>
          <option [ngValue]="false">Inactiva</option>
        </select>
      </label>

      <div class="form-actions">
        <button type="button" (click)="resetForm()" [disabled]="saving">Restablecer</button>
        <button type="submit" [disabled]="saving">{{ saving ? 'Guardando…' : 'Guardar' }}</button>
      </div>
    </form>
  `
})
export class AdminCategoryFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoriesApi = inject(AdminCategoriesApi);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    active: [true]
  });

  isEdit = false;
  loading = false;
  saving = false;
  error: string | null = null;

  private categoryId: string | null = null;
  private fetchController: AbortController | null = null;
  private saveController: AbortController | null = null;
  private fetchSubscription: Subscription | null = null;
  private saveSubscription: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.abortFetch();
      this.abortSave();
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.categoryId = id;
        this.loadCategory(id);
      } else {
        this.isEdit = false;
        this.categoryId = null;
        this.abortFetch();
        this.loading = false;
        this.error = null;
        this.form.reset({ name: '', description: '', active: true });
      }
    });
  }

  reload(): void {
    if (this.categoryId) {
      this.loadCategory(this.categoryId);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, description, active } = this.form.getRawValue();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      this.form.controls.name.setErrors({ minlength: true });
      this.form.controls.name.markAsTouched();
      return;
    }

    const trimmedDescription = description?.trim() ?? '';

    const payload = {
      name: trimmedName,
      description: trimmedDescription ? trimmedDescription : null,
      active: !!active
    };

    this.abortSave();
    const controller = new AbortController();
    this.saveController = controller;
    this.saving = true;

    const request$ = this.isEdit && this.categoryId
      ? this.categoriesApi.update(this.categoryId, payload)
      : this.categoriesApi.create(payload);

    this.saveSubscription = request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.saveController === controller) {
            this.saving = false;
            this.saveController = null;
            this.saveSubscription = null;
          }
        })
      )
      .subscribe({
        next: () => {
          this.toast.success(this.isEdit ? 'Categoría actualizada.' : 'Categoría creada.');
          this.router.navigate(['/admin/categories']);
        },
        error: err => {
          if (controller.signal.aborted) {
            return;
          }
          const message = err?.error?.message ?? 'No se pudo guardar la categoría.';
          this.toast.error(message);
        }
      });
  }

  resetForm(): void {
    if (this.isEdit && this.categoryId) {
      this.loadCategory(this.categoryId);
    } else {
      this.form.reset({ name: '', description: '', active: true });
    }
  }

  private loadCategory(id: string): void {
    this.abortFetch();
    const controller = new AbortController();
    this.fetchController = controller;
    this.loading = true;
    this.error = null;

    this.fetchSubscription = this.categoriesApi
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.fetchController === controller) {
            this.loading = false;
            this.fetchController = null;
            this.fetchSubscription = null;
          }
        })
      )
      .subscribe({
        next: category => {
          this.form.reset({
            name: category.name,
            description: category.description ?? '',
            active: category.active
          });
        },
        error: err => {
          if (controller.signal.aborted) {
            return;
          }
          const message = err?.error?.message ?? 'No se pudo cargar la categoría.';
          this.error = message;
        }
      });
  }

  private abortFetch(): void {
    if (this.fetchController) {
      this.fetchController.abort();
      this.fetchController = null;
    }
    if (this.fetchSubscription) {
      this.fetchSubscription.unsubscribe();
      this.fetchSubscription = null;
    }
  }

  private abortSave(): void {
    if (this.saveController) {
      this.saveController.abort();
      this.saveController = null;
    }
    if (this.saveSubscription) {
      this.saveSubscription.unsubscribe();
      this.saveSubscription = null;
    }
  }
}
