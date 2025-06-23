import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'forgot-password', renderMode: RenderMode.Prerender },
  { path: 'reset-password', renderMode: RenderMode.Prerender },
  { path: 'profile-settings', renderMode: RenderMode.Prerender },
  { path: 'my-applications', renderMode: RenderMode.Prerender },
  { path: 'jobs', renderMode: RenderMode.Prerender },
  { path: 'profile', renderMode: RenderMode.Prerender },
  { path: 'job-poster', renderMode: RenderMode.Prerender },
  { path: 'jobs/:id', renderMode: RenderMode.Server },
  { path: 'job-poster/applications/:id', renderMode: RenderMode.Server },
  { path: 'job-poster/edit-job/:id', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Prerender }
];
