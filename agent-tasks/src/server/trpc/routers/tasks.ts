import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../../../drizzle/db';
import { tasks, projects } from '../../../drizzle/schema';
import { eq, isNull, sql } from 'drizzle-orm';

export const taskRouter = router({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await db.query.tasks.findMany({
        where: eq(tasks.projectId, input.projectId),
        with: { subtasks: true, assignee: true },
        orderBy: tasks.number,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        projectId: z.string().uuid(),
        parentTaskId: z.string().uuid().optional(),
        assigneeId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await db.transaction(async (tx) => {
        // Increment the project's task counter and get the new number
        const [updated] = await tx
          .update(projects)
          .set({ taskCounter: sql`${projects.taskCounter} + 1` })
          .where(eq(projects.id, input.projectId))
          .returning({ taskCounter: projects.taskCounter });

        const [task] = await tx
          .insert(tasks)
          .values({
            number: updated.taskCounter,
            title: input.title,
            description: input.description,
            projectId: input.projectId,
            parentTaskId: input.parentTaskId,
            assigneeId: input.assigneeId,
          })
          .returning();

        return task;
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        status: z.enum(['todo', 'in_progress', 'done', 'blocked']),
      })
    )
    .mutation(async ({ input }) => {
      const [task] = await db
        .update(tasks)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(tasks.id, input.taskId))
        .returning();
      return task;
    }),
});
