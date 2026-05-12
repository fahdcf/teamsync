import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Title } from '@angular/platform-browser';
import { Injectable } from '@angular/core';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

@Injectable({ providedIn: 'root' })
class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) { super(); }
  override updateTitle(snapshot: RouterStateSnapshot): void {
    const t = this.buildTitle(snapshot);
    this.title.setTitle(t ?? 'TeamSync');
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    provideToastr({ timeOut: 3000, positionClass: 'toast-top-right', preventDuplicates: true }),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ]
};
