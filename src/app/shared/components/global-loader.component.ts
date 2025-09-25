import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoaderService } from '../services/loader.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        display: block;
        pointer-events: none;
        z-index: 2000;
      }

      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(17, 24, 39, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: all;
      }

      .spinner {
        width: 3rem;
        height: 3rem;
        border-radius: 9999px;
        border: 4px solid rgba(255, 255, 255, 0.4);
        border-top-color: #2563eb;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `
  ],
  template: `
    @if (isVisible) {
      <div class="backdrop" role="alert" aria-busy="true" aria-live="assertive">
        <div class="spinner"></div>
      </div>
    }
  `
})
export class GlobalLoaderComponent {
  private readonly loaderService = inject(LoaderService);
  protected isVisible = false;

  constructor() {
    effect(() => {
      this.isVisible = this.loaderService.isLoading();
    });
  }
}
