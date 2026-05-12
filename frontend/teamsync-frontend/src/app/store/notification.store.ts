import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { Notification } from '../shared/models/notification.model';
import { NotificationService } from '../api/notification.service';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly notificationService = inject(NotificationService);
  private readonly notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private pollingInterval: any;

  readonly notifications$ = this.notificationsSubject.asObservable();
  readonly unreadCount$ = this.notifications$.pipe(map(n => n.filter(x => !x.readStatus).length));

  load(): void {
    this.notificationService.getAll().subscribe(n => this.notificationsSubject.next(n));
  }

  markRead(id: string): void {
    this.notificationService.markRead(id).subscribe(() => {
      const updated = this.notificationsSubject.value.map(n =>
        n.id === id ? { ...n, readStatus: true } : n
      );
      this.notificationsSubject.next(updated);
    });
  }

  markAllRead(): void {
    const unread = this.notificationsSubject.value.filter(n => !n.readStatus);
    unread.forEach(n => this.markRead(n.id));
  }

  startPolling(): void {
    this.load();
    this.pollingInterval = setInterval(() => this.load(), 30000);
  }

  stopPolling(): void {
    clearInterval(this.pollingInterval);
  }
}
