import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Workspace } from '../../shared/models/workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceContextService {
  private readonly storageKey = 'teamsync.activeWorkspaceId';
  private readonly selectedWorkspaceIdSubject = new BehaviorSubject<string | null>(this.readStoredWorkspaceId());

  readonly selectedWorkspaceId$ = this.selectedWorkspaceIdSubject.asObservable();

  get selectedWorkspaceId(): string | null {
    return this.selectedWorkspaceIdSubject.value;
  }

  selectWorkspace(workspaceId: string | null): void {
    this.selectedWorkspaceIdSubject.next(workspaceId);
    this.storeWorkspaceId(workspaceId);
  }

  syncAvailableWorkspaces(workspaces: Workspace[]): Workspace | null {
    if (!workspaces.length) {
      this.selectWorkspace(null);
      return null;
    }

    const current = this.selectedWorkspaceId;
    const selected = workspaces.find((workspace) => workspace.id === current) ?? workspaces[0];
    if (selected.id !== current) this.selectWorkspace(selected.id);
    return selected;
  }

  private readStoredWorkspaceId(): string | null {
    try {
      return window.localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  private storeWorkspaceId(workspaceId: string | null): void {
    try {
      if (workspaceId) {
        window.localStorage.setItem(this.storageKey, workspaceId);
      } else {
        window.localStorage.removeItem(this.storageKey);
      }
    } catch {
      // Local storage can be unavailable in private browsing or tests.
    }
  }
}
