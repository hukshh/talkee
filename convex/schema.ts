import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    birthDate: v.optional(v.number()),
    gender: v.optional(v.string()),
    bio: v.optional(v.string()),
    fantasy: v.optional(v.array(v.string())),
    desire: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    images: v.optional(v.array(v.string())),
    virtualCurrency: v.optional(v.number()),
    subscriptionTier: v.optional(v.union(v.literal("free"), v.literal("pro"), v.literal("ultra"))),
    dailyVideoCalls: v.optional(v.number()),
    lastCallResetDate: v.optional(v.string()),
    lastSeenStatus: v.optional(v.number()),
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
    lastMessageSenderName: v.optional(v.string()),
    updatedAt: v.number(),
  }),

  messages: defineTable({
    senderId: v.id("users"),
    conversationId: v.id("conversations"),
    content: v.string(),
    imageUrl: v.optional(v.string()),
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

  swipes: defineTable({
    swiperId: v.id("users"),
    swipedId: v.id("users"),
    action: v.union(v.literal("like"), v.literal("pass")),
  })
    .index("by_swiper", ["swiperId"])
    .index("by_swiped", ["swipedId"])
    .index("by_swipe", ["swiperId", "swipedId"]),

  statuses: defineTable({
    userId: v.id("users"),
    mediaUrl: v.string(),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    caption: v.optional(v.string()),
    note: v.optional(v.string()),
    musicUrl: v.optional(v.string()),
    musicTitle: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
}, { schemaValidation: false });


