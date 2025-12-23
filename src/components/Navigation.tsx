"use client";

import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";

export default function Navigation() {
    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 left-0 right-0 z-50 glass-panel h-16 flex items-center"
        >
            <div className="container-wide w-full flex items-center justify-between">
                {/* Logo */}
                <Link
                    href="/"
                    className="font-heading font-bold text-2xl tracking-tight hover:opacity-70 transition-opacity"
                >
                    PORTAL
                </Link>

                {/* Minimal Links */}
                <nav className="hidden md:flex gap-8 text-sm font-medium tracking-wide">
                    <Link href="/discover" className="hover:text-neutral-500 transition-colors">DISCOVER</Link>
                    <Link href="/vendors" className="hover:text-neutral-500 transition-colors">VENDORS</Link>
                    <Link href="/services" className="hover:text-neutral-500 transition-colors">SERVICES</Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    <button className="hover:opacity-70 transition-opacity" aria-label="Search">
                        <Search className="w-5 h-5" />
                    </button>

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
            </div>
        </motion.header>
    );
}
