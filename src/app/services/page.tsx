"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";
import Image from "next/image";

// Mock Service Data
const SERVICES = [
    { id: 1, name: "Kwame The Barber", category: "Barber", location: "East Legon", image: "bg-zinc-800", imageUrl: "/others/haircut_1.jpg", price: "From GH₵ 50" },
    { id: 2, name: "Elite Cleaning", category: "Cleaning", location: "Cantonments", image: "bg-blue-100", imageUrl: "", price: "From GH₵ 150" },
    { id: 3, name: "FitLife Gym", category: "Fitness", location: "Airport City", image: "bg-gray-200", imageUrl: "/people/person_4.jpg", price: "Membership" },
    { id: 4, name: "Tech Fix", category: "Repair", location: "Osu", image: "bg-blue-50", imageUrl: "", price: "Quote" },
];

export default function ServicesPage() {
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
                        <h1 className="font-heading text-4xl md:text-5xl font-bold">Book Services.</h1>
                    </motion.div>

                    <div className="space-y-4">
                        {SERVICES.map((service, index) => (
                            <Link href="#" key={service.id} className="block group">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="flex flex-col md:flex-row items-center border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                                >
                                    <div className={`w-full md:w-48 h-32 ${service.image} rounded-xl mb-4 md:mb-0 md:mr-6 flex-shrink-0 relative overflow-hidden`}>
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
                                                <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-1 block">{service.category}</span>
                                                <h3 className="font-heading text-2xl font-bold mb-1">{service.name}</h3>
                                                <p className="text-neutral-500">{service.location}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-bold mb-1">{service.price}</span>
                                                <div className="flex items-center gap-1 text-sm font-bold justify-end text-neutral-500">
                                                    <Star className="w-3 h-3 fill-current" /> 5.0
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="ml-6 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-2 duration-300">
                                        <ArrowUpRight className="w-6 h-6" />
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
