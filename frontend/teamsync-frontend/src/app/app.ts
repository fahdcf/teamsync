import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { fadeIn } from './app.animations';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [fadeIn],
})
export class App {
  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['title'] ?? outlet?.activatedRoute?.snapshot?.routeConfig?.path ?? '';
  }
}
