"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Search, Loader2 } from "lucide-react";

interface GifResult {
    id: string;
    url: string;
    preview: string;
}

export function GifPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GifResult[]>([]);
    const [trending, setTrending] = useState<GifResult[]>([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Tenor V2 API (free tier, no key required for anonymous usage with limited rate)
    const TENOR_KEY = "AIzaSyDDAz428hbsvqSJabPf2QhfMkm0MFJRrmo"; // Google's default public Tenor key

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Load trending on mount
    useEffect(() => {
        fetchTrending();
    }, []);

    const fetchTrending = async () => {
        try {
            const res = await fetch(`https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&limit=20&media_filter=tinygif,gif`);
            const data = await res.json();
            setTrending(parseResults(data.results));
        } catch (err) {
            console.error("Tenor trending error:", err);
        }
    };

    const searchGifs = async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`https://tenor.googleapis.com/v2/search?key=${TENOR_KEY}&q=${encodeURIComponent(searchQuery)}&limit=20&media_filter=tinygif,gif`);
            const data = await res.json();
            setResults(parseResults(data.results));
        } catch (err) {
            console.error("Tenor search error:", err);
        }
        setLoading(false);
    };

    const parseResults = (items: any[]): GifResult[] => {
        return items.map((item: any) => ({
            id: item.id,
            url: item.media_formats?.gif?.url || item.media_formats?.tinygif?.url || "",
            preview: item.media_formats?.tinygif?.url || item.media_formats?.gif?.url || "",
        }));
    };

    const handleQueryChange = (value: string) => {
        setQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchGifs(value), 400);
    };

    const displayItems = query.trim() ? results : trending;

    return (
        <div ref={ref} className="absolute bottom-16 left-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        placeholder="Search GIFs & Memes..."
                        className="pl-9 rounded-xl bg-gray-50 border-gray-200 text-sm"
                        autoFocus
                    />
                </div>
            </div>

            <div className="h-64 overflow-y-auto p-2">
                {loading && (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                )}

                {!loading && displayItems.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        {query.trim() ? "No results found" : "Loading trending GIFs..."}
                    </div>
                )}

                {!loading && displayItems.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                        {displayItems.map((gif) => (
                            <button
                                key={gif.id}
                                onClick={() => { onSelect(gif.url); onClose(); }}
                                className="rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all active:scale-95"
                            >
                                <img src={gif.preview} alt="GIF" className="w-full h-28 object-cover bg-gray-100" loading="lazy" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-3 py-1.5 border-t bg-gray-50 flex items-center justify-center">
                <span className="text-[10px] text-gray-400 font-medium">Powered by Tenor</span>
            </div>
        </div>
    );
}
