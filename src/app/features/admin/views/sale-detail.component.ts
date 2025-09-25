import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-sale-detail',
  standalone: true,
  template: `
    <h1>Sale Detail</h1>
    <p>ID: {{ saleId }}</p>
  `
})
export class AdminSaleDetailComponent {
  readonly saleId: string | null;

  constructor(private readonly route: ActivatedRoute) {
    this.saleId = this.route.snapshot.paramMap.get('id');
  }
}
