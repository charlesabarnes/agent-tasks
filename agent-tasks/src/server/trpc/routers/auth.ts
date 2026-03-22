import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { setCookie, deleteCookie } from 'h3';
import { publicProcedure, protectedProcedure, router } from '../trpc';
import { db } from '../../../drizzle/db';
import { users, organizations, memberships } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../../auth/password';
import { signToken, JWT_COOKIE_NAME } from '../../auth/jwt';
import { acceptPendingInvites } from './invites';

const cookieOptions = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }

      const passwordHash = await hashPassword(input.password);

      const user = await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            email: input.email,
            name: input.name,
            passwordHash,
          })
          .returning();

        const slug =
          'personal-' +
          input.email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-') +
          '-' +
          newUser.id.slice(0, 8);

        const [org] = await tx
          .insert(organizations)
          .values({
            name: `${input.name}'s Space`,
            slug,
            isPersonal: true,
          })
          .returning();

        await tx.insert(memberships).values({
          userId: newUser.id,
          organizationId: org.id,
          role: 'owner',
        });

        return newUser;
      });

      // Accept any pending invites for this email
      await acceptPendingInvites(user.id, input.email);

      const token = signToken({ userId: user.id });
      setCookie(ctx.event, JWT_COOKIE_NAME, token, cookieOptions);

      const { passwordHash: _, ...safeUser } = user;
      return { user: safeUser };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const token = signToken({ userId: user.id });
      setCookie(ctx.event, JWT_COOKIE_NAME, token, cookieOptions);

      const { passwordHash: _, ...safeUser } = user;
      return { user: safeUser };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    deleteCookie(ctx.event, JWT_COOKIE_NAME, { path: '/' });
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const { passwordHash: _, ...safeUser } = ctx.user;
    return { user: safeUser };
  }),
});
