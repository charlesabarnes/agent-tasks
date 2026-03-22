import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  imports: [RouterOutlet, RouterLink, ReactiveFormsModule],
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
            <div class="h-px bg-gray-200 my-1"></div>
            <button
              (click)="openCreateOrg()"
              class="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Organization
            </button>
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
              (click)="openCreateProject()"
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
          <a
            routerLink="/members"
            class="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Members
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

    <!-- Create Project Modal -->
    @if (createProjectOpen()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div
        class="absolute inset-0 bg-black/50"
        (click)="closeCreateProject()"
      ></div>
      <div
        class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
      >
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Create project
        </h2>

        @if (createProjectError()) {
        <div
          class="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {{ createProjectError() }}
        </div>
        }

        <form
          [formGroup]="createProjectForm"
          (ngSubmit)="submitCreateProject()"
          class="space-y-4"
        >
          <div>
            <label
              for="projectName"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Name</label
            >
            <input
              id="projectName"
              type="text"
              formControlName="name"
              (input)="onProjectNameInput()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="My Project"
            />
          </div>

          <div>
            <label
              for="projectSlug"
              class="block text-sm font-medium text-gray-700 mb-1"
              >Slug</label
            >
            <input
              id="projectSlug"
              type="text"
              formControlName="slug"
              (input)="slugManuallyEdited = true"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="PROJ"
              maxlength="10"
            />
            <p class="mt-1 text-xs text-gray-500">
              1–10 uppercase letters/numbers, must start with a letter
            </p>
            @if (createProjectForm.get('slug')?.invalid && createProjectForm.get('slug')?.touched) {
            <p class="mt-1 text-sm text-red-600">
              Invalid slug format
            </p>
            }
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="closeCreateProject()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="createProjectLoading()"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-md shadow-sm transition-colors"
            >
              {{ createProjectLoading() ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    }

    <!-- Create Organization Modal -->
    @if (createOrgOpen()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div
        class="absolute inset-0 bg-black/50"
        (click)="closeCreateOrg()"
      ></div>
      <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Create organization</h2>

        @if (createOrgError()) {
        <div class="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {{ createOrgError() }}
        </div>
        }

        <form [formGroup]="createOrgForm" (ngSubmit)="submitCreateOrg()" class="space-y-4">
          <div>
            <label for="orgName" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              id="orgName"
              type="text"
              formControlName="name"
              (input)="onOrgNameInput()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="My Organization"
            />
          </div>

          <div>
            <label for="orgSlug" class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              id="orgSlug"
              type="text"
              formControlName="slug"
              (input)="orgSlugManuallyEdited = true"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="my-org"
            />
            <p class="mt-1 text-xs text-gray-500">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="closeCreateOrg()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="createOrgLoading()"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-md shadow-sm transition-colors"
            >
              {{ createOrgLoading() ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
})
export default class DashboardLayoutComponent {
  auth = inject(AuthService);
  workspace = inject(WorkspaceService);
  private router = inject(Router);

  orgDropdownOpen = signal(false);
  userMenuOpen = signal(false);

  // Create project modal
  createProjectOpen = signal(false);
  createProjectLoading = signal(false);
  createProjectError = signal<string | null>(null);
  slugManuallyEdited = false;

  createProjectForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(1)]),
    slug: new FormControl('', [
      Validators.required,
      Validators.minLength(1),
      Validators.maxLength(10),
      Validators.pattern(/^[A-Z][A-Z0-9]*$/),
    ]),
  });

  // Create org modal
  createOrgOpen = signal(false);
  createOrgLoading = signal(false);
  createOrgError = signal<string | null>(null);
  orgSlugManuallyEdited = false;

  createOrgForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(1)]),
    slug: new FormControl('', [
      Validators.required,
      Validators.minLength(1),
      Validators.pattern(/^[a-z0-9-]+$/),
    ]),
  });

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

  // Project modal methods
  openCreateProject() {
    this.createProjectForm.reset();
    this.createProjectError.set(null);
    this.slugManuallyEdited = false;
    this.createProjectOpen.set(true);
  }

  closeCreateProject() {
    this.createProjectOpen.set(false);
  }

  onProjectNameInput() {
    if (this.slugManuallyEdited) return;
    const name = this.createProjectForm.get('name')?.value ?? '';
    const words = name.trim().split(/\s+/).filter(Boolean);
    let slug: string;
    if (words.length === 1) {
      slug = words[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    } else {
      slug = words
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 10);
    }
    slug = slug.replace(/^[^A-Z]+/, '');
    this.createProjectForm.get('slug')?.setValue(slug);
  }

  async submitCreateProject() {
    if (this.createProjectForm.invalid) {
      this.createProjectForm.markAllAsTouched();
      return;
    }

    this.createProjectLoading.set(true);
    this.createProjectError.set(null);

    try {
      await this.workspace.createProject(
        this.createProjectForm.value.name!,
        this.createProjectForm.value.slug!
      );
      this.closeCreateProject();
    } catch (e: any) {
      this.createProjectError.set(e?.message ?? 'Failed to create project');
    } finally {
      this.createProjectLoading.set(false);
    }
  }

  // Org modal methods
  openCreateOrg() {
    this.orgDropdownOpen.set(false);
    this.createOrgForm.reset();
    this.createOrgError.set(null);
    this.orgSlugManuallyEdited = false;
    this.createOrgOpen.set(true);
  }

  closeCreateOrg() {
    this.createOrgOpen.set(false);
  }

  onOrgNameInput() {
    if (this.orgSlugManuallyEdited) return;
    const name = this.createOrgForm.get('name')?.value ?? '';
    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    this.createOrgForm.get('slug')?.setValue(slug);
  }

  async submitCreateOrg() {
    if (this.createOrgForm.invalid) {
      this.createOrgForm.markAllAsTouched();
      return;
    }

    this.createOrgLoading.set(true);
    this.createOrgError.set(null);

    try {
      await this.workspace.createOrganization(
        this.createOrgForm.value.name!,
        this.createOrgForm.value.slug!
      );
      this.closeCreateOrg();
    } catch (e: any) {
      this.createOrgError.set(e?.message ?? 'Failed to create organization');
    } finally {
      this.createOrgLoading.set(false);
    }
  }
}
