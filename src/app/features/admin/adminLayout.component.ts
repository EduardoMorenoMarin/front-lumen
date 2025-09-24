import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { MeResponse } from '../../core/models/auth';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <header class="admin-topbar">
      <div class="admin-topbar__brand">Panel de administracion</div>
      <div class="admin-topbar__user" *ngIf="currentUser$ | async as user">
        <span class="admin-topbar__name">{{ user.displayName || user.username }}</span>
        <button type="button" (click)="logout()">Cerrar sesion</button>
      </div>
    </header>
    <main class="admin-content">
      <router-outlet />
    </main>
  `
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);

  currentUser$: Observable<MeResponse | null> = this.auth.currentUser$;

  ngOnInit(): void {
    this.auth.me().subscribe({ error: () => this.auth.logout() });
  }

  logout(): void {
    this.auth.logout();
  }
}
