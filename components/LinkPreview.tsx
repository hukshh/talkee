"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

interface LinkMetadata {
    title?: string;
    description?: string;
    image?: string;
    url: string;
}

export function LinkPreview({ url }: { url: string }) {
    const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // In a real app, you'd use a server-side proxy to fetch metadata
        // For this core demo, we'll simulate it or just show a nice card
        const fetchMetadata = async () => {
            try {
                // Simulating meta fetch
                setMetadata({
                    url,
                    title: url.replace("https://", "").split("/")[0],
                    description: "Tap to visit link",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, [url]);

    if (!metadata) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex flex-col rounded-xl overflow-hidden glass border border-white/10 hover:bg-white/5 transition-all group max-w-xs"
        >
            <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest truncate max-w-[150px]">{metadata.title}</span>
                    <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white transition-colors" />
                </div>
                <p className="text-xs font-bold text-zinc-300 line-clamp-1">{metadata.url}</p>
                <p className="text-[10px] text-zinc-500 font-medium">{metadata.description}</p>
            </div>
        </a>
    );
}
