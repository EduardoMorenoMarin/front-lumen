import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Login</h1>
    <form (ngSubmit)="onSubmit()">
      <input name="email" [(ngModel)]="email" type="email" placeholder="Correo electronico" />
      <input name="password" [(ngModel)]="password" type="password" placeholder="Contraseña" />
      <button type="submit">Entrar</button>
    </form>
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';

  onSubmit() {
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/admin']),
    });
  }
}


