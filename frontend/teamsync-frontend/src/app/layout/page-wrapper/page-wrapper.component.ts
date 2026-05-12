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
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }
    .shell {
      display: flex;
      flex-direction: row;
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-height: 0;
    }
    .content {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
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
