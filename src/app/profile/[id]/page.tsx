"use client";

import { useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { ArrowLeft, User, MapPin, ShoppingBag, Star, Mail, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const params = useParams();
    const supabase = createClient();
    const [profile, setProfile] = useState<any | null>(null);
    const [services, setServices] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', params.id)
                    .single();

                if (profileError) throw profileError;

                // Fetch User's Services (Individual listings)
                const { data: servicesData } = await supabase
                    .from('services')
                    .select('*')
                    .eq('profile_id', params.id);

                // Fetch Reviews
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('*, profiles:user_id(full_name, avatar_url)')
                    .eq('reviewed_profile_id', params.id)
                    .limit(10);

                setProfile(profileData);
                if (servicesData) setServices(servicesData);
                if (reviewsData) setReviews(reviewsData);

            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchProfile();
        }
    }, [params.id]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-2 border-neutral-200 dark:border-neutral-800 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                    <div className="animate-pulse h-4 w-32 bg-neutral-100 dark:bg-neutral-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-heading font-bold mb-4">User Not Found</h1>
                <Link href="/" className="text-neutral-500 hover:text-black dark:hover:text-white underline transition-colors">Return to Home</Link>
            </div>
        );
    }

    // RENDER INDIVIDUAL PROFILE
    return (
        <main className="min-h-screen bg-background text-foreground font-sans selection:bg-neutral-200 dark:selection:bg-neutral-800">
            {/* JSON-LD Structured Data for Google SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Person",
                        name: profile.full_name || "Service Provider",
                        description: profile.bio || `Service provider in Ghana`,
                        ...(profile.location_text
                            ? {
                                address: {
                                    "@type": "PostalAddress",
                                    addressLocality: profile.location_text,
                                    addressCountry: "GH",
                                },
                            }
                            : {}),
                        ...(profile.avatar_url ? { image: profile.avatar_url } : {}),
                        url: `https://myportalgh.com/profile/${params.id}`,
                        ...(services.length > 0
                            ? {
                                makesOffer: services.map((s: any) => ({
                                    "@type": "Offer",
                                    itemOffered: {
                                        "@type": "Service",
                                        name: s.name,
                                        description: s.description || s.name,
                                    },
                                    price: s.price_amount,
                                    priceCurrency: s.price_currency || "GHS",
                                })),
                            }
                            : {}),
                    }),
                }}
            />
            <Navigation />

            <div className="relative">
                {/* Decorative Background Element */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-neutral-50 to-transparent dark:from-neutral-900/50 pointer-events-none -z-10" />

                <div className="pt-28 container-wide max-w-5xl mx-auto px-4 sm:px-6 pb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-12"
                    >
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black dark:hover:text-white transition-colors group">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Map
                        </Link>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 lg:grid-cols-12 gap-12"
                    >
                        {/* Left Column: Profile Info */}
                        <motion.div variants={itemVariants} className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
                            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                                <div className="relative mb-6 group">
                                    <div className="w-40 h-40 rounded-full overflow-hidden border-[6px] border-white dark:border-black shadow-2xl bg-neutral-100 dark:bg-neutral-900 relative z-10">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
                                                <User className="w-16 h-16 text-neutral-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/5 rounded-full blur-xl transform translate-y-4 -z-10 dark:bg-white/5"></div>
                                </div>

                                <h1 className="font-heading text-4xl font-bold mb-2 tracking-tight">{profile.full_name || "Unnamed User"}</h1>

                                <div className="flex flex-col items-center lg:items-start gap-2 mb-8">
                                    <p className="text-sm text-neutral-500 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-neutral-400" /> {profile.location_text || "Location not set"}
                                    </p>
                                    <div className="flex gap-1 text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-current" />
                                        ))}
                                    </div>
                                </div>

                                <blockquote className="text-neutral-600 dark:text-neutral-300 text-lg leading-relaxed mb-8 font-light italic border-l-2 border-neutral-200 dark:border-neutral-800 pl-4">
                                    "{profile.bio || "No bio provided."}"
                                </blockquote>

                                <div className="w-full space-y-3">
                                    {profile.phone && (
                                        <a href={`tel:${profile.phone}`} className="flex items-center justify-center gap-3 w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-black/5 dark:shadow-white/5">
                                            <Phone className="w-4 h-4" /> Contact User
                                        </a>
                                    )}
                                    <button className="flex items-center justify-center gap-3 w-full py-4 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-black dark:text-white rounded-xl font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                        <Mail className="w-4 h-4" /> Send Message
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column: Listings & Reviews */}
                        <div className="lg:col-span-8 space-y-16">

                            {/* Listings Segment */}
                            <motion.div variants={itemVariants}>
                                <div className="flex items-end justify-between mb-8 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                    <h3 className="font-heading text-2xl font-bold">User Listings</h3>
                                    <span className="text-sm text-neutral-400 font-mono">{services.length} ITEMS</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {services.length > 0 ? services.map((item, idx) => (
                                        <Link key={item.id} href={`/service/${item.id}`} className="group block h-full">
                                            <article className="h-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-1 flex flex-col">
                                                <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <ShoppingBag className="w-8 h-8 text-neutral-300" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                                        {item.price_currency} {item.price_amount}
                                                    </div>
                                                </div>
                                                <div className="p-5 flex flex-col flex-grow">
                                                    <h4 className="font-bold text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.name}</h4>
                                                    <p className="text-sm text-neutral-500 line-clamp-2 mb-4 flex-grow">{item.description || "No description available."}</p>
                                                    <div className="flex items-center text-xs font-medium text-neutral-400 pt-4 border-t border-neutral-100 dark:border-neutral-800 mt-auto">
                                                        View Details <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                                                    </div>
                                                </div>
                                            </article>
                                        </Link>
                                    )) : (
                                        <div className="col-span-full py-12 text-center bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                            <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                            <p className="text-neutral-500">No active listings allowed.</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Reviews Segment */}
                            <motion.div variants={itemVariants}>
                                <div className="flex items-end justify-between mb-8 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                    <h3 className="font-heading text-2xl font-bold">Client Reviews</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex text-yellow-500">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="w-4 h-4 fill-current" />
                                            ))}
                                        </div>
                                        <span className="text-sm text-neutral-400 font-mono">({reviews.length})</span>
                                    </div>
                                </div>

                                {reviews.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {reviews.map((review, i) => (
                                            <div key={review.id} className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 sm:gap-6">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 overflow-hidden shadow-sm">
                                                        {review.profiles?.avatar_url ? (
                                                            <img src={review.profiles.avatar_url} alt="Reviewer" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold bg-neutral-100 dark:bg-neutral-700">
                                                                {review.profiles?.full_name?.[0] || "?"}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                                                        <h5 className="font-bold text-sm">{review.profiles?.full_name || "Anonymous Client"}</h5>
                                                        <span className="text-xs text-neutral-400">{new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                    </div>
                                                    <div className="flex text-yellow-500 mb-3 w-fit">
                                                        {[...Array(5)].map((_, starI) => (
                                                            <Star key={starI} className={`w-3 h-3 ${starI < (review.rating || 0) ? "fill-current" : "text-neutral-300 dark:text-neutral-700"}`} />
                                                        ))}
                                                    </div>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">"{review.comment}"</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                        <Star className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                                        <p className="text-neutral-500">No reviews have been received yet.</p>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );


}
