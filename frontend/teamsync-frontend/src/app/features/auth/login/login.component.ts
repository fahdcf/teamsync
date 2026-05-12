import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  template: `<p>Login (coming soon) <a routerLink="/register">Register</a></p>`
})
export default class LoginComponent {}
