"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

export default function DiscoverPage() {
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchServices = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('services')
                .select('*')
                .limit(20); // Limit for now

            if (data) {
                const mapped = data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    price: `${item.price_currency || 'GH₵'} ${item.price_amount}`,
                    image: "bg-neutral-100", // Fallback background
                    imageUrl: item.image_url || (item.images && item.images[0]) || null
                }));
                setProducts(mapped);
            }
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
                        <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 mb-2 block">DISCOVER</span>
                        <h1 className="font-heading text-4xl md:text-5xl font-bold">Curated Finds.</h1>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group cursor-pointer"
                            >
                                <div className={`aspect-[4/5] ${item.image} rounded-xl mb-4 overflow-hidden relative`}>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 z-10" />
                                    {item.imageUrl && (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    )}
                                </div>
                                <h3 className="font-medium text-lg">{item.name}</h3>
                                <p className="text-neutral-500">{item.price}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
