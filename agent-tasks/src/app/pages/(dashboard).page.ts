import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { authGuard } from '../guards/auth.guard';
import { AuthService } from '../services/auth.service';
import {
  WorkspaceService,
  WorkspaceOrganization,
  WorkspaceProject,
} from '../services/workspace.service';

export const routeMeta: RouteMeta = {
  canActivate: [authGuard],
};

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet],
  template: `
    <div class="flex h-screen bg-white">
      <!-- Sidebar -->
      <aside
        class="w-64 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col"
      >
        <!-- Org Switcher -->
        <div class="relative px-3 pt-4 pb-2">
          <button
            (click)="orgDropdownOpen.set(!orgDropdownOpen())"
            class="w-full flex items-center gap-2 px-2 py-2 text-sm font-semibold text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span
              class="flex items-center justify-center w-7 h-7 rounded-md bg-indigo-600 text-white text-xs font-bold shrink-0"
            >
              {{ orgInitials() }}
            </span>
            <span class="truncate flex-1 text-left">{{
              workspace.currentOrg()?.name ?? 'Select Organization'
            }}</span>
            <svg
              class="w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </button>

          @if (orgDropdownOpen()) {
          <div
            class="absolute left-3 right-3 mt-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
          >
            @for (org of workspace.organizations(); track org.id) {
            <button
              (click)="selectOrg(org)"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              [class.bg-indigo-50]="org.id === workspace.currentOrg()?.id"
              [class.text-indigo-700]="org.id === workspace.currentOrg()?.id"
            >
              <span
                class="flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0"
                [class.bg-indigo-600]="org.id === workspace.currentOrg()?.id"
                [class.text-white]="org.id === workspace.currentOrg()?.id"
                [class.bg-gray-200]="org.id !== workspace.currentOrg()?.id"
                [class.text-gray-600]="org.id !== workspace.currentOrg()?.id"
              >
                {{ org.name.charAt(0).toUpperCase() }}
              </span>
              <span class="truncate">{{ org.name }}</span>
              @if (org.isPersonal) {
              <span
                class="ml-auto text-xs text-gray-400 shrink-0"
                >Personal</span
              >
              }
            </button>
            }
          </div>
          }
        </div>

        <div class="h-px bg-gray-200 mx-3"></div>

        <!-- Projects Section -->
        <div class="flex-1 overflow-y-auto px-3 py-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >Projects</span
            >
            <button
              class="p-0.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"
              title="Create project"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          @if (workspace.projects().length === 0) {
          <p class="text-xs text-gray-400 px-2 py-4">No projects yet</p>
          } @for (project of workspace.projects(); track project.id) {
          <button
            (click)="selectProject(project)"
            class="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors mb-0.5"
            [class.bg-indigo-50]="
              project.id === workspace.currentProject()?.id
            "
            [class.text-indigo-700]="
              project.id === workspace.currentProject()?.id
            "
            [class.font-medium]="
              project.id === workspace.currentProject()?.id
            "
            [class.text-gray-700]="
              project.id !== workspace.currentProject()?.id
            "
            [class.hover:bg-gray-100]="
              project.id !== workspace.currentProject()?.id
            "
          >
            <span
              class="text-xs font-mono px-1 py-0.5 rounded shrink-0"
              [class.bg-indigo-100]="
                project.id === workspace.currentProject()?.id
              "
              [class.text-indigo-600]="
                project.id === workspace.currentProject()?.id
              "
              [class.bg-gray-200]="
                project.id !== workspace.currentProject()?.id
              "
              [class.text-gray-500]="
                project.id !== workspace.currentProject()?.id
              "
              >{{ project.slug }}</span
            >
            <span class="truncate">{{ project.name }}</span>
          </button>
          }
        </div>

        <div class="h-px bg-gray-200 mx-3"></div>

        <!-- Navigation Links -->
        <nav class="px-3 py-3 space-y-0.5">
          <a
            class="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
              />
            </svg>
            Board
          </a>
          <a
            class="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            Backlog
          </a>
          <a
            class="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <svg
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            My Tasks
          </a>
        </nav>

        <div class="h-px bg-gray-200 mx-3"></div>

        <!-- User Menu -->
        <div class="relative px-3 py-3">
          <button
            (click)="userMenuOpen.set(!userMenuOpen())"
            class="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span
              class="flex items-center justify-center w-7 h-7 rounded-full bg-gray-300 text-gray-700 text-xs font-bold shrink-0"
            >
              {{ userInitial() }}
            </span>
            <span class="truncate flex-1 text-left">{{
              auth.user()?.name
            }}</span>
          </button>

          @if (userMenuOpen()) {
          <div
            class="absolute left-3 right-3 bottom-full mb-1 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
          >
            <div class="px-3 py-2 border-b border-gray-100">
              <p class="text-sm font-medium text-gray-900">
                {{ auth.user()?.name }}
              </p>
              <p class="text-xs text-gray-500">{{ auth.user()?.email }}</p>
            </div>
            <button
              (click)="logout()"
              class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign out
            </button>
          </div>
          }
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-auto bg-white">
        <router-outlet />
      </main>
    </div>
  `,
})
export default class DashboardLayoutComponent {
  auth = inject(AuthService);
  workspace = inject(WorkspaceService);

  orgDropdownOpen = signal(false);
  userMenuOpen = signal(false);

  orgInitials = () => {
    const name = this.workspace.currentOrg()?.name;
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  userInitial = () => {
    const name = this.auth.user()?.name;
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  async selectOrg(org: WorkspaceOrganization) {
    this.orgDropdownOpen.set(false);
    await this.workspace.setOrganization(org);
  }

  selectProject(project: WorkspaceProject) {
    this.workspace.setProject(project);
  }

  async logout() {
    this.userMenuOpen.set(false);
    this.workspace.reset();
    await this.auth.logout();
  }
}
