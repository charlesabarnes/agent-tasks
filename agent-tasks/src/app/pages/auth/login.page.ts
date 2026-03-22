import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouteMeta } from '@analogjs/router';
import { guestGuard } from '../../guards/guest.guard';

export const routeMeta: RouteMeta = {
  canActivate: [guestGuard],
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen">
      <!-- Left Panel - Branding -->
      <div
        class="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex-col justify-center items-center p-12"
      >
        <div class="max-w-md text-center">
          <h1 class="text-4xl font-bold mb-4">Multi-Tenant App</h1>
          <p class="text-lg text-indigo-100">
            Manage your organizations and teams in one place.
          </p>
        </div>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div class="w-full max-w-md">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p class="text-gray-500 mb-8">Sign in to your account</p>

          @if (error()) {
            <div
              class="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Email</label
              >
              <input
                id="email"
                type="email"
                formControlName="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                for="password"
                class="block text-sm font-medium text-gray-700 mb-1"
                >Password</label
              >
              <input
                id="password"
                type="password"
                formControlName="password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {{ loading() ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>

          <p class="mt-6 text-center text-sm text-gray-500">
            Don't have an account?
            <a
              routerLink="/auth/register"
              class="font-medium text-indigo-600 hover:text-indigo-500"
              >Sign up</a
            >
          </p>
        </div>
      </div>
    </div>
  `,
})
export default class LoginPageComponent {
  private auth = inject(AuthService);

  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  loading = signal(false);
  error = signal<string | null>(null);

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.auth.login(
        this.form.value.email!,
        this.form.value.password!
      );
    } catch (e: any) {
      this.error.set(e?.message ?? 'Invalid email or password');
    } finally {
      this.loading.set(false);
    }
  }
}
