"use client";

import Navigation from "@/components/Navigation";
import { Mail, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
    // Optional: Get email from query param if we forwarded it
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100 dark:bg-indigo-900 rounded-full blur-3xl -z-10 opacity-50" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100 dark:bg-purple-900 rounded-full blur-3xl -z-10 opacity-50" />

                <div className="w-full max-w-md text-center">
                    <div className="glass-panel p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center relative">
                                <Mail className="w-10 h-10 text-neutral-600 dark:text-neutral-300" />
                                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-white dark:border-black">
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <h1 className="font-heading text-3xl font-bold mb-4">Check your inbox.</h1>

                        <p className="text-neutral-500 mb-8 leading-relaxed">
                            We&apos;ve sent a verification link to {email ? <span className="font-bold text-foreground">{email}</span> : "your email address"}.
                            <br />
                            Please click the link to verify your account.
                        </p>

                        <div className="space-y-4">
                            <Link href="/login" className="block w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity">
                                RETURN TO LOGIN
                            </Link>

                            <p className="text-xs text-neutral-400">
                                Didn't receive the email? <button className="text-foreground font-bold hover:underline">Click to resend</button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
