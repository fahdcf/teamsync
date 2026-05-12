import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <div class="not-found-content">
        <p class="code">404</p>
        <h1 class="title">Page not found</h1>
        <p class="desc">The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--color-bg);
    }
    .not-found-content { text-align: center; }
    .code {
      font-size: 120px; font-weight: 900; margin: 0; line-height: 1;
      background: linear-gradient(135deg, var(--color-accent), #7c3aed);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .title { font-size: 28px; font-weight: 700; margin: 8px 0 12px; }
    .desc { color: var(--color-muted); font-size: 15px; margin: 0 0 28px; }
    .back-link {
      color: var(--color-accent); font-size: 15px; text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; }
  `]
})
export default class NotFoundComponent {}
