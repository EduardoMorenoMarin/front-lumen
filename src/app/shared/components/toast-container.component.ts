import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      :host {
        position: fixed;
        right: 1rem;
        top: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        z-index: 2100;
        width: min(24rem, 90vw);
      }

      .toast {
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        color: #0b1120;
        background: #f8fafc;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
        border-left: 6px solid transparent;
        display: grid;
        gap: 0.25rem;
      }

      .toast--success {
        border-left-color: #16a34a;
      }

      .toast--info {
        border-left-color: #2563eb;
      }

      .toast--warning {
        border-left-color: #f59e0b;
      }

      .toast--error {
        border-left-color: #dc2626;
      }

      .toast__title {
        font-weight: 600;
      }

      button.close {
        justify-self: end;
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 0.85rem;
      }
    `
  ],
  template: `
    @for (toast of toastService.messages(); track toast.id) {
      <div class="toast toast--{{ toast.type }}" role="alert" aria-live="assertive">
        @if (toast.title) {
          <span class="toast__title">{{ toast.title }}</span>
        }
        <span>{{ toast.message }}</span>
        <button type="button" class="close" (click)="toastService.dismiss(toast.id)">
          ×
        </button>
      </div>
    }
  `
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
