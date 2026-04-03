import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createStatus = mutation({
    args: {
        currentClerkId: v.string(),
        mediaUrl: v.string(),
        mediaType: v.union(v.literal("image"), v.literal("video")),
        caption: v.optional(v.string()),
        note: v.optional(v.string()),
        musicUrl: v.optional(v.string()),
        musicTitle: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) throw new Error("User not found");

        return await ctx.db.insert("statuses", {
            userId: user._id,
            mediaUrl: args.mediaUrl,
            mediaType: args.mediaType,
            caption: args.caption,
            note: args.note,
            musicUrl: args.musicUrl,
            musicTitle: args.musicTitle,
            createdAt: Date.now(),
        });
    },
});

export const getStatuses = query({
    args: { currentClerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) return [];

        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

        const allStatuses = await ctx.db
            .query("statuses")
            .filter((q) => q.gt(q.field("createdAt"), twentyFourHoursAgo))
            .collect();

        // Get match IDs to only show statuses from matches
        // For now, let's show all statuses to make the app feel move active, 
        // but real apps usually filter by matches/friends.
        // We'll hydrate user info for each status.

        const hydratedStatuses = [];
        for (const status of allStatuses) {
            const statusUser = await ctx.db.get(status.userId);
            if (statusUser) {
                const fullMediaUrl = await ctx.storage.getUrl(status.mediaUrl);
                const fullMusicUrl = status.musicUrl ? (status.musicUrl.startsWith('http') ? status.musicUrl : await ctx.storage.getUrl(status.musicUrl)) : null;

                let userAvatarUrl = statusUser.avatarUrl;
                if (userAvatarUrl && !userAvatarUrl.startsWith("http")) {
                    userAvatarUrl = await ctx.storage.getUrl(userAvatarUrl) || userAvatarUrl;
                }

                hydratedStatuses.push({
                    ...status,
                    mediaUrl: fullMediaUrl || status.mediaUrl,
                    musicUrl: fullMusicUrl || status.musicUrl,
                    user: {
                        name: statusUser.name,
                        avatarUrl: userAvatarUrl,
                    }
                });
            }
        }

        // Group by user
        const grouped = hydratedStatuses.reduce((acc, status) => {
            const userId = status.userId.toString();
            if (!acc[userId]) {
                acc[userId] = {
                    userId: status.userId,
                    user: status.user,
                    items: []
                };
            }
            acc[userId].items.push(status);
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped);
    },
});

export const markStatusSeen = mutation({
    args: { currentClerkId: v.string(), timestamp: v.number() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) return;

        await ctx.db.patch(user._id, {
            lastSeenStatus: args.timestamp,
        });
    },
});

export const getStatusByUserId = query({
    args: { userId: v.id("users"), currentClerkId: v.string() },
    handler: async (ctx, args) => {
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        const statuses = await ctx.db
            .query("statuses")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.gt(q.field("createdAt"), twentyFourHoursAgo))
            .collect();

        if (statuses.length === 0) return null;

        const statusUser = await ctx.db.get(args.userId);
        if (!statusUser) return null;

        let avatarUrl = statusUser.avatarUrl;
        if (avatarUrl && !avatarUrl.startsWith("http")) {
            avatarUrl = await ctx.storage.getUrl(avatarUrl) || avatarUrl;
        }

        const hydratedItems = await Promise.all(statuses.map(async (s) => ({
            ...s,
            mediaUrl: await ctx.storage.getUrl(s.mediaUrl) || s.mediaUrl,
            musicUrl: s.musicUrl ? (s.musicUrl.startsWith('http') ? s.musicUrl : await ctx.storage.getUrl(s.musicUrl)) : null,
        })));

        return {
            userId: args.userId,
            user: {
                name: statusUser.name,
                avatarUrl: avatarUrl,
            },
            items: hydratedItems,
        };
    },
});
