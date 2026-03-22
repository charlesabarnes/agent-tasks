import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../../../drizzle/db';
import { invites, users, memberships } from '../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function acceptPendingInvites(userId: string, email: string) {
  const pendingInvites = await db.query.invites.findMany({
    where: and(eq(invites.email, email), eq(invites.status, 'pending')),
  });

  for (const invite of pendingInvites) {
    await db.insert(memberships).values({
      userId,
      organizationId: invite.organizationId,
      role: invite.role,
    });
    await db
      .update(invites)
      .set({ status: 'accepted' })
      .where(eq(invites.id, invite.id));
  }

  return pendingInvites.length;
}

export const inviteRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        organizationId: z.string().uuid(),
        role: z.enum(['admin', 'member']).default('member'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existingUser) {
        // Check if already a member
        const existingMembership = await db.query.memberships.findFirst({
          where: and(
            eq(memberships.userId, existingUser.id),
            eq(memberships.organizationId, input.organizationId)
          ),
        });

        if (existingMembership) {
          return { status: 'already_member' as const };
        }

        // Add directly as member
        await db.insert(memberships).values({
          userId: existingUser.id,
          organizationId: input.organizationId,
          role: input.role,
        });

        return { status: 'added' as const };
      }

      // Create invite for non-existent user
      const [invite] = await db
        .insert(invites)
        .values({
          email: input.email,
          organizationId: input.organizationId,
          role: input.role,
          invitedById: ctx.user.id,
        })
        .returning();

      return { status: 'invited' as const, invite };
    }),

  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ input }) => {
      return await db.query.invites.findMany({
        where: and(
          eq(invites.organizationId, input.organizationId),
          eq(invites.status, 'pending')
        ),
        with: { invitedBy: true },
        orderBy: invites.createdAt,
      });
    }),

  cancel: protectedProcedure
    .input(z.object({ inviteId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(invites)
        .where(eq(invites.id, input.inviteId))
        .returning();
      return deleted;
    }),
});
