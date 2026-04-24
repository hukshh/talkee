import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const setTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
        currentClerkId: v.string(),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) return;

        const existingTyping = await ctx.db
            .query("typing")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", user._id)
            )
            .unique();

        if (existingTyping) {
            await ctx.db.patch(existingTyping._id, {
                isTyping: args.isTyping,
                lastTypedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("typing", {
                conversationId: args.conversationId,
                userId: user._id,
                isTyping: args.isTyping,
                lastTypedAt: Date.now(),
            });
        }
    },
});

export const getTypingUsers = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const typings = await ctx.db
            .query("typing")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        // Only return users who typed in the last 2 seconds
        const now = Date.now();
        const activeTyping = typings.filter((t) => t.isTyping && now - t.lastTypedAt < 2000);
        
        return await Promise.all(
            activeTyping.map(async (t) => {
                const user = await ctx.db.get(t.userId);
                return {
                    ...t,
                    userName: user?.name?.split(' ')[0] || "Someone",
                };
            })
        );
    },
});
