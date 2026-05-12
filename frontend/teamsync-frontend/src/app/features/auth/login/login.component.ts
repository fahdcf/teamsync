import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../api/auth.service';
import { AuthStore } from '../../../store/auth.store';
import { TokenService } from '../../../core/services/token.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export default class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = false;
  showPassword = false;
  serverError = '';

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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.serverError = '';
    const { email, password } = this.form.value;

    this.authService.login({ email: email!, password: password! }).pipe(
      switchMap((res) => {
        this.tokenService.setToken(res.token);
        return this.authService.getMe();
      }),
      finalize(() => (this.isLoading = false)),
    ).subscribe({
      next: (user) => {
        this.authStore.setUser(user);
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) this.serverError = 'Cannot connect to server. Please try again.';
        else if (err.status === 401 || err.status === 400) this.serverError = 'Invalid email or password.';
        else this.serverError = 'Something went wrong. Please try again.';
      },
    });
  }
}
