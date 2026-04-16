import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CategorySearchClient from "./CategorySearchClient";

const BASE_URL = "https://myportalgh.com";

const CATEGORY_MAP: Record<string, { name: string; title: string; description: string; keywords: string[] }> = {
  // 1. Beauty & Personal Care
  "hair-braiding": {
    name: "Hair & Braiding",
    title: "Expert Hair & Braiding Services Near You in Ghana",
    description: "Find general hair stylists and specialist braiders in Ghana. Browse portfolios and book your next appointment instantly on Portal.",
    keywords: ["hair braiding near me", "braids ghana", "hair salon accra", "specialist braider", "hair stylist near me"],
  },
  "barbering": {
    name: "Barbering",
    title: "Professional Barbering Services Near You in Ghana",
    description: "Discover skilled barbers and top-rated barbershops near you. Book your next haircut or grooming session seamlessly.",
    keywords: ["barber near me", "barbering ghana", "barbershop accra", "haircut near me"],
  },
  "makeup-artistry": {
    name: "Makeup Artistry",
    title: "Talented Makeup Artists Near You in Ghana",
    description: "Professional makeup artistry for weddings, events, and everyday looks. Find the best MUAs near your location.",
    keywords: ["makeup artist near me", "MUA ghana", "makeup artistry accra", "bridal makeup"],
  },
  "nail-tech-pedicure": {
    name: "Nail Tech & Pedicure",
    title: "Expert Nail Technicians & Pedicure Services in Ghana",
    description: "Find nail salons, manicurists, and pedicure specialists near you. Book nail art and spa pedicures.",
    keywords: ["nail tech near me", "pedicure ghana", "nail salon accra", "manicure near me"],
  },
  "spa-massage": {
    name: "Spa & Massage Therapy",
    title: "Spa & Massage Therapy Near You in Ghana",
    description: "Discover relaxing spa treatments and professional massage therapists near your location.",
    keywords: ["massage therapy near me", "spa ghana", "massage accra", "wellness center"],
  },
  "skin-consultation": {
    name: "Skin Consultation",
    title: "Skin Consultation & Dermatologists Near You in Ghana",
    description: "Connect with skin consultants and dermatologists for advanced skincare advice and treatments.",
    keywords: ["skin consultation near me", "dermatologist ghana", "skincare specialist accra"],
  },
  "tattoo": {
    name: "Tattoo",
    title: "Tattoo Artists & Studios Near You in Ghana",
    description: "Find skilled tattoo artists and studios near your location in Ghana. View portfolios and book your next tattoo on Portal.",
    keywords: ["tattoo near me", "tattoo artist ghana", "tattoo studio accra", "tattoo shop near me"],
  },
  "lash-tech": {
    name: "Lash Tech",
    title: "Top Lash Technicians Near You in Ghana",
    description: "Find and book the best lash technicians near your location in Ghana. Browse verified lash artists, view portfolios, compare prices, and book appointments instantly on Portal.",
    keywords: ["lash tech near me", "lash extensions ghana", "lash technician accra", "eyelash extensions near me", "lash artist ghana"],
  },

  // 2. Home & Technical Services
  "plumbing": {
    name: "Plumbing",
    title: "Trusted Plumbing Services Near You in Ghana",
    description: "Find reliable plumbers for repairs, installations, and emergency services near your location.",
    keywords: ["plumber near me", "plumbing service ghana", "pipe repair accra"],
  },
  "electrical-engineering": {
    name: "Electrical Engineering",
    title: "Electrical Engineering & Wiring Services Near You in Ghana",
    description: "Connect with certified electrical engineers and electricians for safe wiring and installations.",
    keywords: ["electrician near me", "electrical engineering ghana", "wiring services accra"],
  },
  "ac-refrigeration": {
    name: "AC & Refrigeration Tech",
    title: "AC & Refrigeration Technicians Near You in Ghana",
    description: "Beat the heat! Find expert AC repair and refrigeration technicians near you in Ghana.",
    keywords: ["ac repair near me", "refrigeration tech ghana", "air conditioning accra"],
  },
  "solar-panel": {
    name: "Solar Panel Installation & Maintenance",
    title: "Solar Panel Installation & Maintenance in Ghana",
    description: "Go green with expert solar panel installation and maintenance services near your location.",
    keywords: ["solar installation near me", "solar panel maintenance ghana", "green energy accra"],
  },
  "carpentry-furniture": {
    name: "Carpentry & Furniture Repair",
    title: "Carpentry & Furniture Repair Services Near You",
    description: "Find skilled carpenters and furniture repair specialists for custom woodwork and restoration.",
    keywords: ["carpenter near me", "furniture repair ghana", "carpentry accra"],
  },
  "painting-wallpapering": {
    name: "Painting & Wallpapering",
    title: "Painting & Wallpapering Services Near You in Ghana",
    description: "Transform your space with professional painting and wallpapering services near you.",
    keywords: ["painter near me", "wallpapering ghana", "house painting accra"],
  },
  "security-cctv": {
    name: "Security & CCTV Installation",
    title: "Security & CCTV Installation Near You in Ghana",
    description: "Secure your home and business with professional CCTV installation and security services.",
    keywords: ["cctv installation near me", "security services ghana", "cctv accra"],
  },
  "fumigation-pest": {
    name: "Fumigation & Pest Control",
    title: "Fumigation & Pest Control Services in Ghana",
    description: "Get rid of pests safely with professional fumigation and pest control services near you.",
    keywords: ["pest control near me", "fumigation ghana", "pest exterminator accra"],
  },
  "cleaning": {
    name: "Cleaning Services",
    title: "Cleaning Services Near You in Ghana",
    description: "Find professional cleaning services near you in Ghana. Book house cleaning, office cleaning, and deep cleaning services on Portal.",
    keywords: ["cleaning services near me", "cleaners near me", "house cleaning ghana", "office cleaning accra", "deep cleaning services"],
  },
  // 3. Automotive
  "mechanic": {
    name: "Mechanic",
    title: "Auto Mechanics & Car Repair Near You in Ghana",
    description: "Find trusted auto mechanics and garages near your location for swift car repairs.",
    keywords: ["mechanic near me", "car repair ghana", "auto mechanic accra"],
  },
  "auto-electrician": {
    name: "Auto-Electrician",
    title: "Auto-Electricians Near You in Ghana",
    description: "Certified auto-electricians to diagnose and fix electrical issues in your vehicle.",
    keywords: ["auto electrician near me", "car wiring repair ghana", "auto electrician accra"],
  },
  "car-detailing-wash": {
    name: "Car Detailing & Wash",
    title: "Car Detailing & Wash Services Near You",
    description: "Premium car detailing and washing services to keep your vehicle looking brand new.",
    keywords: ["car wash near me", "auto detailing ghana", "car cleaning accra"],
  },
  "vulcanizing": {
    name: "Vulcanizing",
    title: "Vulcanizing & Tire Repair Services Near You",
    description: "Find vulcanizing services and tire repair shops near your location.",
    keywords: ["vulcanizer near me", "tire repair ghana", "vulcanizing accra"],
  },
  "ev-specialist": {
    name: "EV Specialist",
    title: "EV Specialists & Diagnostics Near You in Ghana",
    description: "Expert diagnostics and repairs for electric vehicles (EV) in Ghana.",
    keywords: ["ev specialist near me", "electric vehicle repair ghana", "ev diagnostics accra"],
  },

  // 4. Fashion & Craftsmanship
  "tailoring-fashion": {
    name: "Tailoring & Fashion Design",
    title: "Tailoring & Fashion Design Near You in Ghana",
    description: "Find expert tailors and fashion designers for custom outfits and alterations.",
    keywords: ["tailor near me", "fashion designer ghana", "custom tailoring accra"],
  },
  "cobbler-shoe-repair": {
    name: "Cobbler & Shoe Repair",
    title: "Cobblers & Shoe Repair Services Near You",
    description: "Professional cobbler and shoe repair services to restore your favorite footwear.",
    keywords: ["cobbler near me", "shoe repair ghana", "shoemaker accra"],
  },
  "laundry-dry-cleaning": {
    name: "Laundry & Dry Cleaning",
    title: "Laundry & Dry Cleaning Services in Ghana",
    description: "Reliable laundry and dry cleaning services near your location. Drop off or request pickup.",
    keywords: ["laundry near me", "dry cleaning ghana", "laundry accra"],
  },
  "jewelry-goldsmithing": {
    name: "Jewelry Design & Goldsmithing",
    title: "Jewelry Design & Goldsmithing Near You",
    description: "Discover skilled goldsmiths and custom jewelry designers near your location.",
    keywords: ["goldsmith near me", "jewelry design ghana", "custom jewelry accra"],
  },

  // 5. Events & Media
  "photography": {
    name: "Photography",
    title: "Professional Photographers Near You in Ghana",
    description: "Book professional photographers for weddings, events, and portrait sessions.",
    keywords: ["photographer near me", "photography ghana", "wedding photographer accra"],
  },
  "videography": {
    name: "Videography",
    title: "Professional Videographers Near You in Ghana",
    description: "Find skilled videographers for event coverage, commercials, and cinematic shoots.",
    keywords: ["videographer near me", "videography ghana", "event video accra"],
  },
  "event-decor-planning": {
    name: "Event Decor & Planning",
    title: "Event Decor & Planning Services Near You",
    description: "Expert event planners and decorators for unforgettable weddings and parties.",
    keywords: ["event planner near me", "event decor ghana", "wedding planner accra"],
  },
  "catering": {
    name: "Catering",
    title: "Catering Services Near You in Ghana",
    description: "Top-rated catering services for your events, weddings, and corporate gatherings.",
    keywords: ["catering near me", "event catering ghana", "food catering accra"],
  },
  "mc-dj": {
    name: "MC & DJ Services",
    title: "MC & DJ Services Near You in Ghana",
    description: "Book energetic MCs and DJs near your location to keep your event alive.",
    keywords: ["dj near me", "mc services ghana", "event dj accra"],
  },
  "drone-pilot": {
    name: "Drone Pilot",
    title: "Certified Drone Pilots Near You in Ghana",
    description: "Hire certified drone pilots for aerial photography, real estate, and event coverage.",
    keywords: ["drone pilot near me", "aerial photography ghana", "drone coverage accra"],
  },

  // 6. Lifestyle & Education
  "home-tutoring": {
    name: "Home Tutoring",
    title: "Home Tutoring Services Near You in Ghana",
    description: "Find experienced home tutors for math, science, music, and exam preparations.",
    keywords: ["home tutor near me", "private tutor ghana", "tutoring accra"],
  },
  "nanny-childcare": {
    name: "Nanny & Childcare",
    title: "Nanny & Childcare Services Near You in Ghana",
    description: "Connect with verified nannies and trusted childcare professionals near your location.",
    keywords: ["nanny near me", "childcare services ghana", "babysitter accra"],
  },
  "fitness-yoga": {
    name: "Fitness Training & Yoga",
    title: "Fitness Training & Yoga Near You in Ghana",
    description: "Find certified personal trainers and yoga instructors for all fitness levels.",
    keywords: ["fitness trainer near me", "yoga instructor ghana", "personal training accra"],
  }
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
