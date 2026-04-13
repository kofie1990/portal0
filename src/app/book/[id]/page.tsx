"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, MapPin, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import Navigation from "@/components/Navigation";
import { createBookingAction, fetchServiceBookings } from "@/app/actions/booking";

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [service, setService] = useState<any>(null);
    // REMOVED: const [bookingDate, setBookingDate] = useState(""); 

    // New State for Custom Picker
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [existingBookings, setExistingBookings] = useState<any[]>([]);

    // State for User & Guest
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [guestPhone, setGuestPhone] = useState("");

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCurrentUser(user);
        });
    }, [supabase]);

    // Helper: Generate Dates
    const getAvailableDates = () => {
        const today = new Date();
        const outputDates = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            outputDates.push({
                fullDate: d,
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                date: d.getDate().toString(),
                month: d.toLocaleDateString('en-US', { month: 'short' })
            });
        }
        return outputDates;
    };

    const dates = getAvailableDates();
    const times = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

    useEffect(() => {
        const fetchService = async () => {
            const { data, error } = await supabase
                .from('services')
                .select('*, businesses(name, id), profiles(full_name, id)')
                .eq('id', id)
                .single();

            if (error) {
                console.error(error);
                showToast("Service not found", "error");
                router.push("/");
                return;
            }
            setService(data);
            setIsLoading(false);
        };
        fetchService();
    }, [id, supabase, router, showToast]);

    // Fetch Bookings for Capacity
    useEffect(() => {
        const fetchBookings = async () => {
            if (!service) return;

            const startDate = dates[0].fullDate.toISOString();
            const endDate = dates[dates.length - 1].fullDate.toISOString();

            const { data, error } = await fetchServiceBookings(service.id, startDate, endDate);

            if (error) {
                console.error("Failed to fetch capacity:", error);
            } else if (data) {
                setExistingBookings(data as any[]);
            }
        };
        if (service) fetchBookings();
    }, [service, supabase]);

    const getSlotInfo = (dateStr: string, time: string) => {
        if (!service) return { available: true, count: 0, max: 1 };

        const slotDate = new Date(`${dateStr} ${time}`);

        const slotBookings = existingBookings.filter(b => {
            const bDate = new Date(b.booking_date);
            return bDate.getFullYear() === slotDate.getFullYear() &&
                bDate.getMonth() === slotDate.getMonth() &&
                bDate.getDate() === slotDate.getDate() &&
                bDate.getHours() === slotDate.getHours() &&
                bDate.getMinutes() === slotDate.getMinutes();
        });

        const limit = service.max_bookings_per_slot || 1;
        return {
            available: slotBookings.length < limit,
            count: slotBookings.length,
            max: limit
        };
    };

    const handleBooking = async () => {
        if (!selectedDate || !selectedTime) {
            showToast("Please select a date and time.", "error");
            return;
        }

        setIsBooking(true);
        try {
            const userId = currentUser?.id || null;

            if (!userId) {
                if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
                    showToast("Please fill in all your contact details to proceed.", "error");
                    setIsBooking(false);
                    return;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(guestEmail)) {
                    showToast("Please enter a valid email address.", "error");
                    setIsBooking(false);
                    return;
                }
            }

            const deposit = service.deposit_amount || 0;
            const total = service.price_amount;

            // 0. Check Capacity
            const bookingISO = new Date(`${selectedDate} ${selectedTime}`).toISOString();
            const { count, error: countError } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('service_id', service.id)
                .eq('booking_date', bookingISO)
                .in('status', ['pending_payment', 'confirmed']);

            if (countError) {
                console.error("Capacity check failed", countError);
                // Proceed with caution or fail? Let's fail safe.
                showToast("Could not verify availability. Please try again.", "error");
                setIsBooking(false);
                return;
            }

            const limit = service.max_bookings_per_slot || 1;
            if (count !== null && count >= limit) {
                showToast(`This time slot is fully booked (Max ${limit}). Please choose another time.`, "error");
                setIsBooking(false);
                return;
            }

            // 1. Create Booking (Pending Payment) via Server Action (Bypasses RLS for Anon)
            const { data: bookingData, error: bookingError } = await createBookingAction({
                user_id: userId,
                guest_name: userId ? null : guestName.trim(),
                guest_email: userId ? null : guestEmail.trim().toLowerCase(),
                guest_phone: userId ? null : guestPhone.trim(),
                service_id: service.id,
                business_id: service.business_id,
                provider_id: service.profile_id,
                booking_date: bookingISO,
                status: 'pending_payment',
                total_amount: total,
                amount_paid: 0,
                notes: "Booking initialized",
            });

            if (bookingError || !bookingData) throw new Error(bookingError || "Failed to create booking");

            const emailToUse = currentUser?.email || guestEmail.trim().toLowerCase();

            // 2. Initialize Paystack
            const res = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailToUse,
                    amount: deposit, // Paystack expects amount in main currency if logic in API handles *100.
                    metadata: {
                        booking_id: bookingData.id,
                        vendorId: service.business_id || service.profile_id, // For split payments if needed
                        custom_fields: [
                            {
                                display_name: "Service",
                                variable_name: "service",
                                value: service.name
                            }
                        ]
                    }
                })
            });

            const paystackData = await res.json();

            if (!res.ok) {
                throw new Error(paystackData.error || "Payment initialization failed");
            }

            // 3. Redirect to Paystack
            if (paystackData.authorization_url) {
                router.push(paystackData.authorization_url);
            } else {
                throw new Error("No payment URL received");
            }

        } catch (error: any) {
            console.error(error);
            showToast(error.message || "Booking failed", "error");
            setIsBooking(false); // Only reset if error. If redirecting, keep loading? 
            // Better to keep loading so user doesn't click again while redirect happens.
            // But if router.push takes time, maybe unsafe.
            // Let's reset isBooking if error.
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>;
    }

    if (!service) return null;

    const depositAmount = service.deposit_amount || 0;
    const remainingAmount = service.price_amount - depositAmount;

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <div className="pt-28 pb-20 container-wide max-w-4xl mx-auto px-6">

                <Link href={`/service/${id}`} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-black dark:hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to Service
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Left: Service Details */}
                    <div className="space-y-8">
                        <div>
                            <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase mb-2 block">{service.category}</span>
                            <h1 className="text-4xl font-heading font-bold mb-4">{service.name}</h1>
                            <div className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                {service.businesses?.name || service.profiles?.full_name}
                            </div>
                        </div>

                        <div className="aspect-video relative rounded-3xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                            {(service.image_url || (service.images && service.images[0])) ? (
                                <Image src={service.image_url || service.images[0]} alt={service.name} fill className="object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-neutral-400">No Image</div>
                            )}
                        </div>

                        <div className="flex flex-col gap-4 p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Secure Booking</h3>
                                    <p className="text-xs text-neutral-500 mt-1">Your deposit is held securely until the booking is confirmed.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Booking Form */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl">
                            <h2 className="font-heading text-xl font-bold mb-6">Confirm Booking</h2>

                            <div className="space-y-6">
                                {/* Date & Time Selection */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-sm font-bold ml-1 mb-3 block">SELECT DATE</label>
                                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                            {dates.map((d) => {
                                                const dateStr = d.fullDate.toDateString();
                                                const isSelected = selectedDate === (d.date + " " + d.month + " " + d.fullDate.getFullYear());
                                                return (
                                                    <button
                                                        key={dateStr}
                                                        onClick={() => setSelectedDate(d.date + " " + d.month + " " + d.fullDate.getFullYear())}
                                                        className={`min-w-[70px] p-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all flex-shrink-0 ${isSelected
                                                            ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                                                            : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300"
                                                            }`}
                                                    >
                                                        <span className="text-[10px] font-bold uppercase opacity-70">{d.month}</span>
                                                        <span className="text-lg font-bold">{d.date}</span>
                                                        <span className="text-[10px] font-bold uppercase">{d.day}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold ml-1 mb-3 block">SELECT TIME</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {times.map((t) => {
                                                const slotInfo = selectedDate ? getSlotInfo(selectedDate, t) : { available: true, count: 0, max: 1 };
                                                const isAvailable = slotInfo.available;
                                                const isSelected = selectedTime === t;

                                                return (
                                                    <button
                                                        key={t}
                                                        disabled={!isAvailable}
                                                        onClick={() => setSelectedTime(t)}
                                                        className={`py-2 rounded-xl text-xs font-bold border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${isSelected
                                                            ? "border-black dark:border-white bg-neutral-100 dark:bg-neutral-900"
                                                            : !isAvailable
                                                                ? "border-neutral-100 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700 cursor-not-allowed bg-neutral-50 dark:bg-neutral-900/50"
                                                                : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300"
                                                            }`}
                                                    >
                                                        <span>{t}</span>
                                                        {selectedDate && (
                                                            <span className={`text-[9px] font-normal ${!isAvailable ? 'text-red-400' : 'text-neutral-400'}`}>
                                                                {!isAvailable ? "Full" : `${slotInfo.count}/${slotInfo.max} Booked`}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {/* Guest Contact Details (Only show if not logged in) */}
                                {!currentUser && (
                                    <div className="space-y-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                                        <h3 className="font-bold text-sm">CONTACT DETAILS</h3>
                                        <div className="grid gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Full Name</label>
                                                <input 
                                                    type="text" 
                                                    value={guestName}
                                                    onChange={e => setGuestName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Email Address</label>
                                                    <input 
                                                        type="email" 
                                                        value={guestEmail}
                                                        onChange={e => setGuestEmail(e.target.value)}
                                                        placeholder="john@example.com"
                                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-neutral-500 mb-1.5 block">Phone Number</label>
                                                    <input 
                                                        type="tel" 
                                                        value={guestPhone}
                                                        onChange={e => setGuestPhone(e.target.value)}
                                                        placeholder="+233 XX XXX XXXX"
                                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Price Breakdown */}
                                <div className="space-y-3 py-6 border-t border-b border-neutral-100 dark:border-neutral-800">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-500">Service Price</span>
                                        <span className="font-medium">GH₵{service.price_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-green-600 font-bold">
                                        <span>Deposit Required (Now)</span>
                                        <span>GH₵{depositAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-neutral-400">
                                        <span>Due after service</span>
                                        <span>GH₵{remainingAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total to Pay Now</span>
                                    <span>GH₵{depositAmount.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleBooking}
                                    disabled={isBooking}
                                    className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold tracking-wide hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                                >
                                    {isBooking ? (
                                        <Loader2 className="animate-spin w-5 h-5" />
                                    ) : (
                                        <>PAY DEPOSIT & BOOK</>
                                    )}
                                </button>
                                <p className="text-xs text-center text-neutral-400">By booking, you agree to our Terms of Service.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
