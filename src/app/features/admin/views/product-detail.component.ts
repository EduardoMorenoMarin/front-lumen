import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductsApi } from '../../../core/api/products.api';
import { CategoriesApi } from '../../../core/api/categories.api';
import { ProductCreateDTO, ProductUpdateDTO, ProductViewDTO } from '../../../core/models/product';
import { CategoryViewDTO } from '../../../core/models/category';

@Component({
  selector: 'app-admin-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <a routerLink="/admin/products">&larr; Volver</a>

    <h1>{{ isEdit ? 'Editar producto' : 'Crear producto' }}</h1>

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
        Autor
        <input type="text" formControlName="author" placeholder="Apellido, Nombre" />
      </label>

      <label>
        SKU
        <input type="text" formControlName="sku" required />
        <span class="error" *ngIf="form.controls.sku.invalid && form.controls.sku.touched">
          El SKU es obligatorio.
        </span>
      </label>

      <label>
        Precio
        <input type="number" step="0.01" formControlName="price" required />
        <span class="error" *ngIf="form.controls.price.invalid && form.controls.price.touched">
          Ingrese un precio válido.
        </span>
      </label>

      <label>
        Moneda
        <input type="text" formControlName="currency" maxlength="3" required />
      </label>

      <label>
        Categoría
        <select formControlName="categoryId" required>
          <option value="" disabled>Seleccione una categoría</option>
          <option *ngFor="let category of categories" [value]="category.id">{{ category.name }}</option>
        </select>
        <span class="error" *ngIf="form.controls.categoryId.invalid && form.controls.categoryId.touched">
          Seleccione una categoría.
        </span>
      </label>

      <label class="full-width">
        Descripción
        <textarea formControlName="description" rows="4"></textarea>
      </label>

      <label>
        Activo
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
export class AdminProductDetailComponent {
  private readonly productsApi = inject(ProductsApi);
  private readonly categoriesApi = inject(CategoriesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    author: [''],
    description: [''],
    sku: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: ['PEN', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    categoryId: ['', Validators.required],
    isActive: [true]
  });

  categories: CategoryViewDTO[] = [];
  productId: string | null = null;
  isEdit = false;
  loading = false;
  saving = false;
  message: string | null = null;
  error: string | null = null;

  constructor() {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.productId && this.productId !== 'new';
    this.loadCategories();
    if (this.isEdit && this.productId) {
      this.loadProduct(this.productId);
    }
  }

  private loadCategories(): void {
    this.categoriesApi
      .list({ page: 1, pageSize: 100, sort: 'name,asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => (this.categories = response.items)
      });
  }

  private loadProduct(id: string): void {
    this.loading = true;
    this.productsApi
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: product => this.populateForm(product),
        error: () => {
          this.error = 'No se pudo cargar el producto.';
        }
      });
  }

  private populateForm(product: ProductViewDTO): void {
    this.form.setValue({
      name: product.name,
      author: product.author ?? '',
      description: product.description ?? '',
      sku: product.sku,
      price: product.price,
      currency: product.currency,
      categoryId: product.categoryId,
      isActive: product.isActive
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
    const payload: ProductCreateDTO = {
      name: rawValue.name.trim(),
      author: rawValue.author?.trim() || undefined,
      description: rawValue.description?.trim() || undefined,
      sku: rawValue.sku.trim(),
      price: Number(rawValue.price),
      currency: rawValue.currency.trim().toUpperCase(),
      categoryId: rawValue.categoryId,
      isActive: rawValue.isActive
    };

    const request$ = this.isEdit && this.productId
      ? this.productsApi.update(this.productId, payload as ProductUpdateDTO)
      : this.productsApi.create(payload);

    request$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: product => {
          this.message = 'Producto guardado correctamente.';
          if (!this.isEdit && product.id) {
            this.router.navigate(['/admin/products', product.id]);
          }
        },
        error: () => {
          this.error = 'No se pudo guardar el producto.';
        }
      });
  }

  resetForm(): void {
    if (this.isEdit && this.productId) {
      this.loadProduct(this.productId);
    } else {
      this.form.reset({
        name: '',
        author: '',
        description: '',
        sku: '',
        price: 0,
        currency: 'PEN',
        categoryId: '',
        isActive: true
      });
    }
  }
}
