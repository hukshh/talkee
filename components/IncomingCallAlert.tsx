"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { VideoCall } from "./VideoCall";
import { Button } from "./ui/button";
import { Phone, PhoneOff } from "lucide-react";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Phone className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">Incoming Video Call</h2>
                <p className="text-gray-500 mb-8 text-center">
                    Someone is calling you...
                </p>

                <div className="flex gap-4 w-full">
                    <Button
                        variant="destructive"
                        className="flex-1 py-6 rounded-xl text-lg relative overflow-hidden group"
                        onClick={() => declineCall({ callId: incomingCall._id })}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
                        <PhoneOff className="w-5 h-5 mr-2" />
                        Decline
                    </Button>
                    <Button
                        className="flex-1 py-6 rounded-xl text-lg bg-green-500 hover:bg-green-600 border-none relative overflow-hidden group shadow-lg shadow-green-200"
                        onClick={() => setAcceptedCallId(incomingCall._id)}
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
                        <Phone className="w-5 h-5 mr-2" />
                        Accept
                    </Button>
                </div>
            </div>
        </div>
    );
}
