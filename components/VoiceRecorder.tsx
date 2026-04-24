"use client";

import { useState, useRef } from "react";
import { Mic, Square, Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import clsx from "clsx";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface VoiceRecorderProps {
    onSend: (storageId: string) => void;
    generateUploadUrl: () => Promise<string>;
}

export function VoiceRecorder({ onSend, generateUploadUrl }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

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
                await uploadVoice(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (err) {
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const uploadVoice = async (blob: Blob) => {
        setIsUploading(true);
        try {
            const uploadUrl = await generateUploadUrl();
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": blob.type },
                body: blob,
            });
            const { storageId } = await result.json();
            onSend(storageId);
        } catch (error) {
            toast.error("Failed to upload voice message");
        } finally {
            setIsUploading(false);
        }
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const ss = s % 60;
        return `${m}:${ss.toString().padStart(2, "0")}`;
    };

    if (isUploading) {
        return (
            <div className="h-10 px-4 glass rounded-xl flex items-center gap-3 border-white/5">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-[10px] font-black text-white uppercase italic tracking-widest">Uploading Voice...</span>
            </div>
        );
    }

    if (isRecording) {
        return (
            <div className="flex-1 h-12 glass-silver rounded-2xl flex items-center justify-between px-4 border border-white/10 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm font-black text-white italic tabular-nums">{formatTime(duration)}</span>
                    </div>
                    <WaveformVisualizer isActive={isRecording} barCount={20} />
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setIsRecording(false);
                            clearInterval(timerRef.current);
                            mediaRecorderRef.current?.stop();
                            chunksRef.current = [];
                        }}
                        className="h-8 w-8 text-zinc-500 hover:text-red-500"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                        type="button"
                        onClick={stopRecording}
                        className="h-8 px-4 rounded-lg bg-white text-black font-black uppercase text-[10px] italic tracking-widest hover:bg-zinc-200"
                    >
                        <Square className="w-3 h-3 mr-2 fill-current" /> Stop & Send
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={startRecording}
            className="h-10 w-10 glass rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] border-white/[0.04] transition-all shrink-0"
        >
            <Mic className="w-6 h-6" />
        </Button>
    );
}
