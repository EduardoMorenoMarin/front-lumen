import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-customer-detail',
  standalone: true,
  template: 
    <h1>Customer Detail</h1>
    <p>ID: {{ customerId }}</p>
  
})
export class AdminCustomerDetailComponent {
  readonly customerId = this.route.snapshot.paramMap.get('id');

  constructor(private readonly route: ActivatedRoute) {}
}
