import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const baseUrl = "https://myportalgh.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/businesses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/signup/business`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Category landing pages (high priority for "near me" searches)
  const categories = [
    // Beauty
    "hair-braiding", "barbering", "makeup-artistry", "nail-tech-pedicure", "spa-massage", "skin-consultation", "tattoo", "lash-tech",
    // Home & Technical
    "plumbing", "electrical-engineering", "ac-refrigeration", "solar-panel", "carpentry-furniture", "painting-wallpapering", "security-cctv", "fumigation-pest",
    // Auto
    "mechanic", "auto-electrician", "car-detailing-wash", "vulcanizing", "ev-specialist",
    // Fashion & Craftsmanship
    "tailoring-fashion", "cobbler-shoe-repair", "laundry-dry-cleaning", "jewelry-goldsmithing",
    // Events
    "photography", "videography", "event-decor-planning", "catering", "mc-dj", "drone-pilot",
    // Lifestyle
    "home-tutoring", "nanny-childcare", "fitness-yoga"
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/s/${cat}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Dynamic business pages
  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, location_type, updated_at");

  const businessPages: MetadataRoute.Sitemap = (businesses || []).map((b: any) => ({
    url: `${baseUrl}/business/${b.location_type === "physical" ? "store" : "service"}/${b.id}`,
    lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic profile pages
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, updated_at");

  const profilePages: MetadataRoute.Sitemap = (profiles || []).map((p: any) => ({
    url: `${baseUrl}/profile/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic service pages
  const { data: services } = await supabase
    .from("services")
    .select("id, updated_at");

  const servicePages: MetadataRoute.Sitemap = (services || []).map((s: any) => ({
    url: `${baseUrl}/service/${s.id}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...businessPages, ...profilePages, ...servicePages];
}
