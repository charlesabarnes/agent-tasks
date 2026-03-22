import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import SuperJSON from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
});

/**
 * Unprotected procedure
 **/
export const publicProcedure = t.procedure;
export const router = t.router;
export const middleware = t.middleware;

const isAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
