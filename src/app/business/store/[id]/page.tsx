"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Share2, Heart, Globe, Instagram, Facebook } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import MapPlaceholder from "@/components/MapPlaceholder";
import { notFound } from "next/navigation";
import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import FavoriteButton from "@/components/FavoriteButton";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
    loading: () => <MapPlaceholder />,
    ssr: false,
});

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params Promise (Next.js 16+)
    const { id } = use(params);
    const [vendor, setVendor] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [geocodedLocation, setGeocodedLocation] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        const fetchVendor = async () => {
            const supabase = createClient();
            const { data: b, error } = await supabase
                .from('businesses')
                .select('*, services(*), reviews(*)')
                .eq('id', id)
                .single();

            if (b && !error) {
                // Calculate dynamic rating and review counts
                const reviewCount = b.reviews?.length || 0;
                const averageRating = reviewCount > 0 
                    ? (b.reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / reviewCount).toFixed(1)
                    : 0;
                
                // Map DB to UI
                setVendor({
                    id: b.id,
                    name: b.name,
                    category: b.category,
                    location: b.location_address,
                    address: b.location_address,
                    rating: typeof averageRating === 'string' ? parseFloat(averageRating) : averageRating,
                    reviews: reviewCount,
                    imageUrl: b.image_url,
                    coverImage: b.cover_image_url,
                    lat: b.lat,
                    lng: b.lng,
                    bio: b.bio || "Welcome to our flagship store.",
                    openNow: b.open_now,
                    website: b.website, // [NEW]
                    socials: b.social_links, // [NEW]
                    mapUrl: b.iframe_map_url, // [NEW]
                    type: 'business',
                    businessType: 'store'
                });

                // Treat services as products for the store view
                const mappedProducts = b.services?.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    price: `${s.price_currency || 'GH₵'} ${s.price_amount}`,
                    imageUrl: s.image_url,
                    description: s.description
                })) || [];
                setProducts(mappedProducts);
            } else {
                setVendor(null);
            }
            setIsLoading(false);
        };

        if (id) fetchVendor();
    }, [id]);

    useEffect(() => {
        if (vendor && !vendor.lat && !vendor.lng && vendor.address && !vendor.mapUrl) {
            // Geocode the address
            const geocodeAddress = async () => {
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(vendor.address)}&limit=1`,
                        {
                            headers: {
                                "User-Agent": "PortalApp/1.0"
                            }
                        }
                    );
                    const data = await response.json();
                    if (data && data.length > 0) {
                        setGeocodedLocation({
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon)
                        });
                    }
                } catch (error) {
                    console.error("Geocoding failed:", error);
                }
            };
            geocodeAddress();
        }
    }, [vendor]);


    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // If not found, show 404
    if (!vendor) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            {/* Storefront Cover Photo (Conditional) */}
            {vendor.coverImage && (
                <div className="w-full h-[60vh] relative">
                    <div className="absolute inset-0 bg-neutral-900/20 z-10" />
                    {vendor.coverImage.startsWith("/") || vendor.coverImage.startsWith("http") ? (
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
                        className="border-b border-neutral-200 dark:border-neutral-800 pb-8 mb-12"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div className="flex-1">
                                <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 mb-2 block">{vendor.category?.toUpperCase() || 'STORE'}</span>
                                <h1 className="font-heading text-5xl md:text-7xl font-bold mb-4">{vendor.name}.</h1>
                                <div className="flex items-center gap-4 text-sm font-medium flex-wrap">
                                    <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-black dark:fill-white" /> {vendor.rating} ({vendor.reviews || 0} Reviews)</span>
                                    <span className="text-neutral-400">•</span>
                                    <span>{vendor.location}</span>
                                    <span className="text-neutral-400">•</span>
                                    <span className={vendor.openNow ? "text-green-600" : "text-red-500"}>{vendor.openNow ? 'Open Now' : 'Closed'}</span>
                                </div>
                                {vendor.bio && <p className="text-neutral-500 max-w-xl mt-6 text-lg leading-relaxed">{vendor.bio}</p>}
                            </div>

                            <div className="flex gap-3">
                                <button className="p-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center justify-center">
                                    <FavoriteButton entityId={id} entityType="business" className="p-3 m-0" />
                                </div>
                                <Link href={`/book?businessId=${vendor.id}&type=store`} className="bg-foreground text-background px-6 py-3 rounded-full text-sm font-bold tracking-wide hover:opacity-90 transition-opacity">
                                    BOOK APPOINTMENT
                                </Link>
                            </div>
                        </div>
                    </motion.div>

                    {/* Featured Collection Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                        {products.length > 0 ? products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                viewport={{ once: true }}
                                className="group cursor-pointer"
                            >
                                <div className={`aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 rounded-xl mb-4 relative overflow-hidden`}>
                                    {/* Placeholder for Product Image */}
                                    {product.imageUrl ? (
                                        <Image
                                            src={product.imageUrl}
                                            alt={product.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                            <ShoppingBag className="w-12 h-12" />
                                        </div>
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
                        )) : (
                            <div className="col-span-full py-12 text-center text-neutral-500 italic">
                                No Services listed yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* Location Map Section */}
                <div className="mt-24 border-t border-neutral-200 dark:border-neutral-800 pt-12">
                    <div className="container-wide">
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

                                {/* Contact & Socials */}
                                {(vendor.website || vendor.socials) && (
                                    <div className="p-6 bg-neutral-100 dark:bg-neutral-900 rounded-2xl space-y-3">
                                        <h4 className="font-bold mb-2">Connect</h4>
                                        {vendor.website && (
                                            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors">
                                                <Globe className="w-4 h-4" /> Website
                                            </a>
                                        )}
                                        {vendor.socials?.instagram && (
                                            <a href={`https://instagram.com/${vendor.socials.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-neutral-600 hover:text-pink-600 dark:text-neutral-400 dark:hover:text-pink-400 transition-colors">
                                                <Instagram className="w-4 h-4" /> {vendor.socials.instagram}
                                            </a>
                                        )}
                                        {vendor.socials?.facebook && (
                                            <a href={vendor.socials.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors">
                                                <Facebook className="w-4 h-4" /> Facebook
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2 h-[400px] rounded-2xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 relative">
                                {vendor.mapUrl ? (
                                    <iframe
                                        src={vendor.mapUrl}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                ) : (
                                    <InteractiveMap
                                        items={[{
                                            id: vendor.id,
                                            lat: vendor.lat || geocodedLocation?.lat || 0,
                                            lng: vendor.lng || geocodedLocation?.lng || 0,
                                            name: vendor.name,
                                            imageUrl: vendor.imageUrl,
                                            category: vendor.category,
                                            rating: vendor.rating,
                                            address: vendor.address,
                                            phone: vendor.phone || null,
                                            type: 'business',
                                            businessType: 'store',
                                            services: products
                                        }]}
                                        center={
                                            (vendor.lat && vendor.lng)
                                                ? { lat: vendor.lat, lng: vendor.lng }
                                                : geocodedLocation
                                                    ? { lat: geocodedLocation.lat, lng: geocodedLocation.lng }
                                                    : undefined
                                        }
                                        zoom={15}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
