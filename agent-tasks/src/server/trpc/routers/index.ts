import { router } from '../trpc';
import { userRouter } from './users';
import { organizationRouter } from './organizations';

export const appRouter = router({
  user: userRouter,
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
