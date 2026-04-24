"use client";

import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SearchInterface from "@/components/SearchInterface";
import MapPlaceholder from "@/components/MapPlaceholder";
import BusinessList from "@/components/BusinessList";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";

import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  loading: () => <MapPlaceholder />,
  ssr: false,
});

import { createClient } from "@/lib/supabase/client";

import { motion, AnimatePresence } from "framer-motion";


function HomeContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "";

  const [query, setQuery] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory || "All");
  const [isSearching, setIsSearching] = useState(!!urlQuery);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [geocodedCoords, setGeocodedCoords] = useState<Record<string, { lat: number, lng: number }>>({});



  // Fetch real data


  useEffect(() => {
    const fetchToMap = async () => { // Renamed for clarity
      const supabase = createClient();

      // 1. Fetch Businesses
      const { data: bData, error: bError } = await supabase
        .from('businesses')
        .select('*, services(*)');

      console.log('Fetched Businesses:', bData?.length);
      if (bError) console.error('Error fetching businesses:', bError);

      let mappedBusinesses: any[] = [];
      if (bData && !bError) {
        mappedBusinesses = bData.map((b: any) => ({
          id: b.id,
          name: b.name,
          category: b.category,
          items: [],
          location: b.location_address,
          distance: "0km",
          rating: b.rating || 0,
          reviews: b.review_count || 0,
          image: "bg-neutral-100",
          imageUrl: b.cover_image_url || b.image_url,
          coverImage: b.cover_image_url,
          lat: b.lat,
          lng: b.lng,
          phone: b.phone,
          email: b.email,
          address: b.location_address,
          type: 'business', // Explicitly typed
          businessType: b.location_type === 'physical' ? 'store' : 'service',
          bio: b.bio,
          services: b.services?.map((s: any) => ({
            id: s.id,
            name: s.name,
            price: `${s.price_currency || 'GH₵'} ${s.price_amount}`,
            duration: s.duration_text,
            image: s.image_url || (s.images && s.images[0]) || null,
            description: s.description
          }))
        }));
      }

      // 2. Fetch Individual Profiles (that have services or are marked as providers)
      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('*, services(*)');

      let mappedProfiles: any[] = [];
      if (pData && !pError) {
        mappedProfiles = pData.map((p: any) => {
          // Determine Location: Profile > First Service > Null
          let finalLat = p.lat;
          let finalLng = p.lng;
          let finalAddress = p.location_text;

          // If no profile location, try to find a service with a location
          if ((!finalLat || !finalLng) && p.services && p.services.length > 0) {
            const serviceWithLoc = p.services.find((s: any) => s.lat && s.lng);
            if (serviceWithLoc) {
              finalLat = serviceWithLoc.lat;
              finalLng = serviceWithLoc.lng;
              finalAddress = serviceWithLoc.location_text || finalAddress;
            }
          }

          // If still no location, exclude from map
          if (!finalLat || !finalLng) return null;

          // Exclude profiles without any services
          if (!p.services || p.services.length === 0) return null;

          return {
            id: p.id,
            name: p.full_name || "Unnamed User",
            lat: finalLat,
            lng: finalLng,
            image: "bg-blue-100",
            imageUrl: p.avatar_url,
            category: "Individual", // Default, but can be overridden by search
            rating: 0,
            address: finalAddress,
            type: 'profile',
            bio: p.bio,
            services: p.services?.map((s: any) => ({
              id: s.id,
              name: s.name,
              price: `${s.price_currency || 'GH₵'} ${s.price_amount}`,
              description: s.description,
              category: s.category,
              image: s.image_url || (s.images && s.images[0]) || null
            })) || []
          };
        }).filter((p) => p !== null);
      }

      setBusinesses([...mappedBusinesses, ...mappedProfiles]);
    };
    fetchToMap();
  }, []);

  const filteredBusinesses = businesses.filter((business) => {
    // Check if any service matches the selected category (or if the business/profile itself matches)
    const hasServiceInCategory = business.services?.some((s: any) => s.category === category);
    const matchesCategory = category === "All" || business.category === category || hasServiceInCategory;

    const matchesQuery =
      business.name.toLowerCase().includes(query.toLowerCase()) ||
      (business.bio && business.bio.toLowerCase().includes(query.toLowerCase())) ||
      (business.address && business.address.toLowerCase().includes(query.toLowerCase())) ||
      (business.location && business.location.toLowerCase().includes(query.toLowerCase())) ||
      (business.items && business.items.some((item: string) => item.toLowerCase().includes(query.toLowerCase()))) ||
      (business.services && business.services.some((svc: any) =>
        svc.name.toLowerCase().includes(query.toLowerCase()) ||
        svc.description?.toLowerCase().includes(query.toLowerCase())
      ));



    return matchesCategory && matchesQuery;
  });

  // Geocode filtered businesses that are missing coordinates
  useEffect(() => {
    const businessesToGeocode = filteredBusinesses.filter(
      b => (!b.lat || !b.lng) && b.address && !geocodedCoords[b.id]
    );

    if (businessesToGeocode.length > 0) {
      // Throttle/Sequence requests to avoid rate limits
      const geocodeNext = async (index: number) => {
        if (index >= businessesToGeocode.length) return;

        const business = businessesToGeocode[index];
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(business.address)}&limit=1`,
            {
              headers: { "User-Agent": "PortalApp/1.0" }
            }
          );
          const data = await res.json();
          if (data && data.length > 0) {
            setGeocodedCoords(prev => ({
              ...prev,
              [business.id]: {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
              }
            }));
          }
        } catch (e) {
          console.error("Geocoding failed for", business.name, e);
        }

        // Wait 1s between requests to be nice to Nominatim
        setTimeout(() => geocodeNext(index + 1), 1000);
      };

      geocodeNext(0);
    }
  }, [filteredBusinesses, geocodedCoords]);

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
              initialQuery={urlQuery}
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
            <InteractiveMap
              items={filteredBusinesses.map(b => {
                if (b.lat && b.lng) return b;
                if (geocodedCoords[b.id]) {
                  return {
                    ...b,
                    lat: geocodedCoords[b.id].lat,
                    lng: geocodedCoords[b.id].lng
                  };
                }
                return null;
              }).filter(Boolean)}
              centerOnUserLocation={!!urlQuery}
            />
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
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <h2 className="font-heading text-3xl font-bold mb-2">Featured Businesses.</h2>
                    <p className="text-neutral-500">Top rated local favorites near you.</p>
                  </div>
                  <Link href="/businesses" className="text-sm font-bold tracking-widest hover:opacity-70 transition-opacity flex items-center gap-2">
                    VIEW ALL <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <BusinessList businesses={businesses.filter(b => b.type === 'business').slice(0, 4)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}
