"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { VideoCall } from "./VideoCall";
import { Button } from "./ui/button";
import { Phone, PhoneOff, Sparkles } from "lucide-react";

export function IncomingCallAlert() {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const incomingCall = useQuery(
        api.calls.getIncomingCall,
        currentClerkId ? { currentClerkId } : "skip"
    );

    const declineCall = useMutation(api.calls.declineCall);
    const [acceptedCallId, setAcceptedCallId] = useState<string | null>(null);

    if (!user || incomingCall === undefined) return null;

    if (acceptedCallId) {
        return (
            <VideoCall
                isCaller={false}
                callId={acceptedCallId}
                onClose={() => setAcceptedCallId(null)}
            />
        );
    }

    if (!incomingCall) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-3xl animate-in fade-in duration-700">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            <div className="relative glass-grey w-full max-w-sm p-10 rounded-[3.5rem] border border-white/20 shadow-[0_40px_80px_rgba(0,0,0,0.8)] flex flex-col items-center animate-in zoom-in-95 duration-500">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                    <div className="glass-silver p-5 rounded-[2.5rem] border border-white/30 shadow-2xl animate-bounce-subtle">
                        <Phone className="w-10 h-10 text-white" />
                    </div>
                </div>

                <div className="mt-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="glass h-8 px-4 rounded-full flex items-center gap-2 border-white/10 backdrop-blur-3xl">
                            <Sparkles className="w-3 h-3 text-white opacity-40" />
                            <span className="text-[8px] font-black text-white uppercase tracking-[0.4em] italic leading-none">Frequency Match Request</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Incoming</h2>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic mb-6">Real-time Vibe Sync</p>
                    </div>
                    <p className="text-zinc-400 font-bold italic text-sm px-4 leading-relaxed">
                        A frequency signal is attempting to establish a cinematic connection with you. 🔮
                    </p>
                </div>

                <div className="flex flex-col gap-4 w-full mt-12">
                    <Button
                        className="h-20 rounded-[2.2rem] bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest italic transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 flex items-center justify-center gap-3"
                        onClick={() => setAcceptedCallId(incomingCall._id)}
                    >
                        <Phone className="w-6 h-6" />
                        Accept Sync
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-20 rounded-[2.2rem] glass text-zinc-500 hover:text-white font-black uppercase tracking-widest italic border-white/5 transition-all flex items-center justify-center gap-3"
                        onClick={() => declineCall({ callId: incomingCall._id })}
                    >
                        <PhoneOff className="w-6 h-6 opacity-40 group-hover:opacity-100" />
                        Decline
                    </Button>
                </div>
            </div>
        </div>
    );
}
