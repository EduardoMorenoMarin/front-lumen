import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-reservation-detail',
  standalone: true,
  template: `
    <h1>Reservation Detail</h1>
    <p>ID: {{ reservationId }}</p>
  `
})
export class AdminReservationDetailComponent {
  readonly reservationId: string | null;

  constructor(private readonly route: ActivatedRoute) {
    this.reservationId = this.route.snapshot.paramMap.get('id');
  }
}
