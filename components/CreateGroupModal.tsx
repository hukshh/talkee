"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { X, Users, Loader2, Check, PlusCircle, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import clsx from "clsx";

export function CreateGroupModal({ currentClerkId, isOpen, onClose }: { currentClerkId: string, isOpen: boolean, onClose: () => void }) {
    const matches = useQuery(api.matches.getMatches, { currentClerkId });
    const createGroup = useMutation(api.conversations.createGroup);

    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (!groupName.trim()) {
            toast.error("Please enter a group name");
            return;
        }
        if (selectedUsers.length === 0) {
            toast.error("Please select at least one member");
            return;
        }

        setIsCreating(true);
        try {
            await createGroup({
                name: groupName,
                memberIds: selectedUsers as any,
                currentClerkId
            });
            toast.custom((t) => (
                <div className="glass-darker p-4 rounded-2xl border border-primary/20 shadow-2xl flex items-center gap-3">
                    <Users className="w-5 h-5 text-primary" />
                    <p className="text-white font-bold italic uppercase tracking-tighter">Group Created!</p>
                </div>
            ));
            onClose();
            setGroupName("");
            setSelectedUsers([]);
        } catch (error) {
            toast.error("Failed to create group.");
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="glass-darker rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                            <PlusCircle className="w-6 h-6 text-primary shadow-2xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">New Squad</h2>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Create a legendary group</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 glass-darker rounded-2xl hover:bg-white/5 transition-all text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-1 italic">Squad Name</label>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Enter an iconic name..."
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="w-full h-16 glass-darker border border-white/5 rounded-2xl px-6 font-bold text-white placeholder:text-gray-600 focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Sparkles className="w-5 h-5 text-gray-700" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] italic">Invite Members</label>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">{selectedUsers.length} Selected</span>
                        </div>

                        {!matches || matches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3 glass-darker rounded-3xl border border-white/5">
                                <Users className="w-8 h-8 text-gray-800" />
                                <p className="text-sm text-gray-600 font-bold italic tracking-tight">No connections to add yet.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {matches.map((u) => {
                                    const isSelected = selectedUsers.includes(u._id);
                                    return (
                                        <div
                                            key={u._id}
                                            onClick={() => toggleUser(u._id)}
                                            className={clsx(
                                                "flex items-center justify-between p-4 rounded-[1.5rem] cursor-pointer transition-all border shadow-2xl",
                                                isSelected ? "glass border-primary/40 bg-primary/5" : "glass-darker border-white/0 hover:border-white/5 hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar className="w-12 h-12 rounded-2xl border-2 border-white/10 group-hover:border-primary/50 transition-all">
                                                    <AvatarImage src={u.avatarUrl} className="object-cover" />
                                                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-base font-black text-white italic tracking-tight">{u.name}</p>
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{u.gender}</span>
                                                </div>
                                            </div>
                                            <div className={clsx(
                                                "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all shadow-xl",
                                                isSelected ? "bg-primary border-primary rotate-0" : "border-white/10 rotate-45 opacity-30"
                                            )}>
                                                {isSelected ? <Check className="w-4 h-4 text-black" strokeWidth={4} /> : <PlusCircle className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-8 border-t border-white/5">
                    <Button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary font-black text-lg text-black uppercase italic tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border-none"
                    >
                        {isCreating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Deploy Squad"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
