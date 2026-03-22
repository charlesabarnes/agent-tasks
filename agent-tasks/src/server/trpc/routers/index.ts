import { router } from '../trpc';
import { authRouter } from './auth';
import { userRouter } from './users';
import { organizationRouter } from './organizations';
import { projectRouter } from './projects';
import { taskRouter } from './tasks';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  organization: organizationRouter,
  project: projectRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
