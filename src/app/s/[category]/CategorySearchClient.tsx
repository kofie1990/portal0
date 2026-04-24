"use client";

import Navigation from "@/components/Navigation";
import SearchInterface from "@/components/SearchInterface";
import MapPlaceholder from "@/components/MapPlaceholder";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  loading: () => <MapPlaceholder />,
  ssr: false,
});

interface CategorySearchClientProps {
  initialQuery: string;
  categoryName: string;
}

export default function CategorySearchClient({ initialQuery, categoryName }: CategorySearchClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("All");
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    const fetchToMap = async () => {
      const supabase = createClient();

      // 1. Fetch Businesses
      const { data: bData, error: bError } = await supabase
        .from("businesses")
        .select("*, services(*)");

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
          type: "business",
          businessType: b.location_type === "physical" ? "store" : "service",
          bio: b.bio,
          services: b.services?.map((s: any) => ({
            id: s.id,
            name: s.name,
            price: `${s.price_currency || "GH₵"} ${s.price_amount}`,
            duration: s.duration_text,
            image: s.image_url || (s.images && s.images[0]) || null,
            description: s.description,
            category: s.category,
          })),
        }));
      }

      // 2. Fetch Individual Profiles
      const { data: pData, error: pError } = await supabase
        .from("profiles")
        .select("*, services(*)");

      let mappedProfiles: any[] = [];
      if (pData && !pError) {
        mappedProfiles = pData
          .map((p: any) => {
            let finalLat = p.lat;
            let finalLng = p.lng;
            let finalAddress = p.location_text;

            if ((!finalLat || !finalLng) && p.services && p.services.length > 0) {
              const serviceWithLoc = p.services.find((s: any) => s.lat && s.lng);
              if (serviceWithLoc) {
                finalLat = serviceWithLoc.lat;
                finalLng = serviceWithLoc.lng;
                finalAddress = serviceWithLoc.location_text || finalAddress;
              }
            }

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
              category: "Individual",
              rating: 0,
              address: finalAddress,
              type: "profile",
              bio: p.bio,
              services:
                p.services?.map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  price: `${s.price_currency || "GH₵"} ${s.price_amount}`,
                  description: s.description,
                  category: s.category,
                  image: s.image_url || (s.images && s.images[0]) || null,
                })) || [],
            };
          })
          .filter((p: any) => p !== null);
      }

      setBusinesses([...mappedBusinesses, ...mappedProfiles]);
    };
    fetchToMap();
  }, []);

  // Filter businesses based on search query and category
  const filteredBusinesses = businesses.filter((business) => {
    const hasServiceInCategory = business.services?.some((s: any) => s.category === category);
    const matchesCategory = category === "All" || business.category === category || hasServiceInCategory;

    const matchesQuery =
      business.name.toLowerCase().includes(query.toLowerCase()) ||
      (business.bio && business.bio.toLowerCase().includes(query.toLowerCase())) ||
      (business.address && business.address.toLowerCase().includes(query.toLowerCase())) ||
      (business.location && business.location.toLowerCase().includes(query.toLowerCase())) ||
      (business.services &&
        business.services.some(
          (svc: any) =>
            svc.name.toLowerCase().includes(query.toLowerCase()) ||
            svc.description?.toLowerCase().includes(query.toLowerCase()) ||
            svc.category?.toLowerCase().includes(query.toLowerCase())
        ));

    return matchesCategory && matchesQuery;
  });

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black font-sans">
      <Navigation onSearchClick={() => {}} />

      <div className="relative min-h-screen flex flex-col">
        {/* Search Interface - Fixed at top */}
        <div className="fixed top-24 left-0 right-0 z-40 w-full flex justify-center px-4 pointer-events-none">
          <div id="search-interface" className="w-full max-w-4xl pointer-events-auto">
            <SearchInterface
              onQueryChange={setQuery}
              onCategoryChange={setCategory}
              activeCategory={category}
              initialQuery={initialQuery}
            />
          </div>
        </div>

        {/* Map Container - Full screen */}
        <div className="fixed inset-0 z-0 w-full h-screen">
          <div className="w-full h-full">
            <InteractiveMap
              items={filteredBusinesses
                .map((b) => {
                  if (b.lat && b.lng) return b;
                  return null;
                })
                .filter(Boolean)}
              centerOnUserLocation={true}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
