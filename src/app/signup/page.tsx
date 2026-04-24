"use client";

import Navigation from "@/components/Navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, User, Smartphone, Check } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SocialAuthButtons from "@/components/SocialAuthButtons";

export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        const supabase = createClient();
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || location.origin}/auth/callback`,
                data: {
                    full_name: fullName,
                    phone: phone,
                    role: 'user', // Default role
                },
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            // Check if we have a session (Auto-confirm might be ON, or implicit flow)
            // Note: signUp returns null session if email confirm is required
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                // User is signed in. Do they need onboarding? Yes.
                router.refresh();
                router.push("/onboarding");
            } else {
                // No session means Email Verification is required
                router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
            }
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-100 dark:bg-blue-900 rounded-full blur-3xl -z-10 opacity-50" />

                <div className="w-full max-w-md mt-10">
                    <div className="text-center mb-10">
                        <h1 className="font-heading text-4xl font-bold mb-2">Create Account.</h1>
                        <p className="text-neutral-500">Join the universal booking platform today.</p>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50">
                        <SocialAuthButtons className="mb-2" />
                        <form onSubmit={handleSignup} className="space-y-6">
                            {error && (
                                <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><User className="w-4 h-4" /> FULL NAME</label>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                            </div>

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
                                <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><Smartphone className="w-4 h-4" /> PHONE NUMBER</label>
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+233 XX XXX XXXX"
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
                                    placeholder="Min 6 characters"
                                    minLength={6}
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
                                    placeholder="Re-enter password"
                                    minLength={6}
                                    className={`w-full bg-neutral-50 dark:bg-neutral-900 border ${password && confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-neutral-200 dark:border-neutral-800'} rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors`}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                {isLoading ? "CREATING ACCOUNT..." : <>SIGN UP <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                    </div>

                    <p className="text-center mt-8 text-sm text-neutral-500">
                        Already have an account? <Link href="/login" className="font-bold text-foreground hover:underline">Sign In</Link>
                    </p>
                    {/* <p className="text-center mt-2 text-sm text-neutral-500">
                        Are you a business? <Link href="/signup/business" className="font-bold text-foreground hover:underline">Register Business</Link>
                    </p> */}
                </div>
            </div>
        </main>
    )
}
