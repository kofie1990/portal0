"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star } from "lucide-react";
import Image from "next/image";

// Mock Data
const VENDORS = [
    { id: 1, name: "The Atelier", category: "Fashion", location: "Osu, Accra", image: "bg-stone-200", imageUrl: "/others/storefront.jpg" },
    { id: 2, name: "Kwame The Barber", category: "Service", location: "East Legon", image: "bg-zinc-800", imageUrl: "/others/haircut_1.jpg" },
    { id: 3, name: "Spice & Soul", category: "Food", location: "Cantonments", image: "bg-orange-100", imageUrl: "/others/food_2.jpg" },
    { id: 4, name: "Urban Plants", category: "Home", location: "Airport City", image: "bg-green-100", imageUrl: "" },
    { id: 5, name: "Gold Coast Coffee", category: "Food", location: "Labone", image: "bg-amber-100", imageUrl: "/others/food_3.jpg" },
    { id: 6, name: "Afro Chic Boutique", category: "Fashion", location: "Osu, Accra", image: "bg-pink-100", imageUrl: "/others/clothes.jpg" },
];

export default function VendorsPage() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <div className="pt-24 pb-12 px-6">
                <div className="container-wide">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-12"
                    >
                        <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 mb-2 block">DIRECTORY</span>
                        <h1 className="font-heading text-4xl md:text-5xl font-bold">All Vendors.</h1>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {VENDORS.map((vendor, index) => (
                            <Link href="#" key={vendor.id} className="block group">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-black"
                                >
                                    <div className={`h-48 ${vendor.image} rounded-xl mb-4 relative overflow-hidden`}>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />
                                        {vendor.imageUrl && (
                                            <Image
                                                src={vendor.imageUrl}
                                                alt={vendor.name}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase">{vendor.category}</span>
                                            <h3 className="font-heading text-xl font-bold">{vendor.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-bold bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-lg">
                                            <Star className="w-3 h-3 fill-black dark:fill-white" /> 4.9
                                        </div>
                                    </div>
                                    <p className="text-sm text-neutral-500">{vendor.location}</p>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
