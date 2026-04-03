"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, X, Sparkles, Zap, ShieldCheck, MapPin, Share2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import clsx from "clsx";

interface ProfileViewProps {
    user: any;
    currentUser: any;
    isStandalone?: boolean;
    onClose?: () => void;
}

export function ProfileView({ user, currentUser, isStandalone, onClose }: ProfileViewProps) {
    if (!user) return null;

    const userInterests = user.interests || [...(user.fantasy || []), ...(user.desire || [])];
    const currentUserInterests = currentUser.interests || [...(currentUser.fantasy || []), ...(currentUser.desire || [])];
    const commonInterests = userInterests.filter((i: string) => currentUserInterests.includes(i));

    return (
        <div className={clsx("relative w-full", isStandalone ? "min-h-screen bg-[#050505]" : "")}>
            {/* Hero Section */}
            <div className={clsx("relative w-full group overflow-hidden", isStandalone ? "h-[600px]" : "h-[500px]")}>
                <img
                    src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"}
                    alt={user.name}
                    className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/40 via-transparent to-transparent opacity-80" />

                {/* Top Controls - Only show in modal */}
                {!isStandalone && (
                    <div
                        className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-20"
                        style={{ paddingTop: 'max(2rem, env(safe-area-inset-top))' }}
                    >
                        <div className="glass-darker px-4 py-2 rounded-full flex items-center gap-2 border-white/10 backdrop-blur-3xl">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">Vibe Active</span>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={onClose} variant="ghost" size="icon" className="h-12 w-12 glass rounded-2xl text-white hover:bg-white hover:text-black transition-all border-white/10 shadow-2xl">
                                <X className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* User Identity Overlay */}
                <div className={clsx("absolute left-6 md:left-10 right-6 md:right-10 space-y-4", isStandalone ? "bottom-20" : "bottom-12")}>
                    <div className="flex items-center gap-4">
                        <h2 className={clsx("font-black italic uppercase tracking-tighter drop-shadow-2xl vibe-gradient", isStandalone ? "text-6xl md:text-8xl" : "text-5xl md:text-6xl")}>{user.name}</h2>
                        <div className="h-8 w-8 glass-silver rounded-xl flex items-center justify-center border-white/20 opacity-80 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest italic">Secret Location, IN</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest italic">{user.gender} • Identity Verified</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className={clsx("p-10 space-y-12 max-w-5xl mx-auto", isStandalone ? "pb-40" : "")}>
                {/* Profile Bio */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.5em] italic">Direct Manifestation</h3>
                    <p className="text-xl font-bold text-zinc-300 leading-relaxed italic border-l-2 border-white/10 pl-8">
                        {user.bio || "This frequency is waiting to be explored. Connect to unlock shared consciousness and exchange high-level vibes."}
                    </p>
                </div>

                {/* Interests & Legacy Vibes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-4 h-4 text-white opacity-40" />
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">Neural Fantasy</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {userInterests.slice(0, 10).map((interest: string) => {
                                const isShared = commonInterests.includes(interest);
                                return (
                                    <Badge
                                        key={interest}
                                        className={clsx(
                                            "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all italic border-white/5",
                                            isShared
                                                ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-105"
                                                : "glass-darker text-zinc-500"
                                        )}
                                    >
                                        {interest}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Heart className="w-4 h-4 text-white opacity-40" />
                            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">Core Desires</h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {userInterests.slice(10).map((interest: string) => {
                                const isShared = commonInterests.includes(interest);
                                return (
                                    <Badge
                                        key={interest}
                                        className={clsx(
                                            "px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all italic border-white/5",
                                            isShared
                                                ? "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-105"
                                                : "glass-darker text-zinc-500"
                                        )}
                                    >
                                        {interest}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Action Hub */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row gap-6">
                    <Button className="flex-1 h-20 rounded-[2rem] bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-95 transition-all text-sm font-black uppercase tracking-[0.2em] italic shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                        <MessageCircle className="w-6 h-6 mr-3" /> Initiate Frequency
                    </Button>
                    <div className="flex gap-4">
                        <Button className="h-20 w-20 rounded-[2rem] glass-darker text-white border-white/5 hover:bg-white hover:text-black transition-all">
                            <Share2 className="w-6 h-6" />
                        </Button>
                        <Button className="h-20 w-20 rounded-[2rem] glass-darker text-white border-white/5 hover:bg-white hover:text-black transition-all">
                            <Heart className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface UserProfileModalProps {
    user: any;
    currentUser: any;
    isOpen: boolean;
    onClose: () => void;
}

export function UserProfileModal({ user, currentUser, isOpen, onClose }: UserProfileModalProps) {
    if (!user) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[700px] p-0 overflow-hidden bg-[#050505] border-white/5 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                <ScrollArea className="max-h-[90vh]">
                    <ProfileView user={user} currentUser={currentUser} onClose={onClose} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
