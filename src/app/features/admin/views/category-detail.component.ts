import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CategoriesApi } from '../../../core/api/categories.api';
import { CategoryCreateDTO, CategoryUpdateDTO, CategoryViewDTO } from '../../../core/models/category';
import { slugify } from '../../../core/utils/slugify';

@Component({
  selector: 'app-admin-category-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <a routerLink="/admin/categories">&larr; Volver</a>

    <h1>{{ isEdit ? 'Editar categoría' : 'Crear categoría' }}</h1>

    <section *ngIf="loading" class="loading">Cargando…</section>
    <section *ngIf="error" class="alert error">{{ error }}</section>
    <section *ngIf="message" class="alert success">{{ message }}</section>

    <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
      <label>
        Nombre
        <input type="text" formControlName="name" required />
        <span class="error" *ngIf="form.controls.name.invalid && form.controls.name.touched">
          El nombre es obligatorio.
        </span>
      </label>

      <label>
        Slug
        <input type="text" formControlName="slug" required />
        <span class="hint">Se generará automáticamente a partir del nombre si se deja vacío.</span>
      </label>

      <label class="full-width">
        Descripción
        <textarea formControlName="description" rows="4"></textarea>
      </label>

      <label>
        Activa
        <input type="checkbox" formControlName="isActive" />
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
export class AdminCategoryDetailComponent {
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
    description: [''],
    isActive: [true]
  });

  categoryId: string | null = null;
  isEdit = false;
  loading = false;
  saving = false;
  message: string | null = null;
  error: string | null = null;

  constructor() {
    this.categoryId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.categoryId && this.categoryId !== 'new';
    if (this.isEdit && this.categoryId) {
      this.loadCategory(this.categoryId);
    }
  }

  private loadCategory(id: string): void {
    this.loading = true;
    this.categoriesApi
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: category => this.populateForm(category),
        error: () => {
          this.error = 'No se pudo cargar la categoría.';
        }
      });
  }

  private populateForm(category: CategoryViewDTO): void {
    this.form.setValue({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      isActive: category.isActive
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
    const slug = rawValue.slug.trim() || slugify(rawValue.name);
    const payload: CategoryCreateDTO = {
      name: rawValue.name.trim(),
      slug,
      description: rawValue.description?.trim() || undefined,
      isActive: rawValue.isActive
    };

    const request$ = this.isEdit && this.categoryId
      ? this.categoriesApi.update(this.categoryId, payload as CategoryUpdateDTO)
      : this.categoriesApi.create(payload);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: category => {
          this.message = 'Categoría guardada correctamente.';
          if (!this.isEdit && category.id) {
            this.router.navigate(['/admin/categories', category.id]);
          }
        },
        error: () => {
          this.error = 'No se pudo guardar la categoría.';
        }
      });
  }

  resetForm(): void {
    if (this.isEdit && this.categoryId) {
      this.loadCategory(this.categoryId);
    } else {
      this.form.reset({ name: '', slug: '', description: '', isActive: true });
    }
  }
}
