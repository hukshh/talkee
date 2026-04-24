"use client";

import { useEffect, useState, useRef } from "react";
import clsx from "clsx";

interface WaveformVisualizerProps {
    isActive: boolean;
    color?: string;
    barCount?: number;
}

export function WaveformVisualizer({ isActive, color = "bg-white", barCount = 12 }: WaveformVisualizerProps) {
    const [bars, setBars] = useState<number[]>(new Array(barCount).fill(20));
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isActive) {
            setBars(new Array(barCount).fill(20));
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            return;
        }

        const animate = () => {
            setBars(prev => prev.map(() => 20 + Math.random() * 60));
            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isActive, barCount]);

    return (
        <div className="flex items-center gap-1 h-8">
            {bars.map((height, i) => (
                <div
                    key={i}
                    className={clsx("w-1 rounded-full transition-all duration-150", color)}
                    style={{ height: `${height}%` }}
                />
            ))}
        </div>
    );
}
