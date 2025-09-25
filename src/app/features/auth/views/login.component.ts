import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="d-flex justify-content-center align-items-center py-5">
      <div class="card shadow-sm border-0" style="max-width: 420px; width: 100%">
        <div class="card-body p-4 d-flex flex-column gap-4">
          <header>
            <h1 class="h3 mb-1">Ingresar al panel</h1>
            <p class="text-muted mb-0">Gestiona el catálogo, reservas y ventas desde un solo lugar.</p>
          </header>

          <form (ngSubmit)="onSubmit()" class="d-flex flex-column gap-3" novalidate>
            <div>
              <label for="email" class="form-label">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                class="form-control"
                [(ngModel)]="email"
                [disabled]="loading"
                required
              />
            </div>

            <div>
              <label for="password" class="form-label">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                class="form-control"
                [(ngModel)]="password"
                [disabled]="loading"
                required
              />
            </div>

            <button type="submit" class="btn btn-primary w-100" [disabled]="loading || !email || !password">
              <ng-container *ngIf="!loading; else loadingTpl">Entrar</ng-container>
            </button>
          </form>

          <div *ngIf="error" class="alert alert-danger mb-0" role="alert">
            {{ error }}
          </div>

          <p class="text-center text-muted mb-0">
            ¿Necesitas ayuda? <a routerLink="/catalog">Vuelve al catálogo público</a>
          </p>
        </div>
      </div>

      <ng-template #loadingTpl>
        <span class="d-inline-flex align-items-center gap-2 justify-content-center">
          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Ingresando…
        </span>
      </ng-template>
    </section>
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';

  onSubmit(): void {
    if (!this.email || !this.password || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 401 || err?.status === 403) {
          this.error = 'Credenciales incorrectas. Revisa tu correo y contraseña.';
        } else {
          this.error = 'No se pudo iniciar sesión. Intenta nuevamente más tarde.';
        }
      }
    });
  }
}
