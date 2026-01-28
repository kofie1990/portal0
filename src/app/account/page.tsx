"use client";

import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Package, User, MapPin, CreditCard, Settings, Plus, LogOut, LayoutGrid, List, Calendar, CheckCircle, Clock, Store, Tag, Edit2, Edit3, ExternalLink, Camera, Bell, BarChart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import NotificationsSheet from "@/components/NotificationsSheet";
import CalendarView from "@/components/CalendarView";
import { confirmBooking } from "@/app/actions/booking";

type Business = Database['public']['Tables']['businesses']['Row'];
type Service = Database['public']['Tables']['services']['Row'] & {
    businesses: { name: string } | null
};
type Booking = Database['public']['Tables']['bookings']['Row'] & {
    services: { name: string; price_amount: number; price_currency: string } | null;
    businesses: { name: string } | null;
    profiles: { full_name: string; avatar_url: string | null } | null;
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
    const [myBookings, setMyBookings] = useState<Booking[]>([]); // Added
    const [providerBookings, setProviderBookings] = useState<Booking[]>([]); // Added for calendar
    const [notifications, setNotifications] = useState<Booking[]>([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            if (activeTab === 'businesses') {
                const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id);
                if (data) setMyBusinesses(data);
            }

            if (activeTab === 'listings') {
                // ... (Existing Listings Logic)
                const { data: bizData } = await supabase.from('businesses').select('id').eq('owner_id', user.id);
                const businessIds = bizData?.map(b => b.id) || [];

                let query = supabase
                    .from('services')
                    .select('*, businesses(name)');

                if (businessIds.length > 0) {
                    query = query.or(`profile_id.eq.${user.id},business_id.in.(${businessIds.join(',')})`);
                } else {
                    query = query.eq('profile_id', user.id);
                }

                const { data: serviceData, error } = await query;
                if (serviceData) setMyListings(serviceData as any);
            }

            if (activeTab === 'bookings') {
                const { data: bookingsData, error } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        services (name, price_amount, price_currency),
                        businesses (name),
                        profiles:profiles!provider_id (full_name, avatar_url)
                    `)
                    .eq('user_id', user.id)
                    .order('booking_date', { ascending: false });

                if (error) console.error("Error fetching bookings:", error);
                if (bookingsData) setMyBookings(bookingsData as any);
            }

            if (activeTab === 'calendar') {
                // Fetch My Bookings (As Customer)
                const { data: myBookingsData } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        services (name, price_amount, price_currency),
                        businesses (name),
                        profiles:profiles!provider_id (full_name, avatar_url)
                    `)
                    .eq('user_id', user.id)
                    .neq('status', 'cancelled');

                // Fetch Provider Bookings (As Service Provider)
                // 1. Get my businesses IDs first
                const { data: bizData } = await supabase.from('businesses').select('id').eq('owner_id', user.id);
                const businessIds = bizData?.map(b => b.id) || [];

                let providerQuery = supabase
                    .from('bookings')
                    .select(`
                        *,
                        services (name, price_amount, price_currency),
                        businesses (name),
                        profiles:profiles!user_id (full_name, avatar_url)
                    `)
                    .neq('status', 'cancelled');

                if (businessIds.length > 0) {
                    providerQuery = providerQuery.or(`provider_id.eq.${user.id},business_id.in.(${businessIds.join(',')})`);
                } else {
                    providerQuery = providerQuery.eq('provider_id', user.id);
                }

                const { data: providerBookingsData } = await providerQuery;

                if (myBookingsData) setMyBookings(myBookingsData as any);
                if (providerBookingsData) setProviderBookings(providerBookingsData as any);
            }
        };

        const fetchNotifications = async () => {
            if (!user) return;

            // 1. Get my businesses
            const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id);
            const businessIds = businesses?.map(b => b.id) || [];

            // 2. Fetch Provider Notifications (Bookings for my services needing action)
            // Assuming 'pending_payment' or just created bookings are "new"
            let providerQuery = supabase
                .from('bookings')
                .select(`
                    *,
                    services (name, price_amount, price_currency),
                    businesses (name),
                    profiles:profiles!user_id (full_name)
                `)
                .neq('status', 'cancelled'); // Get active ones

            if (businessIds.length > 0) {
                providerQuery = providerQuery.or(`provider_id.eq.${user.id},business_id.in.(${businessIds.join(',')})`);
            } else {
                providerQuery = providerQuery.eq('provider_id', user.id);
            }

            const { data: providerData } = await providerQuery;

            // Filter locally for now for "Actionable" or "New"
            // For now, let's show ALL pending/confirmed to the provider as "Inbox"
            const providerNotifications = providerData || [];

            // 3. Fetch Customer Notifications (Updates on my bookings)
            // Mostly just show recent confirmations?
            const { data: customerData } = await supabase
                .from('bookings')
                .select(`
                    *,
                    services (name, price_amount, price_currency),
                    businesses (name),
                    profiles:profiles!provider_id (full_name)
                `)
                .eq('user_id', user.id)
                .eq('status', 'confirmed') // Only show confirmed updates for now
                .order('created_at', { ascending: false, nullsFirst: false }) // valid order provided updated_at exists, schema says it does
                .limit(5);

            // Merge and deduplicate if necessary (unlikely to overlap ID unless self-booking)
            const allNotifs = [...providerNotifications, ...(customerData || [])].filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

            // Sort by date desc
            allNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setNotifications(allNotifs as any);
        };

        fetchData();
        fetchNotifications();
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

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const fullName = formData.get("fullName") as string;

        // Optimistic update
        setProfile((prev: any) => ({ ...prev, full_name: fullName }));
        setIsEditingProfile(false);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                location_text: profile.location_text,
                lat: profile.lat,
                lng: profile.lng
            })
            .eq('id', user.id);

        if (error) console.error("Error updating profile", error);
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;

        // Optimistic update
        setMyBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
        setNotifications(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));

        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (error) {
            console.error("Error cancelling booking", error);
            // Revert optimistic update ideally, but simplified for now
        }
    };

    const handleConfirmBooking = async (bookingId: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'confirmed' } : b));

        const result = await confirmBooking(bookingId);

        if (result.error) {
            console.error("Error confirming booking", result.error);
            alert("Failed to confirm booking: " + result.error);
            // Revert optimistic update?
        }
    };

    const handlePostponeBooking = async (bookingId: string) => {
        const newDate = prompt("Enter a proposed new date/time (e.g. 'Tomorrow at 2pm'):");
        if (!newDate) return;

        // Just updating notes for now as a simple implementation of "Request Postpone"
        let { error } = await supabase.rpc('append_booking_note', {
            booking_id: bookingId,
            note: `Postpone Requested: ${newDate}`
        });

        if (error) {
            // Fallback if RPC doesn't exist or fails
            const { data } = await supabase.from('bookings').select('notes').eq('id', bookingId).single();
            const updateResult = await supabase.from('bookings').update({
                notes: (data?.notes || "") + `\n[Postpone Requested: ${newDate}]`
            }).eq('id', bookingId);

            // If fallback succeeded, clear the error
            if (!updateResult.error) {
                error = null;
            } else {
                error = updateResult.error;
            }
        }

        if (!error) {
            alert("Postpone request added to booking notes.");
        } else {
            console.error("Error requesting postpone", error);
        }
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
                                    <button
                                        onClick={() => setActiveTab("bookings")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "bookings" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <List className="w-4 h-4" /> My Bookings
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("calendar")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "calendar" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <Calendar className="w-4 h-4" /> Calendar
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

                                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                                    {/* Profile Update Form */}
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
                                                                name="fullName"
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
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => setIsNotificationsOpen(true)}
                                                                className="relative p-2 bg-neutral-100 dark:bg-neutral-900 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                                            >
                                                                <Bell className="w-5 h-5" />
                                                                {notifications.some(n => n.status !== 'confirmed' && n.status !== 'cancelled' && n.user_id !== user?.id) && (
                                                                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => setIsEditingProfile(true)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg text-sm font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                                            >
                                                                <Edit2 className="w-4 h-4" /> Edit Profile
                                                            </button>
                                                        </div>
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
                                                    <h4 className="font-bold mb-4">Recent Bookings</h4>
                                                    <div className="space-y-4">
                                                        {myBookings.length > 0 ? myBookings.slice(0, 3).map((booking) => (
                                                            <div key={booking.id} className="flex items-center justify-between py-4 border-b border-neutral-100 dark:border-neutral-900 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors rounded-lg px-2 -mx-2">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${booking.status === 'confirmed' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-900'}`}>
                                                                        {booking.status === 'confirmed' ? <Calendar className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-sm">{booking.services?.name}</p>
                                                                        <p className="text-xs text-neutral-500 mb-0.5">at {booking.businesses?.name || booking.profiles?.full_name}</p>
                                                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                                                            <Clock className="w-3 h-3" /> {new Date(booking.booking_date).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block text-sm font-bold mb-1">{booking.services?.price_currency} {booking.services?.price_amount}</span>
                                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${booking.status === 'confirmed'
                                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                                                                        }`}>
                                                                        {booking.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div className="text-center py-4 text-neutral-400 text-sm">No recent activity.</div>
                                                        )}
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
                                                                <Link href={business.location_type === 'physical' ? `/business/store/${business.id}` : `/business/service/${business.id}`}>
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
                                                            <Link href={`/account/listings/${service.id}/analytics`}>
                                                                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors relative z-20" title="Analytics">
                                                                    <BarChart className="w-4 h-4 text-neutral-500 hover:text-black dark:hover:text-white" />
                                                                </button>
                                                            </Link>
                                                            <Link href={`/service/edit/${service.id}`}>
                                                                <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors relative z-20" title="Edit">
                                                                    <Edit3 className="w-4 h-4 text-neutral-500 hover:text-black dark:hover:text-white" />
                                                                </button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "bookings" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-heading text-2xl font-bold">My Bookings</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {myBookings.length === 0 ? (
                                                <div className="text-center py-12 text-neutral-500">
                                                    <p>You haven't made any bookings yet.</p>
                                                    <Link href="/">
                                                        <button className="mt-4 px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold text-sm">Browse Services</button>
                                                    </Link>
                                                </div>
                                            ) : (
                                                myBookings.map((booking) => (
                                                    <div key={booking.id} className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                                                        {/* Header: Date & Status */}
                                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-900 leading-none">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                    }`}>
                                                                    {booking.status}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Main Content */}
                                                        <div className="flex items-start gap-4">
                                                            {/* Provider Avatar */}
                                                            <div className="flex-shrink-0">
                                                                <div className="w-14 h-14 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden border-2 border-white dark:border-neutral-900 shadow-sm relative">
                                                                    {booking.profiles?.avatar_url ? (
                                                                        <Image
                                                                            src={booking.profiles.avatar_url}
                                                                            alt={booking.profiles.full_name || "Provider"}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-neutral-400">
                                                                            {(booking.businesses?.name?.[0] || booking.profiles?.full_name?.[0] || "P").toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-heading font-bold text-lg leading-tight mb-1 truncate">
                                                                    {booking.services?.name}
                                                                </h4>
                                                                <p className="text-sm text-neutral-500 truncate mb-3">
                                                                    Provided by <span className="font-bold text-foreground">{booking.businesses?.name || booking.profiles?.full_name}</span>
                                                                </p>

                                                                {/* Prominent Date & Time */}
                                                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                                                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-lg">
                                                                        <Calendar className="w-4 h-4 text-neutral-500" />
                                                                        <span className="font-bold text-sm text-foreground">
                                                                            {new Date(booking.booking_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-lg">
                                                                        <Clock className="w-4 h-4 text-neutral-500" />
                                                                        <span className="font-bold text-sm text-foreground">
                                                                            {new Date(booking.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-lg font-bold text-black dark:text-white">
                                                                        {booking.services?.price_currency} {booking.services?.price_amount}
                                                                    </span>
                                                                    {booking.amount_paid && booking.amount_paid > 0 && (
                                                                        <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">
                                                                            Paid {booking.services?.price_currency} {booking.amount_paid}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="mt-5 grid grid-cols-2 gap-3">
                                                            {booking.status !== 'cancelled' && booking.status !== 'completed' ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleCancelBooking(booking.id)}
                                                                        className="px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/10 dark:hover:text-red-400 dark:hover:border-red-900/30 transition-all"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <Link href={`/account/bookings/${booking.id}`}>
                                                                        <button className="px-4 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
                                                                            View Details
                                                                        </button>
                                                                    </Link>
                                                                </>
                                                            ) : (
                                                                <Link href={`/account/bookings/${booking.id}`} className="col-span-2">
                                                                    <button className="w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 rounded-xl text-sm font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                                                                        View Details
                                                                    </button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "calendar" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-heading text-2xl font-bold">Calendar</h3>
                                        </div>
                                        <CalendarView
                                            bookings={[...myBookings, ...providerBookings]}
                                            currentUserId={user?.id}
                                        />
                                    </motion.div>
                                )}

                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <NotificationsSheet
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                onConfirm={handleConfirmBooking}
                onPostpone={handlePostponeBooking}
                currentUserId={user?.id}
            />
        </main >
    );
}
