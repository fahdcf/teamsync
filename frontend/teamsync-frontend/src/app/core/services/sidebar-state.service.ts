import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private readonly openSubject = new BehaviorSubject(false);
  readonly mobileOpen$ = this.openSubject.asObservable();

  toggle(): void { this.openSubject.next(!this.openSubject.value); }
  close(): void { this.openSubject.next(false); }
}
