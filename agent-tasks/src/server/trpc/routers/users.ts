import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { db } from '../../../drizzle/db';
import { users, organizations, memberships } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const userRouter = router({
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ email: input.email, name: input.name })
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

  list: publicProcedure.query(async () => {
    return await db.query.users.findMany({
      with: { memberships: { with: { organization: true } } },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return await db.query.users.findFirst({
        where: eq(users.id, input.id),
        with: { memberships: { with: { organization: true } } },
      });
    }),

  remove: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return await db.delete(users).where(eq(users.id, input.id)).returning();
    }),
});
