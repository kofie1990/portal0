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
      url: `${baseUrl}/businesses`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Category landing pages (high priority for "near me" searches)
  const categories = [
    "lash-tech",
    "hair-stylist",
    "makeup-artist",
    "nail-tech",
    "barber",
    "fashion",
    "food",
    "services",
    "tech",
    "art",
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
