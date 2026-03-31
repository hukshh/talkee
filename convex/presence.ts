import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updatePresence = mutation({
    args: { currentClerkId: v.string(), isOnline: v.boolean() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) return; // User might not be created yet

        const presence = await ctx.db
            .query("presence")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .unique();

        if (presence) {
            await ctx.db.patch(presence._id, {
                isOnline: args.isOnline,
                lastSeen: Date.now(),
            });
        } else {
            await ctx.db.insert("presence", {
                userId: user._id,
                isOnline: args.isOnline,
                lastSeen: Date.now(),
            });
        }
    },
});

export const getPresence = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("presence")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();
    },
});
