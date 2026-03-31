"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

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

    // Queries for ICE candidates
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

    // Handle call state updates
    useEffect(() => {
        if (callState?.status === "ended" || callState?.status === "rejected") {
            cleanup();
        }
    }, [callState?.status, cleanup]);

    // Handle incoming SDP Answer for the caller
    useEffect(() => {
        if (isCaller && callState?.status === "accepted" && callState.sdpAnswer && pcRef.current) {
            const currentRemoteDesc = pcRef.current.remoteDescription;
            if (!currentRemoteDesc) {
                pcRef.current.setRemoteDescription(new RTCSessionDescription(JSON.parse(callState.sdpAnswer)))
                    .catch(console.error);
            }
        }
    }, [callState, isCaller]);

    // Add remote ICE candidates
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
                    tempCallId = newCallId; // For ice candidate handler
                } else if (!isCaller && callId && callState?.sdpOffer) {
                    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(callState.sdpOffer)));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    await acceptCall({
                        callId: callId as any,
                        sdpAnswer: JSON.stringify(answer),
                    });
                }
            } catch (err) {
                console.error("Error accessing media devices or setting up WebRTC.", err);
                cleanup();
            }
        };

        if (!pcRef.current && (isCaller || (!isCaller && callState?.sdpOffer))) {
            initWebRTC();
        }

        return () => { }; // Actual cleanup is tied to the component unmounting or status changes
    }, [isCaller, callId, callState?.sdpOffer, currentClerkId, receiverId, initiateCall, acceptCall, cleanup]);

    useEffect(() => {
        // Unmount cleanup
        return () => {
            if (localStream) {
                localStream.getTracks().forEach((track) => track.stop());
            }
            if (pcRef.current) pcRef.current.close();
        };
    }, []);

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
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="flex-1 relative flex items-center justify-center p-4">
                {/* Remote Video */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-2xl bg-gray-900"
                />

                {/* Local Video */}
                <div className="absolute top-8 right-8 w-48 h-64 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                    />
                    {isVideoOff && (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <VideoOff className="w-8 h-8 text-gray-500" />
                        </div>
                    )}
                </div>

                {/* Call Status Overlay */}
                {callState?.status === "ringing" && isCaller && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xl animate-pulse bg-black/50 px-6 py-3 rounded-full backdrop-blur-md">
                        Ringing...
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="h-24 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-6 pb-6">
                <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-700/80 hover:bg-gray-600 text-white backdrop-blur-md"
                        }`}
                >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                    onClick={cleanup}
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105"
                >
                    <PhoneOff className="w-7 h-7" />
                </button>

                <button
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-700/80 hover:bg-gray-600 text-white backdrop-blur-md"
                        }`}
                >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
}
