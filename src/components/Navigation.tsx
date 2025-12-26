"use client";

import Link from "next/link";
import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface NavigationProps {
    onSearchClick?: () => void;
}

export default function Navigation({ onSearchClick }: NavigationProps) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                        <Link href="/vendors" className="hover:text-neutral-500 transition-colors">VENDORS</Link>
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
                            <Link href="/cart" className="hover:opacity-70 transition-opacity" aria-label="Cart">
                                <ShoppingBag className="w-5 h-5" />
                            </Link>

                            <Link href="/account" className="hover:opacity-70 transition-opacity" aria-label="Account">
                                <User className="w-5 h-5" />
                            </Link>

                            <button className="bg-foreground text-background px-5 py-2 text-xs font-bold tracking-wider rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors">
                                CHECKOUT
                            </button>
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
                                href="/vendors"
                                className="border-b border-neutral-200 dark:border-neutral-800 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                VENDORS
                            </Link>
                            <Link
                                href="/services"
                                className="border-b border-neutral-200 dark:border-neutral-800 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                SERVICES
                            </Link>
                            <div className="flex gap-4 pt-4">
                                <Link
                                    href="/account"
                                    className="flex items-center gap-2 text-sm opacity-70"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <User className="w-4 h-4" /> Account
                                </Link>
                                <Link
                                    href="/cart"
                                    className="flex items-center gap-2 text-sm opacity-70"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <ShoppingBag className="w-4 h-4" /> Cart
                                </Link>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
