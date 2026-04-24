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
import { Camera, Loader2, Sparkles, Zap, ShieldCheck, Plus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import clsx from "clsx";

export default function OnboardingForm({
    isEditing = false,
    onComplete
}: {
    isEditing?: boolean;
    onComplete?: () => void;
}) {
    const { user } = useUser();
    const currentUser = useQuery(api.users.getCurrentUser, user?.id ? { currentClerkId: user.id } : "skip");
    const [formData, setFormData] = useState({
        name: user?.fullName || "",
        gender: "other",
        birthDate: "",
        bio: "",
    });

    useEffect(() => {
        if (isEditing && currentUser) {
            setFormData({
                name: currentUser.name || user?.fullName || "",
                gender: currentUser.gender || "other",
                birthDate: currentUser.birthDate ? new Date(currentUser.birthDate).toISOString().split('T')[0] : "",
                bio: currentUser.bio || "",
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
                avatarUrl,
            });
            toast.success(isEditing ? "Profile updated successfully!" : "Welcome to Talkee!");
            if (onComplete) onComplete();
        } catch (error: any) {
            toast.error(error.message || "Failed to initialize profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-10 relative overflow-hidden bg-[#050505] dark">
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
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] italic leading-none">Authentication Required</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter">
                            Initialize <span className="text-zinc-400">Profile</span>
                        </h1>
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] italic">Set up your identity on Talkee</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="flex flex-col items-center space-y-8">
                            <Label htmlFor="avatar" className="cursor-pointer group relative">
                                <Avatar className="h-64 w-64 rounded-[3.5rem] border-4 border-white/10 transition-all duration-700 group-hover:border-white/30 group-hover:scale-105 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                    <AvatarImage src={previewUrl || ""} className="object-cover" />
                                    <AvatarFallback className="bg-zinc-900 border-none">
                                        <Camera className="h-16 w-16 text-zinc-600 group-hover:text-white transition-all" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-4 -right-4 h-16 w-16 glass rounded-3xl flex items-center justify-center border-white/10 shadow-2xl group-hover:bg-white group-hover:text-black transition-all">
                                    <Plus className="w-8 h-8" />
                                </div>
                                <input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </Label>
                            
                            <div className="w-full space-y-4">
                                <Label className="text-[10px] font-black text-white uppercase tracking-widest italic px-1">Biography</Label>
                                <Textarea
                                    value={formData.bio}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="Tell others about yourself..."
                                    className="min-h-[150px] bg-[#0c0c0c]/80 text-white border-white/10 rounded-[2rem] px-8 py-6 font-bold placeholder:text-zinc-700 italic text-lg leading-relaxed shadow-inner backdrop-blur-3xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-white uppercase tracking-widest italic px-1 flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-zinc-500" /> Full Name
                                </Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your name"
                                    className="h-14 bg-[#0c0c0c]/60 text-white border-white/10 rounded-2xl px-6 font-bold placeholder:text-zinc-600 backdrop-blur-xl focus:bg-[#0c0c0c]/80 transition-all"
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-white uppercase tracking-widest italic px-1 flex items-center gap-2">
                                    <ShieldCheck className="w-3 h-3 text-zinc-500" /> Gender
                                </Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["male", "female", "other"].map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, gender: g })}
                                            className={clsx(
                                                "h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all italic border border-white/5",
                                                formData.gender === g ? "bg-white text-black shadow-2xl" : "bg-[#0c0c0c]/40 hover:bg-white/5 text-zinc-400"
                                            )}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-white uppercase tracking-widest italic px-1">Birth Date</Label>
                                <Input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="h-14 bg-[#0c0c0c]/60 text-white border-white/10 rounded-2xl px-6 font-bold focus:bg-[#0c0c0c]/80 transition-all"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 rounded-2xl bg-white text-black hover:bg-zinc-200 disabled:opacity-80 disabled:bg-white font-black uppercase tracking-widest italic transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-95"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin text-black" /> : isEditing ? "Update Profile" : "Complete Registration"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
