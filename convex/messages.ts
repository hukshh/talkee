import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        imageUrl: v.optional(v.string()),
        currentClerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const messageId = await ctx.db.insert("messages", {
            senderId: currentUser._id,
            conversationId: args.conversationId,
            content: args.content,
            imageUrl: args.imageUrl,
            createdAt: Date.now(),
            seen: false,
        });

        await ctx.db.patch(args.conversationId, {
            lastMessage: args.imageUrl ? "📷 GIF" : args.content,
            lastMessageSenderName: currentUser.name,
            updatedAt: Date.now(),
        });

        return messageId;
    },
});

export const getMessages = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        const hydrated = [];
        for (const msg of messages) {
            const sender = await ctx.db.get(msg.senderId);
            hydrated.push({
                ...msg,
                sender: sender ? {
                    name: sender.name,
                    avatarUrl: sender.avatarUrl,
                    clerkId: sender.clerkId,
                } : null,
            });
        }
        return hydrated;
    },
});

export const deleteMessage = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            deleted: true,
            content: "This message was deleted",
        });
    },
});

export const markAsSeen = mutation({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.messageId, {
            seen: true,
        });
    },
});

export const markAllAsSeen = mutation({
    args: {
        conversationId: v.id("conversations"),
        currentClerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!currentUser) return;

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        for (const msg of messages) {
            if (!msg.seen && msg.senderId !== currentUser._id) {
                await ctx.db.patch(msg._id, { seen: true });
            }
        }
    },
});
