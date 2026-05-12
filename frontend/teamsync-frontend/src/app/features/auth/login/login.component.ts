import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { switchMap, finalize } from 'rxjs';
import { AuthService } from '../../../api/auth.service';
import { AuthStore } from '../../../store/auth.store';
import { TokenService } from '../../../core/services/token.service';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  template: `
    <div class="auth-page">
      <!-- Left decorative column -->
      <div class="auth-left">
        <div class="brand">
          <div class="brand-logo">TS</div>
          <h1 class="brand-name">TeamSync</h1>
        </div>
        <p class="tagline">Collaborate. Track. Deliver.</p>
        <div class="dot-grid"></div>
      </div>

      <!-- Right form column -->
      <div class="auth-right">
        <div class="auth-card">
          <h2 class="auth-title">Welcome back</h2>
          <p class="auth-subtitle">Sign in to your account</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
            <app-input
              label="Email"
              type="email"
              placeholder="you@example.com"
              formControlName="email"
              [error]="emailError">
            </app-input>

            <div class="password-field">
              <app-input
                label="Password"
                [type]="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                formControlName="password"
                [error]="passwordError">
              </app-input>
              <button type="button" class="toggle-pw" (click)="showPassword = !showPassword">
                {{ showPassword ? '🙈' : '👁' }}
              </button>
            </div>

            <app-button type="submit" [loading]="isLoading" [disabled]="isLoading" size="lg" style="width:100%">
              Sign In
            </app-button>
          </form>

          <p class="auth-link">
            Don't have an account? <a routerLink="/register">Register</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
    }
    @media (max-width: 768px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-left { display: none; }
    }
    .auth-left {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 48px;
      position: relative;
      overflow: hidden;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo {
      width: 52px; height: 52px;
      background: rgba(255,255,255,0.2);
      border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 18px; color: #fff;
    }
    .brand-name { color: #fff; font-size: 28px; font-weight: 800; margin: 0; }
    .tagline { color: rgba(255,255,255,0.8); font-size: 18px; font-weight: 500; margin: 0; }
    .dot-grid {
      position: absolute; bottom: 40px;
      width: 200px; height: 200px;
      background-image: radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px);
      background-size: 20px 20px;
    }
    .auth-right {
      display: flex; align-items: center; justify-content: center;
      padding: 48px;
    }
    .auth-card { width: 100%; max-width: 420px; }
    .auth-title { font-size: 26px; font-weight: 700; margin: 0 0 6px; }
    .auth-subtitle { color: var(--color-muted); margin: 0 0 28px; font-size: 14px; }
    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    .password-field { position: relative; }
    .toggle-pw {
      position: absolute; right: 12px; bottom: 10px;
      background: none; border: none; font-size: 16px;
      color: var(--color-muted); padding: 0;
    }
    .auth-link { margin: 20px 0 0; font-size: 14px; color: var(--color-muted); text-align: center; }
  `]
})
export default class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  showPassword = false;

  get emailError(): string {
    const ctrl = this.form.get('email');
    if (!ctrl?.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Email is required';
    if (ctrl.errors['email']) return 'Enter a valid email';
    return '';
  }

  get passwordError(): string {
    const ctrl = this.form.get('password');
    if (!ctrl?.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return 'Password is required';
    if (ctrl.errors['minlength']) return 'Password must be at least 6 characters';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading = true;
    const { email, password } = this.form.value;
    this.authService.login({ email: email!, password: password! }).pipe(
      switchMap(res => {
        this.tokenService.setToken(res.token);
        return this.authService.getMe();
      }),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: user => {
        this.authStore.setUser(user);
        this.router.navigate(['/dashboard']);
      },
      error: () => {}
    });
  }
}
