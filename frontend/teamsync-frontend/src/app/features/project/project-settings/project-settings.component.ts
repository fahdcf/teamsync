import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Project } from '../../../shared/models/project.model';
import { ProjectService } from '../../../api/project.service';
import { AuthStore } from '../../../store/auth.store';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent, ConfirmDialogComponent],
  template: `
    <div class="settings">
      <form [formGroup]="form" (ngSubmit)="save()" class="form">
        <h3>General</h3>
        <app-input label="Title" formControlName="title"></app-input>
        <app-input label="Description" formControlName="description"></app-input>
        <div class="field">
          <label class="field-label">Deadline</label>
          <input type="date" class="field-input" formControlName="deadline">
        </div>
        <app-button type="submit" size="sm" [loading]="isSaving">Save Changes</app-button>
      </form>

      <div *ngIf="canArchive" class="danger-zone">
        <h3>Danger Zone</h3>
        <div class="danger-row">
          <div>
            <strong>Archive this project</strong>
            <p>This will set the project status to ARCHIVED.</p>
          </div>
          <app-button variant="danger" size="sm" (click)="isConfirmOpen = true">Archive</app-button>
        </div>
      </div>
    </div>

    <app-confirm-dialog
      [isOpen]="isConfirmOpen"
      title="Archive project"
      message="Are you sure you want to archive this project?"
      confirmLabel="Archive"
      [danger]="true"
      (confirmed)="archive()"
      (cancelled)="isConfirmOpen = false">
    </app-confirm-dialog>
  `,
  styles: [`
    .settings { display: flex; flex-direction: column; gap: 32px; max-width: 600px; }
    .form { display: flex; flex-direction: column; gap: 16px; }
    .form h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field-label { font-size: 13px; font-weight: 500; color: var(--color-muted); }
    .field-input {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); color: var(--color-text); padding: 10px 14px; font-size: 14px; outline: none;
    }
    .danger-zone {
      border: 1px solid var(--color-danger); border-radius: var(--radius-lg);
      padding: 20px;
    }
    .danger-zone h3 { margin: 0 0 16px; color: var(--color-danger); font-size: 16px; }
    .danger-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .danger-row p { margin: 4px 0 0; font-size: 13px; color: var(--color-muted); }
  `]
})
export class ProjectSettingsComponent implements OnInit {
  @Input() project!: Project;
  @Output() updated = new EventEmitter<Project>();
  private readonly projectService = inject(ProjectService);
  private readonly authStore = inject(AuthStore);
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    deadline: ['']
  });

  isSaving = false;
  isConfirmOpen = false;

  get canArchive(): boolean {
    const role = this.authStore.getUser()?.role;
    return role === 'ADMIN' || role === 'PROJECT_MANAGER';
  }

  ngOnInit(): void {
    this.form.patchValue({
      title: this.project.title,
      description: this.project.description,
      deadline: this.project.deadline
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.isSaving = true;
    const { title, description, deadline } = this.form.value;
    this.projectService.update(this.project.id, { title: title!, description: description || '', deadline: deadline || '' }).subscribe({
      next: p => { this.updated.emit(p); this.isSaving = false; },
      error: () => { this.isSaving = false; }
    });
  }

  archive(): void {
    this.isConfirmOpen = false;
    this.projectService.archive(this.project.id).subscribe({
      next: p => this.updated.emit(p)
    });
  }
}
