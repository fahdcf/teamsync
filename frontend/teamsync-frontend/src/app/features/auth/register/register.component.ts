import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../api/auth.service';
import { AuthStore } from '../../../store/auth.store';
import { TokenService } from '../../../core/services/token.service';
import { UserRole } from '../../../shared/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export default class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['TEAM_MEMBER' as UserRole],
  });

  isLoading = false;
  showPassword = false;
  serverError = '';

  fieldError(name: string): string {
    const ctrl = this.form.get(name);
    if (!ctrl?.touched || !ctrl.errors) return '';
    if (ctrl.errors['required']) return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    if (ctrl.errors['email']) return 'Enter a valid email';
    if (ctrl.errors['minlength']) return `Minimum ${ctrl.errors['minlength'].requiredLength} characters`;
    if (ctrl.errors['maxlength']) return `Maximum ${ctrl.errors['maxlength'].requiredLength} characters`;
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.serverError = '';
    const { email, password, username, role } = this.form.value;

    this.authService.register({ username: username!, email: email!, password: password!, role: role as UserRole }).pipe(
      switchMap(() => this.authService.login({ email: email!, password: password! })),
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
        else if (err.status === 409) this.serverError = 'Email or username is already in use.';
        else if (err.status === 400) this.serverError = 'Invalid registration data. Please check your inputs.';
        else this.serverError = 'Something went wrong. Please try again.';
      },
    });
  }
}
