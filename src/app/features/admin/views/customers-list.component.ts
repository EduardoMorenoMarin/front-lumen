import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomersApi } from '../../../core/api/customers.api';
import { CustomerViewDTO } from '../../../core/models/customer';
import { PageResponse } from '../../../core/models/pagination';

@Component({
  selector: 'app-admin-customers-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <section class="page-header">
      <h1>Clientes</h1>
      <a routerLink="/admin/customers/new" class="btn">Nuevo cliente</a>
    </section>

    <form class="filters" [formGroup]="filterForm" (ngSubmit)="applyFilters()">
      <label>
        Buscar
        <input type="text" formControlName="search" placeholder="Nombre, email o DNI" />
      </label>

      <div class="filter-actions">
        <button type="submit">Aplicar</button>
        <button type="button" (click)="resetFilters()">Limpiar</button>
      </div>
    </form>

    <section *ngIf="error" class="alert error">{{ error }}</section>
    <section *ngIf="loading" class="loading">Cargando clientes…</section>

    <table *ngIf="!loading && customers.length" class="data-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Teléfono</th>
          <th>DNI</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let customer of customers">
          <td>{{ customer.firstName }} {{ customer.lastName }}</td>
          <td>{{ customer.email || '—' }}</td>
          <td>{{ customer.phone || '—' }}</td>
          <td>{{ customer.dni }}</td>
          <td><a [routerLink]="['/admin/customers', customer.id]">Editar</a></td>
        </tr>
      </tbody>
    </table>

    <p *ngIf="!loading && !customers.length" class="empty-state">No hay clientes para mostrar.</p>

    <nav class="pagination" *ngIf="!loading && totalPages > 1">
      <button type="button" (click)="goToPage(page - 1)" [disabled]="page <= 1">Anterior</button>
      <span>Página {{ page }} de {{ totalPages }}</span>
      <button type="button" (click)="goToPage(page + 1)" [disabled]="page >= totalPages">Siguiente</button>
    </nav>
  `
})
export class AdminCustomersListComponent {
  private readonly customersApi = inject(CustomersApi);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterForm = this.fb.nonNullable.group({
    search: ['']
  });

  customers: CustomerViewDTO[] = [];
  loading = false;
  error: string | null = null;
  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;

  constructor() {
    this.loadCustomers(1);
  }

  applyFilters(): void {
    this.loadCustomers(1);
  }

  resetFilters(): void {
    this.filterForm.reset({ search: '' });
    this.loadCustomers(1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.loadCustomers(page);
  }

  private loadCustomers(page: number): void {
    this.loading = true;
    this.error = null;
    const { search } = this.filterForm.getRawValue();
    this.customersApi
      .list({
        page,
        pageSize: this.pageSize,
        search: search || undefined
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: response => this.handleResponse(response),
        error: () => {
          this.error = 'No se pudieron cargar los clientes.';
        }
      });
  }

  private handleResponse(response: PageResponse<CustomerViewDTO>): void {
    this.customers = response.items;
    this.page = response.page;
    this.pageSize = response.pageSize;
    this.totalPages = response.totalPages;
    this.totalItems = response.totalItems;
  }
}
