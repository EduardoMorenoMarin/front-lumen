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
          Usuario
          <input
            name="username"
            [(ngModel)]="username"
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

        <button type="submit" [disabled]="loading || !username || !password">
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

  username = '';
  password = '';
  loading = false;
  error = '';

  onSubmit(): void {
    if (!this.username || !this.password || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.login({ username: this.username, password: this.password }).subscribe({
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
