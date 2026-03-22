import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { db } from '../../../drizzle/db';
import { organizations, memberships } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const organizationRouter = router({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
        createdByUserId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        const [org] = await tx
          .insert(organizations)
          .values({
            name: input.name,
            slug: input.slug,
            isPersonal: false,
          })
          .returning();

        await tx.insert(memberships).values({
          userId: input.createdByUserId,
          organizationId: org.id,
          role: 'owner',
        });

        return org;
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await db.query.organizations.findFirst({
        where: eq(organizations.slug, input.slug),
        with: { memberships: { with: { user: true } } },
      });
    }),

  list: publicProcedure.query(async () => {
    return await db.query.organizations.findMany({
      with: { memberships: true },
    });
  }),

  addMember: publicProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(['admin', 'member']).default('member'),
      })
    )
    .mutation(async ({ input }) => {
      const [membership] = await db
        .insert(memberships)
        .values({
          userId: input.userId,
          organizationId: input.organizationId,
          role: input.role,
        })
        .returning();
      return membership;
    }),

  removeMember: publicProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      return await db
        .delete(memberships)
        .where(
          and(
            eq(memberships.organizationId, input.organizationId),
            eq(memberships.userId, input.userId)
          )
        )
        .returning();
    }),

  listForUser: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await db.query.memberships.findMany({
        where: eq(memberships.userId, input.userId),
        with: { organization: true },
      });
    }),
});
