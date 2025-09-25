import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private readonly pendingRequests = signal(0);

  readonly isLoading = computed(() => this.pendingRequests() > 0);

  show(): void {
    this.pendingRequests.update((count) => count + 1);
  }

  hide(): void {
    this.pendingRequests.update((count) => (count > 0 ? count - 1 : 0));
  }

  reset(): void {
    this.pendingRequests.set(0);
  }
}
