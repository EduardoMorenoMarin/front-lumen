import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container">
        <a class="navbar-brand fw-semibold" routerLink="/">Lumen Librería</a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#publicNavbar"
          aria-controls="publicNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <nav class="collapse navbar-collapse" id="publicNavbar">
          <ul class="navbar-nav ms-auto gap-lg-3">
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/catalog"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
                >Catálogo</a
              >
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/categories" routerLinkActive="active">Categorías</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/reserve" routerLinkActive="active">Reservar</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/login">Ingresar</a>
            </li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="bg-light py-5">
      <div class="container">
        <router-outlet />
      </div>
    </main>
  `
})
export class PublicLayoutComponent {}


