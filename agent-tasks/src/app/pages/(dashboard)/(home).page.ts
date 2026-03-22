import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';

@Component({
  selector: 'app-home',
  template: `
    <div class="p-8">
      @if (workspace.currentProject(); as project) {
        <div class="mb-6">
          <h1 class="text-2xl font-semibold text-gray-900">{{ project.name }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ project.slug }} &middot; {{ workspace.currentOrg()?.name }}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Tasks</h3>
            <p class="text-2xl font-semibold text-gray-900">{{ project.taskCounter }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Project Key</h3>
            <p class="text-2xl font-mono font-semibold text-indigo-600">{{ project.slug }}</p>
          </div>
          <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 class="text-sm font-medium text-gray-500 mb-2">Organization</h3>
            <p class="text-2xl font-semibold text-gray-900">{{ workspace.currentOrg()?.name }}</p>
          </div>
        </div>
      } @else if (workspace.currentOrg()) {
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 mb-2">{{ workspace.currentOrg()?.name }}</h1>
          <p class="text-gray-500">No projects yet. Create one to get started.</p>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center h-64">
          <h1 class="text-2xl font-semibold text-gray-900 mb-2">Welcome, {{ auth.user()?.name }}</h1>
          <p class="text-gray-500">Select an organization to get started.</p>
        </div>
      }
    </div>
  `,
})
export default class HomeComponent {
  auth = inject(AuthService);
  workspace = inject(WorkspaceService);
}
