"use client";

import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Package, User, MapPin, CreditCard, Settings, Plus, LogOut, LayoutGrid, List, Calendar, CheckCircle, Clock, Store, Tag, Edit2, ExternalLink, Camera } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import LocationAutocomplete from "@/components/LocationAutocomplete";

type Business = Database['public']['Tables']['businesses']['Row'];
type Service = Database['public']['Tables']['services']['Row'] & {
    businesses: { name: string } | null
};

export default function AccountPage() {
    const router = useRouter();
    const supabase = createClient();

    // Auth State
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    // UI State
    const [activeTab, setActiveTab] = useState("profile");
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Data State
    const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
    const [myListings, setMyListings] = useState<Service[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            if (activeTab === 'businesses') {
                const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id);
                if (data) setMyBusinesses(data);
            }

            if (activeTab === 'listings') {
                // Fetch services linked to me (profile_id) OR my businesses
                // 1. Get my business IDs first (if not already loaded, but safe to fetch again)
                const { data: bizData } = await supabase.from('businesses').select('id').eq('owner_id', user.id);
                const businessIds = bizData?.map(b => b.id) || [];

                // 2. Fetch services
                // Filter: profile_id = user.id OR business_id IN (myBusinessIds)
                let query = supabase
                    .from('services')
                    .select('*, businesses(name)');

                if (businessIds.length > 0) {
                    // Using 'or' syntax: "profile_id.eq.USER_ID,business_id.in.(ID1,ID2)"
                    query = query.or(`profile_id.eq.${user.id},business_id.in.(${businessIds.join(',')})`);
                } else {
                    // No businesses, so only individual listings
                    query = query.eq('profile_id', user.id);
                }

                const { data: serviceData, error } = await query;

                if (error) console.error("Error fetching listings:", error);
                if (serviceData) setMyListings(serviceData as any);
            }
        };

        fetchData();
    }, [activeTab, user, supabase]);

    // Fetch User on Mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                router.push("/login?redirect=/account");
                return;
            }

            setUser(user);

            // Fetch Profile Details
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            setProfile(profileData);
            setIsLoading(false);
        };

        getUser();
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/login");
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background text-foreground font-sans">
                <Navigation />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-full"></div>
                        <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <div className="pt-24 min-h-screen flex items-center justify-center p-6 bg-neutral-50/50 dark:bg-neutral-950/50">

                <AnimatePresence mode="wait">
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-5xl"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {/* Sidebar */}
                            <div className="md:col-span-1 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 h-fit">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden">
                                        {profile?.avatar_url ? (
                                            <Image src={profile.avatar_url} alt="Profile" width={48} height={48} className="object-cover w-full h-full" />
                                        ) : (
                                            user?.email?.[0].toUpperCase() || "U"
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h2 className="font-heading font-bold text-base truncate">{profile?.full_name || "User"}</h2>
                                        <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <nav className="space-y-1">
                                    <button
                                        onClick={() => setActiveTab("profile")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "profile" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <User className="w-4 h-4" /> Profile
                                    </button>
                                    <div className="pt-4 pb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider px-4">Manage</div>
                                    <button
                                        onClick={() => setActiveTab("businesses")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "businesses" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <Store className="w-4 h-4" /> My Businesses
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("listings")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "listings" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <Tag className="w-4 h-4" /> My Listings
                                    </button>
                                    <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-4" />
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-medium text-sm transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" /> Sign Out
                                    </button>
                                </nav>
                            </div>

                            {/* Content Area */}
                            <div className="md:col-span-3 space-y-6">

                                {activeTab === "profile" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                        {isEditingProfile ? (
                                            <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
                                                <div className="flex items-center justify-between mb-8">
                                                    <h3 className="font-heading text-2xl font-bold">Edit Profile</h3>
                                                    <button
                                                        onClick={() => setIsEditingProfile(false)}
                                                        className="text-sm font-bold text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>

                                                <form onSubmit={(e) => { e.preventDefault(); setIsEditingProfile(false); }} className="space-y-6">
                                                    {/* NOTE: Real profile update logic would go here, for now just UI switch back */}

                                                    <div className="flex flex-col items-center mb-8">
                                                        <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center relative group cursor-pointer overflow-hidden">
                                                            {profile?.avatar_url ? (
                                                                <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
                                                            ) : (
                                                                <span className="text-2xl font-bold text-neutral-400">{user?.email?.[0].toUpperCase()}</span>
                                                            )}
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                                                                <Camera className="w-6 h-6 text-white" />
                                                            </div>
                                                        </div>
                                                        <button className="mt-3 text-sm font-bold text-blue-600 hover:underline">Change Photo</button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Full Name</label>
                                                            <input
                                                                type="text"
                                                                defaultValue={profile?.full_name || ""}
                                                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-black dark:focus:border-white transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Email</label>
                                                            <input
                                                                type="email"
                                                                disabled
                                                                defaultValue={user?.email || ""}
                                                                className="w-full bg-neutral-100 dark:bg-neutral-800 border-none text-neutral-500 rounded-xl px-4 py-3 cursor-not-allowed"
                                                            />
                                                        </div>
                                                        <div className="space-y-2 col-span-1 md:col-span-2">
                                                            <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Location</label>
                                                            <LocationAutocomplete
                                                                initialValue={profile?.location_text || ""}
                                                                onSelect={(loc) => {
                                                                    // Update profile state locally or handle update
                                                                    setProfile((prev: any) => ({
                                                                        ...prev,
                                                                        location_text: loc.address,
                                                                        lat: loc.lat,
                                                                        lng: loc.lng
                                                                    }));
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsEditingProfile(false)}
                                                            className="px-6 py-3 rounded-xl font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-6 py-3 rounded-xl font-bold bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors"
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 mb-6 relative overflow-hidden">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h3 className="font-heading text-2xl font-bold mb-1">Welcome Back, {profile?.full_name?.split(' ')[0] || "User"}.</h3>
                                                            <p className="text-neutral-500 text-sm">Here's a quick overview of your activity.</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setIsEditingProfile(true)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-sm font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" /> Edit Profile
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                                            <span className="text-orange-600 font-bold text-2xl block mb-1">2</span>
                                                            <span className="text-xs font-bold tracking-wider text-orange-600/70 uppercase">Upcoming Bookings</span>
                                                        </div>
                                                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                                            <span className="text-blue-600 font-bold text-2xl block mb-1">5</span>
                                                            <span className="text-xs font-bold tracking-wider text-blue-600/70 uppercase">Favorite Providers</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
                                                    <h4 className="font-bold mb-4">Recent Activity</h4>
                                                    <div className="space-y-4">
                                                        {[
                                                            { id: "BK-802", service: "Private Shopping Session", vendor: "The Atelier", date: "Jan 15, 2:00 PM", status: "Confirmed", price: "Free" },
                                                            { id: "BK-755", service: "Signature Haircut", vendor: "Kwame The Barber", date: "Jan 03, 10:00 AM", status: "Completed", price: "GH₵ 150" },
                                                            { id: "BK-621", service: "Interior Styling", vendor: "The Atelier", date: "Dec 12, 11:30 AM", status: "Completed", price: "GH₵ 500" }
                                                        ].map((booking) => (
                                                            <div key={booking.id} className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-900 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors rounded-lg px-2 -mx-2">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${booking.status === 'Confirmed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-900'}`}>
                                                                        {booking.status === 'Confirmed' ? <Calendar className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-sm">{booking.service}</p>
                                                                        <p className="text-xs text-neutral-500 mb-0.5">at {booking.vendor}</p>
                                                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                                                            <Clock className="w-3 h-3" /> {booking.date}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block text-sm font-bold mb-1">{booking.price}</span>
                                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${booking.status === 'Confirmed'
                                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                                                                        }`}>
                                                                        {booking.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}


                                {activeTab === "businesses" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-heading text-2xl font-bold">My Businesses</h3>
                                            <Link href="/signup/business">
                                                <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90">
                                                    <Plus className="w-4 h-4" /> Add New
                                                </button>
                                            </Link>
                                        </div>

                                        {myBusinesses.length === 0 ? (
                                            <div className="text-center py-12 text-neutral-500">
                                                <p>You haven't listed any businesses yet.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {myBusinesses.map((business) => (
                                                    <div key={business.id} className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                                                        <div className="w-20 h-20 bg-neutral-200 rounded-xl relative overflow-hidden flex-shrink-0">
                                                            {business.image_url ? (
                                                                <Image src={business.image_url} alt={business.name} fill className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-2xl font-bold text-neutral-300">
                                                                    {business.name[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 text-center md:text-left">
                                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                                                <h4 className="font-heading font-bold text-xl">{business.name}</h4>
                                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Active</span>
                                                            </div>
                                                            <p className="text-sm text-neutral-500 mb-3">{business.category} • {business.location_address}</p>
                                                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                                                <Link href={`/dashboard/${business.id}`}>
                                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                                                        <Settings className="w-3 h-3" /> Dashboard
                                                                    </button>
                                                                </Link>
                                                                <Link href={`/business/service/${business.id}`}>
                                                                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                                                        <ExternalLink className="w-3 h-3" /> View Live
                                                                    </button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        <div className="text-center md:text-right p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl min-w-[120px]">
                                                            <span className="block text-2xl font-bold">{business.rating || 0}</span>
                                                            <span className="text-xs text-neutral-500">Avg Rating</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === "listings" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-heading text-2xl font-bold">My Listings</h3>
                                            <Link href="/list">
                                                <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90">
                                                    <Plus className="w-4 h-4" /> Create Listing
                                                </button>
                                            </Link>
                                        </div>

                                        <div className="space-y-4">
                                            {myListings.length === 0 ? (
                                                <div className="text-center py-12 text-neutral-500">
                                                    <p>You haven't listed any services yet.</p>
                                                </div>
                                            ) : (
                                                myListings.map((service) => (
                                                    <div key={service.id} className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-4">
                                                        <div className="w-16 h-16 bg-neutral-200 rounded-lg relative overflow-hidden flex-shrink-0">
                                                            {service.image_url ? (
                                                                <Image src={service.image_url} alt={service.name} fill className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 text-neutral-300">
                                                                    <Tag className="w-6 h-6" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold">{service.name}</h4>
                                                            <p className="text-sm text-neutral-500">{service.category || "General"} • {service.price_currency || "GH₵"} {service.price_amount}</p>
                                                            <p className="text-xs text-neutral-400 mt-1">
                                                                Listed under <span className="font-bold text-foreground">{service.businesses?.name || "Individual"}</span>
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Link href={`/list?mode=edit&id=${service.id}`} className="p-2 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500">
                                                                <Edit2 className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </main>
    );
}
