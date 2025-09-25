import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-product-detail',
  standalone: true,
  template: `
    <h1>Product Detail</h1>
    <p>ID: {{ productId }}</p>
  `
})
export class AdminProductDetailComponent {
  readonly productId: string | null;

  constructor(private readonly route: ActivatedRoute) {
    this.productId = this.route.snapshot.paramMap.get('id');
  }
}
