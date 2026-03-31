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

  calls: defineTable({
    callerId: v.id("users"),
    receiverId: v.id("users"),
    status: v.union(v.literal("ringing"), v.literal("accepted"), v.literal("rejected"), v.literal("ended")),
    sdpOffer: v.optional(v.string()), // JSON string of RTCSessionDescriptionInit
    sdpAnswer: v.optional(v.string()), // JSON string of RTCSessionDescriptionInit
  })
    .index("by_receiver", ["receiverId"])
    .index("by_caller", ["callerId"]),

  ice_candidates: defineTable({
    callId: v.id("calls"),
    userId: v.id("users"),
    type: v.union(v.literal("caller"), v.literal("receiver")),
    candidate: v.string(), // JSON string of RTCIceCandidateInit
  }).index("by_call", ["callId"]),
});

