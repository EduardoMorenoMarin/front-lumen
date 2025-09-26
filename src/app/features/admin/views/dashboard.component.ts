import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CustomersApi } from '../../../core/api/customers.api';
import { ProductsApi } from '../../../core/api/products.api';
import { ReportsApi } from '../../../core/api/reports.api';
import { ReservationsApi } from '../../../core/api/reservations.api';
import { Reservation } from '../../../core/models/reservation';
import { DailySalesTotalsDTO } from '../../../core/models/sale';
import { CurrencyFormatPipe, DateFormatPipe, ToastService } from '../../../shared';

interface DashboardMetrics {
  pendingReservations: number;
  todaysReservations: number;
  customers: number;
  activeProducts: number;
  todaysSalesAmount: number;
  todaysSalesOrders: number;
  currency: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyFormatPipe, DateFormatPipe],
  styleUrls: ['./dashboard.component.css'],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private readonly reservationsApi = inject(ReservationsApi);
  private readonly customersApi = inject(CustomersApi);
  private readonly productsApi = inject(ProductsApi);
  private readonly reportsApi = inject(ReportsApi);
  private readonly toastService = inject(ToastService);

  protected today = new Date();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly metrics = signal<DashboardMetrics>({
    pendingReservations: 0,
    todaysReservations: 0,
    customers: 0,
    activeProducts: 0,
    todaysSalesAmount: 0,
    todaysSalesOrders: 0,
    currency: 'PEN'
  });
  protected readonly pendingReservations = signal<Reservation[]>([]);
  protected readonly salesTrend = signal<DailySalesTotalsDTO[]>([]);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    if (this.loading()) {
      return;
    }

    this.today = new Date();
    const { startOfWeekIso, endOfDayIso, todayKey } = this.buildDateRanges();

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      reservations: this.reservationsApi.list(), // GET /api/v1/reservations
      customers: this.customersApi.list(), // GET /api/v1/customers
      products: this.productsApi.list({ page: 1, pageSize: 1, active: true }), // GET /api/v1/products
      sales: this.reportsApi.daily(startOfWeekIso, endOfDayIso) // GET /api/v1/reports/sales/daily
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ reservations, customers, products, sales }) => {
          this.updateReservationsData(reservations);
          const customersCount = Array.isArray(customers) ? customers.length : 0;
          const activeProductsTotal =
            typeof products.totalItems === 'number' ? products.totalItems : products.items?.length ?? 0;
          this.updateMetrics({
            reservations,
            customersCount,
            activeProducts: activeProductsTotal,
            sales,
            todayKey
          });
          this.salesTrend.set(this.normalizeSalesTrend(sales));
          this.lastUpdated.set(new Date());
        },
        error: () => {
          this.error.set('No se pudo actualizar el dashboard. Intenta nuevamente.');
          this.toastService.error('Ocurrió un problema al cargar el resumen.');
        }
      });
  }

  private updateReservationsData(reservations: Reservation[]): void {
    const pending = [...reservations]
      .filter((reservation) => reservation.status === 'PENDING')
      .sort((a, b) => new Date(b.reservationDate).getTime() - new Date(a.reservationDate).getTime())
      .slice(0, 5);

    this.pendingReservations.set(pending);
  }

  private updateMetrics(params: {
    reservations: Reservation[];
    customersCount: number;
    activeProducts: number;
    sales: DailySalesTotalsDTO[];
    todayKey: string;
  }): void {
    const { reservations, customersCount, activeProducts, sales, todayKey } = params;

    const todaysReservations = reservations.filter((reservation) =>
      this.normalizeDate(reservation.reservationDate) === todayKey
    );
    const pendingReservations = reservations.filter((reservation) => reservation.status === 'PENDING');

    const todaysSales = sales.find((sale) => sale.date === todayKey);

    this.metrics.set({
      pendingReservations: pendingReservations.length,
      todaysReservations: todaysReservations.length,
      customers: customersCount,
      activeProducts,
      todaysSalesAmount: todaysSales?.totalSales ?? 0,
      todaysSalesOrders: todaysSales?.totalOrders ?? 0,
      currency: todaysSales?.currency ?? 'PEN'
    });
  }

  private normalizeSalesTrend(sales: DailySalesTotalsDTO[]): DailySalesTotalsDTO[] {
    return [...sales]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7);
  }

  private buildDateRanges(): { startOfWeekIso: string; endOfDayIso: string; todayKey: string } {
    const now = this.today;
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return {
      startOfWeekIso: this.toIsoDateTime(start),
      endOfDayIso: this.toIsoDateTime(end),
      todayKey: this.normalizeDate(now)
    };
  }

  private toIsoDateTime(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  private normalizeDate(value: string | Date): string {
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().slice(0, 10);
  }
}
