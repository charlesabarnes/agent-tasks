import { Component, inject, signal, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { WorkspaceService } from '../../services/workspace.service';

@Component({
  selector: 'app-members',
  imports: [ReactiveFormsModule],
  template: `
    <div class="p-8 max-w-3xl">
      @if (workspace.currentOrg(); as org) {
        <div class="mb-6">
          <h1 class="text-2xl font-semibold text-gray-900">Members</h1>
          <p class="text-sm text-gray-500 mt-1">Manage members of {{ org.name }}</p>
        </div>

        <!-- Invite Form -->
        <div class="mb-8 bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h2 class="text-sm font-semibold text-gray-900 mb-3">Invite member</h2>

          @if (inviteSuccess()) {
            <div class="mb-3 p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm">
              {{ inviteSuccess() }}
            </div>
          }
          @if (inviteError()) {
            <div class="mb-3 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {{ inviteError() }}
            </div>
          }

          <form [formGroup]="inviteForm" (ngSubmit)="submitInvite()" class="flex items-end gap-3">
            <div class="flex-1">
              <label for="inviteEmail" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="inviteEmail"
                type="email"
                formControlName="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="user@example.com"
              />
            </div>
            <div class="w-32">
              <label for="inviteRole" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                id="inviteRole"
                formControlName="role"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              [disabled]="inviteLoading()"
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-md shadow-sm transition-colors"
            >
              {{ inviteLoading() ? 'Inviting...' : 'Invite' }}
            </button>
          </form>
        </div>

        <!-- Members List -->
        <div class="mb-8">
          <h2 class="text-sm font-semibold text-gray-900 mb-3">Current members</h2>
          @if (workspace.members().length === 0) {
            <p class="text-sm text-gray-400">Loading members...</p>
          } @else {
            <div class="border border-gray-200 rounded-lg divide-y divide-gray-200">
              @for (member of workspace.members(); track member.id) {
                <div class="flex items-center gap-3 px-4 py-3">
                  <span class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-sm font-bold shrink-0">
                    {{ member.user.name.charAt(0).toUpperCase() }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ member.user.name }}</p>
                    <p class="text-xs text-gray-500 truncate">{{ member.user.email }}</p>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full shrink-0" [class]="roleBadgeClass(member.role)">
                    {{ member.role }}
                  </span>
                  @if (canRemoveMember(member)) {
                    <button
                      (click)="removeMember(member.userId)"
                      class="text-sm text-red-600 hover:text-red-800 transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Pending Invites -->
        @if (workspace.invites().length > 0) {
          <div>
            <h2 class="text-sm font-semibold text-gray-900 mb-3">Pending invites</h2>
            <div class="border border-gray-200 rounded-lg divide-y divide-gray-200">
              @for (invite of workspace.invites(); track invite.id) {
                <div class="flex items-center gap-3 px-4 py-3">
                  <span class="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 text-sm shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ invite.email }}</p>
                    <p class="text-xs text-gray-500">Invited as {{ invite.role }}</p>
                  </div>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 shrink-0">
                    Pending
                  </span>
                  <button
                    (click)="cancelInvite(invite.id)"
                    class="text-sm text-red-600 hover:text-red-800 transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              }
            </div>
          </div>
        }
      } @else {
        <div class="flex flex-col items-center justify-center h-64">
          <p class="text-gray-500">Select an organization to manage members.</p>
        </div>
      }
    </div>
  `,
})
export default class MembersComponent implements OnInit {
  auth = inject(AuthService);
  workspace = inject(WorkspaceService);

  inviteLoading = signal(false);
  inviteError = signal<string | null>(null);
  inviteSuccess = signal<string | null>(null);

  inviteForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    role: new FormControl<'admin' | 'member'>('member', [Validators.required]),
  });

  async ngOnInit() {
    await this.workspace.loadMembers();
    await this.workspace.loadInvites();
  }

  roleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
      member: 'bg-gray-100 text-gray-600',
    };
    return map[role] ?? 'bg-gray-100 text-gray-600';
  }

  canRemoveMember(member: { userId: string; role: string }): boolean {
    const currentUser = this.auth.user();
    return member.role !== 'owner' && member.userId !== currentUser?.id;
  }

  async submitInvite() {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviteLoading.set(true);
    this.inviteError.set(null);
    this.inviteSuccess.set(null);

    try {
      const result = await this.workspace.inviteMember(
        this.inviteForm.value.email!,
        this.inviteForm.value.role!
      );

      if (result.status === 'added') {
        this.inviteSuccess.set('User has been added to the organization.');
      } else if (result.status === 'invited') {
        this.inviteSuccess.set('Invitation sent. They will be added when they register.');
      } else if (result.status === 'already_member') {
        this.inviteSuccess.set('This user is already a member of the organization.');
      }

      this.inviteForm.reset({ email: '', role: 'member' });
    } catch (e: any) {
      this.inviteError.set(e?.message ?? 'Failed to invite member');
    } finally {
      this.inviteLoading.set(false);
    }
  }

  async removeMember(userId: string) {
    try {
      await this.workspace.removeMember(userId);
    } catch (e: any) {
      this.inviteError.set(e?.message ?? 'Failed to remove member');
    }
  }

  async cancelInvite(inviteId: string) {
    try {
      await this.workspace.cancelInvite(inviteId);
    } catch (e: any) {
      this.inviteError.set(e?.message ?? 'Failed to cancel invite');
    }
  }
}
