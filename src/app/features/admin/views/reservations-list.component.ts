import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReservationsApi } from '../../../core/api/reservations.api';
import { ReservationViewDTO } from '../../../core/models/reservation';
import { PageResponse } from '../../../core/models/pagination';

@Component({
  selector: 'app-admin-reservations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DatePipe],
  template: `
    <section class="page-header">
      <h1>Reservas</h1>
    </section>

    <form class="filters" [formGroup]="filterForm" (ngSubmit)="onFilter()">
      <label>
        Búsqueda
        <input type="text" formControlName="search" placeholder="Código, cliente o producto" />
      </label>

      <label>
        Estado
        <select formControlName="status">
          <option value="">Todos</option>
          <option *ngFor="let option of statusOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </label>

      <div class="filter-actions">
        <button type="submit">Aplicar filtros</button>
        <button type="button" (click)="clearFilters()">Limpiar</button>
      </div>
    </form>

    <section *ngIf="message" class="alert success">{{ message }}</section>
    <section *ngIf="error" class="alert error">{{ error }}</section>

    <section *ngIf="loading" class="loading">Cargando reservas…</section>

    <table *ngIf="!loading && reservations.length" class="data-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Producto</th>
          <th>Cliente</th>
          <th>Cantidad</th>
          <th>Estado</th>
          <th>Reservada</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let reservation of reservations">
          <td>{{ reservation.code }}</td>
          <td>{{ reservation.productName || reservation.productId }}</td>
          <td>{{ reservation.customerName || reservation.customerId }}</td>
          <td>{{ reservation.quantity }}</td>
          <td>{{ reservation.status }}</td>
          <td>{{ reservation.reservedAt | date: 'short' }}</td>
          <td>
            <a [routerLink]="['/admin/reservations', reservation.id]">Ver detalle</a>
            <button type="button" (click)="acceptReservation(reservation)" [disabled]="isActionInFlight(reservation.id)">
              Aceptar
            </button>
            <button type="button" (click)="confirmReservation(reservation, true)" [disabled]="isActionInFlight(reservation.id)">
              Confirmar + venta
            </button>
            <button type="button" (click)="confirmReservation(reservation, false)" [disabled]="isActionInFlight(reservation.id)">
              Confirmar sin venta
            </button>
            <button type="button" (click)="cancelReservation(reservation)" [disabled]="isActionInFlight(reservation.id)">
              Cancelar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p *ngIf="!loading && !reservations.length" class="empty-state">No se encontraron reservas con los filtros seleccionados.</p>

    <nav class="pagination" *ngIf="!loading && totalPages > 1">
      <button type="button" (click)="goToPage(page - 1)" [disabled]="page <= 1">Anterior</button>
      <span>Página {{ page }} de {{ totalPages }}</span>
      <button type="button" (click)="goToPage(page + 1)" [disabled]="page >= totalPages">Siguiente</button>
    </nav>
  `
})
export class AdminReservationsListComponent {
  private readonly reservationsApi = inject(ReservationsApi);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    status: ['']
  });

  readonly statusOptions: { value: string; label: string }[] = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'confirmed', label: 'Confirmada' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'picked_up', label: 'Retirada' }
  ];

  reservations: ReservationViewDTO[] = [];
  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;
  loading = false;
  message: string | null = null;
  error: string | null = null;
  private actionInFlight: string | null = null;

  constructor() {
    this.loadReservations(1);
  }

  onFilter(): void {
    this.loadReservations(1);
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', status: '' });
    this.loadReservations(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadReservations(page);
  }

  isActionInFlight(reservationId: string): boolean {
    return this.actionInFlight === reservationId;
  }

  private loadReservations(page: number): void {
    this.loading = true;
    this.error = null;
    const { search, status } = this.filterForm.getRawValue();
    this.reservationsApi
      .list({
        page,
        pageSize: this.pageSize,
        search: search || undefined,
        status: status || undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: response => this.handlePageResponse(response),
        error: () => {
          this.error = 'No se pudieron cargar las reservas.';
        }
      });
  }

  private handlePageResponse(response: PageResponse<ReservationViewDTO>): void {
    this.reservations = response.items;
    this.totalItems = response.totalItems;
    this.page = response.page;
    this.pageSize = response.pageSize;
    this.totalPages = response.totalPages;
  }

  private setActionFeedback(message: string | null, error: string | null): void {
    this.message = message;
    this.error = error;
  }

  acceptReservation(reservation: ReservationViewDTO): void {
    if (!reservation.id) return;
    if (!window.confirm(`¿Confirmas aceptar la reserva ${reservation.code}?`)) {
      return;
    }
    this.executeAction(reservation.id, () => this.reservationsApi.accept(reservation.id), () => {
      this.setActionFeedback(`Reserva ${reservation.code} aceptada correctamente.`, null);
      this.loadReservations(this.page);
    });
  }

  confirmReservation(reservation: ReservationViewDTO, createSale: boolean): void {
    if (!reservation.id) return;
    if (
      !window.confirm(
        `¿Confirmas la reserva ${reservation.code}?${createSale ? ' Se generará una venta.' : ''}`
      )
    ) {
      return;
    }
    this.executeAction(
      reservation.id,
      () => this.reservationsApi.confirm(reservation.id, createSale),
      () => {
        this.setActionFeedback(
          `Reserva ${reservation.code} confirmada${createSale ? ' y venta creada' : ''}.`,
          null
        );
        this.loadReservations(this.page);
      }
    );
  }

  cancelReservation(reservation: ReservationViewDTO): void {
    if (!reservation.id) return;
    const reason = window.prompt('Motivo de cancelación (opcional):') ?? undefined;
    if (!window.confirm(`¿Quieres cancelar la reserva ${reservation.code}?`)) {
      return;
    }
    this.executeAction(
      reservation.id,
      () => this.reservationsApi.cancel(reservation.id, reason ? { reason } : {}),
      () => {
        this.setActionFeedback(`Reserva ${reservation.code} cancelada.`, null);
        this.loadReservations(this.page);
      }
    );
  }

  private executeAction(
    reservationId: string,
    requestFactory: () => ReturnType<ReservationsApi['accept']>,
    onSuccess: () => void
  ): void {
    this.actionInFlight = reservationId;
    this.setActionFeedback(null, null);
    requestFactory()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.actionInFlight = null;
        })
      )
      .subscribe({
        next: () => onSuccess(),
        error: () => {
          this.setActionFeedback(null, 'No se pudo completar la acción sobre la reserva.');
        }
      });
  }
}
