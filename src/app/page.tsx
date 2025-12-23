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

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const filteredVendors = MOCK_VENDORS.filter((vendor) => {
    const matchesCategory = category === "All" || vendor.category === category;
    const matchesQuery =
      vendor.name.toLowerCase().includes(query.toLowerCase()) ||
      vendor.items.some(item => item.toLowerCase().includes(query.toLowerCase()));

    return matchesCategory && matchesQuery;
  });

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black font-sans">
      <Navigation />
      <div className="relative">
        <HeroSection />
        <div id="search-interface" className="absolute bottom-0 left-0 right-0 transform translate-y-1/2 z-30 px-4">
          <SearchInterface
            onQueryChange={setQuery}
            onCategoryChange={setCategory}
            activeCategory={category}
          />
        </div>
      </div>
      <div className="mt-24 pb-20">
        <div className="container-wide mb-12">
          <h3 className="font-heading text-2xl font-bold mb-6 px-4 md:px-0">Explore Nearby</h3>
          <div className="rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl h-[500px] bg-neutral-100">
            <InteractiveMap vendors={filteredVendors} />
          </div>
        </div>

        <VendorList vendors={filteredVendors} />
      </div>
    </main>
  );
}


