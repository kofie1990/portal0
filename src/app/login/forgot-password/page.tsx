"use client";

import Navigation from "@/components/Navigation";
import { useState, Suspense } from "react";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function ForgotPasswordContent() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        const supabase = createClient();

        // Construct the URL for the password reset flow
        // The callback route will handle the 'next' parameter
        const redirectTo = `${window.location.origin}/auth/callback?next=/account/update-password`;

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setSuccess(true);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Abstract Background */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neutral-100 dark:bg-neutral-900 rounded-full blur-3xl -z-10 opacity-50" />

            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="font-heading text-4xl font-bold mb-2">Forgot Password?</h1>
                    <p className="text-neutral-500">Enter your email to receive a reset link.</p>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50">
                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold">Check your inbox</h3>
                            <p className="text-neutral-500">
                                We've sent a password reset link to <span className="font-bold text-foreground">{email}</span>.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm font-bold border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black px-6 py-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    {error}
                                </div>
                            )}
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

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                {isLoading ? "SENDING..." : <>SEND RESET LINK <ArrowRight className="w-4 h-4" /></>}
                            </button>

                            <div className="text-center pt-2">
                                <Link href="/login" className="text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1">
                                    <ArrowLeft className="w-3 h-3" /> BACK TO LOGIN
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <ForgotPasswordContent />
            </Suspense>
        </main>
    )
}
