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
      <input name="username" [(ngModel)]="username" placeholder="Usuario" />
      <input name="password" [(ngModel)]="password" type="password" placeholder="Contraseña" />
      <button type="submit">Entrar</button>
    </form>
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';

  onSubmit() {
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.router.navigate(['/admin']),
    });
  }
}


