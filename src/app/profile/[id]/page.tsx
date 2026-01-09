"use client";

import { useParams } from "next/navigation";
import { MOCK_BUSINESSES } from "@/lib/mock-data";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { ArrowLeft, User, MapPin, Star, Phone, Mail, ShoppingBag, Share2, Heart, CheckCircle, Clock } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import MapPlaceholder from "@/components/MapPlaceholder";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
    loading: () => <MapPlaceholder />,
    ssr: false,
});

export default function ProfilePage() {
    const params = useParams();
    const vendor = MOCK_BUSINESSES.find((v) => v.id === params.id);

    if (!vendor) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Vendor Not Found</h1>
                <Link href="/" className="text-blue-500 hover:underline">Go Home</Link>
            </div>
        );
    }

    const isBusiness = vendor.type === 'business';
    const isService = vendor.businessType === 'service';

    // RENDER INDIVIDUAL PROFILE
    if (!isBusiness) {
        return (
            <main className="min-h-screen bg-background text-foreground font-sans pb-20">
                <Navigation />
                <div className="pt-24 container-wide max-w-2xl mx-auto px-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-foreground mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Map
                    </Link>
                    <div className="flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6 bg-neutral-100 relative">
                            {vendor.ownerImage ? (
                                <img src={vendor.ownerImage} alt={vendor.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
                                    <User className="w-12 h-12 text-neutral-400" />
                                </div>
                            )}
                        </div>
                        <h1 className="font-heading text-3xl font-bold mb-2">{vendor.name}</h1>
                        <p className="text-sm text-neutral-500 mb-6 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> {vendor.address}
                        </p>
                        <div className="max-w-lg mx-auto text-neutral-600 mb-8 leading-relaxed">
                            "{vendor.bio || "Just another user looking to sell some great items."}"
                        </div>
                        <div className="flex gap-4 mb-12">
                            <a href={`tel:${vendor.phone}`} className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm hover:scale-105 transition-transform">
                                Contact User
                            </a>
                            <button className="px-6 py-2 bg-neutral-100 text-neutral-900 rounded-full font-bold text-sm hover:scale-105 transition-transform">
                                View History
                            </button>
                        </div>
                        <div className="w-full text-left">
                            <h3 className="font-heading text-xl font-bold mb-4 border-b pb-2 border-neutral-200">User Listings</h3>
                            <div className="space-y-3">
                                {vendor.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center">
                                                <ShoppingBag className="w-5 h-5 text-neutral-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">{item}</h4>
                                                <p className="text-xs text-neutral-400">Listed recently</p>
                                            </div>
                                        </div>
                                        <button className="text-xs font-bold text-neutral-900 px-3 py-1 bg-neutral-100 rounded-full hover:bg-neutral-200">
                                            View
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // RENDER BUSINESS PROFILE
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            {/* Storefront Cover Photo */}
            <div className="w-full h-[50vh] relative pt-16">
                <div className="absolute inset-0 bg-neutral-900/10 z-10" />
                {vendor.coverImage && vendor.coverImage.startsWith("/") ? (
                    <div className="w-full h-full relative">
                        <img src={vendor.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className={`w-full h-full ${vendor.coverImage || 'bg-neutral-200'} bg-cover bg-center`} />
                )}

                {/* Back button overlay */}
                <div className="absolute top-24 left-6 z-20">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-black/20 backdrop-blur-md px-4 py-2 rounded-full hover:bg-black/40 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Map
                    </Link>
                </div>
            </div>

            {/* Hero / Store Header */}
            <div className="pt-8 pb-12 px-6">
                <div className="container-wide">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col md:flex-row justify-between items-end border-b border-neutral-200 dark:border-neutral-800 pb-8 mb-12"
                    >
                        <div>
                            <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 mb-2 block uppercase">{vendor.category} STORE</span>
                            <h1 className="font-heading text-5xl md:text-7xl font-bold mb-4">{vendor.name}</h1>
                            <div className="flex items-center gap-4 text-sm font-medium">
                                <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-black dark:fill-white" /> {vendor.rating} ({vendor.reviews || 0} Reviews)</span>
                                <span className="text-neutral-400">•</span>
                                <span>{vendor.location}</span>
                                <span className="text-neutral-400">•</span>
                                <span className="text-green-600">{vendor.openNow ? "Open Now" : "Closed"}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6 md:mt-0">
                            <button className="p-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button className="p-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                <Heart className="w-5 h-5" />
                            </button>
                            <a href={`tel:${vendor.phone}`} className="bg-foreground text-background px-6 py-3 rounded-full text-sm font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2">
                                CONTACT STORE
                            </a>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* LEFT COLUMN: Products or Services */}
                        <div className="lg:col-span-8">
                            <h3 className="font-heading text-2xl font-bold mb-8">Featured Items</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-10">
                                {vendor.products?.map((product, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                        viewport={{ once: true }}
                                        className="group cursor-pointer"
                                    >
                                        <div className={`aspect-[4/3] rounded-xl mb-4 relative overflow-hidden ${product.image || 'bg-neutral-100'}`}>
                                            {product.imageUrl && <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />}

                                            <button className="absolute bottom-4 right-4 bg-white dark:bg-black text-black dark:text-white p-3 rounded-full shadow-lg translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                                <ShoppingBag className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-heading text-lg font-bold">{product.name}</h3>
                                            <span className="font-medium text-neutral-500">{product.price}</span>
                                        </div>
                                    </motion.div>
                                ))}

                                {(!vendor.products || vendor.products.length === 0) && (
                                    <p className="text-neutral-500">No products listed.</p>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Info & Map */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="p-8 bg-neutral-100 dark:bg-neutral-900 rounded-3xl">
                                <h4 className="font-bold mb-4 text-lg">About</h4>
                                <p className="text-neutral-500 leading-relaxed mb-6">
                                    {vendor.bio}
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-5 h-5 mt-1" />
                                        <div>
                                            <span className="font-bold block text-sm">Address</span>
                                            <span className="text-sm text-neutral-500">{vendor.address}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Clock className="w-5 h-5 mt-1" />
                                        <div>
                                            <span className="font-bold block text-sm">Hours</span>
                                            <span className="text-sm text-neutral-500">Mon-Sat: 9am - 9pm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[300px] rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-100">
                                <InteractiveMap
                                    vendors={[vendor]}
                                    center={{ lat: vendor.lat, lng: vendor.lng }}
                                    zoom={15}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
