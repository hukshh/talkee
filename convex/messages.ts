import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        imageUrl: v.optional(v.string()),
        audioUrl: v.optional(v.string()),
        fileUrl: v.optional(v.string()),
        attachmentType: v.optional(v.union(v.literal("image"), v.literal("audio"), v.literal("file"))),
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
            audioUrl: args.audioUrl,
            fileUrl: args.fileUrl,
            attachmentType: args.attachmentType,
            createdAt: Date.now(),
            seen: false,
        });

        let lastMsgText = args.content;
        if (args.attachmentType === "image") lastMsgText = "📷 Image";
        else if (args.attachmentType === "audio") lastMsgText = "🎤 Voice Message";
        else if (args.attachmentType === "file") lastMsgText = "📁 File";

        await ctx.db.patch(args.conversationId, {
            lastMessage: lastMsgText,
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
            
            let imageUrl = msg.imageUrl;
            if (imageUrl && !imageUrl.startsWith("http")) {
                imageUrl = await ctx.storage.getUrl(imageUrl) || imageUrl;
            }

            let audioUrl = msg.audioUrl;
            if (audioUrl && !audioUrl.startsWith("http")) {
                audioUrl = await ctx.storage.getUrl(audioUrl) || audioUrl;
            }

            let fileUrl = msg.fileUrl;
            if (fileUrl && !fileUrl.startsWith("http")) {
                fileUrl = await ctx.storage.getUrl(fileUrl) || fileUrl;
            }

            hydrated.push({
                ...msg,
                imageUrl,
                audioUrl,
                fileUrl,
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
        });
    },
});

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        emoji: v.string(),
        currentClerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");

        const reactions = message.reactions || [];
        const existingReactionIndex = reactions.findIndex(
            (r) => r.userId === user._id && r.emoji === args.emoji
        );

        if (existingReactionIndex !== -1) {
            reactions.splice(existingReactionIndex, 1);
        } else {
            reactions.push({ userId: user._id, emoji: args.emoji });
        }

        await ctx.db.patch(args.messageId, { reactions });
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
