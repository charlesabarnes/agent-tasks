import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectTrpcClient } from '../../trpc-client';
import { WorkspaceService } from './workspace.service';

export interface TaskWithSubtasks {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  projectId: string;
  parentTaskId: string | null;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  subtasks: TaskWithSubtasks[];
  assignee: { id: string; name: string; email: string } | null;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private trpc = injectTrpcClient();
  private workspace = inject(WorkspaceService);

  private _tasks = signal<TaskWithSubtasks[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  readonly tasks = this._tasks.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly rootTasks = computed(() =>
    this._tasks().filter((t) => t.parentTaskId === null)
  );

  constructor() {
    effect(() => {
      const project = this.workspace.currentProject();
      if (project) {
        this.loadTasks(project.id);
      } else {
        this._tasks.set([]);
      }
    });
  }

  async loadTasks(projectId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      const tasks = await firstValueFrom(
        this.trpc.task.listByProject.query({ projectId })
      );
      this._tasks.set(tasks as TaskWithSubtasks[]);
    } catch (e: any) {
      this._error.set(e?.message ?? 'Failed to load tasks');
    } finally {
      this._loading.set(false);
    }
  }

  async createTask(input: {
    title: string;
    description?: string;
    parentTaskId?: string;
    assigneeId?: string;
  }): Promise<void> {
    const project = this.workspace.currentProject();
    if (!project) throw new Error('No project selected');

    await firstValueFrom(
      this.trpc.task.create.mutate({
        ...input,
        projectId: project.id,
      })
    );

    await this.loadTasks(project.id);
  }

  async updateStatus(
    taskId: string,
    status: 'todo' | 'in_progress' | 'done' | 'blocked'
  ): Promise<void> {
    await firstValueFrom(
      this.trpc.task.updateStatus.mutate({ taskId, status })
    );

    const project = this.workspace.currentProject();
    if (project) {
      await this.loadTasks(project.id);
    }
  }
}
