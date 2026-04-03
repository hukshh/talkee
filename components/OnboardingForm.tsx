"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, Loader2, Heart, Check, Sparkles, Zap, ShieldCheck, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import clsx from "clsx";

const INTEREST_TAGS = [
    "Deep Conversations", "Late Night Shifts", "Gaming", "Travel", "Fitness", "Music", "Art", "Tech", "Coding", "Cooking",
    "Friendship", "Long-term", "Casual", "Networking", "Mentorship", "Soulmate", "Adventure Buddy"
];

export default function OnboardingForm({
    isEditing = false,
    onComplete
}: {
    isEditing?: boolean;
    onComplete?: () => void;
}) {
    const { user } = useUser();
    const currentUser = useQuery(api.users.getCurrentUser, user?.id ? { currentClerkId: user.id } : "skip");
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: user?.fullName || "",
        gender: "other",
        birthDate: "",
        bio: "",
        interests: [] as string[],
    });

    useEffect(() => {
        if (isEditing && currentUser) {
            setFormData({
                name: currentUser.name || user?.fullName || "",
                gender: currentUser.gender || "other",
                birthDate: currentUser.birthDate ? new Date(currentUser.birthDate).toISOString().split('T')[0] : "",
                bio: currentUser.bio || "",
                interests: currentUser.interests || [...(currentUser.fantasy || []), ...(currentUser.desire || [])],
            });
        }
    }, [isEditing, currentUser, user]);
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const generateUploadUrl = useMutation(api.users.generateUploadUrl);
    const onboardUser = useMutation(api.users.onboardUser);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || user?.fullName || "",
                gender: currentUser.gender || "other",
                birthDate: currentUser.birthDate ? new Date(currentUser.birthDate).toISOString().split('T')[0] : "",
                bio: currentUser.bio || "",
                interests: currentUser.interests || [...(currentUser.fantasy || []), ...(currentUser.desire || [])],
            });
            if (currentUser.avatarUrl) setPreviewUrl(currentUser.avatarUrl);
        }
    }, [currentUser, user]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const toggleTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(tag)
                ? prev.interests.filter(t => t !== tag)
                : [...prev.interests, tag]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        try {
            let avatarUrl = previewUrl || "";

            if (image) {
                const uploadUrl = await generateUploadUrl();
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": image.type },
                    body: image,
                });
                const { storageId } = await result.json();
                avatarUrl = storageId;
            }

            await onboardUser({
                currentClerkId: user.id,
                name: formData.name,
                gender: formData.gender,
                birthDate: new Date(formData.birthDate).getTime(),
                bio: formData.bio,
                interests: formData.interests,
                avatarUrl,
            });
            toast.success(isEditing ? "Profile updated successfully!" : "Welcome to Vibe Mingle!");
            if (onComplete) onComplete();
        } catch (error: any) {
            toast.error(error.message || "Failed to initialize frequency.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-10 relative overflow-hidden bg-[#050505]">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="w-full max-w-4xl relative z-10 glass-grey p-8 md:p-16 rounded-[3rem] border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                <header className="mb-16 space-y-6 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="glass h-12 px-6 rounded-full flex items-center gap-3 border-white/10 backdrop-blur-3xl">
                            <Sparkles className="w-4 h-4 text-white" />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic leading-none">Identity Scans Required</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter">
                            Initialize <span className="text-zinc-600">Vibe</span>
                        </h1>
                        <p className="text-xs font-black text-zinc-600 uppercase tracking-[0.3em] italic">Step {step} of 2 • Building Signal</p>
                    </div>

                    <div className="flex justify-center items-center gap-3">
                        <div className={clsx("h-1.5 w-12 rounded-full transition-all duration-700", step === 1 ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "bg-white/10")} />
                        <div className={clsx("h-1.5 w-12 rounded-full transition-all duration-700", step === 2 ? "bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" : "bg-white/10")} />
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex flex-col items-center space-y-8">
                                <Label htmlFor="avatar" className="cursor-pointer group relative">
                                    <Avatar className="h-64 w-64 rounded-[3.5rem] border-4 border-white/10 transition-all duration-700 group-hover:border-white/30 group-hover:scale-105 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                        <AvatarImage src={previewUrl || ""} className="object-cover" />
                                        <AvatarFallback className="bg-zinc-900 border-none">
                                            <Camera className="h-16 w-16 text-zinc-700 group-hover:text-white transition-all" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-4 -right-4 h-16 w-16 glass rounded-3xl flex items-center justify-center border-white/10 shadow-2xl group-hover:bg-white group-hover:text-black transition-all">
                                        <Plus className="w-8 h-8" />
                                    </div>
                                    <input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                </Label>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic group-hover:text-white transition-all underline underline-offset-4">Upload Visual ID</p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-white uppercase tracking-widest italic px-1 flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-zinc-500" /> Full Identity Name
                                    </Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Identification..."
                                        className="h-14 glass text-white border-white/10 rounded-2xl px-6 font-bold placeholder:text-zinc-800"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-white uppercase tracking-widest italic px-1 flex items-center gap-2">
                                        <ShieldCheck className="w-3 h-3 text-zinc-500" /> Gender Frequency
                                    </Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["male", "female", "other"].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, gender: g })}
                                                className={clsx(
                                                    "h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic border border-white/5",
                                                    formData.gender === g ? "bg-white text-black shadow-2xl" : "glass hover:bg-white/5 text-zinc-500"
                                                )}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black text-white uppercase tracking-widest italic px-1">Birth Manifestation</Label>
                                    <Input
                                        type="date"
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                        className="h-14 glass text-white border-white/10 rounded-2xl px-6 font-bold"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="w-full h-16 rounded-[2rem] bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest italic transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-95"
                                >
                                    Proceed to Frequency Mapping
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 px-1">
                                        <Sparkles className="w-4 h-4 text-white opacity-40" />
                                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">Neural Fantasy Tags</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {INTEREST_TAGS.slice(0, 10).map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                className={clsx(
                                                    "px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all italic border border-white/5",
                                                    formData.interests.includes(tag) ? "bg-white text-black shadow-2xl scale-105" : "glass text-zinc-500 hover:text-white"
                                                )}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 px-1">
                                        <Heart className="w-4 h-4 text-white opacity-40" />
                                        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] italic">Core Desire Mapping</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {INTEREST_TAGS.slice(10).map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTag(tag)}
                                                className={clsx(
                                                    "px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all italic border border-white/5",
                                                    formData.interests.includes(tag) ? "bg-white text-black shadow-2xl scale-105" : "glass text-zinc-500 hover:text-white"
                                                )}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-white uppercase tracking-widest italic px-1">Identity Bio-Trace</Label>
                                <Textarea
                                    value={formData.bio}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Manifest your presence..."
                                    className="min-h-[150px] glass text-white border-white/10 rounded-[2rem] px-8 py-6 font-bold placeholder:text-zinc-800 italic text-lg leading-relaxed shadow-inner"
                                />
                            </div>

                            <div className="flex gap-6">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setStep(1)}
                                    className="h-20 w-32 rounded-[2rem] glass text-zinc-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest italic border-white/5 transition-all"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 h-20 rounded-[2rem] bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest italic transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95"
                                >
                                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Authorize Vibe Access"}
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
