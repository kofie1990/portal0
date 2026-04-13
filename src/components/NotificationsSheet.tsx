"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Check, Clock, AlertCircle } from "lucide-react";
import { Database } from "@/types/supabase";

type Booking = Database['public']['Tables']['bookings']['Row'] & {
    services: { name: string; price_amount: number; price_currency: string } | null;
    businesses: { name: string } | null;
    profiles: { full_name: string } | null;
};

interface NotificationsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Booking[];
    onConfirm: (bookingId: string) => void;
    onPostpone: (bookingId: string) => void;
    currentUserId: string;
}

export default function NotificationsSheet({
    isOpen,
    onClose,
    notifications,
    onConfirm,
    onPostpone,
    currentUserId
}: NotificationsSheetProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 z-[101] shadow-2xl flex flex-col"
                    >
                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h2 className="font-heading font-bold text-xl">Notifications</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {notifications.length === 0 ? (
                                <div className="text-center py-12 text-neutral-500">
                                    <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Clock className="w-8 h-8 text-neutral-400" />
                                    </div>
                                    <p>No new notifications.</p>
                                </div>
                            ) : (
                                notifications.map((booking) => {
                                    const isProvider = booking.provider_id === currentUserId || (booking.businesses && booking.business_id); // Simplified check, ideally check business ownership but close enough for UI context if fetched correctly
                                    // Actually, simpler: if I am NOT the `user_id` (the one who booked), I must be the provider.
                                    const role = booking.user_id === currentUserId ? 'customer' : 'provider';

                                    return (
                                        <motion.div
                                            key={booking.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 rounded-xl p-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${booking.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30'
                                                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                                    }`}>
                                                    {booking.status === 'confirmed' ? (
                                                        <Check className="w-5 h-5" />
                                                    ) : (
                                                        <Calendar className="w-5 h-5" />
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="font-bold text-sm mb-1">
                                                        {role === 'provider' ? 'New Booking Request' : 'Booking Update'}
                                                    </h3>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                                                        {role === 'provider' ? (
                                                            <>
                                                                <span className="font-bold">{booking.profiles?.full_name || booking.guest_name || 'Guest'}</span> requested
                                                                <span className="font-bold"> {booking.services?.name}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                Your booking for <span className="font-bold">{booking.services?.name}</span> is now <span className="font-bold text-foreground">{booking.status}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(booking.booking_date).toLocaleString()}
                                                    </div>

                                                    {role === 'provider' && booking.status !== 'confirmed' && booking.status !== 'cancelled' && (
                                                        <div className="flex gap-2 mt-2">
                                                            <button
                                                                onClick={() => onConfirm(booking.id)}
                                                                className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() => onPostpone(booking.id)}
                                                                className="flex-1 border border-neutral-200 dark:border-neutral-700 py-2 rounded-lg text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                                            >
                                                                Request Postpone
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
