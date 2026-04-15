"use client";

import Navigation from "@/components/Navigation";
import { use } from "react";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Clock, ArrowLeft, CheckCircle, Share2, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import FavoriteButton from "@/components/FavoriteButton";

type Service = Database['public']['Tables']['services']['Row'] & {
    businesses: { id: string; name: string; location_address: string; image_url: string; rating: number } | null;
    profiles: { id: string; full_name: string; avatar_url: string } | null;
};

type Review = Database['public']['Tables']['reviews']['Row'] & {
    profiles: { full_name: string; avatar_url: string } | null;
};

function ServiceImageCarousel({ images, name }: { images: string[], name: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <div className="relative w-full h-full">
            {images.map((img, idx) => (
                <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentIndex ? "opacity-100" : "opacity-0"}`}
                >
                    <Image src={img} alt={`${name} - Image ${idx + 1}`} fill className="object-cover" />
                </div>
            ))}

            {/* Indicators */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ServiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supabase = createClient();

    const [service, setService] = useState<Service | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasLoggedView = useRef(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Service Details
                const { data: serviceData, error: serviceError } = await supabase
                    .from('services')
                    .select(`
                        *,
                        businesses (id, name, location_address, image_url, rating),
                        profiles (id, full_name, avatar_url)
                    `)
                    .eq('id', id)
                    .single();

                if (serviceError) throw serviceError;
                setService(serviceData as any);

                // Track View (Optimized: Deduplicate & Throttle)
                const lastViewKey = `view_timestamp_${id}`;
                const lastViewTime = localStorage.getItem(lastViewKey);
                const now = Date.now();
                const oneHour = 60 * 60 * 1000;

                // Only track if:
                // 1. Not already logged in this session component instance (Strict Mode fix)
                // 2. No view recorded for this service in the last hour (Spam prevention)
                if (!hasLoggedView.current && (!lastViewTime || now - parseInt(lastViewTime) > oneHour)) {
                    hasLoggedView.current = true;
                    // Update storage immediately to prevent race conditions
                    localStorage.setItem(lastViewKey, now.toString());

                    const { data: { user } } = await supabase.auth.getUser();
                    await supabase.from('service_views').insert({
                        service_id: id,
                        viewer_id: user?.id || null
                    });
                }

                // Fetch Reviews
                const { data: reviewsData, error: reviewsError } = await supabase
                    .from('reviews')
                    .select(`
                        *,
                        profiles (full_name, avatar_url)
                    `)
                    // Reviews can be for a business OR a profile, but typically matched via service?
                    // Schema doesn't link review directly to service, but to business OR profile.
                    // For now, if it's a business service, fetch business reviews? Or if profile service, fetch profile reviews?
                    // Ideally reviews should be linked to the booking or service directly, but schema puts them on entity.
                    // Let's filter by the entity ID of this service provider.
                    .limit(5);

                // Correction: Reviews schema has business_id and reviewed_profile_id.
                // We should fetch reviews where business_id = service.business_id OR reviewed_profile_id = service.profile_id

                if (serviceData) {
                    let reviewQuery = supabase.from('reviews').select(`*, profiles:profiles!user_id(full_name, avatar_url)`);

                    if (serviceData.business_id) {
                        reviewQuery = reviewQuery.eq('business_id', serviceData.business_id);
                    } else if (serviceData.profile_id) {
                        reviewQuery = reviewQuery.eq('reviewed_profile_id', serviceData.profile_id);
                    }

                    const { data: rData } = await reviewQuery.limit(10);
                    if (rData) setReviews(rData as any);
                }

            } catch (err: any) {
                console.error("Error fetching service:", err);
                setError("Service not found.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, supabase]);

    if (loading) {
        return (
            <main className="min-h-screen bg-background">
                <Navigation />
                <div className="h-screen flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
                        <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                    </div>
                </div>
            </main>
        );
    }

    if (!service) {
        return (
            <main className="min-h-screen bg-background">
                <Navigation />
                <div className="h-screen flex items-center justify-center flex-col gap-4">
                    <h1 className="text-2xl font-bold">Service Not Found</h1>
                    <Link href="/services" className="text-blue-600 hover:underline">Back to Services</Link>
                </div>
            </main>
        );
    }

    const providerName = service.businesses?.name || service.profiles?.full_name || "Unknown Provider";
    const providerImage = service.businesses?.image_url || service.profiles?.avatar_url;
    const providerLocation = service.businesses?.location_address || service.location_text || "Location available on booking";
    const providerRating = service.businesses?.rating || 5.0; // Default or calculate for individual
    const providerId = service.businesses?.id || service.profiles?.id;
    const isBusiness = !!service.businesses;

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-24 pb-20">
                <div className="container-wide px-6">
                    <Link href="/services" className="inline-flex items-center text-sm font-bold text-neutral-500 hover:text-black dark:hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Services
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                        {/* LEFT COLUMN: Service Info */}
                        <div className="lg:col-span-8">

                            {/* Hero Image / Carousel */}
                            <div className="relative aspect-[4/5] md:aspect-video w-full overflow-hidden rounded-3xl mb-8 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 group">
                                {service.images && service.images.length > 0 ? (
                                    <ServiceImageCarousel images={service.images} name={service.name} />
                                ) : service.image_url ? (
                                    <Image src={service.image_url} alt={service.name} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                        <span className="text-4xl font-bold opacity-20">{service.category}</span>
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 flex gap-3">
                                    <button className="p-3 bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-full shadow-lg hover:scale-105 transition-transform">
                                        <Share2 className="w-5 h-5 text-black dark:text-white" />
                                    </button>
                                    <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
                                        <FavoriteButton entityId={id} entityType="service" className="p-3 m-0" />
                                    </div>
                                </div>
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                                    <div>
                                        <span className="inline-block px-3 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-3">
                                            {service.category}
                                        </span>
                                        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">{service.name}</h1>
                                        <div className="flex items-center gap-6 text-sm text-neutral-500 font-medium">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                <span>{providerLocation}</span>
                                            </div>
                                            {service.duration_text && (
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{service.duration_text}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <Star className="w-4 h-4 fill-black dark:fill-white text-black dark:text-white" />
                                                <span className="text-black dark:text-white font-bold">{providerRating}</span>
                                                <span>({reviews.length})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left md:text-right">
                                        <div className="text-3xl font-bold">{service.price_currency} {service.price_amount}</div>
                                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1">Starting Price</p>
                                    </div>
                                </div>

                                <div className="h-px bg-neutral-100 dark:bg-neutral-900 mb-8" />

                                <div className="prose dark:prose-invert max-w-none mb-12">
                                    <h3 className="font-heading text-xl font-bold mb-4">About this service</h3>
                                    <p className="text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                        {service.description || "No description provided."}
                                    </p>
                                </div>

                                {/* Reviews Section */}
                                <div className="mb-12">
                                    <h3 className="font-heading text-2xl font-bold mb-6">Client Reviews</h3>
                                    {reviews.length > 0 ? (
                                        <div className="space-y-6">
                                            {reviews.map((review) => (
                                                <div key={review.id} className="bg-neutral-50 dark:bg-neutral-900/50 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden relative">
                                                                {/* Reviewer Avatar logic if available in simplified schema, else initial */}
                                                                {review.profiles?.avatar_url ? (
                                                                    <Image src={review.profiles.avatar_url} alt="Reviewer" fill className="object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs">{review.profiles?.full_name?.[0] || "U"}</div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-sm">{review.profiles?.full_name || "Anonymous User"}</div>
                                                                <div className="text-xs text-neutral-400">{new Date(review.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? "fill-black dark:fill-white text-black dark:text-white" : "text-neutral-300 dark:text-neutral-700"}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">"{review.comment}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-neutral-50 dark:bg-neutral-900/30 rounded-2xl text-neutral-500">
                                            No reviews yet. Be the first to book and review!
                                        </div>
                                    )}
                                </div>

                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN: Booking Card */}
                        <div className="lg:col-span-4 relative">
                            <div className="sticky top-28 space-y-6">

                                {/* Provider Card */}
                                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-xl overflow-hidden relative border border-neutral-200 dark:border-neutral-800">
                                            {providerImage ? (
                                                <Image src={providerImage} alt={providerName} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-neutral-300">{providerName[0]}</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">Provided By</div>
                                            <h3 className="font-heading font-bold text-lg leading-tight mb-1">{providerName}</h3>
                                            <div className="flex items-center gap-1 text-xs font-bold bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-md w-fit">
                                                <Star className="w-3 h-3 fill-black dark:fill-white" /> {providerRating}
                                            </div>
                                        </div>
                                    </div>

                                    <Link href={isBusiness ? `/business/store/${providerId}` : `/profile/${providerId}`}>
                                        <button className="w-full py-3 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                            View Provider Profile
                                        </button>
                                    </Link>
                                </div>

                                {/* Booking Actions */}
                                <div className="bg-black dark:bg-white text-white dark:text-black rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                    <h3 className="font-heading text-2xl font-bold mb-2">Ready to book?</h3>
                                    <p className="text-white/70 dark:text-black/70 mb-8 text-sm">Select a time that works for you.</p>

                                    <Link href={`/book/${id}`}>
                                        <button className="w-full bg-white dark:bg-black text-black dark:text-white py-4 rounded-xl font-bold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 mb-3">
                                            <Calendar className="w-4 h-4" /> REQUEST BOOKING
                                        </button>
                                    </Link>

                                    <p className="text-center text-[10px] text-white/50 dark:text-black/50 font-medium">
                                        {service.deposit_amount ? (
                                            `You will be charged a deposit of ${service.price_currency || 'GH₵'} ${service.deposit_amount} to confirm.`
                                        ) : (
                                            `Full amount of ${service.price_currency || 'GH₵'} ${service.price_amount} to be paid later.`
                                        )}
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                                    <CheckCircle className="w-3 h-3 text-green-500" /> Secure Payment via Paystack
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}
