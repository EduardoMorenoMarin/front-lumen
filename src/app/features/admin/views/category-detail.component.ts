import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin-category-detail',
  standalone: true,
  template: `
    <h1>Category Detail</h1>
    <p>ID: {{ categoryId }}</p>
  `
})
export class AdminCategoryDetailComponent {
  readonly categoryId = this.route.snapshot.paramMap.get('id');

  constructor(private readonly route: ActivatedRoute) {}
}
