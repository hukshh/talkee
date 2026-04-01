import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const initiateCall = mutation({
    args: {
        receiverId: v.id("users"),
        currentClerkId: v.string(),
        sdpOffer: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!caller) throw new Error("Caller not found");

        const today = new Date().toISOString().split("T")[0];
        let dailyVideoCalls = caller.dailyVideoCalls || 0;
        
        if (caller.lastCallResetDate !== today) {
            dailyVideoCalls = 0;
        }

        const tier = caller.subscriptionTier || "free";
        if (tier === "free" && dailyVideoCalls >= 3) {
            throw new Error("Daily limit reached for free tier. Upgrade to Pro for more calls!");
        } else if (tier === "pro" && dailyVideoCalls >= 10) {
            throw new Error("Daily limit reached for pro tier. Upgrade to Ultra for unlimited calls!");
        }

        await ctx.db.patch(caller._id, {
            dailyVideoCalls: dailyVideoCalls + 1,
            lastCallResetDate: today,
        });

        return await ctx.db.insert("calls", {
            callerId: caller._id,
            receiverId: args.receiverId,
            status: "ringing",
            sdpOffer: args.sdpOffer,
        });
    },
});

export const acceptCall = mutation({
    args: {
        callId: v.id("calls"),
        sdpAnswer: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.callId, {
            status: "accepted",
            sdpAnswer: args.sdpAnswer,
        });
    },
});

export const endCall = mutation({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.callId, {
            status: "ended",
        });
    },
});

export const declineCall = mutation({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.callId, {
            status: "rejected",
        });
    },
});

export const addIceCandidate = mutation({
    args: {
        callId: v.id("calls"),
        currentClerkId: v.string(),
        candidate: v.string(),
        type: v.union(v.literal("caller"), v.literal("receiver")),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) throw new Error("User not found");

        await ctx.db.insert("ice_candidates", {
            callId: args.callId,
            userId: user._id,
            candidate: args.candidate,
            type: args.type,
        });
    },
});

export const getIncomingCall = query({
    args: {
        currentClerkId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.currentClerkId))
            .unique();

        if (!user) return null;

        const ringingCalls = await ctx.db
            .query("calls")
            .withIndex("by_receiver", (q) => q.eq("receiverId", user._id))
            .filter((q) => q.eq(q.field("status"), "ringing"))
            .collect();

        // Return the latest incoming call
        if (ringingCalls.length > 0) {
            return ringingCalls[ringingCalls.length - 1];
        }
        return null;
    },
});

export const getCallState = query({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.callId);
    },
});

export const getIceCandidates = query({
    args: {
        callId: v.id("calls"),
        type: v.union(v.literal("caller"), v.literal("receiver")),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("ice_candidates")
            .withIndex("by_call", (q) => q.eq("callId", args.callId))
            .filter((q) => q.eq(q.field("type"), args.type))
            .collect();
    },
});
