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
          <dd>{{ reservation.productName || reservation.productId }}</dd>
        </div>
        <div>
          <dt>Cliente</dt>
          <dd>{{ reservation.customerName || reservation.customerId }}</dd>
        </div>
        <div>
          <dt>Cantidad</dt>
          <dd>{{ reservation.quantity }}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{{ reservation.status }}</dd>
        </div>
        <div>
          <dt>Reservada</dt>
          <dd>{{ reservation.reservedAt | date: 'medium' }}</dd>
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
}
