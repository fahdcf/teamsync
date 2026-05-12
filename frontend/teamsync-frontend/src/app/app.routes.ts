import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    title: 'TeamSync | Home',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/landing/landing.component')
  },
  {
    path: 'login',
    title: 'Login | TeamSync',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component')
  },
  {
    path: 'register',
    title: 'Register | TeamSync',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component')
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/page-wrapper/page-wrapper.component'),
    children: [
      { path: 'dashboard', title: 'Dashboard | TeamSync', loadComponent: () => import('./features/dashboard/dashboard.component') },
      { path: 'workspaces', title: 'Workspaces | TeamSync', loadComponent: () => import('./features/workspace/workspace-list/workspace-list.component') },
      { path: 'workspaces/:id', title: 'Workspace | TeamSync', loadComponent: () => import('./features/workspace/workspace-detail/workspace-detail.component') },
      { path: 'projects', title: 'Projects | TeamSync', loadComponent: () => import('./features/project/project-list/project-list.component') },
      { path: 'projects/:id', title: 'Project | TeamSync', loadComponent: () => import('./features/project/project-detail/project-detail.component') },
      { path: 'projects/:id/board', title: 'Board | TeamSync', loadComponent: () => import('./features/task/task-board/task-board.component') },
      { path: 'tasks', title: 'Tasks | TeamSync', loadComponent: () => import('./features/task/task-list/task-list.component') },
      { path: 'tasks/:id', title: 'Task | TeamSync', loadComponent: () => import('./features/task/task-detail/task-detail.component') },
      { path: 'analytics', title: 'Analytics | TeamSync', loadComponent: () => import('./features/analytics/analytics.component') },
      { path: 'calendar', title: 'Calendar | TeamSync', loadComponent: () => import('./features/calendar/calendar.component') },
      { path: 'messages', title: 'Messages | TeamSync', loadComponent: () => import('./features/messages/messages.component') },
      { path: 'files', title: 'Files | TeamSync', loadComponent: () => import('./features/files/files.component') },
      { path: 'settings', title: 'Settings | TeamSync', loadComponent: () => import('./features/settings/settings.component') },
    ]
  },
  { path: 'patterns', title: 'Patterns | TeamSync', loadComponent: () => import('./features/patterns/patterns.component') },
  { path: '**', title: 'Not Found | TeamSync', loadComponent: () => import('./features/not-found/not-found.component') }
];
