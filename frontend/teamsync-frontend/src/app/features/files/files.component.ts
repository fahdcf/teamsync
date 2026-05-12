import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FileItem { id:string; name:string; type:'pdf'|'doc'|'img'|'zip'|'xls'|'other'; size:string; modified:string; uploader:string; initials:string; color:string; }

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="files-page">
      <header class="page-header">
        <div class="header-left"><h1>Files</h1><span class="count-badge">{{ filtered.length }}</span></div>
        <div class="header-actions">
          <label class="search-bar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="6" r="4"/><path d="M9.5 9.5l3 3" stroke-linecap="round"/></svg>
            <input type="text" placeholder="Search files…" [(ngModel)]="search" (ngModelChange)="applyFilter()" />
          </label>
          <div class="type-filters">
            <button class="type-btn" *ngFor="let t of typeFilters"
              [class.active]="activeType === t.value"
              (click)="setType(t.value)" type="button">{{ t.label }}</button>
          </div>
          <button class="upload-btn" type="button">↑ Upload</button>
        </div>
      </header>

      <div class="files-grid">
        <article class="file-card" *ngFor="let file of filtered">
          <div class="file-icon" [class]="file.type">{{ typeIcon(file.type) }}</div>
          <div class="file-body">
            <div class="file-name" [title]="file.name">{{ file.name }}</div>
            <div class="file-meta">
              <span>{{ file.size }}</span>
              <span class="dot-sep">·</span>
              <span>{{ file.modified }}</span>
            </div>
          </div>
          <div class="file-footer">
            <div class="uploader-row">
              <div class="uploader-avatar" [style.background]="file.color">{{ file.initials }}</div>
              <span class="uploader-name">{{ file.uploader }}</span>
            </div>
            <button class="dl-btn" type="button" title="Download">↓</button>
          </div>
        </article>
      </div>

      <div class="empty-state" *ngIf="!filtered.length">
        <div class="empty-icon">📁</div>
        <p>No files found</p>
      </div>
    </div>
  `,
  styles: [`
    .files-page { min-height:100%; padding:32px; background:var(--bg-base); color:var(--text-primary); }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:28px; flex-wrap:wrap; }
    .header-left { display:flex; align-items:center; gap:12px; }
    h1 { font-size:24px; font-weight:600; }
    .count-badge { height:22px; padding:0 8px; border-radius:var(--radius-full); background:var(--bg-elevated); border:1px solid var(--border-subtle); font-size:12px; color:var(--text-secondary); display:inline-flex; align-items:center; }
    .header-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .search-bar { height:34px; padding:0 12px; border-radius:var(--radius-full); border:1px solid var(--border-subtle); background:var(--bg-elevated); display:flex; align-items:center; gap:8px; color:var(--text-tertiary); }
    .search-bar input { border:none; background:transparent; color:var(--text-primary); font-size:13px; outline:none; width:160px; }
    .search-bar input::placeholder { color:var(--text-tertiary); }
    .type-filters { display:flex; gap:4px; background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:3px; }
    .type-btn { height:26px; padding:0 10px; border-radius:var(--radius-md); border:none; background:transparent; color:var(--text-secondary); font-size:12px; cursor:pointer; transition:all 0.15s; }
    .type-btn.active { background:var(--bg-elevated); color:var(--text-primary); }
    .type-btn:hover:not(.active) { color:var(--text-primary); }
    .upload-btn { height:34px; padding:0 16px; border:none; border-radius:var(--radius-md); background:var(--accent); color:#0c0c0e; font-size:13px; font-weight:600; cursor:pointer; transition:background 0.15s; }
    .upload-btn:hover { background:var(--accent-hover); }
    .files-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:14px; }
    .file-card { background:var(--bg-surface); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:18px; display:flex; flex-direction:column; gap:14px; transition:border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
    .file-card:hover { border-color:var(--border-default); box-shadow:var(--shadow-md); transform:translateY(-1px); }
    .file-icon { width:48px; height:48px; border-radius:var(--radius-lg); display:flex; align-items:center; justify-content:center; font-size:22px; }
    .file-icon.pdf { background:rgba(239,68,68,0.15); }
    .file-icon.doc { background:rgba(96,165,250,0.15); }
    .file-icon.img { background:rgba(74,222,128,0.15); }
    .file-icon.zip { background:rgba(245,158,11,0.15); }
    .file-icon.xls { background:rgba(74,222,128,0.12); }
    .file-icon.other { background:var(--bg-elevated); }
    .file-body { flex:1; }
    .file-name { font-size:13px; font-weight:500; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px; }
    .file-meta { font-size:11px; color:var(--text-tertiary); display:flex; gap:4px; }
    .dot-sep { color:var(--border-default); }
    .file-footer { display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid var(--border-subtle); }
    .uploader-row { display:flex; align-items:center; gap:7px; }
    .uploader-avatar { width:22px; height:22px; border-radius:50%; color:#fff; font-size:8px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .uploader-name { font-size:11px; color:var(--text-secondary); }
    .dl-btn { width:26px; height:26px; border:1px solid var(--border-subtle); border-radius:var(--radius-md); background:transparent; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
    .dl-btn:hover { border-color:var(--accent); color:var(--accent); }
    .empty-state { display:flex; flex-direction:column; align-items:center; gap:8px; padding:80px 0; color:var(--text-secondary); }
    .empty-icon { font-size:40px; opacity:0.4; }
    .empty-state p { font-size:16px; color:var(--text-primary); }
  `]
})
export default class FilesComponent {
  search = '';
  activeType = 'ALL';
  filtered: FileItem[] = [];

  readonly typeFilters = [
    {label:'All', value:'ALL'},{label:'PDF', value:'pdf'},{label:'Docs', value:'doc'},
    {label:'Images', value:'img'},{label:'Archives', value:'zip'},{label:'Sheets', value:'xls'}
  ];

  readonly files: FileItem[] = [
    {id:'1',name:'Project Brief Q2 2025.pdf',type:'pdf',size:'2.4 MB',modified:'May 10',uploader:'Emma Wilson',initials:'EW',color:'linear-gradient(135deg,#c18c60,#2f5874)'},
    {id:'2',name:'Design System v2.0.fig',type:'img',size:'18.7 MB',modified:'May 9',uploader:'Sarah Chen',initials:'SC',color:'linear-gradient(135deg,#f59e0b,#ef4444)'},
    {id:'3',name:'Sprint Planning Notes.docx',type:'doc',size:'340 KB',modified:'May 8',uploader:'Mike Johnson',initials:'MJ',color:'linear-gradient(135deg,#8b5cf6,#3b82f6)'},
    {id:'4',name:'API Documentation.pdf',type:'pdf',size:'1.1 MB',modified:'May 7',uploader:'David Park',initials:'DP',color:'linear-gradient(135deg,#4ade80,#3b82f6)'},
    {id:'5',name:'Budget Report 2025.xlsx',type:'xls',size:'890 KB',modified:'May 6',uploader:'Lisa Turner',initials:'LT',color:'linear-gradient(135deg,#ec4899,#8b5cf6)'},
    {id:'6',name:'Source Assets v3.zip',type:'zip',size:'45.2 MB',modified:'May 5',uploader:'Emma Wilson',initials:'EW',color:'linear-gradient(135deg,#c18c60,#2f5874)'},
    {id:'7',name:'Meeting Recording May.mp4',type:'img',size:'280 MB',modified:'May 4',uploader:'Mike Johnson',initials:'MJ',color:'linear-gradient(135deg,#8b5cf6,#3b82f6)'},
    {id:'8',name:'Technical Spec.docx',type:'doc',size:'520 KB',modified:'May 3',uploader:'David Park',initials:'DP',color:'linear-gradient(135deg,#4ade80,#3b82f6)'},
    {id:'9',name:'User Research Report.pdf',type:'pdf',size:'3.8 MB',modified:'May 2',uploader:'Sarah Chen',initials:'SC',color:'linear-gradient(135deg,#f59e0b,#ef4444)'},
    {id:'10',name:'Component Library.zip',type:'zip',size:'12.1 MB',modified:'May 1',uploader:'Emma Wilson',initials:'EW',color:'linear-gradient(135deg,#c18c60,#2f5874)'},
    {id:'11',name:'Analytics Dashboard.xlsx',type:'xls',size:'1.4 MB',modified:'Apr 30',uploader:'Lisa Turner',initials:'LT',color:'linear-gradient(135deg,#ec4899,#8b5cf6)'},
    {id:'12',name:'Brand Guidelines.pdf',type:'pdf',size:'5.2 MB',modified:'Apr 29',uploader:'Sarah Chen',initials:'SC',color:'linear-gradient(135deg,#f59e0b,#ef4444)'},
  ];

  constructor() { this.applyFilter(); }

  setType(value: string): void { this.activeType = value; this.applyFilter(); }

  applyFilter(): void {
    this.filtered = this.files.filter(f => {
      const typeOk = this.activeType === 'ALL' || f.type === this.activeType;
      const searchOk = !this.search || f.name.toLowerCase().includes(this.search.toLowerCase());
      return typeOk && searchOk;
    });
  }

  typeIcon(type: FileItem['type']): string {
    const map: Record<string, string> = { pdf:'📄', doc:'📝', img:'🖼️', zip:'📦', xls:'📊', other:'📁' };
    return map[type] ?? '📁';
  }
}
