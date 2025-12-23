"use client";

import { motion } from "framer-motion";
import { Vendor } from "@/lib/mock-data";
import { Star, MapPin } from "lucide-react";

interface VendorListProps {
    vendors: Vendor[];
}

export default function VendorList({ vendors }: VendorListProps) {
    if (vendors.length === 0) {
        return (
            <div className="text-center py-20 opacity-50">
                <p>No vendors found matching your search.</p>
            </div>
        );
    }

    return (
        <div className="container-wide py-12">
            <h3 className="font-heading text-2xl font-bold mb-8">Nearby Vendors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor, index) => (
                    <motion.div
                        key={vendor.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                    >
                        {/* Image Placeholder */}
                        <div className={`h-48 ${vendor.image} w-full flex items-center justify-center`}>
                            <span className="text-neutral-500 font-heading opacity-50">{vendor.category}</span>
                        </div>

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg group-hover:underline decoration-1 underline-offset-4">{vendor.name}</h4>
                                <div className="flex items-center gap-1 text-sm font-medium">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    {vendor.rating}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-neutral-500 text-sm mb-4">
                                <MapPin className="w-4 h-4" />
                                {vendor.location} • {vendor.distance}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {vendor.items.map((item) => (
                                    <span key={item} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs text-neutral-600 dark:text-neutral-400">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
