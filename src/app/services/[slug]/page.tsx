"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { MOCK_SERVICES } from "@/lib/mock-data";
import { use } from "react";
import { notFound } from "next/navigation";

// Normalized Categories for matching
const CATEGORY_MAP: Record<string, string[]> = {
    "beauty": ["Beauty", "Barber", "Salon", "Makeup"],
    "fashion": ["Fashion", "Tailor"],
    "home": ["Home", "Cleaning", "Gardening"],
    "fitness": ["Fitness", "Gym", "Yoga"],
    "culinary": ["Culinary", "Food", "Catering", "Chef"],
    "repair": ["Repair", "Tech", "Plumbing"],
};

export default function ServiceCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);
    const validCategories = CATEGORY_MAP[slug.toLowerCase()] || [categoryName];

    const services = MOCK_SERVICES.filter(s => validCategories.includes(s.category) || s.category.toLowerCase() === slug.toLowerCase());

    if (Object.keys(CATEGORY_MAP).indexOf(slug.toLowerCase()) === -1 && services.length === 0) {
        // Only show 404 if we strictly don't recognize it, but for now lets just show empty if no services
    }

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
                        <Link href="/services" className="inline-flex items-center text-sm font-bold text-neutral-500 hover:text-black dark:hover:text-white mb-6">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Services
                        </Link>
                        <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 mb-2 block uppercase">{categoryName}</span>
                        <h1 className="font-heading text-4xl md:text-5xl font-bold">Browse {categoryName}.</h1>
                    </motion.div>

                    {services.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.map((service, index) => (
                                <Link href="#" key={service.id} className="block group">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-black h-full"
                                    >
                                        <div className={`h-48 ${service.image} rounded-xl mb-4 relative overflow-hidden`}>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />
                                            {service.imageUrl && (
                                                <Image
                                                    src={service.imageUrl}
                                                    alt={service.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase">{service.category}</span>
                                                <h3 className="font-heading text-xl font-bold">{service.name}</h3>
                                                <p className="text-sm text-neutral-500">{service.location}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-sm mb-1">{service.price}</span>
                                                <div className="flex items-center gap-1 text-xs font-bold bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-lg">
                                                    <Star className="w-3 h-3 fill-black dark:fill-white" /> 5.0
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center">
                            <h3 className="text-xl font-bold mb-2">No services found in this category.</h3>
                            <p className="text-neutral-500">Check back later or browse other categories.</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
