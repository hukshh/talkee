"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronLeft } from "lucide-react";
import { clsx } from "clsx";

import { Sidebar } from "@/components/Sidebar";
import { DesktopNavbar } from "@/components/DesktopNavbar";
import { DiscoverFeed } from "@/components/DiscoverFeed";
const ChatWindow = dynamic(() => import("@/components/ChatWindow").then((mod) => mod.ChatWindow), { ssr: false });
const Wallet = dynamic(() => import("@/components/Wallet").then((mod) => mod.Wallet), { ssr: false });

import { useNav, MobileTab } from "@/context/NavContext";
import OnboardingForm from "@/components/OnboardingForm";
import { MobileNavbar } from "@/components/MobileNavbar";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [hasRecentlyOnboarded, setHasRecentlyOnboarded] = useState(false);
  const { activeTab, setActiveTab } = useNav();
  const { isLoaded, isSignedIn, user } = useUser();
  const currentClerkId = user?.id;
  const router = useRouter();

  const currentUser = useQuery(api.users.getCurrentUser, currentClerkId ? { currentClerkId } : "skip");

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn || currentUser === undefined) return <VibePreloader />;

  // Onboarding gate
  const hasTags = (currentUser?.interests && currentUser.interests.length > 0) ||
    (currentUser?.fantasy && currentUser.fantasy.length > 0) ||
    (currentUser?.desire && currentUser.desire.length > 0);

  if (!hasRecentlyOnboarded && currentUser && (!currentUser.birthDate || !currentUser.gender || !currentUser.bio || !hasTags)) {
    return (
      <main suppressHydrationWarning className="flex h-screen w-full bg-[#050505] dark">
        <OnboardingForm onComplete={() => {
          setHasRecentlyOnboarded(true);
          setActiveTab("chats");
        }} />
      </main>
    );
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    if (id) setActiveTab("chats");
  };

  const handleTabChange = (tab: MobileTab) => {
    setActiveTab(tab);
    setActiveConversationId(undefined);
  };

  const isWalletActive = activeTab === "wallet";
  const isDiscoverActive = activeTab === "discover";
  const isChatsActive = activeTab === "chats";

  return (
    <main suppressHydrationWarning className="flex h-[100dvh] w-full bg-background overflow-hidden relative dark">
      {/* Desktop Navbar */}
      <DesktopNavbar onTabChange={handleTabChange} />

      {/* Sidebar - Always visible on desktop, tab-dependent on mobile */}
      <div className={clsx(
        "md:h-full shrink-0 transition-all duration-500",
        activeConversationId ? "hidden md:block" : (isChatsActive ? "block" : "hidden md:block")
      )}>
        <Sidebar
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onSelectWallet={() => handleTabChange("wallet")}
          activeMobileTab={activeTab}
          onMobileTabChange={handleTabChange}
          hideOnMobile={!!activeConversationId}
        />
      </div>

      {/* Main Content Area */}
      <div className={clsx(
        "flex-1 flex flex-col h-full bg-background relative z-10 transition-all duration-500",
        !activeConversationId && isChatsActive ? "hidden md:flex" : "flex"
      )}>
        {isWalletActive ? (
          <div className="flex-1 bg-background/50 backdrop-blur-3xl overflow-y-auto">
            <div className="md:hidden flex items-center p-4 border-b border-white/[0.04] bg-[#080808]/80 backdrop-blur-2xl sticky top-0 z-50" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
              <button
                onClick={() => handleTabChange("chats")}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 glass rounded-lg flex items-center justify-center border-white/[0.06] group-active:scale-90 transition-all">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </div>
                <span className="text-zinc-500 font-medium uppercase text-[10px] tracking-wider group-hover:text-white transition-colors">Back</span>
              </button>
            </div>
            <Wallet />
            {/* Mobile Nav Spacer */}
            <div className="h-32 md:hidden" />
          </div>
        ) : activeConversationId ? (
          <div className="flex-1 bg-background/50 backdrop-blur-3xl">
            {/* Mobile back button header */}
            <div className="md:hidden flex items-center p-4 border-b border-white/[0.04] bg-[#080808]/80 backdrop-blur-2xl sticky top-0 z-50" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
              <button
                onClick={() => setActiveConversationId(undefined)}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 glass rounded-lg flex items-center justify-center border-white/[0.06] group-active:scale-90 transition-all">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </div>
                <span className="text-zinc-500 font-medium uppercase text-[10px] tracking-wider group-hover:text-white transition-colors">Back</span>
              </button>
            </div>
            <ChatWindow key={activeConversationId} conversationId={activeConversationId} />
          </div>
        ) : isDiscoverActive ? (
          <div className="flex-1 overflow-y-auto h-full custom-scrollbar">
            {/* Mobile Nav Header */}
            <div
              className="md:hidden flex items-center justify-between p-4 pb-3 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-2xl sticky top-0 z-50"
              style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
            >
              <div className="space-y-0.5">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none vibe-gradient">Explore <span className="text-white/30">Vibes</span></h1>
                <p className="text-[9px] font-medium text-zinc-600 uppercase tracking-widest">The global frequency</p>
              </div>
              <div className="w-10 h-10 glass-silver rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <DiscoverFeed />
            {/* Mobile Nav Spacer */}
            <div className="h-40 md:hidden" />
          </div>
        ) : isChatsActive ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-background/50 backdrop-blur-3xl p-8 text-center space-y-6">
            <div className="relative group">
              <div className="absolute -inset-8 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700" />
              <div className="relative w-24 h-24 glass-silver rounded-[2rem] flex items-center justify-center border-white/5 shadow-2xl">
                <Sparkles className="w-12 h-12 text-zinc-600" />
              </div>
            </div>
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Start a <span className="text-zinc-600 text-3xl">Vibe</span></h2>
              <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] italic">Select a frequency from the sidebar to begin messaging</p>
            </div>
          </div>
        ) : (
          /* Desktop default view (Discover) */
          <div className="flex-1 overflow-y-auto pb-32 md:pb-8 h-full custom-scrollbar hidden md:block">
            <DiscoverFeed />
          </div>
        )}
      </div>

      {/* Mobile Navigation Island - Hidden when in a chat to focus on messaging */}
      {!activeConversationId && <MobileNavbar activeTab={activeTab} onTabChange={handleTabChange} />}
    </main>
  );
}

function VibePreloader() {
  return (
    <div className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center">
      <div className="relative group">
        <div className="absolute -inset-10 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative w-20 h-20 glass-silver rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-10 h-10 text-white animate-bounce" />
        </div>
      </div>
      <div className="mt-12 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter vibe-gradient">Vibe Mingle</h2>
        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Syncing...</p>
      </div>
    </div>
  );
}
