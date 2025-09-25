import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly counter = signal(0);
  private readonly messagesSignal = signal<ToastMessage[]>([]);

  readonly messages = this.messagesSignal.asReadonly();

  success(message: string, title = 'Éxito'): void {
    this.push({ type: 'success', message, title });
  }

  info(message: string, title = 'Información'): void {
    this.push({ type: 'info', message, title });
  }

  warning(message: string, title = 'Atención'): void {
    this.push({ type: 'warning', message, title });
  }

  error(message: string, title = 'Error'): void {
    this.push({ type: 'error', message, title });
  }

  dismiss(id: number): void {
    this.messagesSignal.update((messages) => messages.filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.messagesSignal.set([]);
  }

  private push(config: Omit<ToastMessage, 'id'>): void {
    const id = this.counter() + 1;
    this.counter.set(id);
    const toast: ToastMessage = {
      timeout: 5000,
      ...config,
      id
    };

    this.messagesSignal.update((messages) => [...messages, toast]);

    if (toast.timeout && toast.timeout > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(id), toast.timeout);
    }
  }
}
