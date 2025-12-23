"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { Star, Calendar, MapPin, CheckCircle, Clock } from "lucide-react";
import dynamic from "next/dynamic";
import MapPlaceholder from "@/components/MapPlaceholder";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
    loading: () => <MapPlaceholder />,
    ssr: false,
});

const BARBER_VENDOR = {
    id: "barber-1",
    name: "Kwame The Barber",
    category: "Service",
    items: ["Haircut", "Shave"],
    location: "East Legon",
    distance: "0km",
    rating: 5.0,
    image: "bg-black",
    lat: 5.6350, // East Legon coordinates
    lng: -0.1600,
    coverImage: "bg-neutral-800", // Placeholder
};

// Mock Service Data
const SERVICES = [
    { name: "Signature Haircut", duration: "45 min", price: "GH₵ 150" },
    { name: "Beard Trim & Shape", duration: "30 min", price: "GH₵ 80" },
    { name: "Full Grooming Package", duration: "90 min", price: "GH₵ 250" },
    { name: "Scalp Treatment", duration: "30 min", price: "GH₵ 120" },
];

export default function ServiceBusinessPage({ params }: { params: { id: string } }) {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            {/* Cover Photo Banner */}
            <div className="w-full h-[40vh] relative mt-16">
                <div className="absolute inset-0 bg-neutral-900/10 z-10" />
                <div className={`w-full h-full ${BARBER_VENDOR.coverImage} bg-cover bg-center`} />
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
                                <div className="absolute inset-0 bg-neutral-300 dark:bg-neutral-700" />
                            </div>

                            <div className="flex items-center gap-2 text-sm font-bold tracking-wider text-neutral-500 mb-2">
                                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-blue-500" /> VERIFIED PRO</span>
                            </div>

                            <h1 className="font-heading text-5xl font-bold mb-6">Kwame The Barber.</h1>
                            <p className="text-lg text-neutral-500 mb-8 leading-relaxed">
                                Master barber specializing in precision fades and classic cuts. Bringing over 10 years of experience from London to Accra. Dedicated to the craft of male grooming.
                            </p>

                            <div className="space-y-4 text-sm font-medium mb-8">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-neutral-400" />
                                    <span>East Legon, near A&C Mall</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Star className="w-5 h-5 fill-black dark:fill-white" />
                                    <span>5.0 (214 Verified Reviews)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-neutral-400" />
                                    <span className="text-green-600">Available Today</span>
                                </div>
                            </div>

                            <button className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mb-8">
                                <Calendar className="w-4 h-4" /> BOOK APPOINTMENT
                            </button>

                            {/* Map in Sidebar */}
                            <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm bg-neutral-100">
                                <InteractiveMap
                                    vendors={[BARBER_VENDOR]}
                                    center={{ lat: BARBER_VENDOR.lat, lng: BARBER_VENDOR.lng }}
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
                                {SERVICES.map((service, index) => (
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
