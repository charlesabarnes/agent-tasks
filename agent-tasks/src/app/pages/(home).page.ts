import { Component, inject } from '@angular/core';
import { RouteMeta } from '@analogjs/router';
import { authGuard } from '../guards/auth.guard';
import { AuthService } from '../services/auth.service';

export const routeMeta: RouteMeta = {
  canActivate: [authGuard],
};

@Component({
  selector: 'agent-tasks-home',
  template: `
    <main class="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 class="text-3xl font-medium mb-4">Multi-Tenant App</h1>
      <p class="text-zinc-500 mb-6">Organization management foundation</p>
      @if (auth.user(); as user) {
        <p class="text-zinc-600 mb-4">Welcome, {{ user.name }}</p>
      }
      <button
        (click)="auth.logout()"
        class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Sign out
      </button>
    </main>
  `,
})
export default class HomeComponent {
  auth = inject(AuthService);
}
