import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../../../drizzle/db';
import { users, organizations, memberships } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../../auth/password';

export const userRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      const passwordHash = await hashPassword(input.password);
      return await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ email: input.email, name: input.name, passwordHash })
          .returning();

        const slug =
          'personal-' +
          input.email
            .split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-') +
          '-' +
          user.id.slice(0, 8);

        const [org] = await tx
          .insert(organizations)
          .values({
            name: `${input.name}'s Space`,
            slug,
            isPersonal: true,
          })
          .returning();

        await tx.insert(memberships).values({
          userId: user.id,
          organizationId: org.id,
          role: 'owner',
        });

        return user;
      });
    }),

  list: protectedProcedure.query(async () => {
    return await db.query.users.findMany({
      with: { memberships: { with: { organization: true } } },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return await db.query.users.findFirst({
        where: eq(users.id, input.id),
        with: { memberships: { with: { organization: true } } },
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return await db.delete(users).where(eq(users.id, input.id)).returning();
    }),
});
