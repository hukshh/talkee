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
        if (!args.currentClerkId) return users;

        return users.filter((u) => u.clerkId !== args.currentClerkId);
    },
});

export const getUserById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

export const getCurrentUser = query({
    args: { currentClerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();
    },
});

export const onboardUser = mutation({
    args: {
        currentClerkId: v.string(),
        name: v.string(),
        age: v.number(),
        gender: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) throw new Error("User not found");
        if (args.age < 18) throw new Error("You must be 18 or older to use this app.");

        await ctx.db.patch(user._id, {
            name: args.name,
            age: args.age,
            gender: args.gender,
        });
    },
});
