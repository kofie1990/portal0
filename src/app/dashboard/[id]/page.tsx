"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, use } from "react";
import { notFound } from "next/navigation";
import {
    LayoutDashboard,
    TrendingUp,
    Users,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Search,
    Filter,
    Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [vendor, setVendor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [realBookings, setRealBookings] = useState<any[]>([]);
    const [stats, setStats] = useState([
        { label: "Total Revenue", value: "GH₵ 0.00", change: "+0%", trend: "neutral", icon: TrendingUp, color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
        { label: "Total Bookings", value: "0", change: "+0%", trend: "neutral", icon: Calendar, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
        { label: "Avg Rating", value: "0", change: "0%", trend: "neutral", icon: Users, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
    ]);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch Business
            const { data: businessData, error: businessError } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', id)
                .single();

            if (businessError || !businessData) {
                console.error("Dashboard error:", businessError);
                setLoading(false);
                return;
            }
            setVendor(businessData);

            // 2. Fetch Bookings (joined with profiles for customer names, services for service names)
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    profiles:user_id (full_name),
                    services:service_id (name)
                `)
                .eq('business_id', id)
                .order('created_at', { ascending: false });

            if (bookingsData) {
                // Calculate Stats - Only for Confirmed/Completed bookings
                const confirmedBookings = bookingsData.filter(b => b.status === 'confirmed' || b.status === 'completed');

                const totalRevenue = confirmedBookings
                    .reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

                const bookingCount = confirmedBookings.length;

                setStats([
                    {
                        label: "Total Revenue",
                        value: `GH₵ ${totalRevenue.toLocaleString()}`,
                        change: "+0%",
                        trend: "up",
                        icon: TrendingUp,
                        color: "text-green-600 bg-green-50 dark:bg-green-900/20"
                    },
                    {
                        label: "Total Bookings",
                        value: bookingCount.toString(),
                        change: "+0%",
                        trend: "up",
                        icon: Calendar,
                        color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    },
                    {
                        label: "Avg Rating",
                        value: businessData.rating?.toString() || "0",
                        change: "0%",
                        trend: "neutral",
                        icon: Users,
                        color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                    },
                ]);

                // Map Bookings for Table
                const mappedBookings = bookingsData.map(b => ({
                    id: `#${b.id.slice(0, 8)}`,
                    customer: b.profiles?.full_name || 'Unknown User',
                    service: b.services?.name || 'Unknown Service',
                    date: new Date(b.booking_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
                    status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
                    amount: `GH₵ ${b.total_amount}`
                }));
                setRealBookings(mappedBookings);
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>;
    }

    if (!vendor) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-28 pb-12 container-wide px-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-heading mb-2">Dashboard</h1>
                        <p className="text-neutral-500">Welcome back, {vendor?.name || 'Vendor'}!</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/business/${vendor.id}`} target="_blank">
                            <button className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                View Live Page
                            </button>
                        </Link>
                        <button className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 p-6 rounded-2xl"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up'
                                    ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                    : 'text-red-600 bg-red-50 dark:bg-red-900/20'
                                    }`}>
                                    {stat.change}
                                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                </div>
                            </div>
                            <h3 className="text-neutral-500 text-sm font-medium mb-1">{stat.label}</h3>
                            <p className="text-2xl font-bold font-heading">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Recent Bookings & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Chart/Table Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Bookings Table */}
                        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                                <h2 className="font-bold text-lg">Recent Bookings</h2>
                                <div className="flex gap-2">
                                    <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg text-neutral-500">
                                        <Search className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg text-neutral-500">
                                        <Filter className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-4">Booking ID</th>
                                            <th className="px-6 py-4">Customer</th>
                                            <th className="px-6 py-4">Service</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {realBookings.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                                                    No bookings found.
                                                </td>
                                            </tr>
                                        ) : (
                                            realBookings.map((booking) => (
                                                <tr key={booking.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium">{booking.id}</td>
                                                    <td className="px-6 py-4 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold">
                                                            {booking.customer.charAt(0)}
                                                        </div>
                                                        {booking.customer}
                                                    </td>
                                                    <td className="px-6 py-4 text-neutral-500">{booking.service}</td>
                                                    <td className="px-6 py-4 text-neutral-500">{booking.date}</td>
                                                    <td className="px-6 py-4 font-medium">{booking.amount}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${booking.status === 'Confirmed' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' :
                                                            booking.status === 'Completed' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' :
                                                                booking.status === 'Pending' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' :
                                                                    booking.status === 'Pending_payment' ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' :
                                                                        'text-red-600 bg-red-50 dark:bg-red-900/20'
                                                            }`}>
                                                            {booking.status === 'Pending_payment' ? 'Pending Payment' : booking.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                                            <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Quick Actions */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                            <h3 className="font-bold mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link href={`/business/edit/${vendor.id}`}>
                                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
                                        <span>Edit Business</span>
                                        <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                                    </button>
                                </Link>
                                <Link href={`/dashboard/${vendor.id}/services`}>
                                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
                                        <span>Manage Services</span>
                                        <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                                    </button>
                                </Link>
                                <Link href={`/business/edit/${vendor.id}`}>
                                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
                                        <span>Settings</span>
                                        <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                                    </button>
                                </Link>
                            </div>
                        </div>

                        {/* <div className="bg-gradient-to-br from-black to-neutral-800 text-white rounded-2xl p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-2">Pro Features</h3>
                                <p className="text-neutral-300 text-sm mb-4">Upgrade to unlock advanced analytics and marketing tools.</p>
                                <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-neutral-100 transition-colors">
                                    Upgrade Now
                                </button>
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        </div> */}
                    </div>

                </div>
            </div >
        </main >
    );
}
