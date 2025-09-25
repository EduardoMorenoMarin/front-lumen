import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { MeResponse } from '../../core/models/auth';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  styleUrls: ['./adminLayout.component.css'],
  template: `
    <div class="admin-shell">
      <header class="admin-topbar">
        <div class="admin-topbar__brand">Panel de administración</div>
        <div class="admin-topbar__user" *ngIf="currentUser$ | async as user">
          <span class="admin-topbar__name">{{ user.displayName || user.email }}</span>
          <button type="button" (click)="logout()">Cerrar sesion</button>
        </div>
      </header>

      <div class="admin-shell__body">
        <nav class="admin-sidebar" aria-label="Secciones de administración">
          <h2 class="admin-sidebar__title">Menú</h2>
          <ul class="admin-sidebar__menu">
            <li *ngFor="let link of navLinks">
              <a
                class="admin-sidebar__link"
                [routerLink]="link.path"
                [routerLinkActiveOptions]="{ exact: link.exact }"
                routerLinkActive="active"
              >
                {{ link.label }}
              </a>
            </li>
          </ul>
        </nav>

        <main class="admin-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);

  currentUser$: Observable<MeResponse | null> = this.auth.currentUser$;

  readonly navLinks: Array<{ label: string; path: string | string[]; exact: boolean }> = [
    { label: 'Dashboard', path: '/admin', exact: true },
    { label: 'Reservas', path: '/admin/reservations', exact: false },
    { label: 'Productos', path: '/admin/products', exact: false },
    { label: 'Categorías', path: '/admin/categories', exact: false },
    { label: 'Clientes', path: '/admin/customers', exact: false },
    { label: 'Inventario', path: '/admin/inventory', exact: false },
    { label: 'Ventas', path: '/admin/sales', exact: false },
    { label: 'Reportes', path: '/admin/reports', exact: false }
  ];

  ngOnInit(): void {
    this.auth.me().subscribe({ error: () => this.auth.logout() });
  }

  logout(): void {
    this.auth.logout();
  }
}
