import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminCategoriesApi } from '../../../core/api/admin-categories.api';
import { Category } from '../../../core/models/category-management';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-category-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
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

      .card {
        background: #fff;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        margin-top: 1.5rem;
        padding: 1.5rem;
      }

      .card header {
        align-items: center;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        justify-content: space-between;
        margin: -1.5rem -1.5rem 1.5rem;
        padding: 1.5rem;
      }

      .card header h1 {
        margin: 0;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .actions a,
      .actions button {
        align-items: center;
        border-radius: 0.5rem;
        border: 1px solid transparent;
        cursor: pointer;
        display: inline-flex;
        font-weight: 600;
        gap: 0.25rem;
        padding: 0.5rem 1rem;
        text-decoration: none;
      }

      .actions a {
        background: #2563eb;
        color: #fff;
      }

      .actions button.toggle {
        background: #f3f4f6;
        color: #111827;
      }

      .actions button.delete {
        background: #fee2e2;
        color: #b91c1c;
      }

      dl {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin: 0;
      }

      dt {
        color: #6b7280;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      dd {
        margin: 0.25rem 0 0;
        font-size: 1rem;
      }

      .badge {
        border-radius: 999px;
        display: inline-flex;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.625rem;
      }

      .badge--success {
        background: #dcfce7;
        color: #166534;
      }

      .badge--muted {
        background: #f1f5f9;
        color: #1e293b;
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

    <article *ngIf="!loading && category" class="card">
      <header>
        <h1>{{ category.name }}</h1>
        <div class="actions">
          <a [routerLink]="['/admin/categories', category.id, 'edit']">Editar</a>
          <button
            type="button"
            class="toggle"
            (click)="toggleActive()"
            [disabled]="mutating"
          >
            {{ category.active ? 'Desactivar' : 'Activar' }}
          </button>
          <button
            type="button"
            class="delete"
            (click)="deleteCategory()"
            [disabled]="deleting"
          >
            Eliminar
          </button>
        </div>
      </header>

      <dl>
        <div>
          <dt>Nombre</dt>
          <dd>{{ category.name }}</dd>
        </div>
        <div>
          <dt>Descripción</dt>
          <dd>{{ category.description || '—' }}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <span class="badge" [class.badge--success]="category.active" [class.badge--muted]="!category.active">
              {{ category.active ? 'Activa' : 'Inactiva' }}
            </span>
          </dd>
        </div>
        <div>
          <dt>Creada</dt>
          <dd>{{ category.createdAt | date: 'medium' }}</dd>
        </div>
        <div>
          <dt>Última actualización</dt>
          <dd>{{ category.updatedAt | date: 'medium' }}</dd>
        </div>
        <div>
          <dt>ID</dt>
          <dd><code>{{ category.id }}</code></dd>
        </div>
      </dl>
    </article>
  `
})
export class AdminCategoryDetailComponent {
  private readonly categoriesApi = inject(AdminCategoriesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  category: Category | null = null;
  loading = false;
  mutating = false;
  deleting = false;
  error: string | null = null;

  private categoryId: string | null = null;
  private fetchController: AbortController | null = null;
  private mutationController: AbortController | null = null;
  private fetchSubscription: Subscription | null = null;
  private mutationSubscription: Subscription | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.abortFetch();
      this.abortMutation();
    });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'Categoría no encontrada.';
        this.category = null;
        return;
      }
      this.categoryId = id;
      this.loadCategory(id);
    });
  }

  reload(): void {
    if (this.categoryId) {
      this.loadCategory(this.categoryId);
    }
  }

  toggleActive(): void {
    if (!this.categoryId || !this.category || this.mutating) {
      return;
    }

    this.abortMutation();
    const controller = new AbortController();
    this.mutationController = controller;
    this.mutating = true;

    this.mutationSubscription = this.categoriesApi
      .patch(this.categoryId, { active: !this.category.active })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.mutationController === controller) {
            this.mutating = false;
            this.mutationController = null;
            this.mutationSubscription = null;
          }
        })
      )
      .subscribe({
        next: updated => {
          this.category = updated;
          this.toast.success('Estado de la categoría actualizado.');
        },
        error: err => {
          if (controller.signal.aborted) {
            return;
          }
          const message = err?.error?.message ?? 'No se pudo actualizar la categoría.';
          this.toast.error(message);
        }
      });
  }

  deleteCategory(): void {
    if (!this.categoryId || this.deleting) {
      return;
    }

    const confirmed = window.confirm('¿Deseas eliminar esta categoría? Esta acción no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    this.abortMutation();
    const controller = new AbortController();
    this.mutationController = controller;
    this.deleting = true;

    this.mutationSubscription = this.categoriesApi
      .delete(this.categoryId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (this.mutationController === controller) {
            this.deleting = false;
            this.mutationController = null;
            this.mutationSubscription = null;
          }
        })
      )
      .subscribe({
        next: () => {
          this.toast.success('Categoría eliminada correctamente.');
          this.router.navigate(['/admin/categories']);
        },
        error: err => {
          if (controller.signal.aborted) {
            return;
          }
          const message = err?.error?.message ?? 'No se pudo eliminar la categoría.';
          this.toast.error(message);
        }
      });
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
          this.category = category;
        },
        error: err => {
          if (controller.signal.aborted) {
            return;
          }
          this.category = null;
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

  private abortMutation(): void {
    if (this.mutationController) {
      this.mutationController.abort();
      this.mutationController = null;
    }
    if (this.mutationSubscription) {
      this.mutationSubscription.unsubscribe();
      this.mutationSubscription = null;
    }
  }
}
