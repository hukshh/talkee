import { mutation } from "./_generated/server";

const FAKE_USERS = [
    { name: "Alice Wonderland", avatarUrl: "https://i.pravatar.cc/300?u=alice" },
    { name: "Bob Builder", avatarUrl: "https://i.pravatar.cc/300?u=bob" },
    { name: "Charlie Chaplin", avatarUrl: "https://i.pravatar.cc/300?u=charlie" },
    { name: "Diana Prince", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" },
    { name: "Ethan Hunt", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" },
    { name: "Fiona Gallagher", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop" },
    { name: "Greg House", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop" },
    { name: "Hannah Abbott", avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop" },
];

export const populate = mutation({
    args: {},
    handler: async (ctx) => {
        let count = 0;

        for (const user of FAKE_USERS) {
            // Generate a deterministic fake clerk ID
            const clerkId = `fake_${user.name.toLowerCase().replace(" ", "_")}`;

            const existing = await ctx.db
                .query("users")
                .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
                .unique();

            if (!existing) {
                // Insert fake user
                const userId = await ctx.db.insert("users", {
                    clerkId,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    createdAt: Date.now(),
                });

                // Also insert a fake presence record so they appear active
                await ctx.db.insert("presence", {
                    userId,
                    isOnline: true,
                    lastSeen: Date.now(),
                });

                count++;
            }
        }

        return `Seeded ${count} fake users successfully!`;
    },
});
