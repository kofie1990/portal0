"use client";

import { Star, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Business } from "@/types/ui";
import { motion } from "framer-motion";
import { useUserLocation } from "@/hooks/useUserLocation";

interface BusinessListProps {
    businesses: Business[];
    layout?: "grid" | "list";
}

export default function BusinessList({ businesses, layout = "grid" }: BusinessListProps) {
    const { calculateDistance } = useUserLocation();

    if (businesses.length === 0) {
        return (
            <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800">
                <p className="text-neutral-500 font-medium tracking-wide">No businesses found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className={`grid gap-6 ${layout === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2" : "grid-cols-1"}`}>
            {businesses.map((business, index) => {
                const href = business.type === 'profile'
                    ? `/profile/${business.id}`
                    : `/business/${business.businessType === 'store' ? 'store' : 'service'}/${business.id}`;

                return (
                    <Link href={href} key={business.id} className="block group">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 hover:border-black dark:hover:border-white transition-colors bg-white dark:bg-black h-full flex flex-col"
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
                );
            })}
        </div>
    );
}
