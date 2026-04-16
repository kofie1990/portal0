import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, bio, location_text, avatar_url")
    .eq("id", id)
    .single();

  if (!profile) {
    return {
      title: "Profile Not Found",
      description: "This profile could not be found on Portal.",
    };
  }

  const name = profile.full_name || "Service Provider";
  const title = `${name} — ${profile.location_text || "Ghana"}`;
  const description = profile.bio
    ? `${profile.bio.substring(0, 150)}...`
    : `View ${name}'s profile on Portal. Browse services, read reviews, and book appointments in ${profile.location_text || "Ghana"}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      locale: "en_GH",
      siteName: "Portal",
      ...(profile.avatar_url
        ? {
            images: [
              {
                url: profile.avatar_url,
                width: 400,
                height: 400,
                alt: name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary",
      title,
      description,
      ...(profile.avatar_url ? { images: [profile.avatar_url] } : {}),
    },
    alternates: {
      canonical: `/profile/${id}`,
    },
  };
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
