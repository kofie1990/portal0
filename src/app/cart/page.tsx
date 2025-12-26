"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <div className="pt-24 min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md"
                >
                    <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-8">
                        <ShoppingBag className="w-10 h-10 text-neutral-400" />
                    </div>
                    <h1 className="font-heading text-3xl font-bold mb-4">Your Bag is Empty.</h1>
                    <p className="text-neutral-500 mb-8">
                        Looks like you haven't added anything yet.
                        Explore the latest arrivals to find something you love.
                    </p>
                    <Link href="/discover" className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity">
                        Start Shopping <ArrowRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </div>
        </main>
    );
}
