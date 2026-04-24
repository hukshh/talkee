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

        const hydrated = [];
        for (const conv of userConversations) {
            const memberInfo = [];
            for (const memberId of conv.members) {
                const member = await ctx.db.get(memberId);
                if (member) {
                    const presence = await ctx.db
                        .query("presence")
                        .withIndex("by_userId", (q) => q.eq("userId", member._id))
                        .unique();
                    memberInfo.push({
                        _id: member._id,
                        clerkId: member.clerkId,
                        name: member.name,
                        avatarUrl: member.avatarUrl,
                        isOnline: presence?.isOnline ?? false,
                    });
                }
            }

            // Count unread messages
            const unreadMessages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conv._id))
                .filter((q) => q.and(
                    q.eq(q.field("seen"), false),
                    q.neq(q.field("senderId"), currentUser._id)
                ))
                .collect();

            hydrated.push({ 
                ...conv, 
                memberInfo,
                unreadCount: unreadMessages.length
            });
        }

        return hydrated.sort((a, b) => b.updatedAt - a.updatedAt);
    },
});

export const createGroup = mutation({
    args: {
        name: v.string(),
        memberIds: v.array(v.id("users")),
        currentClerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!currentUser) throw new Error("User not found");

        const allMemberIds = Array.from(new Set([currentUser._id, ...args.memberIds]));

        return await ctx.db.insert("conversations", {
            members: allMemberIds,
            isGroup: true,
            groupName: args.name,
            updatedAt: Date.now(),
        });
    },
});

export const getConversationById = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return null;

        const memberInfo = [];
        for (const memberId of conversation.members) {
            const member = await ctx.db.get(memberId);
            if (member) {
                const presence = await ctx.db
                    .query("presence")
                    .withIndex("by_userId", (q) => q.eq("userId", member._id))
                    .unique();
                memberInfo.push({
                    _id: member._id,
                    clerkId: member.clerkId,
                    name: member.name,
                    avatarUrl: member.avatarUrl,
                    isOnline: presence?.isOnline ?? false,
                });
            }
        }

        return { ...conversation, memberInfo };
    },
});
