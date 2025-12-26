"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import Image from "next/image";

const PRODUCTS = [
    { id: 1, name: "Obsidian Vase", price: "GH₵ 450", image: "bg-neutral-200", imageUrl: "" },
    { id: 2, name: "Linen Tunic", price: "GH₵ 280", image: "bg-neutral-300", imageUrl: "/others/clothes.jpg" },
    { id: 3, name: "Leather Tote", price: "GH₵ 850", image: "bg-stone-200", imageUrl: "" },
    { id: 4, name: "Ceramic Plate Set", price: "GH₵ 320", image: "bg-zinc-200", imageUrl: "/others/food_2.jpg" },
    { id: 5, name: "Woven Basket", price: "GH₵ 150", image: "bg-orange-100", imageUrl: "" },
    { id: 6, name: "Brass Jewelry", price: "GH₵ 120", image: "bg-yellow-100", imageUrl: "" },
    { id: 7, name: "Wooden Stool", price: "GH₵ 550", image: "bg-amber-100", imageUrl: "" },
    { id: 8, name: "Silk Scarf", price: "GH₵ 180", image: "bg-red-100", imageUrl: "" },
];

export default function DiscoverPage() {
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
                        {PRODUCTS.map((item, index) => (
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
