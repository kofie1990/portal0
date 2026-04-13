"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Search, MapPin } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserLocation } from "@/hooks/useUserLocation";

export default function VendorsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [businesses, setBusinesses] = useState<any[]>([]);
    const { calculateDistance } = useUserLocation();

    useEffect(() => {
        const fetchBusinesses = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('businesses').select('*');
            if (data) {
                const mapped = data.map((b: any) => ({
                    id: b.id,
                    name: b.name,
                    category: b.category,
                    location: b.location_address,
                    distance: "0km",
                    rating: b.rating || 0,
                    reviews: b.review_count || 0,
                    image: "bg-neutral-100",
                    imageUrl: b.image_url || b.cover_image_url,
                    address: b.location_address,
                    lat: b.lat,
                    lng: b.lng,
                    businessType: b.location_type === 'physical' ? 'store' : 'service',
                }));
                setBusinesses(mapped);
            }
        };
        fetchBusinesses();
    }, []);

    const filteredBusinesses = businesses.filter(business =>
        business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (business.category && business.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

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
                        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">All Businesses.</h1>

                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-neutral-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl leading-5 bg-white dark:bg-black placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white sm:text-sm"
                                placeholder="Search businesses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBusinesses.map((business, index) => (
                            <Link
                                href={business.businessType === 'store' ? `/business/store/${business.id}` : `/business/service/${business.id}`}
                                key={business.id}
                                className="block group"
                            >
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-black"
                                >
                                    <div className={`h-48 ${business.image} rounded-xl mb-4 relative overflow-hidden`}>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />
                                        {business.imageUrl && (
                                            <Image
                                                src={business.imageUrl}
                                                alt={business.name}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase">{business.category}</span>
                                            <h3 className="font-heading text-xl font-bold">{business.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-bold bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-lg">
                                            <Star className="w-3 h-3 fill-black dark:fill-white" /> {business.rating}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-neutral-500 text-sm mt-auto">
                                        <MapPin className="w-3 h-3" />
                                        {business.location} {calculateDistance(business.lat, business.lng) ? `• ${calculateDistance(business.lat, business.lng)}` : ""}
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
