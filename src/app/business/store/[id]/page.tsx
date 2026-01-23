"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Share2, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import MapPlaceholder from "@/components/MapPlaceholder";
import { MOCK_BUSINESSES } from "@/lib/mock-data";
import { notFound } from "next/navigation";
import { use } from "react";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
    loading: () => <MapPlaceholder />,
    ssr: false,
});

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params Promise (Next.js 16+)
    const { id } = use(params);

    // Find vendor from mock data
    const vendor = MOCK_BUSINESSES.find((v) => v.id === id);

    // If not found or not a product business, show 404
    if (!vendor || vendor.type !== 'business' || vendor.businessType !== 'store') {
        notFound();
    }

    // Get products from vendor
    const products = vendor.products || [];
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            {/* Storefront Cover Photo (Conditional) */}
            {vendor.coverImage && (
                <div className="w-full h-[60vh] relative">
                    <div className="absolute inset-0 bg-neutral-900/20 z-10" />
                    {vendor.coverImage.startsWith("/") ? (
                        <Image
                            src={vendor.coverImage}
                            alt="Storefront"
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className={`w-full h-full ${vendor.coverImage} bg-cover bg-center`} />
                    )}
                    <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="container-wide text-white">
                            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-widest mb-2 border border-white/30">
                                FLAGSHIP STORE
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero / Store Header */}
            <div className="pt-12 pb-12 px-6">
                <div className="container-wide">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col md:flex-row justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-8 mb-12"
                    >
                        <div>
                            <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 mb-2 block">{vendor.category?.toUpperCase() || 'STORE'}</span>
                            <h1 className="font-heading text-5xl md:text-7xl font-bold mb-4">{vendor.name}.</h1>
                            <div className="flex items-center gap-4 text-sm font-medium">
                                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-black dark:fill-white" /> {vendor.rating} ({vendor.reviews || 0} Reviews)</span>
                                <span className="text-neutral-400">•</span>
                                <span>{vendor.location}</span>
                                <span className="text-neutral-400">•</span>
                                <span className={vendor.openNow ? "text-green-600" : "text-red-500"}>{vendor.openNow ? 'Open Now' : 'Closed'}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 md:mt-0">
                            <button className="p-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                <Heart className="w-5 h-5" />
                            </button>
                            <Link href={`/book?vendorId=${vendor.id}&type=store`} className="bg-foreground text-background px-6 py-3 rounded-full text-sm font-bold tracking-wide hover:opacity-90 transition-opacity">
                                BOOK APPOINTMENT
                            </Link>
                        </div>
                    </motion.div>

                    {/* Featured Collection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                        {products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group cursor-pointer"
                            >
                                <div className={`aspect-[3/4] ${product.image} rounded-xl mb-4 relative overflow-hidden`}>
                                    {/* Placeholder for Product Image */}
                                    {product.imageUrl && (
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center text-neutral-400 font-heading text-2xl font-bold opacity-30 group-hover:scale-105 transition-transform duration-700 z-10">
                                        {product.name}
                                    </div>

                                    <button className="absolute bottom-4 right-4 bg-white dark:bg-black text-black dark:text-white p-3 rounded-full shadow-lg translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                        <ShoppingBag className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-heading text-xl font-bold">{product.name}</h3>
                                    <span className="font-medium text-neutral-500">{product.price}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Location Map Section */}
                <div className="mt-24 border-t border-neutral-200 dark:border-neutral-800 pt-12">
                    <h3 className="font-heading text-2xl font-bold mb-8">Visit The Concept Store</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1 space-y-4">
                            <div className="p-6 bg-neutral-100 dark:bg-neutral-900 rounded-2xl">
                                <h4 className="font-bold mb-2">Address</h4>
                                <p className="text-neutral-500 text-sm leading-relaxed">
                                    {vendor.address}
                                </p>
                            </div>
                            <div className="p-6 bg-neutral-100 dark:bg-neutral-900 rounded-2xl">
                                <h4 className="font-bold mb-2">Hours</h4>
                                <ul className="text-neutral-500 text-sm space-y-1">
                                    <li className="flex justify-between"><span>Mon-Fri</span> <span>10am - 8pm</span></li>
                                    <li className="flex justify-between"><span>Saturday</span> <span>10am - 6pm</span></li>
                                    <li className="flex justify-between"><span>Sunday</span> <span>Closed</span></li>
                                </ul>
                            </div>
                        </div>
                        <div className="md:col-span-2 h-[400px] rounded-2xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100">
                            <InteractiveMap
                                items={[{
                                    id: vendor.id,
                                    lat: vendor.lat,
                                    lng: vendor.lng,
                                    name: vendor.name,
                                    image: vendor.image,
                                    imageUrl: vendor.imageUrl,
                                    category: vendor.category,
                                    rating: vendor.rating,
                                    address: vendor.address,
                                    phone: vendor.phone,
                                    type: vendor.type === 'business' ? 'business' : 'individual',
                                    businessType: vendor.businessType,
                                    services: vendor.services?.map((s, idx) => ({
                                        id: `mock-svc-${idx}`,
                                        name: s.name,
                                        price: s.price,
                                        description: s.duration,
                                        image: null
                                    }))
                                }]}
                                center={{ lat: vendor.lat, lng: vendor.lng }}
                                zoom={15}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
