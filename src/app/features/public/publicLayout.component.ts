import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header class="p-2 border-b">Public</header>
    <main class="p-4">
      <router-outlet />
    </main>
  `
})
export class PublicLayoutComponent {}


