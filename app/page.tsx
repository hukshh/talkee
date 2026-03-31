"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { DiscoverFeed } from "@/components/DiscoverFeed";
import { OnboardingForm } from "@/components/OnboardingForm";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const { isLoaded, isSignedIn, user } = useUser();
  const currentClerkId = user?.id;
  const router = useRouter();

  const currentUser = useQuery(api.users.getCurrentUser, currentClerkId ? { currentClerkId } : "skip");

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn || currentUser === undefined) return null;

  // Onboarding gate (under 18 block + profile completion)
  if (currentUser && (!currentUser.age || !currentUser.gender)) {
    return <main className="flex h-screen w-full bg-gray-50"><OnboardingForm currentUser={currentUser} /></main>;
  }

  return (
    <main className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <div className={`w-full md:w-[350px] md:block ${activeConversationId ? "hidden" : "block"}`}>
        <Sidebar
          activeConversationId={activeConversationId}
          onSelectConversation={(id) => setActiveConversationId(id)}
        />
      </div>

      <div className={`flex-1 flex flex-col h-full bg-white relative shadow-l-xl z-10 ${!activeConversationId ? "hidden md:flex" : "flex"}`}>
        {activeConversationId ? (
          <>
            {/* Mobile back button header */}
            <div className="md:hidden flex items-center p-4 border-b">
              <button
                onClick={() => setActiveConversationId(undefined)}
                className="text-blue-600 font-medium"
              >
                ← Back to Chats
              </button>
            </div>
            {/* Using a key ensures ChatWindow fully remounts if conversationId changes, resetting state */}
            <ChatWindow key={activeConversationId} conversationId={activeConversationId} />
          </>
        ) : (
          <DiscoverFeed />
        )}
      </div>
    </main>
  );
}
