"use client";

import { motion } from "framer-motion";

export default function MapPlaceholder() {
    return (
        <section className="w-full h-[600px] bg-neutral-100 dark:bg-neutral-900 relative overflow-hidden flex items-center justify-center">
            {/* Grid Pattern to simulate map tiles */}
            <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none"
                style={{
                    backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }}
            />

            <div className="text-center z-10 p-8">
                <h3 className="font-heading text-3xl font-bold mb-4">Explore Local Vendors</h3>
                <p className="text-neutral-500 mb-8 max-w-md mx-auto">
                    Our integrated map shows you exactly where to find what you need nearby.
                    <br />(Map Integration Coming Soon)
                </p>
                <button className="bg-foreground text-background px-8 py-3 rounded-full text-sm font-bold tracking-wide hover:opacity-80 transition-opacity">
                    ENABLE LOCATION
                </button>
            </div>

            {/* Decorative pulse points simluating vendors */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-4 h-4 rounded-full bg-black dark:bg-white"
                    initial={{ opacity: 0.5, scale: 0.8 }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 2 + i, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${20 + Math.random() * 60}%`
                    }}
                />
            ))}
        </section>
    );
}
