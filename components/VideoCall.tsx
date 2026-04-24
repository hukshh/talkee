"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { PhoneOff, Mic, MicOff, Video, VideoOff, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function VideoCall({
    isCaller,
    receiverId,
    callId: initialCallId,
    onClose,
}: {
    isCaller: boolean;
    receiverId?: string;
    callId?: string;
    onClose: () => void;
}) {
    const { user } = useUser();
    const currentClerkId = user?.id;

    const [callId, setCallId] = useState<string | undefined>(initialCallId);
    const callState = useQuery(api.calls.getCallState, callId ? { callId: callId as any } : "skip");

    const peerType = isCaller ? "receiver" : "caller";
    const myType = isCaller ? "caller" : "receiver";
    const iceCandidates = useQuery(api.calls.getIceCandidates, callId ? { callId: callId as any, type: peerType } : "skip");

    const initiateCall = useMutation(api.calls.initiateCall);
    const acceptCall = useMutation(api.calls.acceptCall);
    const endCall = useMutation(api.calls.endCall);
    const addIceCandidateMutation = useMutation(api.calls.addIceCandidate);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isBlurred, setIsBlurred] = useState(false);

    const cleanup = useCallback(() => {
        if (localStream) {
            localStream.getTracks().forEach((track) => track.stop());
        }
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (callId) {
            endCall({ callId: callId as any }).catch(() => { });
        }
        onClose();
    }, [localStream, callId, endCall, onClose]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsBlurred(document.visibilityState === "hidden");
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5"))) {
                toast.error("Screenshots are not allowed!");
                e.preventDefault();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (callState?.status === "ended" || callState?.status === "rejected") {
            cleanup();
        }
    }, [callState?.status, cleanup]);

    useEffect(() => {
        if (isCaller && callState?.status === "accepted" && callState.sdpAnswer && pcRef.current) {
            const currentRemoteDesc = pcRef.current.remoteDescription;
            if (!currentRemoteDesc) {
                pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(callState.sdpAnswer)))
                    .catch(console.error);
            }
        }
    }, [callState, isCaller]);

    useEffect(() => {
        if (pcRef.current && iceCandidates) {
            iceCandidates.forEach((c) => {
                pcRef.current?.addIceCandidate(new RTCIceCandidate(JSON.parse(c.candidate))).catch(console.error);
            });
        }
    }, [iceCandidates]);

    useEffect(() => {
        const initWebRTC = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
                });
                pcRef.current = pc;

                stream.getTracks().forEach((track) => pc.addTrack(track, stream));

                pc.ontrack = (event) => {
                    if (remoteVideoRef.current && event.streams[0]) {
                        remoteVideoRef.current.srcObject = event.streams[0];
                    }
                };

                let tempCallId = callId;

                pc.onicecandidate = (event) => {
                    if (event.candidate && tempCallId && currentClerkId) {
                        addIceCandidateMutation({
                            callId: tempCallId as any,
                            currentClerkId,
                            candidate: JSON.stringify(event.candidate.toJSON()),
                            type: myType,
                        }).catch(console.error);
                    }
                };

                if (isCaller && receiverId && currentClerkId) {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    const newCallId = await initiateCall({
                        receiverId: receiverId as any,
                        currentClerkId,
                        sdpOffer: JSON.stringify(offer),
                    });
                    setCallId(newCallId);
                    tempCallId = newCallId;
                } else if (!isCaller && callId && callState?.sdpOffer) {
                    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callState.sdpOffer)));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    await acceptCall({
                        callId: callId as any,
                        sdpAnswer: JSON.stringify(answer),
                    });
                }
            } catch (err: any) {
                console.error("Error accessing media devices or setting up WebRTC.", err);
                toast.error(err.message || "Failed to access camera/microphone or initiate call");
                cleanup();
            }
        };

        if (!pcRef.current && (isCaller || (!isCaller && callState?.sdpOffer))) {
            initWebRTC();
        }
    }, [isCaller, callId, callState?.sdpOffer, currentClerkId, receiverId, initiateCall, acceptCall, cleanup, addIceCandidateMutation, myType]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[300] bg-[#050505] flex flex-col select-none touch-none animate-in fade-in duration-1000 ${isBlurred ? 'blur-3xl' : ''}`}
        >
            <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4">
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] animate-pulse" />
                </div>

                <div className="w-full h-full max-w-5xl aspect-[9/16] md:aspect-video relative overflow-hidden rounded-[3rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-1000">
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover bg-zinc-950"
                    />

                    {!remoteVideoRef.current?.srcObject && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-zinc-950">
                            <div className="w-32 h-32 glass-silver rounded-[3.5rem] flex items-center justify-center border-white/20 animate-pulse">
                                <Video className="w-12 h-12 text-white" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-2xl font-black italic uppercase tracking-tighter text-white">Signal Syncing</p>
                                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">Connecting frequency...</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-32 right-8 w-32 h-48 md:w-56 md:h-80 bg-[#0c0c0c] rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-white/20 z-[320] transition-all hover:scale-105 duration-500">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transition-opacity duration-700 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
                    />
                    {isVideoOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 animate-in fade-in">
                            <VideoOff className="w-10 h-10 text-zinc-700" />
                        </div>
                    )}
                </div>

                {callState?.status === "ringing" && isCaller && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[330] flex flex-col items-center gap-6">
                        <div className="w-24 h-24 glass-silver rounded-full border border-white/30 flex items-center justify-center shadow-2xl relative">
                            <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-20" />
                            <PhoneOff className="w-10 h-10 text-white rotate-[135deg]" />
                        </div>
                        <div className="glass px-8 py-4 rounded-full border border-white/10 backdrop-blur-3xl shadow-2xl">
                            <p className="text-lg font-black italic uppercase tracking-widest text-white animate-pulse">Calling...</p>
                        </div>
                    </div>
                )}

                {isBlurred && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/90 backdrop-blur-3xl z-[400] text-center p-12 animate-in fade-in duration-500">
                        <div className="w-24 h-24 glass rounded-[2.5rem] flex items-center justify-center border-white/10 mb-8">
                            <ShieldCheck className="w-12 h-12 text-white" />
                        </div>
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-4">Protected</h3>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Recording and screenshots are forbidden.</p>
                    </div>
                )}
            </div>

            <div className="h-40 bg-gradient-to-t from-black via-[#050505] to-transparent flex items-center justify-center gap-10 pb-12 px-8 z-[350]">
                <button
                    onClick={toggleMute}
                    className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 border-2 active:scale-90 ${isMuted
                        ? "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                        : "glass border-white/10 text-zinc-500 hover:text-white hover:border-white/30"
                        }`}
                >
                    {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <button
                    onClick={cleanup}
                    className="w-24 h-24 rounded-[2.5rem] bg-white text-black hover:bg-zinc-200 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all hover:scale-110 active:scale-95 duration-500 group"
                >
                    <PhoneOff className="w-10 h-10 transition-transform group-hover:rotate-[135deg] duration-700" />
                </button>

                <button
                    onClick={toggleVideo}
                    className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 border-2 active:scale-90 ${isVideoOff
                        ? "bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                        : "glass border-white/10 text-zinc-500 hover:text-white hover:border-white/30"
                        }`}
                >
                    {isVideoOff ? <VideoOff className="w-8 h-8" /> : <Video className="w-8 h-8" />}
                </button>
            </div>
        </div>
    );
}
