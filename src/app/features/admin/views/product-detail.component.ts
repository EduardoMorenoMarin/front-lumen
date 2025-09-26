import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductsApi } from '../../../core/api/products.api';
import { CategoriesApi } from '../../../core/api/categories.api';
import {
  ProductCreateDTO,
  ProductPatchDTO,
  ProductReplaceDTO,
  ProductViewDTO
} from '../../../core/models/product';
import { CategoryViewDTO } from '../../../core/models/category';

@Component({
  selector: 'app-admin-product-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DatePipe],
  template: `
    <a routerLink="/admin/products">&larr; Volver</a>

    <h1>{{ isEdit ? 'Editar producto' : 'Crear producto' }}</h1>

    <section *ngIf="loading" class="loading">Cargando…</section>
    <section *ngIf="error" class="alert error">{{ error }}</section>
    <section *ngIf="message" class="alert success">{{ message }}</section>

    <section *ngIf="isEdit && currentProduct" class="product-summary">
      <h2>Detalle del producto</h2>
      <dl>
        <div>
          <dt>Título</dt>
          <dd>{{ currentProduct.title }}</dd>
        </div>
        <div>
          <dt>ID</dt>
          <dd>{{ currentProduct.id }}</dd>
        </div>
        <div>
          <dt>SKU</dt>
          <dd>{{ currentProduct.sku }}</dd>
        </div>
        <div>
          <dt>ISBN</dt>
          <dd>{{ currentProduct.isbn || '—' }}</dd>
        </div>
        <div>
          <dt>Autor</dt>
          <dd>{{ currentProduct.author }}</dd>
        </div>
        <div>
          <dt>Descripción</dt>
          <dd>{{ currentProduct.description || '—' }}</dd>
        </div>
        <div>
          <dt>Precio</dt>
          <dd>{{ currentProduct.price | number: '1.2-2' }}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd>{{ currentProduct.categoryName || currentProduct.categoryId }}</dd>
        </div>
        <div>
          <dt>Creado</dt>
          <dd>{{ currentProduct.createdAt | date: 'short' }}</dd>
        </div>
        <div>
          <dt>Actualizado</dt>
          <dd>{{ currentProduct.updatedAt | date: 'short' }}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{{ currentProduct.active ? 'Activo' : 'Inactivo' }}</dd>
        </div>
      </dl>
    </section>

    <section *ngIf="isEdit" class="product-actions">
      <button type="button" (click)="toggleActive()" [disabled]="toggling || saving">
        {{ toggling ? 'Actualizando…' : currentProduct?.active ? 'Desactivar' : 'Activar' }}
      </button>
      <button
        type="button"
        class="danger"
        (click)="confirmDelete()"
        [disabled]="deleting || saving"
      >
        {{ deleting ? 'Eliminando…' : 'Eliminar' }}
      </button>
    </section>

    <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
      <label>
        Título
        <input type="text" formControlName="title" required />
        <span class="error" *ngIf="form.controls.title.invalid && form.controls.title.touched">
          El título es obligatorio.
        </span>
      </label>

      <label>
        Autor
        <input type="text" formControlName="author" />
      </label>

      <label>
        SKU
        <input type="text" formControlName="sku" required />
        <span class="error" *ngIf="form.controls.sku.invalid && form.controls.sku.touched">
          El SKU es obligatorio.
        </span>
      </label>

      <label>
        ISBN
        <input type="text" formControlName="isbn" placeholder="Opcional" />
      </label>

      <label>
        Precio
        <input type="number" step="0.01" formControlName="price" required />
        <span class="error" *ngIf="form.controls.price.invalid && form.controls.price.touched">
          Ingrese un precio válido mayor o igual que 0.
        </span>
      </label>

      <label>
        Categoría
        <select formControlName="categoryId" required>
          <option value="" disabled>Seleccione una categoría</option>
          <option *ngFor="let category of categories" [value]="category.id">{{ category.name }}</option>
        </select>
        <span class="error" *ngIf="form.controls.categoryId.invalid && form.controls.categoryId.touched">
          Seleccione una categoría válida.
        </span>
      </label>

      <label class="full-width">
        Descripción
        <textarea formControlName="description" rows="4"></textarea>
      </label>

      <label>
        Activo
        <input type="checkbox" formControlName="active" />
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

  private readonly uuidPattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    author: [''],
    description: [''],
    sku: ['', Validators.required],
    isbn: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required, Validators.pattern(this.uuidPattern)]],
    active: [true]
  });

  categories: CategoryViewDTO[] = [];
  productId: string | null = null;
  isEdit = false;
  loading = false;
  saving = false;
  message: string | null = null;
  error: string | null = null;
  toggling = false;
  deleting = false;
  currentProduct: ProductViewDTO | null = null;

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
      .list({ page: 1, pageSize: 100, sort: 'name,asc', active: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response =>
          (this.categories = (response.items ?? []).filter(category => category.active))
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
    this.currentProduct = product;
    this.form.setValue({
      title: product.title,
      author: product.author ?? '',
      description: product.description ?? '',
      sku: product.sku,
      isbn: product.isbn ?? '',
      price: product.price,
      categoryId: product.categoryId,
      active: product.active
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
    const basePayload: ProductCreateDTO = {
      sku: rawValue.sku.trim(),
      isbn: rawValue.isbn?.trim() || undefined,
      title: rawValue.title.trim(),
      author: rawValue.author?.trim() ?? '',
      description: rawValue.description?.trim() ?? '',
      price: Number(rawValue.price),
      active: rawValue.active,
      categoryId: rawValue.categoryId
    };

    const request$ = this.isEdit && this.productId
      ? this.productsApi.update(this.productId, { ...basePayload, id: this.productId } as ProductReplaceDTO)
      : this.productsApi.create(basePayload);

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
          this.currentProduct = product;
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
        title: '',
        author: '',
        description: '',
        sku: '',
        isbn: '',
        price: 0,
        categoryId: '',
        active: true
      });
    }
  }

  toggleActive(): void {
    if (!this.isEdit || !this.productId || !this.currentProduct || this.toggling) return;
    this.toggling = true;
    this.error = null;
    this.message = null;
    const nextState = !this.currentProduct.active;

    this.productsApi
      .patch(this.productId, { active: nextState } as ProductPatchDTO)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.toggling = false;
        })
      )
      .subscribe({
        next: product => {
          this.currentProduct = product;
          this.form.patchValue({ active: product.active });
          this.message = `El producto fue ${product.active ? 'activado' : 'desactivado'} correctamente.`;
        },
        error: () => {
          this.error = 'No se pudo actualizar el estado del producto.';
        }
      });
  }

  confirmDelete(): void {
    if (!this.isEdit || !this.productId || this.deleting) return;
    const confirmed = window.confirm('¿Deseas eliminar este producto?');
    if (!confirmed) return;
    this.deleting = true;
    this.error = null;
    this.message = null;

    this.productsApi
      .delete(this.productId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.deleting = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/admin/products']);
        },
        error: () => {
          this.error = 'No se pudo eliminar el producto.';
        }
      });
  }
}
