import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink],
  template: `<p>Register (coming soon) <a routerLink="/login">Login</a></p>`
})
export default class RegisterComponent {}
