import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="d-flex flex-column align-items-center text-center gap-4 py-5">
      <span class="badge text-bg-primary text-uppercase">Librería Lumen</span>
      <h1 class="display-4 fw-semibold mb-0">¡Explora nuestro catálogo!</h1>
      <p class="text-muted fs-5 mb-0">
        Descubre los títulos disponibles y encuentra tu próxima lectura favorita.
      </p>
      <a class="btn btn-primary btn-lg px-4" routerLink="/catalog">Ver catálogo</a>
    </section>
  `
})
export class PublicHomeComponent {}
