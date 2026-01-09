"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { MOCK_BUSINESSES } from "@/lib/mock-data";
import { use, useState } from "react";
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
    Filter
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const vendor = MOCK_BUSINESSES.find((v) => v.id === id);

    if (!vendor) {
        notFound();
    }

    // Mock Stats
    const stats = [
        {
            label: "Total Revenue",
            value: "GH₵ 12,450",
            change: "+12.5%",
            trend: "up",
            icon: TrendingUp,
            color: "text-green-600 bg-green-50 dark:bg-green-900/20"
        },
        {
            label: "Total Bookings",
            value: "148",
            change: "+8.2%",
            trend: "up",
            icon: Calendar,
            color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
        },
        {
            label: "Profile Views",
            value: "2.4k",
            change: "-2.1%",
            trend: "down",
            icon: Users,
            color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20"
        },
    ];

    // Mock Bookings Data
    const bookings = [
        { id: "#BK-2049", customer: "Sarah Mensah", service: "Private Shopping", date: "Jan 12, 10:00 AM", status: "Confirmed", amount: "GH₵ 0.00" },
        { id: "#BK-2048", customer: "Kwame Osei", service: "Interior Styling", date: "Jan 11, 2:00 PM", status: "Completed", amount: "GH₵ 500.00" },
        { id: "#BK-2047", customer: "Ama Boateng", service: "Custom Measurement", date: "Jan 10, 11:30 AM", status: "Pending", amount: "GH₵ 100.00" },
        { id: "#BK-2046", customer: "John Doe", service: "Private Shopping", date: "Jan 09, 4:00 PM", status: "Cancelled", amount: "GH₵ 0.00" },
        { id: "#BK-2045", customer: "Esi Darko", service: "Interior Styling", date: "Jan 08, 1:00 PM", status: "Completed", amount: "GH₵ 500.00" },
    ];

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-28 pb-12 container-wide px-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-heading mb-1">Dashboard</h1>
                        <p className="text-neutral-500 text-sm">Welcome back, {vendor.name}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href={`/business/store/${vendor.id}`}>
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
                                        {bookings.map((booking) => (
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
                                                                'text-red-600 bg-red-50 dark:bg-red-900/20'
                                                        }`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded">
                                                        <MoreHorizontal className="w-4 h-4 text-neutral-400" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
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
                                        <span>Edit Profile</span>
                                        <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                                    </button>
                                </Link>
                                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
                                    <span>Manage Services</span>
                                    <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                                </button>
                                <button className="w-full flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium">
                                    <span>Settings</span>
                                    <ArrowUpRight className="w-4 h-4 text-neutral-400" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-black to-neutral-800 text-white rounded-2xl p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="font-bold text-lg mb-2">Pro Features</h3>
                                <p className="text-neutral-300 text-sm mb-4">Upgrade to unlock advanced analytics and marketing tools.</p>
                                <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:bg-neutral-100 transition-colors">
                                    Upgrade Now
                                </button>
                            </div>
                            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
