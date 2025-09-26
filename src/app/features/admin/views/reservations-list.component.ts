import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ReservationsApi } from '../../../core/api/reservations.api';
import { Reservation, ReservationStatus } from '../../../core/models/reservation';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-admin-reservations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  styles: [
    `
      :host {
        display: block;
        padding: 2rem;
      }

      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .page-header h1 {
        margin: 0;
        font-size: 1.5rem;
      }

      .page-header a {
        background: #2563eb;
        color: #fff;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        text-decoration: none;
        font-weight: 600;
      }

      form.filters {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        padding: 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
        background: #f9fafb;
      }

      form.filters label {
        display: flex;
        flex-direction: column;
        font-size: 0.875rem;
        gap: 0.35rem;
      }

      form.filters input,
      form.filters select {
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        border: 1px solid #d1d5db;
      }

      .filters .actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .filters button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        border: none;
        cursor: pointer;
      }

      .filters button[type='submit'] {
        background: #111827;
        color: #fff;
      }

      .filters button[type='button'] {
        background: #e5e7eb;
        color: #111827;
      }

      .status-badge {
        padding: 0.125rem 0.75rem;
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

      .status-badge.CONFIRMED {
        background: #dbeafe;
        color: #1d4ed8;
      }

      table {
        width: 100%;
        border-collapse: collapse;
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

      tbody tr:hover {
        background: #f9fafb;
      }

      .table-actions {
        display: flex;
        gap: 0.5rem;
      }

      .table-actions a {
        color: #2563eb;
        text-decoration: none;
        font-weight: 600;
      }

      .empty-state,
      .error,
      .loading {
        padding: 1rem;
        border-radius: 0.5rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        margin-top: 1rem;
      }

      .error {
        background: #fee2e2;
        border-color: #fecaca;
        color: #991b1b;
      }

      .pagination {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1.5rem;
      }

      .pagination button {
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        border: 1px solid #d1d5db;
        background: #fff;
        cursor: pointer;
      }

      .pagination button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `
  ],
  template: `
    <section class="page-header">
      <h1>Reservas</h1>
      <a routerLink="/admin/reservations/new">Nueva reserva</a>
    </section>

    <form class="filters" [formGroup]="filterForm" (ngSubmit)="onFilter()">
      <label>
        Buscar
        <input type="search" formControlName="search" placeholder="Código, DNI o email" />
      </label>

      <label>
        Estado
        <select formControlName="status">
          <option value="">Todos</option>
          <option *ngFor="let option of statusOptions" [value]="option.value">{{ option.label }}</option>
        </select>
      </label>

      <div class="actions">
        <button type="submit">Aplicar</button>
        <button type="button" (click)="clearFilters()">Limpiar</button>
      </div>
    </form>

    <section *ngIf="loading()" class="loading">Cargando reservas…</section>
    <section *ngIf="error()" class="error">{{ error() }}</section>

    <table *ngIf="!loading() && paginatedReservations().length">
      <thead>
        <tr>
          <th>Código</th>
          <th>Cliente</th>
          <th>Estado</th>
          <th>Fecha de reserva</th>
          <th>Total</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let reservation of paginatedReservations()">
          <td>{{ reservation.code }}</td>
          <td>{{ getCustomerLabel(reservation) }}</td>
          <td><span class="status-badge {{ reservation.status }}">{{ getStatusLabel(reservation.status) }}</span></td>
          <td>{{ reservation.reservationDate | date: 'short' }}</td>
          <td>{{ reservation.totalAmount | currency: 'USD' }}</td>
          <td class="table-actions">
            <a [routerLink]="['/admin/reservations', reservation.id]">Ver</a>
          </td>
        </tr>
      </tbody>
    </table>

    <p *ngIf="!loading() && !paginatedReservations().length" class="empty-state">
      No se encontraron reservas con los filtros seleccionados.
    </p>

    <nav class="pagination" *ngIf="totalPages() > 1">
      <button type="button" (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1">
        Anterior
      </button>
      <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
      <button
        type="button"
        (click)="goToPage(currentPage() + 1)"
        [disabled]="currentPage() === totalPages()"
      >
        Siguiente
      </button>
    </nav>
  `
})
export class AdminReservationsListComponent {
  private readonly reservationsApi = inject(ReservationsApi);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);

  private readonly reservationsSignal = signal<Reservation[]>([]);
  private readonly activeSearch = signal('');
  private readonly activeStatus = signal<ReservationStatus | ''>('');
  readonly currentPage = signal(1);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly pageSize = 10;

  readonly statusOptions: { value: ReservationStatus; label: string }[] = [
    { value: 'PENDING', label: 'Pendiente' },
    { value: 'ACCEPTED', label: 'Aceptada' },
    { value: 'CANCELED', label: 'Cancelada' },
    { value: 'CONFIRMED', label: 'Retirada' }
  ];

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    status: ['']
  });

  readonly filteredReservations = computed(() => {
    const search = this.activeSearch().trim().toLowerCase();
    const status = this.activeStatus();
    return this.reservationsSignal().filter((reservation) => {
      const matchesStatus = status ? reservation.status === status : true;
      if (!matchesStatus) {
        return false;
      }
      if (!search) {
        return true;
      }
      const haystack = [
        reservation.code,
        reservation.customerDni,
        reservation.customerEmail,
        reservation.customerFirstName,
        reservation.customerLastName
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase())
        .join(' ');
      return haystack.includes(search);
    });
  });

  readonly totalPages = computed(() => {
    const totalItems = this.filteredReservations().length;
    if (totalItems === 0) {
      return 1;
    }
    return Math.max(1, Math.ceil(totalItems / this.pageSize));
  });

  readonly paginatedReservations = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    return this.filteredReservations().slice(startIndex, startIndex + this.pageSize);
  });

  constructor() {
    this.loadReservations();
  }

  onFilter(): void {
    const { search, status } = this.filterForm.getRawValue();
    this.activeSearch.set(search ?? '');
    this.activeStatus.set((status as ReservationStatus | '') ?? '');
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.filterForm.reset({ search: '', status: '' });
    this.activeSearch.set('');
    this.activeStatus.set('');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (total === 0) {
      this.currentPage.set(1);
      return;
    }
    const next = Math.min(Math.max(page, 1), total);
    this.currentPage.set(next);
  }

  refresh(): void {
    this.loadReservations();
  }

  getCustomerLabel(reservation: Reservation): string {
    return `${reservation.customerFirstName} ${reservation.customerLastName}`.trim();
  }

  getStatusLabel(status: ReservationStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'ACCEPTED':
        return 'Aceptada';
      case 'CANCELED':
        return 'Cancelada';
      case 'CONFIRMED':
        return 'Retirada';
      default:
        return status;
    }
  }

  private loadReservations(): void {
    this.loading.set(true);
    this.error.set(null);
    this.reservationsApi
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (reservations) => {
          this.reservationsSignal.set(reservations);
          this.currentPage.set(1);
        },
        error: () => {
          this.error.set('No se pudieron cargar las reservas.');
          this.toast.error('No se pudieron cargar las reservas.');
        }
      });
  }
}
