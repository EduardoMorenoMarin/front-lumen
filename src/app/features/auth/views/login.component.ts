import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="login">
      <h1>Iniciar sesion</h1>
      <form (ngSubmit)="onSubmit()" novalidate>
        <label>
          Correo electronico
          <input
            name="email"
            type="email"
            [(ngModel)]="email"
            [disabled]="loading"
            required
          />
        </label>

        <label>
          Contrasena
          <input
            name="password"
            [(ngModel)]="password"
            type="password"
            [disabled]="loading"
            required
          />
        </label>

        <button type="submit" [disabled]="loading || !email || !password">
          {{ loading ? 'Ingresando...' : 'Entrar' }}
        </button>
      </form>

      <p class="error" *ngIf="error">{{ error }}</p>
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
      error: () => {
        this.loading = false;
        this.error = 'Usuario o contrasena invalidos.';
      }
    });
  }
}
