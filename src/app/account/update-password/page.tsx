"use client";

import Navigation from "@/components/Navigation";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function UpdatePasswordContent() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(false);

        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            setSuccess(true);
            setIsLoading(false);

            // Redirect after a short delay
            setTimeout(() => {
                router.push("/account");
                router.refresh();
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Abstract Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neutral-100 dark:bg-neutral-900 rounded-full blur-3xl -z-10 opacity-50" />

            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <h1 className="font-heading text-4xl font-bold mb-2">Set New Password</h1>
                    <p className="text-neutral-500">Please enter a new password for your account.</p>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50">
                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold">Password Updated!</h3>
                            <p className="text-neutral-500">
                                Your password has been successfully changed. Redirecting to your account...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdate} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><Lock className="w-4 h-4" /> NEW PASSWORD</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><Lock className="w-4 h-4" /> CONFIRM PASSWORD</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                {isLoading ? "UPDATING..." : <>UPDATE PASSWORD <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UpdatePasswordPage() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <UpdatePasswordContent />
            </Suspense>
        </main>
    )
}
