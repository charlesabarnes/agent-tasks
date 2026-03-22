import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectTrpcClient } from '../../trpc-client';
import { AuthService } from './auth.service';

export interface WorkspaceOrganization {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
}

export interface WorkspaceProject {
  id: string;
  name: string;
  slug: string;
  organizationId: string;
  taskCounter: number;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private trpc = injectTrpcClient();
  private auth = inject(AuthService);

  private _organizations = signal<WorkspaceOrganization[]>([]);
  private _currentOrg = signal<WorkspaceOrganization | null>(null);
  private _projects = signal<WorkspaceProject[]>([]);
  private _currentProject = signal<WorkspaceProject | null>(null);

  readonly organizations = this._organizations.asReadonly();
  readonly currentOrg = this._currentOrg.asReadonly();
  readonly projects = this._projects.asReadonly();
  readonly currentProject = this._currentProject.asReadonly();

  readonly hasOrganizations = computed(() => this._organizations().length > 0);

  async init(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;

    const memberships = await firstValueFrom(
      this.trpc.organization.listForUser.query({ userId: user.id })
    );

    const orgs = memberships.map((m: any) => m.organization as WorkspaceOrganization);
    this._organizations.set(orgs);

    // Select first non-personal org, or fall back to personal
    const defaultOrg = orgs.find((o) => !o.isPersonal) ?? orgs[0];
    if (defaultOrg) {
      await this.setOrganization(defaultOrg);
    }
  }

  async setOrganization(org: WorkspaceOrganization): Promise<void> {
    this._currentOrg.set(org);
    this._currentProject.set(null);

    const projects = await firstValueFrom(
      this.trpc.project.listByOrganization.query({ organizationId: org.id })
    );
    this._projects.set(projects as WorkspaceProject[]);

    // Auto-select first project if available
    if (projects.length > 0) {
      this._currentProject.set(projects[0] as WorkspaceProject);
    }
  }

  setProject(project: WorkspaceProject): void {
    this._currentProject.set(project);
  }

  reset(): void {
    this._organizations.set([]);
    this._currentOrg.set(null);
    this._projects.set([]);
    this._currentProject.set(null);
  }
}
