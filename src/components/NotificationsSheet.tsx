"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Check, Clock, AlertCircle, Phone, ArrowRight, ChevronLeft } from "lucide-react";
import { Database } from "@/types/supabase";

type Booking = Database['public']['Tables']['bookings']['Row'] & {
    services: { name: string; price_amount: number; price_currency: string } | null;
    businesses: { name: string } | null;
    profiles: { full_name: string; phone: string | null } | null;
};

interface NotificationsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Booking[];
    onConfirm: (bookingId: string) => void;
    onPostpone: (bookingId: string, newDate?: string) => void;
    currentUserId: string;
}

// Custom date/time picker that matches the booking page design
function PostponeDateTimePicker({
    onSelect,
    onBack,
}: {
    onSelect: (isoDate: string) => void;
    onBack: () => void;
}) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Generate next 14 days
    const getAvailableDates = () => {
        const today = new Date();
        const outputDates = [];
        for (let i = 1; i < 15; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            outputDates.push({
                fullDate: d,
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: d.getDate().toString(),
                month: d.toLocaleDateString('en-US', { month: 'short' }),
                dateKey: d.getDate() + " " + d.toLocaleDateString('en-US', { month: 'short' }) + " " + d.getFullYear(),
            });
        }
        return outputDates;
    };

    const dates = getAvailableDates();
    const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

    const handleConfirm = () => {
        if (!selectedDate || !selectedTime) return;
        const isoDate = new Date(`${selectedDate} ${selectedTime}`).toISOString();
        onSelect(isoDate);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
            >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div>
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">New Date</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {dates.map((d) => {
                        const isSelected = selectedDate === d.dateKey;
                        return (
                            <button
                                key={d.dateKey}
                                onClick={() => { setSelectedDate(d.dateKey); setSelectedTime(null); }}
                                className={`min-w-[56px] p-2 rounded-xl flex flex-col items-center gap-0.5 border-2 transition-all flex-shrink-0 ${isSelected
                                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                                    : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                                    }`}
                            >
                                <span className="text-[9px] font-bold uppercase opacity-70">{d.month}</span>
                                <span className="text-sm font-bold">{d.date}</span>
                                <span className="text-[9px] font-bold uppercase">{d.day}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedDate && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                >
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 block">New Time</label>
                    <div className="grid grid-cols-4 gap-1.5">
                        {times.map((t) => {
                            const isSelected = selectedTime === t;
                            return (
                                <button
                                    key={t}
                                    onClick={() => setSelectedTime(t)}
                                    className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${isSelected
                                        ? "border-black dark:border-white bg-neutral-100 dark:bg-neutral-900"
                                        : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                                        }`}
                                >
                                    {t}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            <button
                onClick={handleConfirm}
                disabled={!selectedDate || !selectedTime}
                className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
                Confirm New Date & Time
                <ArrowRight className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
}

export default function NotificationsSheet({
    isOpen,
    onClose,
    notifications,
    onConfirm,
    onPostpone,
    currentUserId
}: NotificationsSheetProps) {
    // Track which booking is in postpone flow, and which step
    const [postponeState, setPostponeState] = useState<{
        bookingId: string;
        step: 'contact' | 'reschedule';
    } | null>(null);

    const handleStartPostpone = (bookingId: string) => {
        setPostponeState({ bookingId, step: 'contact' });
    };

    const handleProceedToReschedule = () => {
        if (!postponeState) return;
        setPostponeState({ ...postponeState, step: 'reschedule' });
    };

    const handleDateSelected = (isoDate: string) => {
        if (!postponeState) return;
        onPostpone(postponeState.bookingId, isoDate);
        setPostponeState(null);
    };

    const handleCancelPostpone = () => {
        setPostponeState(null);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { onClose(); setPostponeState(null); }}
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
                                onClick={() => { onClose(); setPostponeState(null); }}
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
                                    // Actually, simpler: if I am NOT the `user_id` (the one who booked), I must be the provider.
                                    const role = booking.user_id === currentUserId ? 'customer' : 'provider';
                                    const isPostponing = postponeState?.bookingId === booking.id;
                                    const customerPhone = booking.profiles?.phone || booking.guest_phone;

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
                                                        {role === 'provider'
                                                            ? (booking.status === 'confirmed' ? 'Confirmed Booking' : 'New Booking Request')
                                                            : 'Booking Update'
                                                        }
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

                                                    {/* --- Postpone Flow --- */}
                                                    <AnimatePresence mode="wait">
                                                        {isPostponing ? (
                                                            postponeState.step === 'contact' ? (
                                                                <motion.div
                                                                    key="contact-step"
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -10 }}
                                                                    className="space-y-3"
                                                                >
                                                                    {/* Contact Customer First */}
                                                                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                                                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Contact Customer First</span>
                                                                        </div>
                                                                        <p className="text-xs text-amber-800 dark:text-amber-300/80 mb-3">
                                                                            Please call the customer to discuss rescheduling before setting a new date.
                                                                        </p>

                                                                        {customerPhone ? (
                                                                            <a
                                                                                href={`tel:${customerPhone}`}
                                                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
                                                                            >
                                                                                <Phone className="w-4 h-4" />
                                                                                Call {customerPhone}
                                                                            </a>
                                                                        ) : (
                                                                            <div className="text-xs text-amber-600 dark:text-amber-400 italic text-center py-2">
                                                                                No phone number available for this customer.
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={handleCancelPostpone}
                                                                            className="flex-1 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                        <button
                                                                            onClick={handleProceedToReschedule}
                                                                            className="flex-1 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                                                                        >
                                                                            Continue to Reschedule
                                                                            <ArrowRight className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            ) : (
                                                                <motion.div
                                                                    key="reschedule-step"
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -10 }}
                                                                >
                                                                    <PostponeDateTimePicker
                                                                        onSelect={handleDateSelected}
                                                                        onBack={() => setPostponeState({ ...postponeState, step: 'contact' })}
                                                                    />
                                                                </motion.div>
                                                            )
                                                        ) : (
                                                            /* --- Default Action Buttons --- */
                                                            role === 'provider' && booking.status !== 'cancelled' && (
                                                                <motion.div
                                                                    key="actions"
                                                                    initial={{ opacity: 0 }}
                                                                    animate={{ opacity: 1 }}
                                                                    className="flex gap-2 mt-2"
                                                                >
                                                                    {booking.status !== 'confirmed' && (
                                                                        <button
                                                                            onClick={() => onConfirm(booking.id)}
                                                                            className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                                                                        >
                                                                            Confirm
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleStartPostpone(booking.id)}
                                                                        className="flex-1 border border-neutral-200 dark:border-neutral-700 py-2 rounded-lg text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                                                    >
                                                                        Request Postpone
                                                                    </button>
                                                                </motion.div>
                                                            )
                                                        )}
                                                    </AnimatePresence>
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
