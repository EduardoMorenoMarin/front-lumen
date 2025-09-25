import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ReservationsApi } from '../../../core/api/reservations.api';
import { Reservation, ReservationStatus } from '../../../core/models/reservation';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styles: [
    `
      :host {
        display: block;
        padding: 2rem;
      }

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        text-decoration: none;
        color: #2563eb;
        font-weight: 600;
        margin-bottom: 1rem;
      }

      .card {
        background: #fff;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .header h1 {
        margin: 0;
        font-size: 1.75rem;
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-badge.PENDING {
        background: #fef3c7;
        color: #92400e;
      }

      .status-badge.ACCEPTED {
        background: #dcfce7;
        color: #166534;
      }

      .status-badge.CANCELED {
        background: #fee2e2;
        color: #991b1b;
      }

      dl.metadata {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      dl.metadata dt {
        font-weight: 600;
        color: #6b7280;
      }

      dl.metadata dd {
        margin: 0;
        font-size: 0.95rem;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
        background: #fff;
        border-radius: 0.5rem;
        overflow: hidden;
      }

      th,
      td {
        padding: 0.75rem 1rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }

      .actions button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
        font-weight: 600;
      }

      .actions button.primary {
        background: #2563eb;
        color: #fff;
      }

      .actions button.danger {
        background: #dc2626;
        color: #fff;
      }

      .actions button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .loading,
      .error {
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        background: #f9fafb;
        margin-top: 1rem;
      }

      .error {
        background: #fee2e2;
        border-color: #fecaca;
        color: #991b1b;
      }
    `
  ],
  template: `
    <a routerLink="/admin/reservations" class="back-link">← Volver</a>

    <section *ngIf="loading()" class="loading">Cargando reserva…</section>
    <section *ngIf="error()" class="error">{{ error() }}</section>

    <article *ngIf="reservation() as reservation" class="card">
      <header class="header">
        <div>
          <h1>Reserva {{ reservation.code }}</h1>
          <p>Creada el {{ reservation.createdAt | date: 'medium' }}</p>
        </div>
        <span class="status-badge {{ reservation.status }}">{{ getStatusLabel(reservation.status) }}</span>
      </header>

      <dl class="metadata">
        <div>
          <dt>Cliente</dt>
          <dd>{{ customerName() }}</dd>
        </div>
        <div>
          <dt>Documento</dt>
          <dd>{{ reservation.customerDni }}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{{ reservation.customerEmail }}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd>{{ reservation.customerPhone }}</dd>
        </div>
        <div>
          <dt>Fecha de reserva</dt>
          <dd>{{ reservation.reservationDate | date: 'medium' }}</dd>
        </div>
        <div>
          <dt>Fecha límite de retiro</dt>
          <dd>{{ reservation.pickupDeadline | date: 'medium' }}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{{ reservation.totalAmount | currency: 'USD' }}</dd>
        </div>
        <div>
          <dt>Última actualización</dt>
          <dd>{{ reservation.updatedAt | date: 'medium' }}</dd>
        </div>
        <div *ngIf="reservation.notes">
          <dt>Notas</dt>
          <dd>{{ reservation.notes }}</dd>
        </div>
      </dl>

      <section *ngIf="reservation.items.length" class="card">
        <h2>Ítems</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of reservation.items">
              <td>{{ item.productTitle }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice | currency: 'USD' }}</td>
              <td>{{ item.totalPrice | currency: 'USD' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer class="actions">
        <button
          type="button"
          class="primary"
          (click)="acceptReservation()"
          [disabled]="!canAccept() || actionLoading()"
        >
          Aceptar
        </button>
        <button
          type="button"
          class="danger"
          (click)="cancelReservation()"
          [disabled]="!canCancel() || actionLoading()"
        >
          Cancelar
        </button>
      </footer>
    </article>
  `
})
export class AdminReservationDetailComponent {
  private readonly reservationsApi = inject(ReservationsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  readonly reservation = signal<Reservation | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionLoading = signal(false);

  readonly customerName = computed(() => {
    const reservation = this.reservation();
    if (!reservation) {
      return '';
    }
    return `${reservation.customerFirstName} ${reservation.customerLastName}`.trim();
  });

  readonly canAccept = computed(() => this.reservation()?.status === 'PENDING');
  readonly canCancel = computed(() => this.reservation()?.status !== 'CANCELED');

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadReservation(id);
      }
    });
  }

  getStatusLabel(status: ReservationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'ACCEPTED':
        return 'Aceptada';
      case 'CANCELED':
        return 'Cancelada';
      default:
        return status;
    }
  }

  acceptReservation(): void {
    const reservation = this.reservation();
    if (!reservation || !this.canAccept()) {
      return;
    }
    this.actionLoading.set(true);
    this.reservationsApi
      .accept(reservation.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.actionLoading.set(false))
      )
      .subscribe({
        next: (updated) => {
          this.reservation.set(updated);
          this.toast.success('Reserva aceptada correctamente.');
        },
        error: () => {
          this.toast.error('No fue posible aceptar la reserva.');
        }
      });
  }

  cancelReservation(): void {
    const reservation = this.reservation();
    if (!reservation || !this.canCancel()) {
      return;
    }
    if (!window.confirm('¿Deseas cancelar esta reserva?')) {
      return;
    }
    this.actionLoading.set(true);
    this.reservationsApi
      .cancel(reservation.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.actionLoading.set(false))
      )
      .subscribe({
        next: (updated) => {
          this.reservation.set(updated);
          this.toast.success('Reserva cancelada correctamente.');
        },
        error: () => {
          this.toast.error('No fue posible cancelar la reserva.');
        }
      });
  }

  private loadReservation(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.reservationsApi
      .get(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (reservation) => {
          this.reservation.set(reservation);
        },
        error: () => {
          this.error.set('No se pudo cargar la reserva solicitada.');
          this.toast.error('No se pudo cargar la reserva solicitada.');
        }
      });
  }
}
