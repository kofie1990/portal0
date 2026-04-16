"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, MapPin, SlidersHorizontal, ArrowRight } from "lucide-react";

const CATEGORIES = ["All", "Fashion", "Food", "Services", "Tech", "Art"];

interface SearchInterfaceProps {
    onQueryChange: (query: string) => void;
    onCategoryChange: (category: string) => void;
    activeCategory: string;
    onSubmit?: () => void;
    initialQuery?: string;
}

export default function SearchInterface({ onQueryChange, onCategoryChange, activeCategory, onSubmit, initialQuery = "" }: SearchInterfaceProps) {
    const [inputValue, setInputValue] = useState(initialQuery);

    // Sync input value when initialQuery changes (e.g. from URL params)
    useEffect(() => {
        if (initialQuery) {
            setInputValue(initialQuery);
        }
    }, [initialQuery]);

    const handleChange = (value: string) => {
        setInputValue(value);
        onQueryChange(value);
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-0 relative z-20">
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl p-3 md:p-4 shadow-2xl border border-white/10"
            >
                <div className="flex flex-col gap-3">
                    {/* Main Search Bar */}
                    <div className="relative flex items-center bg-white/5 dark:bg-black/20 rounded-2xl p-2 transition-colors focus-within:bg-white/10 dark:focus-within:bg-black/40">
                        <Search className="w-5 h-5 md:w-6 md:h-6 text-neutral-400 ml-2" />
                        <input
                            type="text"
                            placeholder="What are you looking for?"
                            value={inputValue}
                            onChange={(e) => handleChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && onSubmit) {
                                    onSubmit();
                                }
                            }}
                            className="w-full bg-transparent border-none outline-none px-3 py-2 text-base md:text-lg placeholder:text-neutral-500 font-medium"
                        />
                        <button
                            onClick={onSubmit}
                            className="bg-foreground text-background p-2 md:p-3 rounded-xl hover:scale-105 transition-transform"
                        >
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filters & Location */}
                    <div className="flex flex-wrap items-center justify-between gap-4 px-2">

                        {/* Categories */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => onCategoryChange(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat
                                        ? "bg-foreground text-background"
                                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 ml-auto">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                                <MapPin className="w-4 h-4" />
                                <span>Accra, GH</span>
                            </button>
                            <button className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                                <SlidersHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
