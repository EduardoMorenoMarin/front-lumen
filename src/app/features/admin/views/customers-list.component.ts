import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CustomersApi } from '../../../core/api/customers.api';
import { CustomerViewDTO } from '../../../core/models/customer';

const TIMEOUT_MS = 10000;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

@Component({
  selector: 'app-admin-customers-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <section class="page-header">
      <h1>Clientes</h1>
      <a routerLink="/admin/customers/new" class="btn">New customer</a>
    </section>

    <form class="filters" [formGroup]="filterForm" (ngSubmit)="applyFilters(true)">
      <label>
        Search
        <input type="text" formControlName="search" placeholder="Name, email or DNI" />
      </label>

      <label>
        Last name initial
        <select formControlName="initial" (change)="applyFilters(true)">
          <option value="all">All</option>
          <option *ngFor="let letter of initials" [value]="letter">{{ letter }}</option>
          <option value="other">#</option>
        </select>
      </label>

      <label>
        Order by updatedAt
        <select formControlName="sort" (change)="applyFilters(false)">
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </label>

      <div class="filter-actions">
        <button type="submit">Apply</button>
        <button type="button" (click)="resetFilters()">Clear</button>
      </div>
    </form>

    <section *ngIf="error" class="alert error">
      {{ error }}
      <button type="button" (click)="loadCustomers()">Retry</button>
    </section>
    <section *ngIf="loading" class="loading">Loading customers…</section>

    <table *ngIf="!loading && !error && customers.length" class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>DNI</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Updated</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let customer of customers">
          <td>{{ customer.firstName }} {{ customer.lastName }}</td>
          <td>{{ customer.dni }}</td>
          <td>{{ customer.email || '—' }}</td>
          <td>{{ customer.phone || '—' }}</td>
          <td>{{ customer.updatedAt | date: 'short' }}</td>
          <td><a [routerLink]="['/admin/customers', customer.id]">View</a></td>
        </tr>
      </tbody>
    </table>

    <section *ngIf="!loading && !error && !customers.length && totalItems === 0" class="empty-state">
      <p>No customers yet.</p>
      <a routerLink="/admin/customers/new" class="btn">New customer</a>
    </section>

    <nav class="pagination" *ngIf="!loading && totalPages > 1">
      <button type="button" (click)="goToPage(page - 1)" [disabled]="page <= 1">Previous</button>
      <span>Page {{ page }} of {{ totalPages }}</span>
      <button type="button" (click)="goToPage(page + 1)" [disabled]="page >= totalPages">Next</button>
    </nav>
  `
})
export class AdminCustomersListComponent {
  private readonly customersApi = inject(CustomersApi);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly filterForm = this.fb.nonNullable.group({
    search: [''],
    initial: ['all'],
    sort: ['desc']
  });

  readonly initials = ALPHABET;
  readonly pageSize = 10;

  private allCustomers: CustomerViewDTO[] = [];
  private filteredCustomers: CustomerViewDTO[] = [];

  customers: CustomerViewDTO[] = [];
  loading = false;
  error: string | null = null;
  page = 1;
  totalPages = 0;
  totalItems = 0;

  constructor() {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.error = null;
    this.customersApi
      .list()
      .pipe(
        timeout({ each: TIMEOUT_MS }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: response => {
          this.allCustomers = response ?? [];
          this.applyFilters(true);
        },
        error: () => {
          this.error = 'Unable to load customers.';
          this.allCustomers = [];
          this.applyFilters(true);
        }
      });
  }

  applyFilters(resetPage: boolean): void {
    const { search, initial, sort } = this.filterForm.getRawValue();
    const searchValue = search.trim().toLowerCase();

    let filtered = [...this.allCustomers];

    if (searchValue) {
      filtered = filtered.filter(customer => {
        const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
        return (
          fullName.includes(searchValue) ||
          (customer.email ?? '').toLowerCase().includes(searchValue) ||
          customer.dni.toLowerCase().includes(searchValue)
        );
      });
    }

    if (initial !== 'all') {
      filtered = filtered.filter(customer => {
        const lastInitial = (customer.lastName ?? '').charAt(0).toUpperCase();
        if (initial === 'other') {
          return !ALPHABET.includes(lastInitial);
        }
        return lastInitial === initial;
      });
    }

    filtered.sort((a, b) => {
      const aDate = new Date(a.updatedAt).getTime();
      const bDate = new Date(b.updatedAt).getTime();
      return sort === 'asc' ? aDate - bDate : bDate - aDate;
    });

    this.filteredCustomers = filtered;
    this.totalItems = filtered.length;
    this.totalPages = this.totalItems ? Math.ceil(this.totalItems / this.pageSize) : 0;

    if (resetPage || this.page > this.totalPages) {
      this.page = this.totalPages > 0 ? 1 : 0;
    }

    this.updatePage();
  }

  resetFilters(): void {
    this.filterForm.reset({ search: '', initial: 'all', sort: 'desc' });
    this.applyFilters(true);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.updatePage();
  }

  private updatePage(): void {
    if (!this.totalItems || this.page === 0) {
      this.customers = [];
      return;
    }
    const start = (this.page - 1) * this.pageSize;
    this.customers = this.filteredCustomers.slice(start, start + this.pageSize);
  }
}
