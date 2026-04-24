"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

interface SocialAuthButtonsProps {
    redirectTo?: string;
    className?: string;
}

export default function SocialAuthButtons({ redirectTo, className = "" }: SocialAuthButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const buttonContainerRef = useRef<HTMLDivElement>(null);

    const handleGoogleResponse = async (response: any) => {
        setIsLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
        });

        if (error) {
            console.error("Supabase Auth Error:", error.message);
            setIsLoading(false);
        } else if (data.user) {
            // Success! Redirect based on onboarding status
            const { data: profile } = await supabase
                .from("profiles")
                .select("onboarding_completed")
                .eq("id", data.user.id)
                .single();

            if (profile && !profile.onboarding_completed) {
                router.refresh();
                router.push("/onboarding");
            } else {
                router.refresh();
                router.push(redirectTo || "/account");
            }
        }
    };

    const initializeGoogle = () => {
        if (typeof window === "undefined" || !(window as any).google || !buttonContainerRef.current) return;

        const google = (window as any).google;
        const containerWidth = buttonContainerRef.current.offsetWidth || 384;

        google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
            callback: handleGoogleResponse,
            context: "use",
            ux_mode: "popup",
            auto_select: false, // Prevents auto-select errors on load
        });

        google.accounts.id.renderButton(
            buttonContainerRef.current,
            {
                theme: "outline",
                size: "large",
                shape: "pill", // Matches the precision UI
                text: "continue_with",
                logo_alignment: "left", // 'left' looks much better for wide buttons to keep text centered
                width: Math.min(containerWidth, 400) // Dynamically match container width
            }
        );

        // Try to show One Tap prompt, swallow the AbortError if user closes it
        try {
            google.accounts.id.prompt();
        } catch (e) {
            console.warn("One Tap prompt dismissed", e);
        }
    };

    useEffect(() => {
        if ((window as any).google) {
            initializeGoogle();
        }
    }, []);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Load Google SDK safely with Next.js */}
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="lazyOnload"
                onLoad={initializeGoogle}
            />

            {isLoading ? (
                <div className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-5 py-4 font-medium text-sm tracking-wide text-neutral-700 dark:text-neutral-200">
                    <svg className="w-5 h-5 animate-spin text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="font-bold tracking-wide">CONNECTING...</span>
                </div>
            ) : (
                <div className="w-full flex justify-center min-h-[44px]">
                    <div ref={buttonContainerRef} className="w-full flex justify-center"></div>
                </div>
            )}

            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">or</span>
                <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            </div>
        </div>
    );
}

