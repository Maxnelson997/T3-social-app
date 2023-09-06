import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const tweetRouter = createTRPCRouter({
  infiniteFeed: publicProcedure.input(z.object({ limit: z.number().optional(), cursor: z.object({ id: z.string(), createdAt: z.date() }).optional() }))
    .query(async ({ input: { limit = 10, cursor }, ctx }) => {
      const currentUserId = ctx.session?.user.id;

      const tweets = await ctx.prisma.tweet.findMany({
        take: limit + 1,
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          content: true,
          createdAt: true,
          _count: { select: { likes: true } },
          likes: currentUserId == null ? false : { where: { userId: currentUserId } },
          user: {
            select: { name: true, id: true, image: true }
          }
        }
      })
    }),
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input: { content }, ctx }) => {
      const tweet = await ctx.prisma.tweet.create({ data: { content, userId: ctx.session.user.id } });

      return tweet;
    }),

  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.example.findMany();
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),
});
