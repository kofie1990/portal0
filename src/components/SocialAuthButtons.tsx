"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

// Google "G" logo - official multi-color SVG
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

interface SocialAuthButtonsProps {
    redirectTo?: string;
    className?: string;
}

export default function SocialAuthButtons({ redirectTo, className = "" }: SocialAuthButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isScriptReady, setIsScriptReady] = useState(false);
    const [useFallback, setUseFallback] = useState(false);
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);
    const router = useRouter();
    const buttonContainerRef = useRef<HTMLDivElement>(null);

    // Standard Supabase OAuth fallback for restrictive in-app browsers
    const handleFallbackLogin = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const callbackUrl = `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: callbackUrl,
            },
        });

        if (error) {
            console.error("OAuth error:", error.message);
            setIsLoading(false);
        }
    };

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
            auto_select: false,
        });

        google.accounts.id.renderButton(
            buttonContainerRef.current,
            {
                theme: "outline",
                size: "large",
                shape: "pill",
                text: "continue_with",
                logo_alignment: "left",
                width: Math.min(containerWidth, 400)
            }
        );

        try {
            google.accounts.id.prompt();
        } catch (e) {
            console.warn("One Tap prompt dismissed", e);
        }

        setIsScriptReady(true);
    };

    useEffect(() => {
        // Detect in-app browsers that block external scripts/popups (Snapchat, Instagram, TikTok, Facebook)
        const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
        const inApp = /Snapchat|Instagram|FBAV|FBAN|TikTok|Bytedance/i.test(ua);
        
        if (inApp) {
            setIsInAppBrowser(true);
            setUseFallback(true);
            return;
        }

        let checkInterval: NodeJS.Timeout;
        const checkGoogle = () => {
            if (typeof window !== "undefined" && (window as any).google && buttonContainerRef.current) {
                initializeGoogle();
                if (checkInterval) clearInterval(checkInterval);
            }
        };

        checkGoogle();

        if (!((window as any)?.google)) {
            checkInterval = setInterval(checkGoogle, 100);
            
            // If it takes more than 3 seconds, assume the script is blocked and use fallback
            setTimeout(() => {
                if (!((window as any)?.google)) {
                    setUseFallback(true);
                    clearInterval(checkInterval);
                }
            }, 3000);
        }

        return () => {
            if (checkInterval) clearInterval(checkInterval);
        };
    }, []);

    return (
        <div className={`space-y-4 ${className}`}>
            {isLoading ? (
                <div className="w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl px-5 py-4 font-medium text-sm tracking-wide text-neutral-700 dark:text-neutral-200">
                    <svg className="w-5 h-5 animate-spin text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="font-bold tracking-wide">CONNECTING...</span>
                </div>
            ) : useFallback ? (
                <div className="w-full flex flex-col items-center gap-3">
                    {isInAppBrowser && (
                        <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-center shadow-sm">
                            <p className="text-xs font-medium text-red-800 dark:text-red-300 leading-relaxed">
                                Google Sign-In is blocked by this app's browser.<br/>
                                <span className="font-bold mt-1 block">Tap the menu (•••) above and select<br/>"Open in Browser" to continue.</span>
                            </p>
                        </div>
                    )}
                    <button
                        onClick={isInAppBrowser ? () => alert("Please tap the menu above and select 'Open in Browser' to sign in with Google.") : handleFallbackLogin}
                        disabled={isLoading}
                        className={`group w-full flex items-center justify-center gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-full px-5 h-[44px] font-medium text-sm text-[#3c4043] dark:text-neutral-200 tracking-wide hover:border-neutral-400 dark:hover:border-neutral-500 hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none ${isInAppBrowser ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <GoogleIcon className="w-5 h-5" />
                        <span className="font-roboto font-medium">Continue with Google</span>
                    </button>
                </div>
            ) : (
                <div className="w-full flex justify-center min-h-[44px] relative">
                    {!isScriptReady && (
                        <div className="absolute inset-0 flex justify-center pointer-events-none opacity-50">
                             <div className="w-full max-w-[400px] flex items-center justify-center gap-3 bg-white border border-[#dadce0] rounded-full px-5 h-[44px] font-medium text-sm text-[#3c4043] tracking-wide">
                                <GoogleIcon className="w-5 h-5" />
                                <span className="font-roboto">Loading Google...</span>
                            </div>
                        </div>
                    )}
                    <div ref={buttonContainerRef} className={`w-full flex justify-center transition-opacity duration-300 ${isScriptReady ? 'opacity-100' : 'opacity-0'}`}></div>
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

