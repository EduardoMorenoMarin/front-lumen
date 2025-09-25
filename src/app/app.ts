import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoaderComponent, ToastContainerComponent } from './shared';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoaderComponent, ToastContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
