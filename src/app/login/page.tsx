"use client";

import Navigation from "@/components/Navigation";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import Link from "next/link";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/account";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API login
        setTimeout(() => {
            setIsLoading(false);
            // In a real app, clear auth tokens etc.
            alert("Successfully Signed In!");
            router.push(redirectPath);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Abstract Background */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neutral-100 dark:bg-neutral-900 rounded-full blur-3xl -z-10 opacity-50" />

            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="font-heading text-4xl font-bold mb-2">Welcome Back.</h1>
                    <p className="text-neutral-500">Sign in to continue to your destination.</p>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><Mail className="w-4 h-4" /> EMAIL</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><Lock className="w-4 h-4" /> PASSWORD</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            {isLoading ? "SIGNING IN..." : <>SIGN IN <ArrowRight className="w-4 h-4" /></>}
                        </button>

                        <div className="text-center pt-2">
                            <Link href="#" className="text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                                FORGOT PASSWORD?
                            </Link>
                        </div>
                    </form>
                </div>

                <p className="text-center mt-8 text-sm text-neutral-500">
                    Don&apos;t have an account? <Link href="/signup" className="font-bold text-foreground hover:underline">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <LoginContent />
            </Suspense>
        </main>
    )
}
