import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getPotentialMatches = query({
    args: {
        currentClerkId: v.string(),
        genders: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!currentUser) return [];

        // Get all users except current user
        const allUsers = await ctx.db.query("users").collect();
        const otherUsers = allUsers.filter((u) => u._id !== currentUser._id);

        // Get all past swipes by the current user
        const pastSwipes = await ctx.db
            .query("swipes")
            .withIndex("by_swiper", (q) => q.eq("swiperId", currentUser._id))
            .collect();

        const swipedIds = new Set(pastSwipes.map((s) => s.swipedId));

        // Filter users that haven't been swiped on yet
        let filtered = otherUsers.filter((u) => !swipedIds.has(u._id));

        // Apply gender filter if provided
        if (args.genders && args.genders.length > 0) {
            filtered = filtered.filter((u) => u.gender && args.genders!.includes(u.gender));
        }

        return filtered;
    },
});

export const swipe = mutation({
    args: {
        currentClerkId: v.string(),
        swipedId: v.id("users"),
        action: v.union(v.literal("like"), v.literal("pass")),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!currentUser) throw new Error("User not found");

        // Prevent duplicate swipes
        const existingSwipe = await ctx.db
            .query("swipes")
            .withIndex("by_swipe", (q) =>
                q.eq("swiperId", currentUser._id).eq("swipedId", args.swipedId)
            )
            .first();

        if (existingSwipe) return existingSwipe._id;

        return await ctx.db.insert("swipes", {
            swiperId: currentUser._id,
            swipedId: args.swipedId,
            action: args.action,
        });
    },
});

export const getMatches = query({
    args: { currentClerkId: v.string() },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!currentUser) return [];

        // distinct likes initiated BY the current user
        const sentLikes = await ctx.db
            .query("swipes")
            .withIndex("by_swiper", (q) => q.eq("swiperId", currentUser._id))
            .filter((q) => q.eq(q.field("action"), "like"))
            .collect();

        const likedUserIds = new Set(sentLikes.map((s) => s.swipedId));

        // distinct likes received BY the current user
        const receivedLikes = await ctx.db
            .query("swipes")
            .withIndex("by_swiped", (q) => q.eq("swipedId", currentUser._id))
            .filter((q) => q.eq(q.field("action"), "like"))
            .collect();

        // Mutual matches logically exist if an ID appears in both sets
        const matchIds = new Set(
            receivedLikes
                .map((s) => s.swiperId)
                .filter((id) => likedUserIds.has(id))
        );

        // Hydrate user documents for the mutual matches
        const matches = [];
        for (const id of Array.from(matchIds)) {
            const u = await ctx.db.get(id);
            if (u) matches.push(u);
        }

        return matches;
    },
});

export const getPendingLikes = query({
    args: { currentClerkId: v.string() },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!currentUser) return [];

        // likes directed AT the current user
        const receivedLikes = await ctx.db
            .query("swipes")
            .withIndex("by_swiped", (q) => q.eq("swipedId", currentUser._id))
            .filter((q) => q.eq(q.field("action"), "like"))
            .collect();

        // Past swipes BY the current user
        const pastSwipes = await ctx.db
            .query("swipes")
            .withIndex("by_swiper", (q) => q.eq("swiperId", currentUser._id))
            .collect();

        const swipedIds = new Set(pastSwipes.map((s) => s.swipedId));

        const pendingLikeIds = new Set(
            receivedLikes
                .map((s) => s.swiperId)
                .filter((id) => !swipedIds.has(id))
        );

        const pendingScouters = [];
        for (const id of Array.from(pendingLikeIds)) {
            const u = await ctx.db.get(id);
            if (u) pendingScouters.push(u);
        }

        return pendingScouters;
    },
});
