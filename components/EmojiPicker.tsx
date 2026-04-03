"use client";

import { useState, useRef, useEffect } from "react";

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
        <div ref={ref} className="absolute bottom-16 left-0 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex border-b overflow-x-auto scrollbar-hide">
                {EMOJI_CATEGORIES.map((cat, i) => (
                    <button
                        key={cat.name}
                        onClick={() => setActiveCategory(i)}
                        className={`flex-shrink-0 px-3 py-2 text-xs font-semibold transition ${activeCategory === i ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-800"
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-8 gap-1 p-3 max-h-48 overflow-y-auto">
                {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => { onSelect(emoji); onClose(); }}
                        className="text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition active:scale-90"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
