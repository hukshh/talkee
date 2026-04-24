import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const syncUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        avatarUrl: v.string(),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                name: args.name,
                avatarUrl: args.avatarUrl,
            });
            return existingUser._id;
        }

        const userId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            avatarUrl: args.avatarUrl,
            createdAt: Date.now(),
        });

        // Also create presence record
        await ctx.db.insert("presence", {
            userId,
            isOnline: true,
            lastSeen: Date.now(),
        });

        return userId;
    },
});

export const createUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existingUser) {
            return existingUser._id;
        }

        const userId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            avatarUrl: args.avatarUrl,
            createdAt: Date.now(),
        });

        // Also create presence record
        await ctx.db.insert("presence", {
            userId,
            isOnline: true,
            lastSeen: Date.now(),
        });

        return userId;
    },
});

export const getAllUsers = query({
    args: {
        currentClerkId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const users = await ctx.db.query("users").collect();
        const usersWithPresence = await Promise.all(
            users.map(async (user) => {
                const presence = await ctx.db
                    .query("presence")
                    .withIndex("by_userId", (q) => q.eq("userId", user._id))
                    .unique();

                let avatarUrl = user.avatarUrl;
                // Only try to get storage URL if it looks like a Convex storage ID (UUID-like or specific length)
                // and doesn't start with http
                if (avatarUrl && !avatarUrl.startsWith("http") && avatarUrl.length > 10 && avatarUrl !== "test") {
                    try {
                        avatarUrl = await ctx.storage.getUrl(avatarUrl) || avatarUrl;
                    } catch (e) {
                        console.error(`Failed to get storage URL for ${avatarUrl}`);
                    }
                }

                return { ...user, avatarUrl, isOnline: presence?.isOnline ?? false };
            })
        );

        if (!args.currentClerkId) return usersWithPresence;

        return usersWithPresence.filter((u) => u.clerkId !== args.currentClerkId);
    },
});

export const getUserById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;
        let avatarUrl = user.avatarUrl;
        if (avatarUrl && !avatarUrl.startsWith("http") && avatarUrl.length > 10 && avatarUrl !== "test") {
            try {
                avatarUrl = await ctx.storage.getUrl(avatarUrl) || avatarUrl;
            } catch (e) {
                console.error(`Failed to get storage URL for ${avatarUrl}`);
            }
        }
        return { ...user, avatarUrl };
    },
});

export const getCurrentUser = query({
    args: { currentClerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();
        if (!user) return null;
        let avatarUrl = user.avatarUrl;
        if (avatarUrl && !avatarUrl.startsWith("http") && avatarUrl.length > 10 && avatarUrl !== "test") {
            try {
                avatarUrl = await ctx.storage.getUrl(avatarUrl) || avatarUrl;
            } catch (e) {
                console.error(`Failed to get storage URL for ${avatarUrl}`);
            }
        }
        return { ...user, avatarUrl };
    },
});

export const onboardUser = mutation({
    args: {
        currentClerkId: v.string(),
        name: v.string(),
        birthDate: v.optional(v.number()),
        gender: v.string(),
        bio: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            name: args.name,
            birthDate: args.birthDate,
            gender: args.gender,
            bio: args.bio,
            avatarUrl: args.avatarUrl,
        });
    },
});

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});
