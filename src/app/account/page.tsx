"use client";

import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { User, Package, Heart, LogOut, Store, Tag, Settings, ExternalLink, Edit2, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AccountPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock authentication delay
        setTimeout(() => {
            setIsAuthenticated(true);
        }, 1000);
    };

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <div className="pt-24 min-h-screen flex items-center justify-center p-6 bg-neutral-50/50 dark:bg-neutral-950/50">

                <AnimatePresence mode="wait">
                    {isAuthenticated ? (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-5xl"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {/* Sidebar */}
                                <div className="md:col-span-1 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 h-fit">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xl font-bold">
                                            JD
                                        </div>
                                        <div className="overflow-hidden">
                                            <h2 className="font-heading font-bold text-base truncate">John Doe</h2>
                                            <p className="text-xs text-neutral-500 truncate">john@example.com</p>
                                        </div>
                                    </div>
                                    <nav className="space-y-1">
                                        <button
                                            onClick={() => setActiveTab("profile")}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "profile" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                        >
                                            <User className="w-4 h-4" /> Profile
                                        </button>
                                        <div className="pt-4 pb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider px-4">Manage</div>
                                        <button
                                            onClick={() => setActiveTab("businesses")}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "businesses" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                        >
                                            <Store className="w-4 h-4" /> My Businesses
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("listings")}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "listings" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                        >
                                            <Tag className="w-4 h-4" /> My Listings
                                        </button>
                                        <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-4" />
                                        <button
                                            onClick={() => setIsAuthenticated(false)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-medium text-sm transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" /> Sign Out
                                        </button>
                                    </nav>
                                </div>

                                {/* Content Area */}
                                <div className="md:col-span-3 space-y-6">

                                    {activeTab === "profile" && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                            <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 mb-6">
                                                <h3 className="font-heading text-2xl font-bold mb-1">Welcome Back, John.</h3>
                                                <p className="text-neutral-500 text-sm mb-6">Here's a quick overview of your activity.</p>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                                        <span className="text-orange-600 font-bold text-2xl block mb-1">2</span>
                                                        <span className="text-xs font-bold tracking-wider text-orange-600/70 uppercase">Active Orders</span>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                                        <span className="text-blue-600 font-bold text-2xl block mb-1">12</span>
                                                        <span className="text-xs font-bold tracking-wider text-blue-600/70 uppercase">Saved Items</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
                                                <h4 className="font-bold mb-4">Recent Activity</h4>
                                                <div className="space-y-4">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-900 last:border-0">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-900 rounded-lg flex items-center justify-center text-neutral-400">
                                                                    <Package className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-sm">Order #248{i}</p>
                                                                    <p className="text-xs text-neutral-500">Delivered on Dec {20 + i}</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-sm font-bold">GH₵ {150 * i}.00</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "businesses" && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-heading text-2xl font-bold">My Businesses</h3>
                                                <Link href="/signup/business">
                                                    <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90">
                                                        <Plus className="w-4 h-4" /> Add New
                                                    </button>
                                                </Link>
                                            </div>

                                            {/* Mock Business Card */}
                                            <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                                                <div className="w-20 h-20 bg-neutral-200 rounded-xl relative overflow-hidden flex-shrink-0">
                                                    <Image src="/others/storefront.jpg" alt="Logo" fill className="object-cover" />
                                                </div>
                                                <div className="flex-1 text-center md:text-left">
                                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                        <h4 className="font-heading font-bold text-xl">The Atelier</h4>
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Active</span>
                                                    </div>
                                                    <p className="text-sm text-neutral-500 mb-3">Fashion • Osu, Accra</p>
                                                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                                        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                                            <Settings className="w-3 h-3" /> Dashboard
                                                        </button>
                                                        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                                            <Edit2 className="w-3 h-3" /> Edit Page
                                                        </button>
                                                        <Link href="/business/product/atelier-1">
                                                            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                                                <ExternalLink className="w-3 h-3" /> View Live
                                                            </button>
                                                        </Link>
                                                    </div>
                                                </div>
                                                <div className="text-center md:text-right p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl min-w-[120px]">
                                                    <span className="block text-2xl font-bold">4.9</span>
                                                    <span className="text-xs text-neutral-500">Avg Rating</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "listings" && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-heading text-2xl font-bold">My Listings</h3>
                                                <Link href="/list">
                                                    <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90">
                                                        <Plus className="w-4 h-4" /> Create Listing
                                                    </button>
                                                </Link>
                                            </div>

                                            <div className="space-y-4">
                                                {/* Mock Item 1 */}
                                                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-neutral-200 rounded-lg relative overflow-hidden flex-shrink-0">
                                                        <Image src="/others/clothes.jpg" alt="Item" fill className="object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold">Vintage Digital Camera</h4>
                                                        <p className="text-sm text-neutral-500">Electronics • GH₵ 850</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Mock Item 2 */}
                                                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-neutral-200 rounded-lg relative overflow-hidden flex-shrink-0">
                                                        <Image src="/others/fruits.jpg" alt="Item" fill className="object-cover" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold">Organic Fruit Basket</h4>
                                                        <p className="text-sm text-neutral-500">Food • GH₵ 120</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="auth-form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-md bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 md:p-12 shadow-xl shadow-black/5"
                        >
                            <div className="text-center mb-10">
                                <h1 className="font-heading text-3xl font-bold mb-2">
                                    {isLogin ? "Welcome Back." : "Create Account."}
                                </h1>
                                <p className="text-neutral-500">
                                    {isLogin ? "Sign in to access your profile." : "Join to start exploring carefully curated items."}
                                </p>
                            </div>

                            <form onSubmit={handleAuth} className="space-y-4">
                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <input
                                            type="text"
                                            placeholder="Full Name"
                                            required
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                    </motion.div>
                                )}

                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                />

                                {!isLogin && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <input
                                            type="password"
                                            placeholder="Confirm Password"
                                            required
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                    </motion.div>
                                )}

                                <button type="submit" className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity">
                                    {isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
                                </button>
                            </form>

                            <div className="text-center mt-8 pt-8 border-t border-neutral-100 dark:border-neutral-900">
                                <p className="text-sm text-neutral-500">
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-foreground font-bold hover:underline"
                                    >
                                        {isLogin ? "Sign Up" : "Sign In"}
                                    </button>
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
