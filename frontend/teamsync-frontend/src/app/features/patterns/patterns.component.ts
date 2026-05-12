import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PatternsService } from '../../api/patterns.service';
import { Pattern } from '../../shared/models/pattern.model';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type Category = 'ALL' | 'Creational' | 'Structural' | 'Behavioral';
type BadgeVariant = 'info' | 'accent' | 'success' | 'muted' | 'warning' | 'danger';

@Component({
  selector: 'app-patterns',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="patterns-page">
      <header class="patterns-header">
        <div class="header-brand">
          <div class="logo">TS</div>
          <span class="logo-text">TeamSync</span>
        </div>
        <div class="header-content">
          <h1>Design Patterns</h1>
          <p>14 GoF Design Patterns implemented across 3 categories</p>
        </div>
        <a routerLink="/dashboard" class="back-link">← Back to App</a>
      </header>

      <div class="category-tabs">
        <button *ngFor="let cat of categories"
          class="cat-btn"
          [class.active]="activeCategory === cat"
          (click)="onCategoryChange(cat)">
          {{ cat }}
        </button>
      </div>

      <div *ngIf="isLoading" class="patterns-grid">
        <app-skeleton *ngFor="let i of [1,2,3,4,5,6]" type="card"></app-skeleton>
      </div>

      <app-empty-state
        *ngIf="!isLoading && hasError"
        variant="error"
        description="Failed to load patterns"
        (action)="load()">
      </app-empty-state>

      <div *ngIf="!isLoading && !hasError" class="patterns-grid">
        <div *ngFor="let p of filteredPatterns" class="pattern-card">
          <div class="pattern-card-header">
            <app-badge [text]="p.category" [variant]="categoryVariant(p.category)"></app-badge>
            <span class="pattern-number">#{{ p.id }}</span>
          </div>
          <h3 class="pattern-name">{{ p.name }}</h3>
          <p class="pattern-purpose">{{ p.purpose }}</p>
          <div class="pattern-package">{{ p.package }}</div>
          <div class="pattern-classes">
            <span *ngFor="let cls of p.keyClasses" class="class-chip">{{ cls }}</span>
          </div>
        </div>
      </div>

      <footer class="patterns-footer">
        <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noopener">View API Docs →</a>
      </footer>
    </div>
  `,
  styles: [`
    .patterns-page {
      min-height: 100vh;
      background: var(--color-bg);
      padding: 0;
    }
    .patterns-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 40px; background: var(--color-surface);
      border-bottom: 1px solid var(--color-border); gap: 20px;
    }
    .header-brand { display: flex; align-items: center; gap: 10px; }
    .logo {
      width: 36px; height: 36px; background: var(--color-accent);
      border-radius: var(--radius-md); display: flex; align-items: center;
      justify-content: center; font-weight: 800; color: #fff; font-size: 13px;
    }
    .logo-text { font-weight: 700; font-size: 16px; }
    .header-content { flex: 1; text-align: center; }
    .header-content h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
    .header-content p { margin: 0; color: var(--color-muted); font-size: 14px; }
    .back-link { color: var(--color-accent); font-size: 14px; white-space: nowrap; }
    .category-tabs {
      display: flex; gap: 8px; padding: 20px 40px;
    }
    .cat-btn {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); color: var(--color-muted);
      padding: 8px 20px; font-size: 13px; font-weight: 500;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .cat-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
    .cat-btn.active { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
    .loading { display: flex; justify-content: center; padding: 80px; }
    /* legacy -- kept for potential re-use */
    .patterns-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 20px; padding: 0 40px 40px;
    }
    @media (max-width: 1024px) { .patterns-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 576px)  { .patterns-grid { grid-template-columns: 1fr; } }
    .pattern-card {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); padding: 20px;
      display: flex; flex-direction: column; gap: 10px;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .pattern-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    .pattern-card-header { display: flex; align-items: center; justify-content: space-between; }
    .pattern-number { font-size: 12px; color: var(--color-muted); font-weight: 600; }
    .pattern-name { margin: 0; font-size: 17px; font-weight: 700; }
    .pattern-purpose { margin: 0; font-size: 13px; color: var(--color-muted); line-height: 1.5; flex: 1; }
    .pattern-package { font-size: 11px; color: var(--color-muted); font-family: monospace; }
    .pattern-classes { display: flex; flex-wrap: wrap; gap: 6px; }
    .class-chip {
      background: rgba(99,102,241,0.1); color: var(--color-accent);
      border-radius: var(--radius-sm); padding: 2px 8px; font-size: 11px; font-family: monospace;
    }
    .patterns-footer {
      padding: 24px 40px; text-align: center; border-top: 1px solid var(--color-border);
    }
    .patterns-footer a { color: var(--color-accent); font-size: 14px; }
  `]
})
export default class PatternsComponent implements OnInit {
  private readonly patternsService = inject(PatternsService);

  patterns: Pattern[] = [];
  filteredPatterns: Pattern[] = [];
  activeCategory: Category = 'ALL';
  isLoading = true;
  hasError = false;

  readonly categories: Category[] = ['ALL', 'Creational', 'Structural', 'Behavioral'];

  categoryVariant(cat: string): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      Creational: 'info', Structural: 'accent', Behavioral: 'success'
    };
    return map[cat] ?? 'muted';
  }

  onCategoryChange(cat: Category): void {
    this.activeCategory = cat;
    this.filteredPatterns = cat === 'ALL'
      ? this.patterns
      : this.patterns.filter(p => p.category === cat);
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.isLoading = true;
    this.hasError = false;
    this.patternsService.getAll().subscribe({
      next: ps => {
        this.patterns = ps;
        this.filteredPatterns = ps;
        this.isLoading = false;
      },
      error: () => { this.hasError = true; this.isLoading = false; }
    });
  }
}
