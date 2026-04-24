"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function AudioRecorder({ onSend, onCancel }: { onSend: (blob: Blob) => Promise<void>, onCancel: () => void }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isSending, setIsSending] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                stream.getTracks().forEach(track => track.stop());
                if (blob.size > 0 && !isSending) {
                    // This is triggered if stopped manually but not cancelled
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Failed to start recording:", err);
            toast.error("Microphone access denied.");
            onCancel();
        }
    };

    const stopAndSend = async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
        
        setIsSending(true);
        mediaRecorderRef.current.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            try {
                await onSend(blob);
            } catch (error) {
                toast.error("Failed to send voice message.");
            } finally {
                setIsSending(false);
                cleanup();
            }
        };
        mediaRecorderRef.current.stop();
    };

    const cleanup = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setRecordingTime(0);
        setIsRecording(false);
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.onstop = () => {
                cleanup();
                onCancel();
            };
            mediaRecorderRef.current.stop();
        } else {
            onCancel();
        }
    };

    useEffect(() => {
        startRecording();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className="flex items-center gap-4 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-2 px-4 w-full animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>
                <span className="text-sm font-black text-white italic tabular-nums">{formatTime(recordingTime)}</span>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/40 animate-pulse w-full" />
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={cancelRecording}
                    className="h-10 w-10 glass rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
                <Button 
                    onClick={stopAndSend}
                    disabled={isSending}
                    className="h-10 px-4 rounded-xl bg-white text-black hover:bg-zinc-200 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {isSending ? "Syncing..." : "Send Vibe"}
                </Button>
            </div>
        </div>
    );
}
