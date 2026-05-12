import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationStore } from '../../store/notification.store';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-page-wrapper',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  template: `
    <div class="shell">
      <app-sidebar></app-sidebar>
      <div class="main">
        <app-navbar></app-navbar>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      flex-direction: row;
      height: 100vh;
      overflow: hidden;
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }
  `]
})
export default class PageWrapperComponent implements OnInit, OnDestroy {
  private readonly notifStore = inject(NotificationStore);

  ngOnInit(): void {
    this.notifStore.startPolling();
  }

  ngOnDestroy(): void {
    this.notifStore.stopPolling();
  }
}
