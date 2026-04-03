import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const updateUser = mutation({
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

        if (!existingUser) {
            throw new Error("User not found");
        }

        await ctx.db.patch(existingUser._id, {
            name: args.name,
            avatarUrl: args.avatarUrl,
        });
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
                if (avatarUrl && !avatarUrl.startsWith("http")) {
                    avatarUrl = await ctx.storage.getUrl(avatarUrl) || avatarUrl;
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
        if (avatarUrl && !avatarUrl.startsWith("http")) {
            avatarUrl = await ctx.storage.getUrl(avatarUrl) || avatarUrl;
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
        if (avatarUrl && !avatarUrl.startsWith("http")) {
            avatarUrl = await ctx.storage.getUrl(avatarUrl) || avatarUrl;
        }
        return { ...user, avatarUrl };
    },
});

export const onboardUser = mutation({
    args: {
        currentClerkId: v.string(),
        name: v.string(),
        birthDate: v.number(),
        gender: v.string(),
        bio: v.optional(v.string()),
        interests: v.optional(v.array(v.string())),
        images: v.optional(v.array(v.string())),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) throw new Error("User not found");

        // Calculate age for validation
        const birthDate = new Date(args.birthDate);
        const age = new Date().getFullYear() - birthDate.getFullYear();
        if (age < 18) throw new Error("You must be 18 or older to use this app.");

        await ctx.db.patch(user._id, {
            name: args.name,
            birthDate: args.birthDate,
            gender: args.gender,
            bio: args.bio,
            interests: args.interests,
            images: args.images,
            avatarUrl: args.avatarUrl,
            subscriptionTier: user.subscriptionTier || "free",
            virtualCurrency: user.virtualCurrency || 0,
        });
    },
});

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const addVirtualCurrency = mutation({
    args: {
        currentClerkId: v.string(),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.patch(user._id, {
            virtualCurrency: (user.virtualCurrency || 0) + args.amount,
        });
    },
});

export const upgradeSubscriptionTier = mutation({
    args: {
        currentClerkId: v.string(),
        targetTier: v.union(v.literal("pro"), v.literal("ultra")),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) throw new Error("User not found");

        const cost = args.targetTier === "pro" ? 500 : 1000;
        const currentCurrency = user.virtualCurrency || 0;

        if (currentCurrency < cost) {
            throw new Error("Insufficient virtual currency.");
        }

        await ctx.db.patch(user._id, {
            virtualCurrency: currentCurrency - cost,
            subscriptionTier: args.targetTier,
        });
    },
});

export const checkMyBirthday = query({
    args: { currentClerkId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user || !user.birthDate) return null;

        const today = new Date();
        const birth = new Date(user.birthDate);

        const isBirthday = today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();

        if (isBirthday) {
            return {
                name: user.name,
                gender: user.gender,
            };
        }
        return null;
    },
});

export const deductVirtualCurrency = mutation({
    args: {
        currentClerkId: v.string(),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) throw new Error("User not found");

        const currentCurrency = user.virtualCurrency || 0;
        if (currentCurrency < args.amount) {
            throw new Error("Insufficient balance.");
        }

        await ctx.db.patch(user._id, {
            virtualCurrency: currentCurrency - args.amount,
        });
    },
});
