"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatWindow } from "@/components/ChatWindow";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) return null;

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
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Real-Time Messenger</h2>
            <p className="text-gray-500 max-w-sm">
              Select an existing conversation from the sidebar or search for users to start a new chat.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
