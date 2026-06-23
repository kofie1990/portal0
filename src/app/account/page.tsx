"use client";

import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Package, User, MapPin, CreditCard, Settings, Plus, LogOut, LayoutGrid, List, Calendar, CheckCircle, Clock, Store, Tag, Edit2, Edit3, ExternalLink, Camera, Bell, BarChart, Phone, Heart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import NotificationsSheet from "@/components/NotificationsSheet";
import CalendarView from "@/components/CalendarView";
import { useToast } from "@/components/ui/Toast";

import { confirmBooking, sendBookingReminderEmail } from "@/app/actions/booking";
import FileUpload from "@/components/ui/FileUpload";

type Business = Database['public']['Tables']['businesses']['Row'];
type Service = Database['public']['Tables']['services']['Row'] & {
    businesses: { name: string } | null
};
type Booking = Database['public']['Tables']['bookings']['Row'] & {
    services: { name: string; price_amount: number; price_currency: string; image_url: string | null; images: string[] | null; deposit_amount: number | null } | null;
    businesses: { name: string } | null;
    profiles: { full_name: string; avatar_url: string | null; phone: string | null } | null;
};
type Favorite = Database['public']['Tables']['favorites']['Row'] & {
    businesses: { name: string, category: string, image_url: string, id: string } | null;
    services: { name: string, price_amount: number, price_currency: string, image_url: string, id: string } | null;
};

export default function AccountPage() {
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

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
    const [myFavorites, setMyFavorites] = useState<Favorite[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            // Fetch Businesses
            const { data: bizData } = await supabase.from('businesses').select('*, reviews(*)').eq('owner_id', user.id);
            if (bizData) {
                const computed = bizData.map((b: any) => {
                    const rList = b.reviews || [];
                    const rating = rList.length > 0
                        ? (rList.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / rList.length).toFixed(1)
                        : (b.rating ? Number(b.rating).toFixed(1) : "0.0");
                    return { ...b, rating };
                });
                setMyBusinesses(computed as any);
            }
            const businessIds = bizData?.map(b => b.id) || [];

            // Fetch Favorites
            const { data: favoritesData } = await supabase
                .from('favorites')
                .select(`
                    *,
                    businesses (id, name, category, image_url),
                    services (id, name, price_amount, price_currency, image_url)
                `)
                .eq('user_id', user.id);
            if (favoritesData) setMyFavorites(favoritesData as any);

            // Fetch Listings
            let listingsQuery = supabase
                .from('services')
                .select('*, businesses(name)');

            if (businessIds.length > 0) {
                listingsQuery = listingsQuery.or(`profile_id.eq.${user.id},business_id.in.(${businessIds.join(',')})`);
            } else {
                listingsQuery = listingsQuery.eq('profile_id', user.id);
            }

            const { data: serviceData } = await listingsQuery;
            if (serviceData) setMyListings(serviceData as any);

            // Fetch My Bookings (As Customer)
            const { data: myBookingsData } = await supabase
                .from('bookings')
                .select(`
                    *,
                    services (name, price_amount, price_currency, image_url, images, deposit_amount),
                    businesses (name),
                    profiles:profiles!provider_id (full_name, avatar_url)
                `)
                .eq('user_id', user.id)
                .order('booking_date', { ascending: false });

            if (myBookingsData) setMyBookings(myBookingsData as any);

            // Fetch Provider Bookings (As Service Provider) -> For Calendar & Client Bookings
            // Case 1: Bookings for services under the provider's businesses
            let businessProviderBookings: any[] = [];
            if (businessIds.length > 0) {
                const { data: bizProviderData } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        services (name, price_amount, price_currency, image_url, images, deposit_amount),
                        businesses (name),
                        profiles:profiles!user_id (full_name, avatar_url, phone)
                    `)
                    .neq('status', 'cancelled')
                    .in('business_id', businessIds);

                if (bizProviderData) businessProviderBookings = bizProviderData;
            }

            // Case 2: Bookings for individually-listed services (no business_id, uses provider_id)
            const { data: individualProviderData } = await supabase
                .from('bookings')
                .select(`
                    *,
                    services (name, price_amount, price_currency, image_url, images, deposit_amount),
                    businesses (name),
                    profiles:profiles!user_id (full_name, avatar_url, phone)
                `)
                .neq('status', 'cancelled')
                .eq('provider_id', user.id);

            const individualProviderBookings = individualProviderData || [];

            // Merge and deduplicate by booking id
            const allProviderBookings = [
                ...businessProviderBookings,
                ...individualProviderBookings.filter(
                    (b) => !businessProviderBookings.some((p) => p.id === b.id)
                ),
            ];

            setProviderBookings(allProviderBookings as any);
        };

        const fetchNotifications = async () => {
            if (!user) return;

            // 1. Get my businesses
            const { data: businesses } = await supabase.from('businesses').select('id').eq('owner_id', user.id);
            const businessIds = businesses?.map(b => b.id) || [];

            // 2. Fetch Provider Notifications (Bookings for my services needing action)
            let bizProviderNotifs: any[] = [];

            if (businessIds.length > 0) {
                const { data } = await supabase
                    .from('bookings')
                    .select(`
                    *,
                    services (name, price_amount, price_currency, image_url, images, deposit_amount),
                    businesses (name),
                    profiles:profiles!user_id (full_name, phone)
                `)
                    .neq('status', 'cancelled') // Get active ones
                    .in('business_id', businessIds);

                if (data) bizProviderNotifs = data;
            }

            // Also fetch individual provider notifications (for services listed without a business)
            const { data: indivProviderNotifData } = await supabase
                .from('bookings')
                .select(`
                    *,
                    services (name, price_amount, price_currency, image_url, images, deposit_amount),
                    businesses (name),
                    profiles:profiles!user_id (full_name, phone)
                `)
                .neq('status', 'cancelled')
                .eq('provider_id', user.id);

            const indivProviderNotifs = indivProviderNotifData || [];

            // Merge and deduplicate
            const providerNotifications = [
                ...bizProviderNotifs,
                ...indivProviderNotifs.filter((b) => !bizProviderNotifs.some((p) => p.id === b.id)),
            ];

            // 3. Fetch Customer Notifications (Updates on my bookings)
            // Mostly just show recent confirmations?
            const { data: customerData } = await supabase
                .from('bookings')
                .select(`
                    *,
                    services (name, price_amount, price_currency, image_url, images, deposit_amount),
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

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setTimeout(() => {
                const element = document.getElementById('account-content-area');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 50);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const fullName = formData.get("fullName") as string;
        const phone = formData.get("phone") as string;
        const bio = formData.get("bio") as string;
        const interestsStr = formData.get("interests") as string;

        // Convert comma-separated interests to array
        const interests = interestsStr ? interestsStr.split(',').map(i => i.trim()).filter(i => i.length > 0) : [];

        // Optimistic update
        setProfile((prev: any) => ({
            ...prev,
            full_name: fullName,
            phone,
            bio,
            interests
        }));
        setIsEditingProfile(false);

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone,
                bio,
                interests,
                location_text: profile.location_text,
                lat: profile.lat,
                lng: profile.lng,
                avatar_url: profile.avatar_url // Ensure avatar_url is persisted from state
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
            showToast("Failed to confirm booking: " + result.error, "error");
            // Revert optimistic update?
        } else {
            showToast("Booking confirmed successfully!", "success");
        }
    };

    const handlePostponeBooking = async (bookingId: string, newDate?: string) => {
        if (!newDate) {
            // Legacy fallback for text-based postpone
            const textDate = prompt("Enter a proposed new date/time (e.g. 'Tomorrow at 2pm'):");
            if (!textDate) return;

            const { data } = await supabase.from('bookings').select('notes').eq('id', bookingId).single();
            const { error } = await supabase.from('bookings').update({
                notes: (data?.notes || "") + `\n[Postpone Requested: ${textDate}]`
            }).eq('id', bookingId);

            if (!error) {
                showToast("Postpone request added to booking notes.", "success");
            } else {
                console.error("Error requesting postpone", error);
                showToast("Failed to request postpone: " + error.message, "error");
            }
            return;
        }

        // Update the booking date directly
        const oldBooking = notifications.find(b => b.id === bookingId) || providerBookings.find(b => b.id === bookingId);
        const oldDateStr = oldBooking ? new Date(oldBooking.booking_date).toLocaleString() : 'unknown';

        const { error } = await supabase.from('bookings').update({
            booking_date: newDate,
            notes: (oldBooking?.notes || "") + `\n[Postponed from ${oldDateStr} to ${new Date(newDate).toLocaleString()}]`
        }).eq('id', bookingId);

        if (!error) {
            // Optimistic update
            setNotifications(prev => prev.map(b => b.id === bookingId ? { ...b, booking_date: newDate } : b));
            setProviderBookings(prev => prev.map(b => b.id === bookingId ? { ...b, booking_date: newDate } : b));
            showToast("Booking rescheduled successfully!", "success");
        } else {
            console.error("Error rescheduling booking", error);
            showToast("Failed to reschedule: " + error.message, "error");
        }
    };

    const handleSendReminder = async (bookingId: string) => {
        const result = await sendBookingReminderEmail(bookingId);
        if (result.error) {
            showToast("Failed to send reminder: " + result.error, "error");
        } else {
            showToast("Reminder sent successfully!", "success");
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
                                    <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden relative">
                                        {profile?.avatar_url ? (
                                            <Image src={profile.avatar_url} alt="Profile" fill className="object-cover" />
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
                                        onClick={() => handleTabChange("profile")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "profile" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <User className="w-4 h-4" /> Profile
                                    </button>
                                    <div className="pt-4 pb-2 text-xs font-bold text-neutral-400 uppercase tracking-wider px-4">Manage</div>
                                    <button
                                        onClick={() => handleTabChange("favorites")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "favorites" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <Heart className="w-4 h-4" /> Favorites
                                    </button>
                                    <button
                                        onClick={() => handleTabChange("businesses")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "businesses" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <Store className="w-4 h-4" /> My Businesses
                                    </button>
                                    <button
                                        onClick={() => handleTabChange("listings")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "listings" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <Tag className="w-4 h-4" /> My Listings
                                    </button>
                                    <button
                                        onClick={() => handleTabChange("bookings")}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "bookings" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                    >
                                        <List className="w-4 h-4" /> My Bookings
                                    </button>
                                    {(myListings.length > 0 || myBusinesses.length > 0) && (
                                        <button
                                            onClick={() => handleTabChange("client_bookings")}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "client_bookings" ? "bg-neutral-100 dark:bg-neutral-900" : "hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-500"}`}
                                        >
                                            <User className="w-4 h-4" /> Client Bookings
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleTabChange("calendar")}
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
                            <div id="account-content-area" className="md:col-span-3 space-y-6">

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
                                                        <div className="w-40">
                                                            <FileUpload
                                                                label="Profile Photo"
                                                                value={profile?.avatar_url || ""}
                                                                onChange={(url) => setProfile((prev: any) => ({ ...prev, avatar_url: url }))}
                                                                bucket="avatars"
                                                                className="w-full"
                                                            />
                                                        </div>
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
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Phone</label>
                                                            <input
                                                                type="tel"
                                                                name="phone"
                                                                defaultValue={profile?.phone || ""}
                                                                placeholder="+233 XX XXX XXXX"
                                                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-black dark:focus:border-white transition-colors"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Interests</label>
                                                            <input
                                                                type="text"
                                                                name="interests"
                                                                defaultValue={profile?.interests?.join(", ") || ""}
                                                                placeholder="Cooking, Coding, Music..."
                                                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-black dark:focus:border-white transition-colors"
                                                            />
                                                            <p className="text-xs text-neutral-400">Comma separated values</p>
                                                        </div>
                                                        <div className="space-y-2 col-span-1 md:col-span-2">
                                                            <label className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Bio</label>
                                                            <textarea
                                                                name="bio"
                                                                rows={3}
                                                                defaultValue={profile?.bio || ""}
                                                                placeholder="Tell us a little about yourself..."
                                                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
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
                                                        {/* Next Booking Countdown Card */}
                                                        {(() => {
                                                            const now = new Date();
                                                            const allBookings = [...myBookings, ...providerBookings]
                                                                .filter(b => b.status === 'confirmed' && new Date(b.booking_date) > now)
                                                                .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

                                                            const nextBooking = allBookings[0];

                                                            if (!nextBooking) return (
                                                                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 col-span-2">
                                                                    <span className="text-neutral-400 font-bold block mb-1">No upcoming bookings</span>
                                                                    <span className="text-xs font-bold tracking-wider text-neutral-400/70 uppercase">Find a service to book!</span>
                                                                    <Link href="/businesses" className="mt-3 block text-xs font-bold text-blue-600 hover:underline">Explore Businesses &rarr;</Link>
                                                                </div>
                                                            );

                                                            const isMyBooking = nextBooking.user_id === user?.id; // I am the customer
                                                            const bookingDate = new Date(nextBooking.booking_date);
                                                            const diffMs = bookingDate.getTime() - now.getTime();
                                                            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                                            const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                                                            // Theme based on type
                                                            const bgClass = isMyBooking
                                                                ? "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30"
                                                                : "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30";
                                                            const textClass = isMyBooking
                                                                ? "text-blue-600 dark:text-blue-400"
                                                                : "text-amber-600 dark:text-amber-400";
                                                            const labelClass = isMyBooking
                                                                ? "text-blue-600/70 dark:text-blue-400/60"
                                                                : "text-amber-600/70 dark:text-amber-400/60";

                                                            return (
                                                                <div className={`p-4 rounded-xl border ${bgClass} col-span-2 flex flex-col justify-between`}>
                                                                    <div>
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <span className={`text-xs font-bold tracking-wider uppercase ${labelClass}`}>
                                                                                {isMyBooking ? "My Next Appointment" : "Next Client Booking"}
                                                                            </span>
                                                                            {diffDays < 1 && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full animate-pulse">Soon</span>}
                                                                        </div>
                                                                        <h4 className={`font-heading font-bold text-lg leading-tight mb-1 ${textClass}`}>
                                                                            {nextBooking.services?.name}
                                                                        </h4>
                                                                        <p className={`text-xs ${labelClass} opacity-80 mb-3`}>
                                                                            {isMyBooking ? `at ${nextBooking.businesses?.name}` : `with ${nextBooking.profiles?.full_name || nextBooking.guest_name || "Guest"}`}
                                                                        </p>
                                                                    </div>

                                                                    <div className="flex items-end gap-1">
                                                                        <div className={`text-2xl font-bold ${textClass}`}>
                                                                            {diffDays > 0 ? `${diffDays}d` : ''} {diffHrs}h
                                                                        </div>
                                                                        <span className={`text-xs font-bold mb-1.5 ${labelClass}`}>until session</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                                            <span className="text-blue-600 font-bold text-2xl block mb-1">
                                                                {new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(myFavorites.length)}
                                                            </span>
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
                                            <Link href="/signup/business" className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90">
                                                <Plus className="w-4 h-4" /> Add New
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
                                                            {business.image_url || business.cover_image_url ? (
                                                                <Image src={business.image_url || business.cover_image_url || ''} alt={business.name} fill className="object-cover" />
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
                                                                <Link href={`/dashboard/${business.id}`} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                                                    <Settings className="w-3 h-3" /> Dashboard
                                                                </Link>
                                                                <Link href={`/business/edit/${business.id}`} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                                                    <Edit3 className="w-3 h-3" /> Edit Business
                                                                </Link>
                                                                <Link href={business.location_type === 'physical' ? `/business/store/${business.id}` : `/business/service/${business.id}`} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                                                    <ExternalLink className="w-3 h-3" /> View Live
                                                                </Link>
                                                            </div>
                                                        </div>
                                                        <div className="text-center md:text-right p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl min-w-[120px]">
                                                            <span className="block text-2xl font-bold">{business.rating || "0.0"}</span>
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
                                            <Link href="/list" className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90">
                                                <Plus className="w-4 h-4" /> Create Listing
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
                                                            <Link href={`/account/listings/${service.id}/analytics`} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors relative z-20 block" title="Analytics">
                                                                <BarChart className="w-4 h-4 text-neutral-500 hover:text-black dark:hover:text-white" />
                                                            </Link>
                                                            <Link href={`/service/edit/${service.id}`} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors relative z-20 block" title="Edit">
                                                                <Edit3 className="w-4 h-4 text-neutral-500 hover:text-black dark:hover:text-white" />
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
                                                    <Link href="/" className="mt-4 px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold text-sm inline-block">
                                                        Browse Services
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
                                                                <div className="w-14 h-14 bg-neutral-200 dark:bg-neutral-800 rounded-xl overflow-hidden border-2 border-white dark:border-neutral-900 shadow-sm relative">
                                                                    {(booking.services?.image_url || booking.services?.images?.[0]) ? (
                                                                        <Image
                                                                            src={booking.services.image_url || booking.services.images![0]}
                                                                            alt={booking.services.name}
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
                                                                            Paid {booking.services?.price_currency} {booking.services?.deposit_amount || booking.amount_paid}
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
                                                                        className="w-full px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/10 dark:hover:text-red-400 dark:hover:border-red-900/30 transition-all"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <Link href={`/account/bookings/${booking.id}`} className="w-full px-4 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity shadow-sm block text-center">
                                                                        View Details
                                                                    </Link>
                                                                </>
                                                            ) : (
                                                                <Link href={`/account/bookings/${booking.id}`} className="col-span-2 w-full px-4 py-2.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 rounded-xl text-sm font-bold hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors block text-center">
                                                                    View Details
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === "client_bookings" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-heading text-2xl font-bold">Client Bookings</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {providerBookings.length === 0 ? (
                                                <div className="text-center py-12 text-neutral-500">
                                                    <p>No client bookings yet.</p>
                                                </div>
                                            ) : (
                                                providerBookings.map((booking) => (
                                                    <div key={booking.id} className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                                                        <div className="flex flex-col md:flex-row gap-5">
                                                            {/* Client Info */}
                                                            <div className="flex items-start gap-4 flex-1">
                                                                <div className="flex-shrink-0">
                                                                    <div className="w-14 h-14 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden border-2 border-white dark:border-neutral-900 shadow-sm relative">
                                                                        {booking.profiles?.avatar_url ? (
                                                                            <Image
                                                                                src={booking.profiles.avatar_url}
                                                                                alt={booking.profiles.full_name || booking.guest_name || "Client"}
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-neutral-400">
                                                                                {(booking.profiles?.full_name?.[0] || booking.guest_name?.[0] || "C").toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-heading font-bold text-lg mb-1">{booking.profiles?.full_name || booking.guest_name || "Guest User"}</h4>
                                                                    <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
                                                                        <span className="font-medium text-black dark:text-white">{booking.services?.name}</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-3">
                                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-md">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {new Date(booking.booking_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-900 px-2 py-1 rounded-md">
                                                                            <Clock className="w-3 h-3" />
                                                                            {new Date(booking.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex md:flex-col gap-2 justify-center min-w-[140px]">
                                                                <button
                                                                    className="flex-1 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                                                    onClick={() => handleSendReminder(booking.id)}
                                                                >
                                                                    <Bell className="w-3.5 h-3.5" />
                                                                    Send Reminder
                                                                </button>
                                                                {(booking.profiles?.phone || booking.guest_phone) && (
                                                                    <a href={`tel:${booking.profiles?.phone || booking.guest_phone}`} className="flex-1">
                                                                        <button className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2">
                                                                            <Clock className="w-3.5 h-3.5" /> {/* Phone Icon replacement since Phone might not be imported, using Clock for now or check imports */}
                                                                            Call Client
                                                                        </button>
                                                                    </a>
                                                                )}
                                                            </div>
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

                                {activeTab === "favorites" && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="font-heading text-2xl font-bold">My Favorites</h3>
                                        </div>

                                        {myFavorites.length === 0 ? (
                                            <div className="text-center py-12 text-neutral-500 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-black">
                                                <Heart className="w-8 h-8 mx-auto mb-4 text-neutral-300 dark:text-neutral-700" />
                                                <p>You haven't favorited any businesses or services yet.</p>
                                                <Link href="/" className="mt-4 px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold text-sm inline-block">
                                                    Explore Providers
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {myFavorites.map((fav) => {
                                                    const isBiz = !!fav.businesses;
                                                    const item = fav.businesses || fav.services;
                                                    if (!item) return null;

                                                    return (
                                                        <div key={fav.id} className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="w-16 h-16 bg-neutral-200 rounded-xl overflow-hidden relative flex-shrink-0">
                                                                {item.image_url ? (
                                                                    <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center font-bold text-neutral-400 text-xl bg-neutral-100 dark:bg-neutral-900">
                                                                        {item.name[0]}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-heading font-bold text-base truncate">{item.name}</h4>
                                                                <p className="text-xs text-neutral-500 truncate mb-1">
                                                                    {isBiz ? (fav.businesses as any).category : `${(fav.services as any).price_currency || 'GH₵'} ${(fav.services as any).price_amount}`}
                                                                </p>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-full inline-block">
                                                                    {isBiz ? 'Business' : 'Service'}
                                                                </span>
                                                            </div>
                                                            <Link href={isBiz ? `/business/store/${item.id}` : `/service/${item.id}`} className="inline-block p-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 rounded-xl text-xs font-bold transition-colors">
                                                                View
                                                            </Link>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                            </div>
                        </div>

                        {/* Desktop Footer Only */}
                        <div className="hidden md:flex flex-col items-center justify-center mt-12 pb-4 text-xs opacity-50 gap-2 font-medium">
                            <div className="flex gap-4">
                                <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                                <Link href="/terms" className="hover:underline">Terms of Use</Link>
                            </div>
                            <div>&copy; Portal 2026</div>
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
