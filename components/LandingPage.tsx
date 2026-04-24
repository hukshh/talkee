"use client";

import { motion } from "framer-motion";
import { Sparkles, MessageSquare, Shield, Zap, ChevronRight, Globe, Lock, Cpu } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useNav } from "@/context/NavContext";

export function LandingPage() {
    const { isSignedIn } = useUser();
    const { setShowLanding } = useNav();

    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-white/20 flex flex-col relative">
            {/* High-End Background System */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[160px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-400/5 rounded-full blur-[160px] animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
            </div>

            {/* Premium Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 md:px-8 py-8 md:py-10 max-w-7xl mx-auto w-full">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2.5 md:gap-3 group cursor-pointer"
                    onClick={() => setShowLanding(false)}
                >
                    <div className="w-10 h-10 md:w-11 md:h-11 glass-silver rounded-xl md:rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" />
                    </div>
                    <span className="text-xl md:text-2xl font-black italic uppercase tracking-tighter vibe-gradient">Talkee</span>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 md:gap-8"
                >
                    {!isSignedIn && (
                        <Link href="/login" className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-all">Sign In</Link>
                    )}
                    <button onClick={() => isSignedIn ? setShowLanding(false) : window.location.href = "/register"}>
                        <Button className="h-9 md:h-11 px-5 md:px-8 rounded-xl md:rounded-2xl glass-premium text-[9px] md:text-[11px] font-black uppercase tracking-widest italic border-white/10 hover:bg-white hover:text-black transition-all">
                            {isSignedIn ? "Dashboard" : "Join Now"}
                        </Button>
                    </button>
                </motion.div>
            </nav>

            {/* Impressive Hero Section */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-6xl mx-auto py-12 md:py-20">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.2 }
                        }
                    }}
                    className="space-y-12 md:space-y-16 w-full"
                >
                    <div className="space-y-8 md:space-y-12">
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 30, scale: 0.95 },
                                visible: { opacity: 1, y: 0, scale: 1 }
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-darker border border-white/5 mb-4"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Collective Intelligence • Active</span>
                        </motion.div>

                        <motion.h1 
                            variants={{
                                hidden: { opacity: 0, y: 40 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            className="text-5xl md:text-8xl lg:text-9xl font-black italic uppercase tracking-tighter leading-[0.9] vibe-gradient drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        >
                            The Future of <br />
                            <span className="text-white text-glow">Connection.</span>
                        </motion.h1>

                        <motion.p 
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 }
                            }}
                            className="text-zinc-500 text-xs md:text-lg font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] italic max-w-2xl mx-auto leading-relaxed px-4"
                        >
                            Communication without depth is <span className="text-white">just NOISE.</span>
                        </motion.p>
                    </div>

                    <motion.div 
                        variants={{
                            hidden: { opacity: 0, scale: 0.9 },
                            visible: { opacity: 1, scale: 1 }
                        }}
                        className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 pt-4"
                    >
                        <button 
                            className="w-full md:w-auto"
                            onClick={() => isSignedIn ? setShowLanding(false) : window.location.href = "/register"}
                        >
                            <Button className="h-14 md:h-16 w-full md:px-12 rounded-2xl md:rounded-[2rem] bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest italic transition-all shadow-[0_20px_60px_rgba(255,255,255,0.1)] active:scale-95 group">
                                {isSignedIn ? "Back to Dashboard" : "Start Syncing"} <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </button>
                    </motion.div>
                </motion.div>

                {/* Glassmorphic Feature Showcase */}
                <motion.div 
                    initial={{ opacity: 0, y: 100 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
                >
                    <ImpressiveFeatureCard 
                        icon={<Globe className="w-6 h-6" />}
                        title="Global Grid"
                        label="Decentralized"
                        description="Seamlessly connected across the collective with zero latency."
                    />
                    <ImpressiveFeatureCard 
                        icon={<Lock className="w-6 h-6" />}
                        title="Obsidian"
                        label="Encrypted"
                        description="End-to-end signals protected by high-end cryptographic architecture."
                    />
                    <ImpressiveFeatureCard 
                        icon={<Cpu className="w-6 h-6" />}
                        title="Neural Sync"
                        label="Intelligent"
                        description="Experience rich media and waveforms powered by neural extraction."
                    />
                </motion.div>
            </main>

            {/* Impressive Footer */}
            <footer className="relative z-10 py-24 px-8 border-t border-white/5 mt-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <Sparkles className="w-5 h-5 text-white" />
                            <span className="text-xl font-black italic uppercase tracking-tighter vibe-gradient">Talkee</span>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em] italic">Redefining the digital collective.</p>
                    </div>
                    
                    <div className="flex gap-12">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">System</h4>
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-white cursor-pointer transition-colors">Uptime</span>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-white cursor-pointer transition-colors">Security</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Social</h4>
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-white cursor-pointer transition-colors">Twitter</span>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-white cursor-pointer transition-colors">Discord</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-20 text-center">
                    <p className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.6em] italic leading-none">
                        © 2026 Talkee Collective • Designed for the Elite • All Signals Prive
                    </p>
                </div>
            </footer>
        </div>
    );
}

function ImpressiveFeatureCard({ icon, title, label, description }: { icon: React.ReactNode; title: string; label: string; description: string }) {
    return (
        <motion.div 
            whileHover={{ y: -15, scale: 1.02 }}
            className="group relative p-10 glass-premium rounded-[3rem] border border-white/5 hover:border-white/20 transition-all duration-700 overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative space-y-8">
                <div className="w-16 h-16 glass-silver rounded-[1.5rem] flex items-center justify-center border border-white/10 group-hover:rotate-[10deg] transition-transform duration-500 shadow-2xl">
                    <div className="text-white">{icon}</div>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-500 italic">{label}</span>
                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-white">{title}</h3>
                    </div>
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed group-hover:text-zinc-400 transition-colors">
                        {description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
