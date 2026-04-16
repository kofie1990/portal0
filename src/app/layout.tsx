import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Portal | Find & Book Local Services Near You in Ghana",
    template: "%s | Portal",
  },
  description:
    "Portal is Ghana's premier platform for finding and booking local service providers near you. Discover lash techs, hair stylists, makeup artists, barbers, and more. Browse verified providers, compare prices, and book appointments instantly.",
  keywords: [
    "services near me",
    "ghana services",
    "book appointment ghana",
    "lash tech near me",
    "hair stylist near me",
    "makeup artist near me",
    "barber near me",
    "nail tech near me",
    "local services accra",
    "beauty services ghana",
    "portal ghana",
  ],
  metadataBase: new URL("https://myportalgh.com"),
  openGraph: {
    type: "website",
    locale: "en_GH",
    siteName: "Portal",
    title: "Portal | Find & Book Local Services Near You in Ghana",
    description:
      "Ghana's premier platform for finding and booking local service providers. Discover lash techs, hair stylists, makeup artists, and more near you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal | Find & Book Local Services Near You in Ghana",
    description:
      "Ghana's premier platform for finding and booking local service providers near you.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  other: {
    "geo.region": "GH",
    "geo.placename": "Accra",
    "geo.position": "5.5600;-0.2057",
    ICBM: "5.5600, -0.2057",
  },
};

import SmoothScroll from "@/components/SmoothScroll";
import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${inter.variable} antialiased`}
      >
        {/* Site-wide WebSite schema for Google Sitelinks Search Box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Portal",
              url: "https://myportalgh.com",
              description: "Ghana's premier platform for finding and booking local service providers near you.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://myportalgh.com/?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <ToastProvider>
          <SmoothScroll>
            {children}
          </SmoothScroll>
        </ToastProvider>
      </body>
    </html>
  );
}
