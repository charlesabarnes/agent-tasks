import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../../../drizzle/db';
import { projects } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const projectRouter = router({
  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await db.query.projects.findMany({
        where: eq(projects.organizationId, input.organizationId),
        orderBy: projects.name,
      });
    }),

  getBySlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        organizationId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      return await db.query.projects.findFirst({
        where: and(
          eq(projects.slug, input.slug),
          eq(projects.organizationId, input.organizationId)
        ),
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1).max(10).regex(/^[A-Z][A-Z0-9]*$/),
        organizationId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const [project] = await db
        .insert(projects)
        .values({
          name: input.name,
          slug: input.slug,
          organizationId: input.organizationId,
        })
        .returning();
      return project;
    }),
});
