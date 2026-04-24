"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

const EMOJI_CATEGORIES = [
    { name: "Smileys", emojis: ["😀", "😂", "🥹", "😍", "🤩", "😘", "😜", "🤪", "😎", "🥳", "😤", "😭", "🥺", "😱", "🤔", "🫡", "🤭", "😈", "💀", "🤡", "👻", "🙄", "😴"] },
    { name: "Love", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💯", "💕", "💖", "💗", "💘", "💝", "💔", "❣️", "💋", "🫶", "🤝", "👏"] },
    { name: "Gestures", emojis: ["👍", "👎", "✌️", "🤞", "🤙", "👋", "🖐️", "✋", "🤚", "👌", "🤌", "🫰", "💪", "🙏", "👆", "👇", "👈", "👉", "🖕", "✊"] },
    { name: "Fun", emojis: ["🔥", "⭐", "✨", "💫", "🌈", "🎉", "🎊", "🎶", "💡", "💰", "🍕", "🍔", "🍿", "🍩", "☕", "🍺", "🏆", "⚽", "🎮", "🎯"] },
];

export function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
    const [activeCategory, setActiveCategory] = useState(0);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute bottom-20 left-0 w-72 sm:w-80 glass-darker rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 z-[100] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex border-b border-white/5 overflow-x-auto scrollbar-hide px-2">
                {EMOJI_CATEGORIES.map((cat, i) => (
                    <button
                        key={cat.name}
                        onClick={() => setActiveCategory(i)}
                        className={clsx(
                            "flex-shrink-0 px-4 py-3 text-[9px] font-black uppercase tracking-widest italic transition-all",
                            activeCategory === i ? "text-white border-b-2 border-white" : "text-zinc-500 hover:text-white"
                        )}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 p-4 max-h-56 overflow-y-auto custom-scrollbar">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => { onSelect(emoji); onClose(); }}
                        className="text-xl w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/10 transition-all active:scale-75"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
