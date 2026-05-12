import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Contact { id: string; name: string; role: string; initials: string; color: string; lastMsg: string; time: string; unread: number; }
interface Message { id: string; text: string; sent: boolean; time: string; }

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-page">
      <!-- Sidebar -->
      <aside class="contacts-panel">
        <div class="panel-header"><h1>Messages</h1></div>
        <div class="search-bar">
          <input type="text" placeholder="Search conversations…" [(ngModel)]="search" />
        </div>
        <div class="contacts-list">
          <button class="contact-item" *ngFor="let c of filteredContacts"
            [class.active]="selected?.id === c.id"
            (click)="select(c)" type="button">
            <div class="contact-avatar" [style.background]="c.color">{{ c.initials }}</div>
            <div class="contact-info">
              <div class="contact-top">
                <span class="contact-name">{{ c.name }}</span>
                <span class="contact-time">{{ c.time }}</span>
              </div>
              <div class="contact-bottom">
                <span class="contact-preview">{{ c.lastMsg }}</span>
                <span class="unread-badge" *ngIf="c.unread">{{ c.unread }}</span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      <!-- Thread -->
      <main class="thread-panel" *ngIf="selected; else noSelect">
        <div class="thread-header">
          <div class="thread-avatar" [style.background]="selected.color">{{ selected.initials }}</div>
          <div>
            <div class="thread-name">{{ selected.name }}</div>
            <div class="thread-role">{{ selected.role }}</div>
          </div>
        </div>
        <div class="messages-list">
          <div class="message-group" *ngFor="let msg of currentMessages"
            [class.sent]="msg.sent" [class.received]="!msg.sent">
            <div class="bubble">{{ msg.text }}</div>
            <span class="msg-time">{{ msg.time }}</span>
          </div>
        </div>
        <div class="message-input-bar">
          <input type="text" class="msg-input" placeholder="Type a message…"
            [(ngModel)]="newMessage" (keydown.enter)="send()" />
          <button class="send-btn" (click)="send()" type="button">Send</button>
        </div>
      </main>
      <ng-template #noSelect>
        <main class="thread-panel empty-thread">
          <div class="empty-thread-inner">
            <div class="empty-icon">💬</div>
            <p>Select a conversation</p>
          </div>
        </main>
      </ng-template>
    </div>
  `,
  styles: [`
    .messages-page { display:flex; height:100%; background:var(--bg-base); color:var(--text-primary); overflow:hidden; }
    .contacts-panel { width:280px; flex-shrink:0; border-right:1px solid var(--border-subtle); background:var(--bg-surface); display:flex; flex-direction:column; overflow:hidden; }
    .panel-header { padding:24px 20px 12px; }
    h1 { font-size:20px; font-weight:600; }
    .search-bar { padding:0 12px 12px; }
    .search-bar input { width:100%; height:32px; padding:0 12px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-full); color:var(--text-primary); font-size:13px; outline:none; }
    .search-bar input::placeholder { color:var(--text-tertiary); }
    .contacts-list { flex:1; overflow-y:auto; }
    .contact-item { width:100%; display:flex; gap:12px; align-items:center; padding:12px 16px; border:none; background:transparent; cursor:pointer; transition:background 0.12s; text-align:left; }
    .contact-item:hover { background:var(--bg-elevated); }
    .contact-item.active { background:var(--bg-elevated); border-left:2px solid var(--accent); }
    .contact-avatar { width:38px; height:38px; border-radius:50%; color:#fff; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .contact-info { flex:1; min-width:0; }
    .contact-top { display:flex; justify-content:space-between; margin-bottom:3px; }
    .contact-name { font-size:13px; font-weight:500; color:var(--text-primary); }
    .contact-time { font-size:11px; color:var(--text-tertiary); }
    .contact-bottom { display:flex; justify-content:space-between; align-items:center; }
    .contact-preview { font-size:12px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
    .unread-badge { min-width:18px; height:18px; border-radius:9px; background:var(--accent); color:#0c0c0e; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; padding:0 4px; margin-left:6px; }
    .thread-panel { flex:1; display:flex; flex-direction:column; overflow:hidden; }
    .thread-header { padding:16px 24px; border-bottom:1px solid var(--border-subtle); background:var(--bg-surface); display:flex; align-items:center; gap:12px; }
    .thread-avatar { width:38px; height:38px; border-radius:50%; color:#fff; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .thread-name { font-size:14px; font-weight:600; color:var(--text-primary); }
    .thread-role { font-size:12px; color:var(--text-secondary); }
    .messages-list { flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:16px; }
    .message-group { display:flex; flex-direction:column; gap:4px; max-width:65%; }
    .message-group.sent { align-self:flex-end; align-items:flex-end; }
    .message-group.received { align-self:flex-start; align-items:flex-start; }
    .bubble { padding:10px 14px; border-radius:18px; font-size:13px; line-height:1.5; }
    .sent .bubble { background:var(--accent); color:#0c0c0e; border-bottom-right-radius:4px; }
    .received .bubble { background:var(--bg-elevated); color:var(--text-primary); border-bottom-left-radius:4px; }
    .msg-time { font-size:10px; color:var(--text-tertiary); margin:0 6px; }
    .message-input-bar { padding:16px 24px; border-top:1px solid var(--border-subtle); background:var(--bg-surface); display:flex; gap:10px; }
    .msg-input { flex:1; height:40px; padding:0 16px; background:var(--bg-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-full); color:var(--text-primary); font-size:13px; outline:none; transition:border-color 0.15s; }
    .msg-input:focus { border-color:var(--border-default); }
    .msg-input::placeholder { color:var(--text-tertiary); }
    .send-btn { height:40px; padding:0 20px; background:var(--accent); border:none; border-radius:var(--radius-full); color:#0c0c0e; font-size:13px; font-weight:600; cursor:pointer; transition:background 0.15s; }
    .send-btn:hover { background:var(--accent-hover); }
    .empty-thread { align-items:center; justify-content:center; }
    .empty-thread-inner { display:flex; flex-direction:column; align-items:center; gap:12px; color:var(--text-secondary); }
    .empty-icon { font-size:48px; opacity:0.4; }
    .empty-thread-inner p { font-size:16px; }
  `]
})
export default class MessagesComponent implements OnInit {
  search = '';
  newMessage = '';
  selected: Contact | null = null;
  messageMap: Record<string, Message[]> = {};

  contacts: Contact[] = [
    { id:'1', name:'Emma Wilson', role:'Team Member', initials:'EW', color:'linear-gradient(135deg,#c18c60,#2f5874)', lastMsg:'Sure, I will update the task.', time:'2m', unread:2 },
    { id:'2', name:'Mike Johnson', role:'Project Manager', initials:'MJ', color:'linear-gradient(135deg,#8b5cf6,#3b82f6)', lastMsg:'Can you review the PR?', time:'15m', unread:0 },
    { id:'3', name:'Sarah Chen', role:'Designer', initials:'SC', color:'linear-gradient(135deg,#f59e0b,#ef4444)', lastMsg:'Design is ready for review.', time:'1h', unread:1 },
    { id:'4', name:'David Park', role:'Developer', initials:'DP', color:'linear-gradient(135deg,#4ade80,#3b82f6)', lastMsg:'Tests are passing now.', time:'3h', unread:0 },
    { id:'5', name:'Lisa Turner', role:'QA Engineer', initials:'LT', color:'linear-gradient(135deg,#ec4899,#8b5cf6)', lastMsg:'Found 2 bugs, logging now.', time:'1d', unread:0 },
  ];

  get filteredContacts(): Contact[] {
    return this.search ? this.contacts.filter(c => c.name.toLowerCase().includes(this.search.toLowerCase())) : this.contacts;
  }

  get currentMessages(): Message[] {
    return this.selected ? (this.messageMap[this.selected.id] || []) : [];
  }

  ngOnInit(): void {
    this.messageMap = {
      '1': [
        { id:'a', text:'Hey! Can you check the dashboard task?', sent:false, time:'10:02 AM' },
        { id:'b', text:'Sure, on it right now.', sent:true, time:'10:04 AM' },
        { id:'c', text:'Sure, I will update the task.', sent:false, time:'10:05 AM' },
      ],
      '2': [
        { id:'a', text:'Hi, I pushed a fix for the layout bug.', sent:true, time:'9:30 AM' },
        { id:'b', text:'Can you review the PR?', sent:false, time:'9:45 AM' },
      ],
      '3': [
        { id:'a', text:'The new mockups are done!', sent:false, time:'Yesterday' },
        { id:'b', text:'Looks great, will check now.', sent:true, time:'Yesterday' },
        { id:'c', text:'Design is ready for review.', sent:false, time:'8:00 AM' },
      ],
      '4': [{ id:'a', text:'Tests are passing now.', sent:false, time:'7:00 AM' }],
      '5': [{ id:'a', text:'Found 2 bugs, logging now.', sent:false, time:'Yesterday' }],
    };
  }

  select(c: Contact): void {
    this.selected = c;
    c.unread = 0;
  }

  send(): void {
    if (!this.newMessage.trim() || !this.selected) return;
    const msgs = this.messageMap[this.selected.id] || [];
    msgs.push({ id: Date.now().toString(), text: this.newMessage.trim(), sent: true, time: 'Just now' });
    this.messageMap[this.selected.id] = msgs;
    this.selected.lastMsg = this.newMessage.trim();
    this.newMessage = '';
  }
}
