import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

type HttpMethod = 'GET' | 'POST';

interface PublicEndpoint {
  method: HttpMethod;
  path: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="d-flex flex-column gap-5">
      <div class="bg-white border rounded-4 shadow-sm overflow-hidden">
        <div class="row g-0 align-items-center">
          <div class="col-12 col-lg-7 p-5 d-flex flex-column gap-3">
            <span class="badge text-bg-primary text-uppercase align-self-start">Bienvenido</span>
            <h1 class="display-5 fw-semibold mb-0">LIBRERIA LUMEN</h1>
            <p class="text-muted fs-5 mb-0">
              Explora el catálogo público de productos, conoce las categorías disponibles y realiza
              reservas sin necesidad de iniciar sesión. Gestiona todo desde una interfaz clara y
              accesible.
            </p>
            <div class="d-flex flex-column flex-sm-row gap-3">
              <a class="btn btn-primary btn-lg px-4" routerLink="/catalog">Ver catálogo</a>
              <a class="btn btn-outline-primary btn-lg px-4" routerLink="/reserve">Reservar ahora</a>
              <a class="btn btn-outline-dark btn-lg px-4" routerLink="/login">Iniciar sesión</a>
            </div>
          </div>
          <div class="col-12 col-lg-5 bg-primary-subtle p-5">
            <div class="d-flex flex-column gap-4 text-primary-emphasis">
              <div>
                <h2 class="h4 fw-semibold">Acceso público inmediato</h2>
                <p class="mb-0">
                  Las rutas públicas te permiten consultar información actualizada sin crear una cuenta.
                  Si necesitas administrar inventario o ventas, inicia sesión desde aquí cuando estés
                  listo.
                </p>
              </div>
              <div>
                <h2 class="h4 fw-semibold">Reservas confiables</h2>
                <p class="mb-0">
                  Verifica siempre el cuerpo JSON antes de enviarlo para evitar rechazos y asegurar que el
                  pedido llegue al equipo correcto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="d-flex flex-column gap-4">
        <header class="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
          <div>
            <h2 class="h4 mb-1">Rutas públicas disponibles</h2>
            <p class="text-muted mb-0">Consulta y consume los endpoints sin autenticación previa.</p>
          </div>
          <a class="btn btn-link ms-lg-auto" routerLink="/reserve">Ir a reservas</a>
        </header>

        <div class="row g-4">
          <div class="col-12 col-md-6 col-xxl-4" *ngFor="let endpoint of endpoints">
            <article class="card h-100 shadow-sm border-0">
              <div class="card-body d-flex flex-column gap-3">
                <div class="d-flex align-items-center gap-3">
                  <span
                    class="badge text-uppercase"
                    [ngClass]="endpoint.method === 'GET' ? 'text-bg-success' : 'text-bg-warning'"
                  >
                    {{ endpoint.method }}
                  </span>
                  <code class="text-primary-emphasis fw-semibold">{{ endpoint.path }}</code>
                </div>
                <div>
                  <h3 class="h5 mb-1">{{ endpoint.title }}</h3>
                  <p class="text-muted mb-0">{{ endpoint.description }}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="bg-dark text-white rounded-4 shadow-sm p-4 p-lg-5 d-flex flex-column gap-4">
        <div class="d-flex flex-column flex-lg-row gap-3 align-items-lg-center">
          <div class="flex-grow-1">
            <h2 class="h4 mb-2">Ejemplo de reserva correcta</h2>
            <p class="text-white-50 mb-0">
              Antes de confirmar, valida que tu cuerpo JSON respete la estructura solicitada. Puedes
              copiar este formato como referencia.
            </p>
          </div>
          <a class="btn btn-outline-light px-4" routerLink="/reserve">Generar mi reserva</a>
        </div>
        <pre class="bg-black text-white rounded-4 p-4 mb-0 overflow-auto">
          <code [innerText]="reservationExample"></code>
        </pre>
      </section>
    </section>
  `
})
export class PublicHomeComponent {
  readonly endpoints: PublicEndpoint[] = [
    {
      method: 'GET',
      path: '/public/products',
      title: 'Catálogo público',
      description: 'Obtén el listado completo de productos disponibles con información de stock.'
    },
    {
      method: 'GET',
      path: '/public/products/{id}',
      title: 'Detalle de producto',
      description: 'Consulta la información detallada de un producto específico usando su identificador.'
    },
    {
      method: 'GET',
      path: '/public/categories',
      title: 'Listado de categorías',
      description: 'Explora las categorías para organizar y filtrar los productos del catálogo.'
    },
    {
      method: 'GET',
      path: '/public/categories/{id}',
      title: 'Detalle de categoría',
      description: 'Recupera la descripción y los productos asociados a una categoría concreta.'
    },
    {
      method: 'POST',
      path: '/public/reservations',
      title: 'Crear reserva',
      description: 'Envía los datos completos del cliente y los productos para apartar unidades disponibles.'
    }
  ];

  readonly reservationExample = `{
  "customerData": {
    "firstName": "string",
    "lastName": "string",
    "dni": "37999589",
    "email": "user@example.com",
    "phone": "(71())05+9(544 89"
  },
  "items": [
    {
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quantity": 1
    }
  ],
  "pickupDeadline": "2025-09-26T02:26:14.200Z",
  "notes": "string"
}`;
}
