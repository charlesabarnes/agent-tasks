import { router } from '../trpc';
import { authRouter } from './auth';
import { userRouter } from './users';
import { organizationRouter } from './organizations';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
