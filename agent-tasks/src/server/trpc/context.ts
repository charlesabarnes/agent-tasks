import { H3Event, getCookie } from 'h3';
import { inferAsyncReturnType } from '@trpc/server';
import { verifyToken, JWT_COOKIE_NAME } from '../auth/jwt';
import { db } from '../../drizzle/db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const createContext = async (event: H3Event) => {
  const token = getCookie(event, JWT_COOKIE_NAME);
  let user: typeof users.$inferSelect | null = null;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const found = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
      });
      user = found ?? null;
    }
  }

  return { user, event };
};

export type Context = inferAsyncReturnType<typeof createContext>;
