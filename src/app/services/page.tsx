"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ArrowUpRight, Search } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = ["Fashion", "Beauty", "Home", "Fitness", "Culinary", "Food", "Repair", "Art", "Services"];

export default function ServicesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('services')
                .select(`
                    *,
                    businesses (name, location_address, image_url),
                    profiles (full_name, avatar_url)
                `);

            if (data && !error) {
                const mapped = data.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    category: s.category || "General",
                    price: `${s.price_currency || 'GH₵'} ${s.price_amount}`,
                    image: "bg-neutral-100", // Fallback class
                    imageUrl: s.image_url || s.businesses?.image_url || s.profiles?.avatar_url,
                    location: s.location_text || s.businesses?.location_address || "Location available",
                    rating: 5.0, // Placeholder
                    providerName: s.businesses?.name || s.profiles?.full_name
                }));
                setServices(mapped);
            }
            setLoading(false);
        };
        fetchServices();
    }, []);

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
                        <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 mb-2 block">PROFESSIONALS</span>
                        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6">Book Services.</h1>

                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-neutral-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl leading-5 bg-white dark:bg-black placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white sm:text-sm"
                                placeholder="Search services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-pulse flex flex-col items-center gap-4">
                                <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
                                <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {CATEGORIES.map((category, catIndex) => {
                                const categoryServices = services.filter(s =>
                                    (s.category === category || (category === 'Beauty' && s.category === 'Barber')) &&
                                    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        s.category.toLowerCase().includes(searchQuery.toLowerCase()))
                                );

                                if (categoryServices.length === 0) return null;

                                return (
                                    <section key={category}>
                                        <div className="flex items-end justify-between mb-8 border-b border-neutral-100 dark:border-neutral-900 pb-4">
                                            <h2 className="font-heading text-2xl font-bold">{category}</h2>
                                            <Link href={`/services/${category.toLowerCase()}`} className="text-sm font-bold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1">
                                                View All <ArrowUpRight className="w-4 h-4" />
                                            </Link>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {categoryServices.map((service, index) => (
                                                <Link href={`/service/${service.id}`} key={service.id} className="block group h-full">
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true }}
                                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                                        className="flex flex-col md:flex-row items-center border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors h-full"
                                                    >
                                                        <div className={`w-full md:w-32 h-32 ${service.image} rounded-xl mb-4 md:mb-0 md:mr-6 flex-shrink-0 relative overflow-hidden bg-neutral-200 dark:bg-neutral-800`}>
                                                            {service.imageUrl && (
                                                                <Image
                                                                    src={service.imageUrl}
                                                                    alt={service.name}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 w-full">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h3 className="font-heading text-xl font-bold mb-1">{service.name}</h3>
                                                                    <p className="text-neutral-500 text-sm mb-1">{service.location}</p>
                                                                    <p className="text-xs text-neutral-400 mt-1">by {service.providerName}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block font-bold text-sm mb-1">{service.price}</span>
                                                                    <div className="flex items-center gap-1 text-xs font-bold justify-end text-neutral-500">
                                                                        <Star className="w-3 h-3 fill-current" /> {service.rating}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })}

                            {services.length === 0 && !loading && (
                                <div className="text-center py-20 text-neutral-500">
                                    <p>No services found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
