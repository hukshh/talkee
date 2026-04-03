"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Video, ImageIcon, Plus, Loader2, Sparkles, Music, Send } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "./ui/button";
import { toast } from "sonner";
import clsx from "clsx";

export function StatusViewer({ user, currentClerkId, onClose }: { user: any; currentClerkId: string; onClose: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [note, setNote] = useState("");
    const [musicUrl, setMusicUrl] = useState("");
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const markSeen = useMutation(api.statuses.markStatusSeen);
    const createStatus = useMutation(api.statuses.createStatus);
    const generateUploadUrl = useMutation(api.users.generateUploadUrl);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const hasStatuses = user.items && user.items.length > 0;
    const currentItem = hasStatuses ? user.items[currentIndex] : null;

    useEffect(() => {
        if (!hasStatuses || isConfiguring) return;

        const duration = currentItem.mediaType === 'video' ? 10000 : 5000;
        const interval = 50;
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, hasStatuses, isConfiguring]);

    const handleNext = () => {
        if (currentIndex < user.items.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            const lastTimestamp = user.items[user.items.length - 1].createdAt;
            markSeen({ currentClerkId, timestamp: lastTimestamp });
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    useEffect(() => {
        if (currentItem?.musicUrl && audioRef.current && !isConfiguring) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        } else if (audioRef.current) {
            audioRef.current.pause();
        }
    }, [currentIndex, currentItem, isConfiguring]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setIsConfiguring(true);
    };

    const handleUpload = async () => {
        if (!pendingFile) return;

        setIsUploading(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": pendingFile.type },
                body: pendingFile,
            });
            const { storageId } = await result.json();

            await createStatus({
                currentClerkId,
                mediaUrl: storageId,
                mediaType: pendingFile.type.startsWith("video") ? "video" : "image",
                caption: "",
                note: note.trim() || undefined,
                musicUrl: musicUrl.trim() || undefined,
            });

            toast.success("Status uploaded!");
            onClose();
        } catch (error) {
            toast.error("Failed to upload status.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-[#050505] flex items-center justify-center animate-in fade-in duration-500">
            {/* Background Abstract Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px] animate-pulse delay-1000" />
            </div>

            <div className="relative w-full max-w-lg h-full md:h-[90vh] md:max-h-[1000px] bg-[#0c0c0c] md:rounded-[3.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5">

                {/* Progress Indicators */}
                <div className="absolute top-6 inset-x-8 flex gap-1.5 z-[70]">
                    {hasStatuses ? user.items.map((_: any, i: number) => (
                        <div key={i} className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all ease-linear shadow-[0_0_10px_white]"
                                style={{ width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' }}
                            />
                        </div>
                    )) : (
                        <div className="flex-1 h-1 bg-white/10 rounded-full" />
                    )}
                </div>

                {/* Header Section */}
                <div
                    className="absolute top-12 inset-x-8 flex items-center justify-between z-[70]"
                    style={{ paddingTop: 'env(safe-area-inset-top)' }}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-0.5 rounded-2xl ring-2 ring-white/10">
                            <img src={user.user.avatarUrl} className="w-12 h-12 rounded-[1.1rem] object-cover border-2 border-[#0c0c0c]" alt="" />
                        </div>
                        <div>
                            <p className="text-lg font-black italic uppercase tracking-tighter text-white">{user.user.name}</p>
                            {currentItem && (
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
                                    {new Date(currentItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Sync Active
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {user.userId === currentClerkId && !isConfiguring && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="h-12 w-12 glass rounded-2xl flex items-center justify-center text-white border-white/10 hover:bg-white/10 transition-all hover:scale-110"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        )}
                        <button onClick={onClose} className="h-12 w-12 glass rounded-2xl flex items-center justify-center text-white border-white/10 hover:bg-white/10 transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Media Canvas */}
                <div className="flex-1 flex items-center justify-center bg-black/40 relative">
                    {!hasStatuses && !isConfiguring ? (
                        <div className="flex flex-col items-center gap-10 text-center px-12 animate-in zoom-in duration-700">
                            <div className="relative">
                                <div className="absolute -inset-8 bg-white/5 rounded-full blur-2xl animate-pulse" />
                                <div className="relative w-24 h-24 glass-silver rounded-[2.5rem] flex items-center justify-center border-white/20 shadow-2xl">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">Broadcast Vibe</h3>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic leading-relaxed">manifest your energy to the collective</p>
                            </div>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="h-20 w-full rounded-[2.5rem] bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest italic transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-95"
                            >
                                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Capture Signal"}
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/*" className="hidden" />
                        </div>
                    ) : isConfiguring ? (
                        <div className="absolute inset-0 bg-[#050505]/95 z-[80] flex flex-col p-10 animate-in slide-in-from-bottom duration-500">
                            <div className="flex-1 flex flex-col items-center justify-center gap-12">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-white/5 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <img src={previewUrl!} className="max-h-72 w-auto rounded-[3rem] object-contain shadow-2xl border-2 border-white/20 transition-transform duration-700 group-hover:scale-105" alt="Preview" />
                                </div>
                                <div className="w-full space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic ml-1">Manifest Note</label>
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="What's the frequency?..."
                                            className="w-full glass text-white border-white/10 rounded-[2rem] px-8 py-6 font-bold placeholder:text-zinc-800 outline-none resize-none h-40 italic text-lg leading-relaxed shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic ml-1 flex items-center gap-2">
                                            <Music className="w-3 h-3" /> Audio Sync URL
                                        </label>
                                        <input
                                            type="text"
                                            value={musicUrl}
                                            onChange={(e) => setMusicUrl(e.target.value)}
                                            placeholder="Paste .mp3 signal link..."
                                            className="w-full h-14 glass text-white border-white/10 rounded-2xl px-6 font-bold placeholder:text-zinc-800 italic"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-6 mt-10">
                                <Button
                                    variant="ghost"
                                    onClick={() => { setIsConfiguring(false); setPendingFile(null); }}
                                    className="flex-1 h-20 rounded-[2rem] glass text-zinc-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest italic border-white/5 transition-all"
                                >
                                    Abort
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                    className="flex-[2] h-20 rounded-[2rem] bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest italic transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95"
                                >
                                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Authorize Vibe"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {currentItem.mediaType === 'video' ? (
                                <video
                                    src={currentItem.mediaUrl}
                                    className="w-full h-full object-contain"
                                    autoPlay
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={currentItem.mediaUrl}
                                    className="w-full h-full object-contain select-none pointer-events-none"
                                    alt="Status"
                                />
                            )}

                            {currentItem.musicUrl && (
                                <audio ref={audioRef} src={currentItem.musicUrl} className="hidden" />
                            )}

                            {/* Note Overlay - Ultra Premium */}
                            {currentItem.note && (
                                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[85%] animate-in zoom-in duration-700">
                                    <div className="glass-grey backdrop-blur-3xl border border-white/20 p-8 rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] relative group">
                                        <div className="absolute -inset-2 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-[3rem] blur-xl opacity-20" />
                                        <p className="text-white text-3xl font-black italic text-center leading-tight tracking-tighter uppercase drop-shadow-2xl">
                                            {currentItem.note}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Navigation Taps */}
                            <div className="absolute inset-y-0 left-0 w-1/4 z-[60] cursor-w-resize" onClick={handlePrev} />
                            <div className="absolute inset-y-0 right-0 w-1/4 z-[60] cursor-e-resize" onClick={handleNext} />
                        </>
                    )}
                </div>

                {/* Navigation Arrows for Desktop */}
                {!isConfiguring && hasStatuses && (
                    <div className="absolute top-1/2 -translate-y-1/2 inset-x-4 hidden md:flex justify-between items-center z-[70] pointer-events-none">
                        <Button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            variant="ghost"
                            size="icon"
                            className="h-16 w-16 rounded-full glass border-white/10 text-white pointer-events-auto opacity-0 hover:opacity-100 transition-opacity disabled:opacity-0"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </Button>
                        <Button
                            onClick={handleNext}
                            variant="ghost"
                            size="icon"
                            className="h-16 w-16 rounded-full glass border-white/10 text-white pointer-events-auto opacity-0 hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
