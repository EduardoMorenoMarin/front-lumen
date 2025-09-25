import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReservationsApi } from '../../../core/api/reservations.api';
import { ReservationViewDTO } from '../../../core/models/reservation';

@Component({
  selector: 'app-admin-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DatePipe],
  template: `
    <a routerLink="/admin/reservations">&larr; Volver al listado</a>

    <section *ngIf="loading" class="loading">Cargando reserva…</section>

    <section *ngIf="error" class="alert error">{{ error }}</section>
    <section *ngIf="message" class="alert success">{{ message }}</section>

    <ng-container *ngIf="!loading && reservation">
      <h1>Reserva {{ reservation.code }}</h1>

      <dl class="detail">
        <div>
          <dt>Producto</dt>
          <dd>{{ getProductLabel(reservation) }}</dd>
        </div>
        <div>
          <dt>Cliente</dt>
          <dd>{{ getCustomerLabel(reservation) }}</dd>
        </div>
        <div>
          <dt>Cantidad</dt>
          <dd>{{ getReservationQuantity(reservation) }}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{{ getStatusLabel(reservation.status) }}</dd>
        </div>
        <div>
          <dt>Reservada</dt>
          <dd>{{ getReservationDate(reservation) | date: 'medium' }}</dd>
        </div>
        <div *ngIf="reservation.pickupDeadline">
          <dt>Fecha límite de retiro</dt>
          <dd>{{ reservation.pickupDeadline | date: 'medium' }}</dd>
        </div>
        <div *ngIf="reservation.totalAmount !== undefined">
          <dt>Monto total</dt>
          <dd>{{ reservation.totalAmount | number: '1.2-2' }}</dd>
        </div>
        <div *ngIf="reservation.customerEmail || reservation.customerPhone">
          <dt>Contacto</dt>
          <dd>
            <ng-container *ngIf="reservation.customerEmail">{{ reservation.customerEmail }}</ng-container>
            <ng-container *ngIf="reservation.customerEmail && reservation.customerPhone"> · </ng-container>
            <ng-container *ngIf="reservation.customerPhone">{{ reservation.customerPhone }}</ng-container>
          </dd>
        </div>
        <div *ngIf="reservation.desiredPickupDate">
          <dt>Retiro deseado</dt>
          <dd>{{ reservation.desiredPickupDate | date }}</dd>
        </div>
        <div *ngIf="reservation.notes">
          <dt>Notas</dt>
          <dd>{{ reservation.notes }}</dd>
        </div>
      </dl>

      <section *ngIf="reservation.items?.length" class="reservation-items">
        <h2>Ítems reservados</h2>
        <table class="data-table">
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
              <td>{{ item.productTitle || item.productId }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice | number: '1.2-2' }}</td>
              <td>{{ item.totalPrice | number: '1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="actions">
        <h2>Acciones</h2>
        <label>
          Crear venta al confirmar
          <input type="checkbox" [formControl]="confirmSaleControl" />
        </label>

        <div class="action-buttons">
          <button type="button" (click)="accept()" [disabled]="actionLoading">Aceptar</button>
          <button type="button" (click)="confirm()" [disabled]="actionLoading">Confirmar</button>
        </div>

        <form class="cancel-form" [formGroup]="cancelForm" (ngSubmit)="cancel()">
          <label>
            Motivo de cancelación
            <textarea formControlName="reason" rows="3"></textarea>
          </label>
          <button type="submit" [disabled]="actionLoading">Cancelar reserva</button>
        </form>
      </section>
    </ng-container>
  `
})
export class AdminReservationDetailComponent {
  private readonly reservationsApi = inject(ReservationsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  private readonly statusLabelMap = new Map<string, string>([
    ['pending', 'Pendiente'],
    ['PENDING', 'Pendiente'],
    ['accepted', 'Aceptada'],
    ['ACCEPTED', 'Aceptada'],
    ['confirmed', 'Confirmada'],
    ['CONFIRMED', 'Confirmada'],
    ['ready_for_pickup', 'Lista para retiro'],
    ['READY_FOR_PICKUP', 'Lista para retiro'],
    ['picked_up', 'Retirada'],
    ['PICKED_UP', 'Retirada'],
    ['cancelled', 'Cancelada'],
    ['CANCELLED', 'Cancelada']
  ]);

  readonly cancelForm = this.fb.nonNullable.group({
    reason: ['']
  });
  readonly confirmSaleControl = this.fb.nonNullable.control(true);

  reservationId: string | null = null;
  reservation: ReservationViewDTO | null = null;
  loading = false;
  actionLoading = false;
  message: string | null = null;
  error: string | null = null;

  constructor() {
    this.reservationId = this.route.snapshot.paramMap.get('id');
    if (this.reservationId) {
      this.loadReservation(this.reservationId);
    } else {
      this.error = 'No se encontró la reserva solicitada.';
    }
  }

  private loadReservation(id: string): void {
    this.loading = true;
    this.error = null;
    this.reservationsApi
      .getById(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: reservation => {
          this.reservation = reservation;
        },
        error: () => {
          this.error = 'No se pudo cargar la reserva.';
        }
      });
  }

  accept(): void {
    if (!this.reservationId || !this.reservation) return;
    if (!window.confirm(`¿Deseas aceptar la reserva ${this.reservation.code}?`)) return;
    this.executeAction(() => this.reservationsApi.accept(this.reservationId!), 'Reserva aceptada.');
  }

  confirm(): void {
    if (!this.reservationId || !this.reservation) return;
    const createSale = this.confirmSaleControl.value;
    if (
      !window.confirm(
        `¿Deseas confirmar la reserva ${this.reservation.code}?${createSale ? ' Se generará una venta.' : ''}`
      )
    ) {
      return;
    }
    this.executeAction(
      () => this.reservationsApi.confirm(this.reservationId!, createSale),
      createSale ? 'Reserva confirmada y venta creada.' : 'Reserva confirmada.'
    );
  }

  cancel(): void {
    if (!this.reservationId || !this.reservation) return;
    if (!window.confirm(`¿Deseas cancelar la reserva ${this.reservation.code}?`)) return;
    const { reason } = this.cancelForm.getRawValue();
    this.executeAction(
      () => this.reservationsApi.cancel(this.reservationId!, reason ? { reason } : {}),
      'Reserva cancelada.'
    );
  }

  private executeAction(
    requestFactory: () => ReturnType<ReservationsApi['accept']>,
    successMessage: string
  ): void {
    this.actionLoading = true;
    this.message = null;
    this.error = null;
    requestFactory()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.actionLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.message = successMessage;
          if (this.reservationId) {
            this.loadReservation(this.reservationId);
          }
        },
        error: () => {
          this.error = 'No fue posible completar la acción.';
        }
      });
  }

  getProductLabel(reservation: ReservationViewDTO): string {
    const firstItem = reservation.items && reservation.items.length ? reservation.items[0] : null;
    if (firstItem) {
      return firstItem.productTitle || firstItem.productId || '—';
    }
    return reservation.productName || reservation.productId || '—';
  }

  getCustomerLabel(reservation: ReservationViewDTO): string {
    const nameParts = [reservation.customerFirstName, reservation.customerLastName]
      .map(part => part?.trim())
      .filter(Boolean) as string[];
    if (nameParts.length) {
      return nameParts.join(' ');
    }
    if (reservation.customerName) {
      return reservation.customerName;
    }
    return (
      reservation.customerEmail ||
      reservation.customerDni ||
      reservation.customerPhone ||
      reservation.customerId ||
      '—'
    );
  }

  getReservationQuantity(reservation: ReservationViewDTO): number {
    if (reservation.items && reservation.items.length) {
      return reservation.items.reduce((total, item) => total + (item.quantity ?? 0), 0);
    }
    return reservation.quantity ?? 0;
  }

  getStatusLabel(status: string | null | undefined): string {
    if (!status) {
      return '—';
    }
    const direct = this.statusLabelMap.get(status);
    if (direct) {
      return direct;
    }
    const normalized = status.toLowerCase();
    const normalizedMatch = this.statusLabelMap.get(normalized);
    if (normalizedMatch) {
      return normalizedMatch;
    }
    const formatted = normalized
      .split(/[_-]/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return formatted || status;
  }

  getReservationDate(reservation: ReservationViewDTO): string | undefined {
    return reservation.reservationDate || reservation.reservedAt || reservation.createdAt;
  }
}
