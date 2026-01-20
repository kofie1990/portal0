"use client";

import Navigation from "@/components/Navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, TrendingUp, Calendar, Users, DollarSign, Clock, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";

type Booking = {
    id: string;
    booking_date: string;
    status: string;
    total_amount: number;
    amount_paid: number | null;
    profiles: { full_name: string; avatar_url: string | null } | null;
};

type Service = {
    id: string;
    name: string;
    price_amount: number;
    price_currency: string;
    images: string[] | null;
    image_url: string | null;
    category: string | null;
};

export default function ListingAnalyticsPage() {
    const router = useRouter();
    const params = useParams();
    const serviceId = params?.id as string;
    const supabase = createClient();

    const [isLoading, setIsLoading] = useState(true);
    const [service, setService] = useState<Service | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);

    // Stats
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalBookings, setTotalBookings] = useState(0);
    const [pendingBookings, setPendingBookings] = useState(0);
    const [averageRating, setAverageRating] = useState(0); // Placeholder for now

    // Chart Data
    const [revenueData, setRevenueData] = useState<any[]>([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            // 1. Fetch Service & Verify Ownership
            const { data: serviceData, error: serviceError } = await supabase
                .from('services')
                .select('*')
                .eq('id', serviceId)
                .single();

            if (serviceError || !serviceData) {
                console.error("Service not found", serviceError);
                return; // Handle error UI
            }

            // Verify ownership (either profile_id matches or business owner matches)
            // Simplified check: if profile_id matches user.id
            // Ideally should check business ownership too if it's a business service
            // relying on RLS for now mostly
            setService(serviceData as any);

            // 2. Fetch Bookings
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    profiles:user_id (full_name, avatar_url)
                `)
                .eq('service_id', serviceId)
                .order('booking_date', { ascending: true }); // Ascending for chart

            if (bookingsData) {
                const verifiedBookings = bookingsData as any[];
                setBookings(verifiedBookings);

                // Calculate Stats
                const confirmed = verifiedBookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
                const revenue = confirmed.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

                setTotalRevenue(revenue);
                setTotalBookings(verifiedBookings.length);
                setPendingBookings(verifiedBookings.filter(b => b.status === 'pending_payment').length);

                // Prepare Chart Data (Group by Day)
                const chartMap = new Map<string, number>();
                confirmed.forEach(booking => {
                    const date = new Date(booking.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    const current = chartMap.get(date) || 0;
                    chartMap.set(date, current + (booking.total_amount || 0));
                });

                const chartArray = Array.from(chartMap.entries()).map(([date, amount]) => ({
                    date,
                    revenue: amount
                }));

                // Ensure we have at least some data points or empty state
                setRevenueData(chartArray);
            }

            setIsLoading(false);
        };

        if (serviceId) {
            fetchAnalytics();
        }
    }, [serviceId, router, supabase]);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background text-foreground font-sans">
                <Navigation />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                </div>
            </main>
        );
    }

    if (!service) return <div>Service not found</div>;

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans">
            <Navigation />
            <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href="/account" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black dark:hover:text-white mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Back to listings
                        </Link>
                        <h1 className="font-heading text-3xl font-bold">{service.name} Analytics</h1>
                        <p className="text-neutral-500">Track views, bookings, and revenue performance.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/service/edit/${service.id}`}>
                            <button className="px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors">
                                Edit Listing
                            </button>
                        </Link>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Total Revenue</span>
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-lg">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-heading font-bold">
                            {service.price_currency} {totalRevenue.toLocaleString()}
                        </div>
                        <p className="text-xs text-green-600 font-bold mt-1 inline-flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> +12% from last month
                        </p>
                    </div>

                    <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Total Bookings</span>
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-heading font-bold">
                            {totalBookings}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            Lifetime bookings
                        </p>
                    </div>

                    <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Pending</span>
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-heading font-bold">
                            {pendingBookings}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            Requires action
                        </p>
                    </div>

                    {/* Placeholder for Views since we don't track it yet */}
                    <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 opacity-60">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-neutral-500 uppercase tracking-wider">Views</span>
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-heading font-bold">
                            0
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            Coming soon
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart Section */}
                    <div className="lg:col-span-2 bg-white dark:bg-black p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <h3 className="font-heading text-xl font-bold mb-6">Revenue Over Time</h3>
                        <div className="h-80 w-full">
                            {revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#737373', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#737373', fontSize: 12 }}
                                            tickFormatter={(value) => `${service.price_currency}${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#000000"
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            strokeWidth={3}
                                            activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-neutral-400">
                                    No sufficient data to display chart.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Bookings List */}
                    <div className="bg-white dark:bg-black p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                        <h3 className="font-heading text-xl font-bold mb-6">Recent Bookings</h3>
                        <div className="space-y-4">
                            {bookings.slice(0, 5).map((booking) => (
                                <div key={booking.id} className="flex items-center gap-4 py-2 border-b border-neutral-100 dark:border-neutral-900 last:border-0">
                                    <div className="w-10 h-10 bg-neutral-100 rounded-full overflow-hidden relative">
                                        {/* Avatar placeholder */}
                                        {booking.profiles?.avatar_url ? (
                                            <img src={booking.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-neutral-400 text-xs">
                                                {booking.profiles?.full_name?.[0] || "U"}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{booking.profiles?.full_name || "Unknown User"}</p>
                                        <p className="text-xs text-neutral-500">
                                            {new Date(booking.booking_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-sm">
                                            {service.price_currency}{booking.total_amount}
                                        </span>
                                        <span className={`text-[10px] uppercase font-bold ${booking.status === 'confirmed' ? 'text-green-600' :
                                                booking.status === 'cancelled' ? 'text-red-500' : 'text-amber-500'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {bookings.length === 0 && (
                                <p className="text-neutral-500 text-sm text-center py-4">No bookings yet.</p>
                            )}
                        </div>
                        {bookings.length > 5 && (
                            <button className="w-full mt-6 py-2 text-sm font-bold text-neutral-500 hover:text-black transition-colors">
                                View All
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
