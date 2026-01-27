"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, ArrowLeft, MapPin } from "lucide-react";
import Image from "next/image";
import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";

// Normalized Categories for matching
const CATEGORY_MAP: Record<string, string[]> = {
    "beauty": ["Beauty", "Barber", "Salon", "Makeup"],
    "fashion": ["Fashion", "Tailor"],
    "home": ["Home", "Cleaning", "Gardening"],
    "fitness": ["Fitness", "Gym", "Yoga"],
    "culinary": ["Culinary", "Food", "Catering", "Chef"],
    "repair": ["Repair", "Tech", "Plumbing"],
};

type Service = Database['public']['Tables']['services']['Row'] & {
    businesses: { name: string; location_address: string; rating: number } | null;
    profiles: { full_name: string; avatar_url: string } | null;
};

export default function ServiceCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1);

    const supabase = createClient();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            const validCategories = CATEGORY_MAP[slug.toLowerCase()] || [categoryName];

            try {
                const { data, error } = await supabase
                    .from('services')
                    .select(`
                        *,
                        businesses (name, location_address, rating),
                        profiles (full_name, avatar_url)
                    `)
                    .in('category', validCategories);

                if (error) {
                    console.error("Error fetching services:", error);
                } else {
                    setServices(data as Service[]);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchServices();
    }, [slug, categoryName]);

    if (loading) {
        return (
            <main className="min-h-screen bg-background">
                <Navigation />
                <div className="pt-24 pb-12 px-6">
                    <div className="container-wide">
                        <div className="animate-pulse space-y-8">
                            <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mb-12"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-80 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
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
                            {services.map((service, index) => {
                                const providerName = service.businesses?.name || service.profiles?.full_name || "Unknown Provider";
                                const providerLocation = service.businesses?.location_address || service.location_text || "Location available on booking";
                                const rating = service.businesses?.rating || 5.0; // Fallback or distinct rating

                                return (
                                    <Link href={`/service/${service.id}`} key={service.id} className="block group">
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                            className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-black h-full"
                                        >
                                            <div className={`h-48 rounded-xl mb-4 relative overflow-hidden bg-neutral-100 dark:bg-neutral-900 group-hover:scale-[1.02] transition-transform duration-300`}>
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />
                                                {service.image_url ? (
                                                    <Image
                                                        src={service.image_url}
                                                        alt={service.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-neutral-400 font-medium">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 mr-4">
                                                    <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase block mb-1">{service.category}</span>
                                                    <h3 className="font-heading text-xl font-bold line-clamp-1 mb-1">{service.name}</h3>
                                                    <div className="flex items-center gap-1 text-sm text-neutral-500">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        <span className="line-clamp-1">{providerLocation}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <span className="font-bold text-sm mb-1">{service.price_currency} {service.price_amount}</span>
                                                    <div className="flex items-center gap-1 text-xs font-bold bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-lg">
                                                        <Star className="w-3 h-3 fill-black dark:fill-white" /> {rating}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                );
                            })}
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
