"use client";

import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Link from "next/link";
import { Search, User, Menu, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

interface NavigationProps {
    onSearchClick?: () => void;
}

export default function Navigation({ onSearchClick }: NavigationProps) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Auth State
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Fetch profile avatar
                const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
                if (data) setAvatarUrl(data.avatar_url);
            }
        };
        getUser();

        // Listen for auth changes (optional but good for UX)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();

    }, [supabase]);

    const handleSearch = () => {
        if (onSearchClick) {
            onSearchClick();
        } else {
            router.push("/");
        }
    };

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="fixed top-0 left-0 right-0 z-[100] glass-panel h-16 flex items-center"
            >
                <div className="container-wide w-full flex items-center justify-between">
                    {/* Logo */}
                    <Link
                        href="/"
                        className="font-heading font-bold text-2xl tracking-tight hover:opacity-70 transition-opacity z-50 relative"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        PORTAL
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex gap-8 text-sm font-medium tracking-wide">
                        <Link href="/discover" className="hover:text-neutral-500 transition-colors">DISCOVER</Link>
                        <Link href="/businesses" className="hover:text-neutral-500 transition-colors">BUSINESSES</Link>
                        <Link href="/services" className="hover:text-neutral-500 transition-colors">SERVICES</Link>
                    </nav>

                    <div className="flex items-center gap-4 md:gap-6 z-50 relative">
                        <button
                            onClick={handleSearch}
                            className="hover:opacity-70 transition-opacity"
                            aria-label="Search"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        <div className="hidden md:flex items-center gap-6">
                            {user ? (
                                <Link href="/account" className="hover:opacity-70 transition-opacity" aria-label="Account">
                                    {avatarUrl ? (
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800">
                                            <Image src={avatarUrl} alt="Profile" width={32} height={32} className="object-cover w-full h-full" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs">
                                            {user.email?.[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </Link>
                            ) : (
                                <Link href="/login" className="text-sm font-bold hover:opacity-70">
                                    SIGN IN
                                </Link>
                            )}

                            <Link href={user ? "/list" : "/login?redirect=/list"}>
                                <button className="bg-foreground text-background px-5 py-2 text-xs font-bold tracking-wider rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> LIST YOUR SERVICE
                                </button>
                            </Link>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden hover:opacity-70 transition-opacity"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Toggle Menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-xl md:hidden flex flex-col pt-24 px-6"
                    >
                        <nav className="flex flex-col gap-6 text-xl font-medium tracking-wide">
                            <Link
                                href="/discover"
                                className="border-b border-neutral-200 dark:border-neutral-800 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                DISCOVER
                            </Link>
                            <Link
                                href="/businesses"
                                className="border-b border-neutral-200 dark:border-neutral-800 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                BUSINESSES
                            </Link>
                            <Link
                                href="/services"
                                className="border-b border-neutral-200 dark:border-neutral-800 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                SERVICES
                            </Link>
                            <div className="flex gap-4 pt-4">
                                {user ? (
                                    <Link
                                        href="/account"
                                        className="flex items-center gap-2 text-sm opacity-70"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <User className="w-4 h-4" /> Account
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-2 text-sm opacity-70"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <User className="w-4 h-4" /> Sign In
                                    </Link>
                                )}

                                <Link
                                    href={user ? "/list" : "/login?redirect=/list"}
                                    className="flex items-center gap-2 text-sm opacity-70"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <Plus className="w-4 h-4" /> List Service
                                </Link>
                            </div>
                        </nav>

                        {/* Mobile Footer */}
                        <div className="mt-auto pb-8 pt-8 flex flex-col items-center text-xs opacity-50 gap-2 font-medium">
                            <div className="flex gap-4">
                                <Link href="/privacy" onClick={() => setIsMenuOpen(false)} className="hover:underline">Privacy Policy</Link>
                                <Link href="/terms" onClick={() => setIsMenuOpen(false)} className="hover:underline">Terms of Use</Link>
                            </div>
                            <div>&copy; Portal 2026</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
