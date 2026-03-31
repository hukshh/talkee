import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  presence: defineTable({
    userId: v.id("users"),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  }).index("by_userId", ["userId"]),

  conversations: defineTable({
    members: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    lastMessage: v.optional(v.string()),
    updatedAt: v.number(),
  }),

  messages: defineTable({
    senderId: v.id("users"),
    conversationId: v.id("conversations"),
    content: v.string(),
    createdAt: v.number(),
    seen: v.boolean(),
    deleted: v.optional(v.boolean()),
  }).index("by_conversationId", ["conversationId"]),

  typing: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
    lastTypedAt: v.number(),
  }).index("by_conversation", ["conversationId", "userId"]),
});
