import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CategorySearchClient from "./CategorySearchClient";

// Map of URL slugs to display names and SEO descriptions
const CATEGORY_MAP: Record<string, { name: string; title: string; description: string; keywords: string[] }> = {
  "lash-tech": {
    name: "Lash Tech",
    title: "Top Lash Technicians Near You in Ghana",
    description: "Find and book the best lash technicians near your location in Ghana. Browse verified lash artists, view portfolios, compare prices, and book appointments instantly on Portal.",
    keywords: ["lash tech near me", "lash extensions ghana", "lash technician accra", "eyelash extensions near me", "lash artist ghana"],
  },
  "hair-stylist": {
    name: "Hair Stylist",
    title: "Professional Hair Stylists Near You in Ghana",
    description: "Discover top-rated hair stylists in Ghana. Browse portfolios, read reviews, compare prices, and book your next appointment seamlessly on Portal.",
    keywords: ["hair stylist near me", "hair salon ghana", "hairdresser accra", "braiding near me", "hair stylist accra"],
  },
  "makeup-artist": {
    name: "Makeup Artist",
    title: "Talented Makeup Artists Near You in Ghana",
    description: "Find professional makeup artists near your location in Ghana. View their work, read reviews, and book for weddings, events, or everyday glam on Portal.",
    keywords: ["makeup artist near me", "MUA ghana", "makeup artist accra", "bridal makeup ghana", "event makeup near me"],
  },
  "nail-tech": {
    name: "Nail Technician",
    title: "Expert Nail Technicians Near You in Ghana",
    description: "Book the best nail technicians in Ghana. Browse manicure, pedicure, and nail art services near you. Compare prices and book instantly on Portal.",
    keywords: ["nail tech near me", "nail salon ghana", "manicure accra", "nail art near me", "pedicure ghana"],
  },
  "barber": {
    name: "Barber",
    title: "Skilled Barbers Near You in Ghana",
    description: "Find professional barbers near your location in Ghana. Browse barbershops, view their work, check ratings, and book your next haircut on Portal.",
    keywords: ["barber near me", "barbershop ghana", "barber accra", "haircut near me", "men's grooming ghana"],
  },
  "fashion": {
    name: "Fashion",
    title: "Fashion Designers & Stores Near You in Ghana",
    description: "Explore fashion designers, tailors, and clothing stores near you in Ghana. Discover local brands and book custom fittings on Portal.",
    keywords: ["fashion designer near me", "tailor ghana", "clothing store accra", "custom fashion ghana", "fashion near me"],
  },
  "food": {
    name: "Food",
    title: "Food Vendors & Restaurants Near You in Ghana",
    description: "Discover the best food vendors, restaurants, and caterers near your location in Ghana. Browse menus, read reviews, and order on Portal.",
    keywords: ["food near me", "restaurant ghana", "food vendor accra", "catering near me", "local food ghana"],
  },
  "services": {
    name: "Services",
    title: "Local Service Providers Near You in Ghana",
    description: "Find trusted local service providers near you in Ghana. From beauty to tech support, compare services, read reviews, and book instantly on Portal.",
    keywords: ["services near me", "service provider ghana", "local services accra", "book service near me"],
  },
  "tech": {
    name: "Tech",
    title: "Tech Services & Repair Near You in Ghana",
    description: "Find tech repair, IT support, and digital services near your location in Ghana. Browse providers, compare prices, and book on Portal.",
    keywords: ["tech repair near me", "phone repair ghana", "IT support accra", "tech services near me"],
  },
  "art": {
    name: "Art",
    title: "Artists & Creative Services Near You in Ghana",
    description: "Discover local artists, photographers, and creative service providers near you in Ghana. View portfolios and book creative services on Portal.",
    keywords: ["artist near me", "photographer ghana", "creative services accra", "art near me"],
  },
};

// Generate dynamic metadata for Google SEO
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = CATEGORY_MAP[category];

  if (!categoryInfo) {
    return {
      title: "Search Services Near You in Ghana",
      description: "Find and book local services near your location in Ghana. Browse verified providers, compare prices, and book appointments on Portal.",
    };
  }

  return {
    title: categoryInfo.title,
    description: categoryInfo.description,
    keywords: categoryInfo.keywords,
    openGraph: {
      title: `${categoryInfo.title} | Portal`,
      description: categoryInfo.description,
      type: "website",
      locale: "en_GH",
      siteName: "Portal",
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryInfo.title} | Portal`,
      description: categoryInfo.description,
    },
    alternates: {
      canonical: `/s/${category}`,
    },
  };
}

// Fetch businesses on the server for SEO (Google bots will see this content)
async function fetchCategoryData(categorySlug: string) {
  const supabase = await createClient();
  const categoryInfo = CATEGORY_MAP[categorySlug];
  const searchTerm = categoryInfo?.name || categorySlug.replace(/-/g, " ");

  // Fetch businesses matching this category
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, category, location_address, bio, lat, lng, cover_image_url, image_url, rating, review_count")
    .or(`category.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`);

  // Fetch profiles/individuals who offer services in this category
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, bio, location_text, lat, lng, avatar_url")
    .or(`bio.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);

  // Fetch services matching this category
  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, category, price_amount, price_currency, image_url, business_id, profile_id, lat, lng")
    .or(`category.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

  return { businesses: businesses || [], profiles: profiles || [], services: services || [] };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryInfo = CATEGORY_MAP[category];
  const displayName = categoryInfo?.name || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const { businesses, profiles, services } = await fetchCategoryData(category);

  // Build JSON-LD Structured Data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: categoryInfo?.title || `${displayName} Near You in Ghana`,
    description: categoryInfo?.description || `Find ${displayName} services near you in Ghana on Portal.`,
    url: `https://myportalgh.com/s/${category}`,
    numberOfItems: businesses.length + profiles.length,
    itemListElement: [
      ...businesses.map((b: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          name: b.name,
          description: b.bio || `${b.name} - ${displayName} in Ghana`,
          address: {
            "@type": "PostalAddress",
            streetAddress: b.location_address || "",
            addressLocality: "Accra",
            addressCountry: "GH",
          },
          ...(b.lat && b.lng ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: b.lat,
              longitude: b.lng,
            },
          } : {}),
          ...(b.cover_image_url ? { image: b.cover_image_url } : {}),
          ...(b.rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: b.rating, reviewCount: b.review_count || 1 } } : {}),
          url: `https://myportalgh.com/business/service/${b.id}`,
        },
      })),
      ...profiles.map((p: any, i: number) => ({
        "@type": "ListItem",
        position: businesses.length + i + 1,
        item: {
          "@type": "Person",
          name: p.full_name || "Service Provider",
          description: p.bio || `${displayName} provider in Ghana`,
          ...(p.avatar_url ? { image: p.avatar_url } : {}),
          url: `https://myportalgh.com/profile/${p.id}`,
        },
      })),
    ],
  };

  // Compute the search query to pass to the client
  const searchQuery = categoryInfo?.name?.toLowerCase() || category.replace(/-/g, " ");

  return (
    <>
      {/* JSON-LD Structured Data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SEO-visible content for Google bots */}
      <div className="sr-only">
        <h1>{categoryInfo?.title || `${displayName} Near You in Ghana`}</h1>
        <p>{categoryInfo?.description || `Find the best ${displayName} near your location in Ghana.`}</p>
        <h2>Available {displayName} Providers</h2>
        <ul>
          {businesses.map((b: any) => (
            <li key={b.id}>
              <a href={`/business/service/${b.id}`}>{b.name}</a> — {b.location_address || "Ghana"} — {b.bio || `${displayName} provider`}
            </li>
          ))}
          {profiles.map((p: any) => (
            <li key={p.id}>
              <a href={`/profile/${p.id}`}>{p.full_name}</a> — {p.location_text || "Ghana"} — {p.bio || `${displayName} provider`}
            </li>
          ))}
        </ul>
        {services.length > 0 && (
          <>
            <h2>Available Services</h2>
            <ul>
              {services.map((s: any) => (
                <li key={s.id}>
                  {s.name} — {s.price_currency || "GH₵"} {s.price_amount} — {s.description || "No description"}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Interactive Client Component */}
      <CategorySearchClient
        initialQuery={searchQuery}
        categoryName={displayName}
      />
    </>
  );
}
