import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportsApi } from '../../../core/api';
import { DailySalesTotalsDTO } from '../../../core/models/sale';
import { CurrencyFormatPipe, DateFormatPipe, ToastService } from '../../../shared';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type Period = 'daily' | 'weekly';

interface ReportFormValue {
  period: Period;
  start: string;
  end: string;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyFormatPipe, DateFormatPipe],
  styleUrls: ['./reports.component.css'],
  templateUrl: './reports.component.html'
})
export class AdminReportsComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly reportsApi = inject(ReportsApi);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly periods: Array<{ value: Period; label: string }> = [
    { value: 'daily', label: 'Diario' },
    { value: 'weekly', label: 'Semanal' }
  ];

  protected readonly filters = this.fb.group({
    period: this.fb.control<Period>('daily', { validators: [Validators.required] }),
    start: this.fb.control<string>(this.defaultStartDate, { validators: [Validators.required] }),
    end: this.fb.control<string>(this.defaultEndDate, { validators: [Validators.required] })
  });

  protected readonly isFetching = signal(false);
  protected readonly results = signal<DailySalesTotalsDTO[]>([]);
  protected readonly maxTotal = computed(() =>
    this.results().reduce((max, item) => Math.max(max, item.totalSales), 0)
  );

  protected readonly totals = computed(() => {
    const items = this.results();
    if (!items.length) {
      return { amount: 0, orders: 0, currency: 'PEN' };
    }

    return items.reduce(
      (acc, item) => ({
        amount: acc.amount + item.totalSales,
        orders: acc.orders + item.totalOrders,
        currency: item.currency || acc.currency
      }),
      { amount: 0, orders: 0, currency: items[0]?.currency ?? 'PEN' }
    );
  });

  private get defaultStartDate(): string {
    const now = new Date();
    const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return past.toISOString().slice(0, 10);
  }

  private get defaultEndDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  constructor() {
    this.loadReports();
  }

  protected loadReports(): void {
    if (this.filters.invalid) {
      this.filters.markAllAsTouched();
      this.toastService.warning('Completa los filtros para generar el reporte.');
      return;
    }

    const { period, start, end } = this.filters.getRawValue() as ReportFormValue;

    if (new Date(start) > new Date(end)) {
      this.toastService.warning('La fecha de inicio no puede ser posterior a la fecha fin.');
      return;
    }

    this.isFetching.set(true);

    const source = period === 'weekly' ? this.reportsApi.weekly(start, end) : this.reportsApi.daily(start, end);

    source
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isFetching.set(false)))
      .subscribe({
        next: (data) => {
          this.results.set(data);
          if (!data.length) {
            this.toastService.info('No se encontraron resultados para el rango seleccionado.');
          }
        },
        error: () => {
          this.results.set([]);
        }
      });
  }

  protected exportCsv(): void {
    const data = this.results();
    if (!data.length) {
      this.toastService.info('No hay datos para exportar.');
      return;
    }

    const header = 'fecha,total_ventas,pedidos,moneda';
    const rows = data
      .map((item) => `${item.date},${item.totalSales},${item.totalOrders},${item.currency}`)
      .join('\n');
    const blob = new Blob([`${header}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${this.filters.controls.period.value}-${this.filters.controls.start.value}-${this.filters.controls.end.value}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.toastService.success('Reporte exportado con éxito.');
  }
}
