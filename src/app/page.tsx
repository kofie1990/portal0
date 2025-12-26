"use client";

import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SearchInterface from "@/components/SearchInterface";
import MapPlaceholder from "@/components/MapPlaceholder";
import VendorList from "@/components/VendorList";
import { useState } from "react";
import { MOCK_VENDORS } from "@/lib/mock-data";

import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  loading: () => <MapPlaceholder />,
  ssr: false,
});

import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [isSearching, setIsSearching] = useState(false);

  const filteredVendors = MOCK_VENDORS.filter((vendor) => {
    const matchesCategory = category === "All" || vendor.category === category;
    const matchesQuery =
      vendor.name.toLowerCase().includes(query.toLowerCase()) ||
      vendor.items.some(item => item.toLowerCase().includes(query.toLowerCase()));

    return matchesCategory && matchesQuery;
  });

  const handleSearch = () => {
    if (query.trim().length > 0) {
      setIsSearching(true);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black font-sans">
      <Navigation onSearchClick={() => setIsSearching(true)} />

      <div className="relative min-h-screen flex flex-col">
        {/* Animated Background / Hero */}
        <div className="relative inset-0 z-0">
          <AnimatePresence>
            {!isSearching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <HeroSection />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Interface Container */}
        <motion.div
          layout
          className={`relative z-40 w-full flex justify-center px-4 transition-all duration-700 ease-[0.16,1,0.3,1] pointer-events-none ${isSearching
            ? "fixed top-24 left-0 right-0"
            : "mt-0 pb-12 lg:pb-32"
            }`}
        >
          <div id="search-interface" className="w-full max-w-4xl pointer-events-auto">
            <SearchInterface
              onQueryChange={setQuery}
              onCategoryChange={setCategory}
              activeCategory={category}
              onSubmit={handleSearch}
            />
          </div>
        </motion.div>

        {/* Map Container - Expands to full screen */}
        <motion.div
          layout
          className={`transition-all duration-700 ease-[0.16,1,0.3,1] ${isSearching
            ? "fixed inset-0 z-0 w-full h-screen"
            : "relative z-30 h-0 w-full opacity-0 overflow-hidden"
            }`}
        >
          <div className="w-full h-full">
            <InteractiveMap vendors={filteredVendors} />
          </div>

          {/* Overlay to close search mode (Optional UX enhancement) */}
          {isSearching && (
            <button
              onClick={() => setIsSearching(false)}
              className="absolute top-24 right-4 z-[400] bg-white text-black p-2 rounded-full shadow-lg hover:bg-neutral-200 transition-colors"
            >
              <span className="sr-only">Close Map</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </motion.div>

        {/* Initial Static Content (Only visible when NOT searching) */}
        <AnimatePresence>
          {!isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.5 }}
              className="relative top-full left-0 right-0 mt-0 bg-background z-20"
            >
              <div className="container-wide py-12">
                <h3 className="font-heading text-2xl font-bold mb-6 px-4 md:px-0">Trending Nearby</h3>
                <VendorList vendors={MOCK_VENDORS.slice(0, 4)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}


