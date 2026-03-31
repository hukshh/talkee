"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export function SyncUser() {
    const { user, isLoaded, isSignedIn } = useUser();
    const createUser = useMutation(api.users.createUser);
    const updatePresence = useMutation(api.presence.updatePresence);

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            // Sync user details to Convex
            createUser({
                clerkId: user.id,
                name: user.fullName || user.firstName || "Anonymous",
                avatarUrl: user.imageUrl,
            });

            // Update presence
            updatePresence({
                currentClerkId: user.id,
                isOnline: true,
            });

            // Handle presence on unmount / visibility change
            const handleVisibilityChange = () => {
                if (document.visibilityState === "hidden") {
                    updatePresence({ currentClerkId: user.id, isOnline: false });
                } else {
                    updatePresence({ currentClerkId: user.id, isOnline: true });
                }
            };

            document.addEventListener("visibilitychange", handleVisibilityChange);

            return () => {
                document.removeEventListener("visibilitychange", handleVisibilityChange);
                updatePresence({ currentClerkId: user.id, isOnline: false });
            };
        }
    }, [user, isLoaded, isSignedIn, createUser, updatePresence]);

    return null;
}
