import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar" [class]="'avatar--' + size" [style.background]="bgColor" [title]="user?.username">
      {{ initials }}
    </div>
  `,
  styles: [`
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: 600;
      color: #fff;
      flex-shrink: 0;
    }
    .avatar--sm { width: 28px; height: 28px; font-size: 11px; }
    .avatar--md { width: 36px; height: 36px; font-size: 14px; }
    .avatar--lg { width: 48px; height: 48px; font-size: 18px; }
  `]
})
export class AvatarComponent {
  @Input() user: User | null = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get initials(): string {
    const name = this.user?.username ?? '?';
    return name.slice(0, 2).toUpperCase();
  }

  get bgColor(): string {
    const name = this.user?.username ?? '';
    const colors = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}
