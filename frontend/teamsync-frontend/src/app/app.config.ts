import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { Title } from '@angular/platform-browser';
import { Injectable } from '@angular/core';

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
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ]
};
