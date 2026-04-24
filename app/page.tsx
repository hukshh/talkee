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
import { ProfileView } from "@/components/UserProfileModal";
const ChatWindow = dynamic(() => import("@/components/ChatWindow").then((mod) => mod.ChatWindow), { ssr: false });

import { useNav, MobileTab } from "@/context/NavContext";
import OnboardingForm from "@/components/OnboardingForm";
import { MobileNavbar } from "@/components/MobileNavbar";

export default function Home() {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [selectedProfileId, setSelectedProfileId] = useState<string | undefined>();
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

  if (!isLoaded || !isSignedIn || currentUser === undefined) return <Preloader />;

  // Onboarding gate - simplified for core features
  if (!hasRecentlyOnboarded && currentUser && (!currentUser.name || !currentUser.bio)) {
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
    setSelectedProfileId(undefined);
  };

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    setActiveTab("discover");
  };

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
        {selectedProfileId ? (
          <div className="flex-1 overflow-y-auto h-full custom-scrollbar animate-in fade-in duration-500">
             <div className="md:hidden flex items-center p-4 border-b border-white/[0.04] bg-[#080808]/80 backdrop-blur-2xl sticky top-0 z-50" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
              <button
                onClick={() => setSelectedProfileId(undefined)}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 glass rounded-lg flex items-center justify-center border-white/[0.06] group-active:scale-90 transition-all">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </div>
                <span className="text-zinc-500 font-medium uppercase text-[10px] tracking-wider group-hover:text-white transition-colors">Back</span>
              </button>
            </div>
             <div className="hidden md:block">
                <button 
                  onClick={() => setSelectedProfileId(undefined)}
                  className="absolute top-8 left-8 z-50 h-10 px-4 glass rounded-xl text-white hover:bg-white hover:text-black transition-all border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic"
                >
                  <ChevronLeft className="w-4 h-4" /> Exit Profile
                </button>
             </div>
             <div className="min-h-full">
                <ProfileFrameWrapper profileId={selectedProfileId} currentUser={currentUser} onClose={() => setSelectedProfileId(undefined)} />
             </div>
          </div>
        ) : activeConversationId ? (
          <div className="flex-1 h-full overflow-hidden">
            <ChatWindow 
              key={activeConversationId} 
              conversationId={activeConversationId} 
              onBack={() => setActiveConversationId(undefined)}
            />
          </div>
        ) : isDiscoverActive ? (
          <div className="flex-1 overflow-y-auto h-full custom-scrollbar">
            {/* Mobile Nav Header */}
            <div
              className="md:hidden flex items-center justify-between p-4 pb-3 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-2xl sticky top-0 z-50"
              style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
            >
              <div className="space-y-0.5">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none vibe-gradient">Discover</h1>
                <p className="text-[9px] font-medium text-zinc-600 uppercase tracking-widest">Connect with others</p>
              </div>
              <div className="w-10 h-10 glass-silver rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <DiscoverFeed onSelectProfile={handleSelectProfile} />
            {/* Mobile Nav Spacer */}
            <div className="h-40 md:hidden" />
          </div>
        ) : isChatsActive ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-background/50 backdrop-blur-3xl p-8 text-center space-y-10 animate-fade-in">
            <div className="relative group">
              {/* Animated Glow Rings */}
              <div className="absolute -inset-12 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000 animate-pulse" />
              <div className="absolute -inset-24 bg-white/5 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="relative w-28 h-28 glass-premium rounded-[2.5rem] flex items-center justify-center border-white/10 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <div className="w-16 h-16 glass-floating rounded-2xl flex items-center justify-center border-white/20">
                  <Sparkles className="w-8 h-8 text-white animate-bounce-subtle" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="space-y-1">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Your <span className="vibe-gradient text-4xl">Messages</span>
                </h2>
                <div className="h-1 w-12 bg-white/20 mx-auto rounded-full" />
              </div>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic max-w-[200px] mx-auto leading-relaxed">
                Select a conversation to start your next premium experience
              </p>
            </div>

            <div className="flex items-center gap-6 pt-4 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700 animate-slide-up" style={{ animationDelay: '400ms' }}>
               <MessageSquare className="w-5 h-5 text-zinc-500" />
               <div className="w-1 h-1 rounded-full bg-zinc-800" />
               <Zap className="w-5 h-5 text-zinc-500" />
               <div className="w-1 h-1 rounded-full bg-zinc-800" />
               <Users className="w-5 h-5 text-zinc-500" />
            </div>
          </div>
        ) : (
          /* Desktop default view (Discover) */
          <div className="flex-1 overflow-y-auto pb-32 md:pb-8 h-full custom-scrollbar hidden md:block">
            <DiscoverFeed onSelectProfile={handleSelectProfile} />
          </div>
        )}
      </div>

      {/* Mobile Navigation Island */}
      {!activeConversationId && <MobileNavbar activeTab={activeTab} onTabChange={handleTabChange} />}
    </main>
  );
}

function ProfileFrameWrapper({ profileId, currentUser, onClose }: { profileId: string, currentUser: any, onClose: () => void }) {
  const user = useQuery(api.users.getUserById, { userId: profileId as any });
  
  if (!user) return (
    <div className="flex-1 flex items-center justify-center py-40">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    </div>
  );

  return <ProfileView user={user} currentUser={currentUser} isStandalone={true} onClose={onClose} />;
}

function Preloader() {
  return (
    <div className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center">
      <div className="relative group">
        <div className="absolute -inset-10 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative w-20 h-20 glass-silver rounded-2xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-10 h-10 text-white animate-bounce" />
        </div>
      </div>
      <div className="mt-12 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter vibe-gradient">Talkee</h2>
        <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Connecting...</p>
      </div>
    </div>
  );
}
