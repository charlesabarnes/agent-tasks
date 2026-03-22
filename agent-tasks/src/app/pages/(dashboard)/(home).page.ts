import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';
import { TaskService, TaskWithSubtasks } from '../../services/task.service';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule],
  template: `
    <div class="p-8">
      @if (workspace.currentProject(); as project) {
        <div class="mb-6">
          <h1 class="text-2xl font-semibold text-gray-900">{{ project.name }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ project.slug }} &middot; {{ workspace.currentOrg()?.name }}</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

        <!-- Task List -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Tasks</h2>
            <button
              (click)="openCreateTask()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>

          @if (taskService.loading()) {
            <p class="text-sm text-gray-400 py-4">Loading tasks...</p>
          } @else if (taskService.rootTasks().length === 0) {
            <div class="text-center py-12 border border-dashed border-gray-300 rounded-lg">
              <p class="text-gray-500">No tasks yet. Create one to get started.</p>
            </div>
          } @else {
            <div class="border border-gray-200 rounded-lg divide-y divide-gray-200">
              @for (task of taskService.rootTasks(); track task.id) {
                <!-- Parent task row -->
                <div class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div class="relative">
                    <button
                      (click)="toggleStatusMenu(task.id)"
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                      [class]="statusDotClass(task.status)"
                      [title]="statusLabel(task.status)"
                    >
                      @if (task.status === 'done') {
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      }
                    </button>
                    @if (statusMenuOpenFor() === task.id) {
                      <div class="absolute left-0 top-7 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 w-36">
                        @for (s of statuses; track s.value) {
                          <button
                            (click)="changeStatus(task.id, s.value)"
                            class="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <span class="w-2.5 h-2.5 rounded-full" [class]="s.dotClass"></span>
                            {{ s.label }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                  <span class="text-xs font-mono text-gray-400 shrink-0">{{ project.slug }}-{{ task.number }}</span>
                  <span class="text-sm text-gray-900 flex-1 truncate">{{ task.title }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full shrink-0" [class]="statusBadgeClass(task.status)">
                    {{ statusLabel(task.status) }}
                  </span>
                  @if (task.assignee) {
                    <span
                      class="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold shrink-0"
                      [title]="task.assignee.name"
                    >
                      {{ task.assignee.name.charAt(0).toUpperCase() }}
                    </span>
                  }
                </div>
                <!-- Subtasks -->
                @for (sub of task.subtasks; track sub.id) {
                  <div class="flex items-center gap-3 px-4 py-3 pl-12 hover:bg-gray-50 transition-colors bg-gray-50/50">
                    <div class="relative">
                      <button
                        (click)="toggleStatusMenu(sub.id)"
                        class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                        [class]="statusDotClass(sub.status)"
                        [title]="statusLabel(sub.status)"
                      >
                        @if (sub.status === 'done') {
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                          </svg>
                        }
                      </button>
                      @if (statusMenuOpenFor() === sub.id) {
                        <div class="absolute left-0 top-7 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 w-36">
                          @for (s of statuses; track s.value) {
                            <button
                              (click)="changeStatus(sub.id, s.value)"
                              class="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span class="w-2.5 h-2.5 rounded-full" [class]="s.dotClass"></span>
                              {{ s.label }}
                            </button>
                          }
                        </div>
                      }
                    </div>
                    <span class="text-xs font-mono text-gray-400 shrink-0">{{ project.slug }}-{{ sub.number }}</span>
                    <span class="text-sm text-gray-700 flex-1 truncate">{{ sub.title }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full shrink-0" [class]="statusBadgeClass(sub.status)">
                      {{ statusLabel(sub.status) }}
                    </span>
                  </div>
                }
              }
            </div>
          }
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

    <!-- Create Task Modal -->
    @if (createTaskOpen()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <div
        class="absolute inset-0 bg-black/50"
        (click)="closeCreateTask()"
      ></div>
      <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Create task</h2>

        @if (createTaskError()) {
        <div class="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {{ createTaskError() }}
        </div>
        }

        <form [formGroup]="createTaskForm" (ngSubmit)="submitCreateTask()" class="space-y-4">
          <div>
            <label for="taskTitle" class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              id="taskTitle"
              type="text"
              formControlName="title"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Task title"
            />
          </div>

          <div>
            <label for="taskDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="taskDescription"
              formControlName="description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Optional description"
            ></textarea>
          </div>

          <div>
            <label for="taskParent" class="block text-sm font-medium text-gray-700 mb-1">Parent Task</label>
            <select
              id="taskParent"
              formControlName="parentTaskId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">None (top-level task)</option>
              @for (task of taskService.rootTasks(); track task.id) {
                <option [value]="task.id">
                  {{ workspace.currentProject()?.slug }}-{{ task.number }}: {{ task.title }}
                </option>
              }
            </select>
          </div>

          <div>
            <label for="taskAssignee" class="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select
              id="taskAssignee"
              formControlName="assigneeId"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Unassigned</option>
              @for (member of workspace.members(); track member.userId) {
                <option [value]="member.userId">{{ member.user.name }}</option>
              }
            </select>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              (click)="closeCreateTask()"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="createTaskLoading()"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-md shadow-sm transition-colors"
            >
              {{ createTaskLoading() ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
})
export default class HomeComponent {
  auth = inject(AuthService);
  workspace = inject(WorkspaceService);
  taskService = inject(TaskService);

  // Status menu
  statusMenuOpenFor = signal<string | null>(null);

  // Create task modal
  createTaskOpen = signal(false);
  createTaskLoading = signal(false);
  createTaskError = signal<string | null>(null);

  createTaskForm = new FormGroup({
    title: new FormControl('', [Validators.required, Validators.minLength(1)]),
    description: new FormControl(''),
    parentTaskId: new FormControl(''),
    assigneeId: new FormControl(''),
  });

  statuses = [
    { value: 'todo' as const, label: 'To Do', dotClass: 'bg-gray-400' },
    { value: 'in_progress' as const, label: 'In Progress', dotClass: 'bg-blue-500' },
    { value: 'done' as const, label: 'Done', dotClass: 'bg-green-500' },
    { value: 'blocked' as const, label: 'Blocked', dotClass: 'bg-red-500' },
  ];

  statusLabel(status: string): string {
    return this.statuses.find((s) => s.value === status)?.label ?? status;
  }

  statusDotClass(status: string): string {
    const map: Record<string, string> = {
      todo: 'border-gray-300 text-gray-300',
      in_progress: 'border-blue-500 text-blue-500 bg-blue-50',
      done: 'border-green-500 text-green-500 bg-green-50',
      blocked: 'border-red-500 text-red-500 bg-red-50',
    };
    return map[status] ?? 'border-gray-300';
  }

  statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      todo: 'bg-gray-100 text-gray-600',
      in_progress: 'bg-blue-100 text-blue-700',
      done: 'bg-green-100 text-green-700',
      blocked: 'bg-red-100 text-red-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-600';
  }

  toggleStatusMenu(taskId: string) {
    this.statusMenuOpenFor.set(
      this.statusMenuOpenFor() === taskId ? null : taskId
    );
  }

  async changeStatus(taskId: string, status: 'todo' | 'in_progress' | 'done' | 'blocked') {
    this.statusMenuOpenFor.set(null);
    await this.taskService.updateStatus(taskId, status);
  }

  async openCreateTask() {
    this.createTaskForm.reset({ title: '', description: '', parentTaskId: '', assigneeId: '' });
    this.createTaskError.set(null);
    // Load members for assignee dropdown
    await this.workspace.loadMembers();
    this.createTaskOpen.set(true);
  }

  closeCreateTask() {
    this.createTaskOpen.set(false);
  }

  async submitCreateTask() {
    if (this.createTaskForm.invalid) {
      this.createTaskForm.markAllAsTouched();
      return;
    }

    this.createTaskLoading.set(true);
    this.createTaskError.set(null);

    try {
      const { title, description, parentTaskId, assigneeId } = this.createTaskForm.value;
      await this.taskService.createTask({
        title: title!,
        description: description || undefined,
        parentTaskId: parentTaskId || undefined,
        assigneeId: assigneeId || undefined,
      });
      this.closeCreateTask();
    } catch (e: any) {
      this.createTaskError.set(e?.message ?? 'Failed to create task');
    } finally {
      this.createTaskLoading.set(false);
    }
  }
}
