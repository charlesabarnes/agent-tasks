import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { injectTrpcClient } from '../../trpc-client';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private trpc = injectTrpcClient();
  private router = inject(Router);

  private _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  async init(): Promise<void> {
    try {
      const result = await firstValueFrom(this.trpc.auth.me.query());
      this._user.set(result.user as AuthUser);
    } catch {
      this._user.set(null);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const result = await firstValueFrom(this.trpc.auth.login.mutate({ email, password }));
    this._user.set(result.user as AuthUser);
    this.router.navigate(['/']);
  }

  async register(email: string, name: string, password: string): Promise<void> {
    const result = await firstValueFrom(this.trpc.auth.register.mutate({ email, name, password }));
    this._user.set(result.user as AuthUser);
    this.router.navigate(['/']);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.trpc.auth.logout.mutate());
    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }
}
