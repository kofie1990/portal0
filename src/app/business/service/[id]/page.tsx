"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { Star, Calendar, MapPin, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import MapPlaceholder from "@/components/MapPlaceholder";
import { notFound } from "next/navigation";
import { use, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
    loading: () => <MapPlaceholder />,
    ssr: false,
});

export default function ServicePage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params Promise (Next.js 16+)
    const { id } = use(params);
    const [vendor, setVendor] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchVendor = async () => {
            const supabase = createClient();
            const { data: b, error } = await supabase
                .from('businesses')
                .select('*, services(*)')
                .eq('id', id)
                .single();

            if (b && !error) {
                // Map DB to UI
                setVendor({
                    id: b.id,
                    name: b.name,
                    category: b.category,
                    location: b.location_address, // Map location_address to location
                    address: b.location_address,
                    distance: "0km",
                    rating: b.rating || 0,
                    reviews: b.review_count || 0,
                    imageUrl: b.image_url,
                    coverImage: b.cover_image_url,
                    lat: b.lat,
                    lng: b.lng,
                    bio: b.bio,
                    openNow: b.open_now,
                    address: b.location_address,
                    services: b.services?.map((s: any) => ({
                        name: s.name,
                        price: `${s.price_currency || 'GH₵'} ${s.price_amount}`,
                        duration: s.duration_text
                    })) || []
                });
            } else {
                setVendor(null);
            }
            setIsLoading(false);
        };

        if (id) fetchVendor();
    }, [id]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!vendor) {
        notFound();
    }

    // Get services from vendor
    const services = vendor.services || [];
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            {/* Cover Photo Banner */}
            <div className="w-full h-[40vh] relative mt-16">
                <div className="absolute inset-0 bg-neutral-900/10 z-10" />
                {vendor.coverImage && vendor.coverImage.startsWith("/") ? (
                    <Image
                        src={vendor.coverImage}
                        alt="Cover"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className={`w-full h-full ${vendor.coverImage || 'bg-neutral-200'} bg-cover bg-center`} />
                )}
            </div>

            <div className="pt-12 min-h-screen">
                <div className="container-wide px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Bio & Info */}
                    <div className="lg:col-span-5 lg:sticky lg:top-32 h-fit">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="w-32 h-32 bg-neutral-200 dark:bg-neutral-800 rounded-full mb-8 overflow-hidden relative">
                                {/* Portrait Placeholder */}
                                {vendor.imageUrl ? (
                                    <Image
                                        src={vendor.imageUrl}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-neutral-300 dark:bg-neutral-700" />
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-sm font-bold tracking-wider text-neutral-500 mb-2">
                                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-blue-500" /> VERIFIED PRO</span>
                            </div>

                            <h1 className="font-heading text-5xl font-bold mb-6">{vendor.name}.</h1>
                            <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                                {vendor.bio || 'Professional service provider.'}
                            </p>

                            <div className="space-y-4 text-sm font-medium mb-8">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-neutral-400" />
                                    <span>{vendor.address}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Star className="w-5 h-5 fill-black dark:fill-white" />
                                    <span>{vendor.rating} ({vendor.reviews || 0} Verified Reviews)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-neutral-400" />
                                    <span className={vendor.openNow ? "text-green-600" : "text-red-500"}>{vendor.openNow ? 'Available Today' : 'Unavailable'}</span>
                                </div>
                            </div>

                            <Link href={`/book?vendorId=${vendor.id}&type=service`} className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mb-8">
                                <Calendar className="w-4 h-4" /> BOOK APPOINTMENT
                            </Link>

                            {/* Map in Sidebar */}
                            <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-100">
                                <InteractiveMap
                                    items={[vendor]}
                                    center={{ lat: vendor.lat, lng: vendor.lng }}
                                    zoom={15}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Service Menu */}
                    <div className="lg:col-span-7 pb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <h3 className="font-heading text-2xl font-bold mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-4">Service Menu</h3>

                            <div className="space-y-4">
                                {services.map((service, index) => (
                                    <div key={index} className="group p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:border-black dark:hover:border-white transition-colors cursor-pointer bg-white/50 dark:bg-black/20 backdrop-blur-sm flex justify-between items-center">
                                        <div>
                                            <h4 className="font-heading text-xl font-bold mb-1">{service.name}</h4>
                                            <p className="text-sm text-neutral-500">{service.duration}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="font-bold text-lg">{service.price}</span>
                                            <button className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                                                SELECT
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Portfolio Grid Mockup */}
                            <h3 className="font-heading text-2xl font-bold mb-6 mt-16 border-b border-neutral-200 dark:border-neutral-800 pb-4">Recent Work</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                                <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                                <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                                <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
