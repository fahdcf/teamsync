import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component')
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component')
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/page-wrapper/page-wrapper.component'),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component') },
      { path: 'workspaces', loadComponent: () => import('./features/workspace/workspace-list/workspace-list.component') },
      { path: 'workspaces/:id', loadComponent: () => import('./features/workspace/workspace-detail/workspace-detail.component') },
      { path: 'projects/:id', loadComponent: () => import('./features/project/project-detail/project-detail.component') },
      { path: 'projects/:id/board', loadComponent: () => import('./features/task/task-board/task-board.component') },
      { path: 'tasks/:id', loadComponent: () => import('./features/task/task-detail/task-detail.component') },
    ]
  },
  { path: 'patterns', loadComponent: () => import('./features/patterns/patterns.component') },
  { path: '**', redirectTo: 'dashboard' }
];
