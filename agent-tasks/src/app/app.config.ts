import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, inject } from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter, requestContextInterceptor } from '@analogjs/router';

import { provideTrpcClient } from '../trpc-client';
import { AuthService } from './services/auth.service';
import { WorkspaceService } from './services/workspace.service';

function initAuth(): () => Promise<void> {
  const auth = inject(AuthService);
  const workspace = inject(WorkspaceService);
  return async () => {
    await auth.init();
    if (auth.isAuthenticated()) {
      await workspace.init();
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideFileRouter(),
    provideClientHydration(),
    provideHttpClient(
      withFetch(),
      withInterceptors([requestContextInterceptor])
    ),
    provideTrpcClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      multi: true,
    },
  ],
};
