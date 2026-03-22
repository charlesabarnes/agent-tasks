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

export interface WorkspaceMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string };
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  invitedBy: { id: string; name: string; email: string };
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private trpc = injectTrpcClient();
  private auth = inject(AuthService);

  private _organizations = signal<WorkspaceOrganization[]>([]);
  private _currentOrg = signal<WorkspaceOrganization | null>(null);
  private _projects = signal<WorkspaceProject[]>([]);
  private _currentProject = signal<WorkspaceProject | null>(null);
  private _members = signal<WorkspaceMember[]>([]);
  private _invites = signal<WorkspaceInvite[]>([]);

  readonly organizations = this._organizations.asReadonly();
  readonly currentOrg = this._currentOrg.asReadonly();
  readonly projects = this._projects.asReadonly();
  readonly currentProject = this._currentProject.asReadonly();
  readonly members = this._members.asReadonly();
  readonly invites = this._invites.asReadonly();

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
    this._members.set([]);
    this._invites.set([]);

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

  async createProject(name: string, slug: string): Promise<WorkspaceProject> {
    const org = this._currentOrg();
    if (!org) throw new Error('No organization selected');

    const project = await firstValueFrom(
      this.trpc.project.create.mutate({
        name,
        slug,
        organizationId: org.id,
      })
    ) as WorkspaceProject;

    this._projects.update((projects) => [...projects, project]);
    this._currentProject.set(project);
    return project;
  }

  async createOrganization(name: string, slug: string): Promise<void> {
    const user = this.auth.user();
    if (!user) throw new Error('Not authenticated');

    const org = await firstValueFrom(
      this.trpc.organization.create.mutate({
        name,
        slug,
        createdByUserId: user.id,
      })
    ) as WorkspaceOrganization;

    this._organizations.update((orgs) => [...orgs, org]);
    await this.setOrganization(org);
  }

  async loadMembers(): Promise<void> {
    const org = this._currentOrg();
    if (!org) return;

    const result = await firstValueFrom(
      this.trpc.organization.getBySlug.query({ slug: org.slug })
    ) as any;

    if (result?.memberships) {
      this._members.set(result.memberships as WorkspaceMember[]);
    }
  }

  async loadInvites(): Promise<void> {
    const org = this._currentOrg();
    if (!org) return;

    const result = await firstValueFrom(
      this.trpc.invite.listByOrganization.query({ organizationId: org.id })
    );
    this._invites.set(result as WorkspaceInvite[]);
  }

  async inviteMember(
    email: string,
    role: 'admin' | 'member'
  ): Promise<{ status: 'added' | 'invited' | 'already_member' }> {
    const org = this._currentOrg();
    if (!org) throw new Error('No organization selected');

    const result = await firstValueFrom(
      this.trpc.invite.create.mutate({
        email,
        organizationId: org.id,
        role,
      })
    );

    // Refresh members and invites
    await this.loadMembers();
    await this.loadInvites();

    return result as { status: 'added' | 'invited' | 'already_member' };
  }

  async removeMember(userId: string): Promise<void> {
    const org = this._currentOrg();
    if (!org) throw new Error('No organization selected');

    await firstValueFrom(
      this.trpc.organization.removeMember.mutate({
        organizationId: org.id,
        userId,
      })
    );

    this._members.update((members) =>
      members.filter((m) => m.userId !== userId)
    );
  }

  async cancelInvite(inviteId: string): Promise<void> {
    await firstValueFrom(
      this.trpc.invite.cancel.mutate({ inviteId })
    );

    this._invites.update((invites) =>
      invites.filter((i) => i.id !== inviteId)
    );
  }

  reset(): void {
    this._organizations.set([]);
    this._currentOrg.set(null);
    this._projects.set([]);
    this._currentProject.set(null);
    this._members.set([]);
    this._invites.set([]);
  }
}
