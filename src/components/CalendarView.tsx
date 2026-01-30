"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Tag } from "lucide-react";
import Image from "next/image";

type Booking = {
    id: string;
    booking_date: string;
    status: string;
    services: { name: string; price_amount: number; price_currency: string; image_url: string | null; images: string[] | null } | null;
    businesses: { name: string } | null;
    profiles: { full_name: string; avatar_url: string | null } | null;
    provider_id?: string | null; // check if I am the provider
    user_id: string;
};

interface CalendarViewProps {
    bookings: Booking[];
    currentUserId: string;
}

export default function CalendarView({ bookings, currentUserId }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    const getDayBookings = (day: number) => {
        return bookings.filter(b => {
            const d = new Date(b.booking_date);
            return (
                d.getDate() === day &&
                d.getMonth() === currentDate.getMonth() &&
                d.getFullYear() === currentDate.getFullYear() &&
                b.status !== 'cancelled'
            );
        });
    };

    const selectedDayBookings = selectedDate ? bookings.filter(b => {
        const d = new Date(b.booking_date);
        return (
            d.getDate() === selectedDate.getDate() &&
            d.getMonth() === selectedDate.getMonth() &&
            d.getFullYear() === selectedDate.getFullYear() &&
            b.status !== 'cancelled'
        );
    }).sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()) : [];

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Calendar Grid */}
            <div className="flex-1 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 lg:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-heading text-2xl font-bold">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-lg transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4 mb-4">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                        <div key={day} className="text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2 lg:gap-4">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dayBookings = getDayBookings(day);
                        const isToday =
                            day === new Date().getDate() &&
                            currentDate.getMonth() === new Date().getMonth() &&
                            currentDate.getFullYear() === new Date().getFullYear();
                        const isSelected =
                            selectedDate &&
                            day === selectedDate.getDate() &&
                            currentDate.getMonth() === selectedDate.getMonth() &&
                            currentDate.getFullYear() === selectedDate.getFullYear();

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                                className={`
                                    relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all
                                    ${isSelected
                                        ? "bg-black text-white dark:bg-white dark:text-black shadow-lg scale-105 z-10"
                                        : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                                    }
                                    ${isToday && !isSelected ? "bg-neutral-100 dark:bg-neutral-900 font-bold" : ""}
                                `}
                            >
                                <span className={`text-sm ${isSelected ? "font-bold" : ""}`}>{day}</span>
                                {dayBookings.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                        {dayBookings.slice(0, 3).map((b, idx) => {
                                            const isProvider = b.user_id !== currentUserId;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`w-1.5 h-1.5 rounded-full ${isProvider ? "bg-amber-500" : "bg-blue-500"}`}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-8 flex gap-4 text-xs text-neutral-500 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>My Bookings</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Client Bookings</span>
                    </div>
                </div>
            </div>

            {/* Selected Date Details */}
            <div className="w-full lg:w-96">
                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 h-full">
                    <h3 className="font-heading text-xl font-bold mb-6">
                        {selectedDate
                            ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                            : "Select a date"}
                    </h3>

                    <div className="space-y-4">
                        {selectedDayBookings.length > 0 ? (
                            selectedDayBookings.map(booking => {
                                const isProvider = booking.user_id !== currentUserId;
                                return (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`
                                            p-4 rounded-xl border transition-colors
                                            ${isProvider
                                                ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30"
                                                : "bg-neutral-50 dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800"
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <span className={`
                                                    text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 inline-block
                                                    ${isProvider
                                                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    }
                                                `}>
                                                    {isProvider ? "Client Booking" : "My Booking"}
                                                </span>
                                                <h4 className="font-bold text-sm line-clamp-1">{booking.services?.name}</h4>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 bg-white dark:bg-black px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-800">
                                                <Clock className="w-3 h-3" />
                                                {new Date(booking.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative border border-white dark:border-neutral-700">
                                                {(booking.services?.image_url || booking.services?.images?.[0]) ? (
                                                    <Image
                                                        src={booking.services.image_url || booking.services.images![0]}
                                                        alt={booking.services.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : booking.profiles?.avatar_url ? (
                                                    <Image src={booking.profiles.avatar_url} alt="Profile" fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">
                                                        {(booking.profiles?.full_name?.[0] || "?")}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">
                                                    {isProvider ? booking.profiles?.full_name : booking.businesses?.name}
                                                </p>
                                                <p className="text-[10px] text-neutral-500 truncate">
                                                    {isProvider ? "Client" : "Service Provider"}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-neutral-400">
                                <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No bookings for this day.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
