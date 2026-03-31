import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createConversation = mutation({
    args: {
        otherUserId: v.id("users"),
        currentClerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!currentUser) throw new Error("User not found");

        // Check if 1-on-1 already exists
        const conversations = await ctx.db.query("conversations").collect();
        const existing = conversations.find(
            (c) =>
                !c.isGroup &&
                c.members.includes(currentUser._id) &&
                c.members.includes(args.otherUserId)
        );

        if (existing) {
            return existing._id;
        }

        // Create new
        return await ctx.db.insert("conversations", {
            members: [currentUser._id, args.otherUserId],
            isGroup: false,
            updatedAt: Date.now(),
        });
    },
});

export const getConversationsForUser = query({
    args: {
        currentClerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!currentUser) return [];

        const conversations = await ctx.db.query("conversations").collect();
        const userConversations = conversations.filter((c) =>
            c.members.includes(currentUser._id)
        );

        // Sort by most recently updated
        return userConversations.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});
