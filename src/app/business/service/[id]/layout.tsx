import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, category, bio, location_address, cover_image_url, image_url, rating, review_count")
    .eq("id", id)
    .single();

  if (!business) {
    return {
      title: "Service Provider Not Found",
      description: "This service provider could not be found on Portal.",
    };
  }

  const title = `${business.name} — ${business.category || "Services"} in ${business.location_address || "Ghana"}`;
  const description = business.bio
    ? `${business.bio.substring(0, 150)}...`
    : `Book services with ${business.name}, a verified ${business.category || "service"} provider in ${business.location_address || "Ghana"}. View services, check reviews, and book appointments on Portal.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_GH",
      siteName: "Portal",
      ...(business.cover_image_url || business.image_url
        ? {
            images: [
              {
                url: business.cover_image_url || business.image_url,
                width: 1200,
                height: 630,
                alt: business.name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(business.cover_image_url || business.image_url
        ? { images: [business.cover_image_url || business.image_url] }
        : {}),
    },
    alternates: {
      canonical: `/business/service/${id}`,
    },
  };
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
