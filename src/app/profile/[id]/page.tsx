"use client";

import { useParams } from "next/navigation";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import { ArrowLeft, User, MapPin, ShoppingBag, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
                    <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
                <Link href="/" className="text-blue-500 hover:underline">Go Home</Link>
            </div>
        );
    }

    // RENDER INDIVIDUAL PROFILE
    return (
        <main className="min-h-screen bg-background text-foreground font-sans pb-20">
            <Navigation />
            <div className="pt-24 container-wide max-w-2xl mx-auto px-4">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-foreground mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Map
                </Link>
                <div className="flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6 bg-neutral-100 relative">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300">
                                <User className="w-12 h-12 text-neutral-400" />
                            </div>
                        )}
                    </div>
                    <h1 className="font-heading text-3xl font-bold mb-2">{profile.full_name || "Unnamed User"}</h1>
                    <p className="text-sm text-neutral-500 mb-6 flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> {profile.location_text || "Location not set"}
                    </p>
                    <div className="max-w-lg mx-auto text-neutral-600 mb-8 leading-relaxed">
                        "{profile.bio || "No bio provided."}"
                    </div>
                    <div className="flex gap-4 mb-12">
                        {profile.phone && (
                            <a href={`tel:${profile.phone}`} className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm hover:scale-105 transition-transform">
                                Contact User
                            </a>
                        )}
                    </div>

                    <div className="w-full text-left space-y-12">
                        {/* Listings */}
                        <div>
                            <h3 className="font-heading text-xl font-bold mb-4 border-b pb-2 border-neutral-200">User Listings</h3>
                            <div className="space-y-3">
                                {services.length > 0 ? services.map((item, idx) => (
                                    <Link key={item.id} href={`/service/${item.id}`} className="block">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="w-5 h-5 text-neutral-400" />
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-sm">{item.name}</h4>
                                                    <p className="text-xs text-neutral-400">{item.price_currency} {item.price_amount}</p>
                                                </div>
                                            </div>
                                            <button className="text-xs font-bold text-neutral-900 dark:text-neutral-100 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                                                View
                                            </button>
                                        </div>
                                    </Link>
                                )) : (
                                    <p className="text-neutral-500 text-sm">No active listings.</p>
                                )}
                            </div>
                        </div>

                        {/* Reviews */}
                        <div>
                            <h3 className="font-heading text-xl font-bold mb-4 border-b pb-2 border-neutral-200">Reviews</h3>
                            {reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-neutral-200 overflow-hidden">
                                                        {review.profiles?.avatar_url ? (
                                                            <img src={review.profiles.avatar_url} alt="Reviewer" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">{review.profiles?.full_name?.[0] || "?"}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">{review.profiles?.full_name || "Anonymous"}</p>
                                                        <p className="text-[10px] text-neutral-400">{new Date(review.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} className={`w-3 h-3 ${i < (review.rating || 0) ? "fill-black dark:fill-white text-black dark:text-white" : "text-neutral-300"}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-neutral-500 text-sm">No reviews yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );


}
