import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/dashboard", "/onboarding", "/api/", "/login", "/signup"],
      },
    ],
    sitemap: "https://myportalgh.com/sitemap.xml",
  };
}
