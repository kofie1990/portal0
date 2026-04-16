import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronRight, Tag } from "lucide-react";
import { CATEGORY_DIVISIONS } from "@/lib/categories";

interface CategorySelectorProps {
    value: string;
    onChange: (category: string) => void;
    placeholder?: string;
    className?: string;
}

export default function CategorySelector({ value, onChange, placeholder = "Select Category", className }: CategorySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter categories based on search
    const filteredDivisions = CATEGORY_DIVISIONS.map(division => {
        const filteredCategories = division.categories.filter(cat => 
            cat.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return { ...division, categories: filteredCategories };
    }).filter(division => division.categories.length > 0);

    return (
        <>
            {/* The Trigger Button that looks like an input */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`w-full text-left flex items-center justify-between ${className || "bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none hover:border-black dark:hover:border-white transition-colors"}`}
            >
                <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
                    {!className && <Tag className="w-4 h-4 text-neutral-500 shrink-0" />}
                    <span className={value ? "text-foreground" : "text-neutral-500"}>
                        {value || placeholder}
                    </span>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0" />
            </button>

            {/* The Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-2xl max-h-[85vh] bg-background rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-neutral-100 dark:border-neutral-900 flex items-center justify-between shrink-0">
                                <h2 className="font-heading text-2xl font-bold">Choose a Category</h2>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 bg-neutral-100 dark:bg-neutral-900 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Search Bar */}
                            <div className="p-4 sm:p-6 pb-2 shrink-0">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-neutral-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search categories..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-black dark:focus:border-white transition-colors text-base"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Categories List */}
                            <div className="p-4 sm:p-6 pt-2 overflow-y-auto w-full flex-1 minimal-scrollbar">
                                {filteredDivisions.length === 0 ? (
                                    <div className="text-center py-12 text-neutral-500">
                                        No categories found matching "{searchQuery}"
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {filteredDivisions.map((division) => (
                                            <div key={division.name}>
                                                <h3 className="text-xs font-bold tracking-[0.1em] text-neutral-500 uppercase mb-4 sticky top-0 bg-background/95 py-2 backdrop-blur z-10">
                                                    {division.name}
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {division.categories.map((cat) => (
                                                        <button
                                                            key={cat}
                                                            type="button"
                                                            onClick={() => {
                                                                onChange(cat);
                                                                setIsOpen(false);
                                                            }}
                                                            className={`text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                                                                value === cat 
                                                                ? "bg-foreground text-background border-foreground" 
                                                                : "bg-transparent border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white"
                                                            }`}
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
