"use client";

import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Check, CreditCard, Info, ChevronRight, User, Loader2 } from "lucide-react";
import Image from "next/image";
import { MOCK_BUSINESSES } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { fetchBusinessBookings, createBookingAction } from "@/app/actions/booking";
import { useToast } from "@/components/ui/Toast";
import { calculateTotalCharge } from "@/lib/platformFee";

function BookingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { showToast } = useToast();
    const businessId = searchParams.get("businessId") || searchParams.get("vendorId");
    const serviceName = searchParams.get('service');

    // Fetch vendor from Supabase
    const supabase = createClient();
    const [vendor, setVendor] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);

    // Form State
    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [userDetails, setUserDetails] = useState({ name: '', phone: '', email: '' });

    // Calendar Utility
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
    
    const getTimesForSelectedDate = () => {
        if (!selectedDate || !vendor || !vendor.time_slots) {
            return ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
        }

        const dateObj = new Date(selectedDate);
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayStr = dayNames[dateObj.getDay()];

        const slots = vendor.time_slots[dayStr];
        if (Array.isArray(slots) && slots.length > 0) {
            return slots;
        }

        return []; 
    };

    const times = getTimesForSelectedDate();

    // Booking Capacity Logic
    const [existingBookings, setExistingBookings] = useState<any[]>([]);

    // Fetch Bookings Effect
    useEffect(() => {
        const fetchBookings = async () => {
            if (!businessId || !vendor) return;

            const startDate = dates[0].fullDate.toISOString();
            const endDate = dates[dates.length - 1].fullDate.toISOString();

            const { data, error } = await fetchBusinessBookings(businessId, startDate, endDate);

            if (error) {
                console.error("Failed to fetch capacity:", error);
            } else if (data) {
                setExistingBookings(data as any[]);
            }
        };

        if (vendor) {
            fetchBookings();
        }
    }, [businessId, vendor, supabase]);

    // Fetch User Profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserDetails({
                        name: profile.full_name || '',
                        phone: profile.phone || '',
                        email: profile.email || user.email || ''
                    });
                }
            }
        };
        fetchUserProfile();
    }, []);

    useEffect(() => {
        const fetchVendor = async () => {
            if (!businessId) return;

            const { data, error } = await supabase
                .from('businesses')
                .select('*, services(*)')
                .eq('id', businessId)
                .single();

            if (data && !error) {
                setVendor({
                    ...data,
                    // Ensure depositFee is number
                    depositFee: data.deposit_fee,
                    services: data.services?.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        price: `${s.price_currency || 'GH₵'} ${s.price_amount}`,
                        amount: s.price_amount, // Store raw amount for calc
                        duration: s.duration_text,
                        max_bookings_per_slot: s.max_bookings_per_slot // Added
                    }))
                });
            } else {
                setPageError("Business not found");
            }
            setLoading(false);
        };
        fetchVendor();
    }, [businessId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>;
    if (pageError || !vendor) return <div className="min-h-screen flex items-center justify-center">{pageError || "Vendor not found"}</div>;


    const services = vendor.services || [];

    const getSlotInfo = (dateStr: string, time: string) => {
        if (!selectedService) return { available: true, count: 0, max: 1 };

        const slotDate = new Date(`${dateStr} ${time}`);

        const slotBookings = existingBookings.filter(b => {
            if (b.service_id !== selectedService.id) return false;

            const bDate = new Date(b.booking_date);
            return bDate.getFullYear() === slotDate.getFullYear() &&
                bDate.getMonth() === slotDate.getMonth() &&
                bDate.getDate() === slotDate.getDate() &&
                bDate.getHours() === slotDate.getHours() &&
                bDate.getMinutes() === slotDate.getMinutes();
        });

        const limit = selectedService.max_bookings_per_slot || 1;
        return {
            available: slotBookings.length < limit,
            count: slotBookings.length,
            max: limit
        };
    };






    // Platform fee calculation for display
    const bookingFee = vendor.depositFee > 0 ? vendor.depositFee : selectedService?.amount || 0;
    const chargeBreakdown = calculateTotalCharge(bookingFee);

    const handlePayment = async () => {
        setProcessing(true);
        try {
            // 1. Check Auth
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || null;

            if (!userId) {
                if (!userDetails.name.trim() || !userDetails.phone.trim() || !userDetails.email.trim()) {
                    showToast("Please fill in all your contact details (Name, Email, Phone) to proceed.", "error");
                    setProcessing(false);
                    return;
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(userDetails.email)) {
                    showToast("Please enter a valid email address.", "error");
                    setProcessing(false);
                    return;
                }
            }

            // Calculate Amount (Deposit or Full) + Platform Fee
            const amountToPay = chargeBreakdown.totalCharge;
            const platformFeeInPesewas = Math.round(chargeBreakdown.platformFee * 100);

            // 2. Create Booking Record (Bypasses RLS for Anon via Server Action)
            const { data: bookingData, error: bookingError } = await createBookingAction({
                user_id: userId,
                guest_name: userId ? null : userDetails.name.trim(),
                guest_email: userId ? null : userDetails.email.trim().toLowerCase(),
                guest_phone: userId ? null : userDetails.phone.trim(),
                business_id: vendor.id,
                provider_id: null,
                service_id: selectedService.id,
                booking_date: new Date(`${selectedDate} ${selectedTime}`).toISOString(), // Naive Date Convert
                status: 'pending_payment',
                total_amount: selectedService.amount,
                amount_paid: 0,
                platform_fee: chargeBreakdown.platformFee,
                notes: `Booking for ${selectedService.name} on ${selectedDate} at ${selectedTime}`,
            });

            if (bookingError || !bookingData) throw new Error(bookingError || "Failed to create booking");

            // 3. Initialize Paystack
            // transaction_charge tells Paystack how much (in pesewas) goes to the main/platform account.
            // The rest goes to the provider's subaccount.
            const res = await fetch('/api/paystack/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userDetails.email.trim() || user?.email,
                    amount: amountToPay,
                    subaccount: vendor.paystack_subaccount_code,
                    transaction_charge: platformFeeInPesewas,
                    metadata: {
                        booking_id: bookingData.id, // Important for callback
                        vendorId: vendor.id,
                        business_id: vendor.id,
                        custom_fields: [
                            {
                                display_name: "Service",
                                variable_name: "service",
                                value: selectedService.name
                            }
                        ]
                    }
                })
            });
            const data = await res.json();
            if (res.ok && data.authorization_url) {
                window.location.href = data.authorization_url;
            } else {
                showToast(`Payment initialization failed: ${data.error || "Unknown error"}`, "error");
                setProcessing(false);
            }
        } catch (e: any) {
            console.error(e);
            showToast(`An error occurred: ${e.message}`, "error");
            setProcessing(false);
        }
    };

    const handleNext = () => {
        if (step === 1 && !selectedService) return;
        if (step === 2 && (!selectedDate || !selectedTime)) return;
        if (step === 3) {
            // Trigger Payment
            handlePayment();
        } else {
            setStep(step + 1);
        }
    };

    return (
        <div className="pt-24 pb-20 container-wide max-w-4xl mx-auto px-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white mb-8 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Store
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Steps & Info */}
                <div className="md:col-span-1 space-y-6">
                    <div>
                        <h1 className="font-heading text-4xl font-bold mb-2">Book Appointment</h1>
                        <p className="text-neutral-500">at {vendor.name}</p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <StepIndicator current={step} number={1} label="Select Service" />
                        <StepIndicator current={step} number={2} label="Date & Time" />
                        <StepIndicator current={step} number={3} label="Your Details" />
                    </div>
                </div>

                {/* Right: Content Card */}
                <div className="md:col-span-2">
                    <div className="glass-panel p-6 md:p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 relative min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-4 pb-24"
                                >
                                    <h2 className="text-xl font-bold mb-6">Select a Service</h2>
                                    <div className="grid gap-4">
                                        {services.map((service: any, idx: number) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedService(service)}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedService?.name === service.name
                                                    ? "border-black dark:border-white bg-neutral-50 dark:bg-neutral-900"
                                                    : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300"
                                                    }`}
                                            >
                                                <div>
                                                    <h3 className="font-bold">{service.name}</h3>
                                                    <p className="text-sm text-neutral-500">{service.duration}</p>
                                                </div>
                                                <div className="font-bold">{service.price}</div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8 pb-24"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold mb-4">Select Date</h2>
                                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                            {dates.map((d) => {
                                                const dateStr = d.fullDate.toDateString();
                                                return (
                                                    <button
                                                        key={dateStr}
                                                        onClick={() => setSelectedDate(d.date + " " + d.month + " " + d.fullDate.getFullYear())}
                                                        className={`min-w-[80px] p-4 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all flex-shrink-0 ${selectedDate === (d.date + " " + d.month + " " + d.fullDate.getFullYear())
                                                            ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                                                            : "border-neutral-100 dark:border-neutral-800"
                                                            }`}
                                                    >
                                                        <span className="text-xs font-bold uppercase opacity-70">{d.month}</span>
                                                        <span className="text-xl font-bold">{d.date}</span>
                                                        <span className="text-xs font-bold uppercase">{d.day}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold mb-4">Select Time</h2>
                                        {times.length > 0 ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {times.map((t: string) => {
                                                    const slotInfo = selectedDate ? getSlotInfo(selectedDate, t) : { available: true, count: 0, max: 1 };
                                                    const isAvailable = slotInfo.available;

                                                    return (
                                                        <button
                                                            key={t}
                                                            disabled={!isAvailable}
                                                            onClick={() => setSelectedTime(t)}
                                                            className={`py-3 rounded-xl text-sm font-bold border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${selectedTime === t
                                                                ? "border-black dark:border-white bg-neutral-100 dark:bg-neutral-900"
                                                                : !isAvailable
                                                                    ? "border-neutral-100 dark:border-neutral-800 text-neutral-300 dark:text-neutral-700 cursor-not-allowed decoration-slice bg-neutral-50 dark:bg-neutral-900/50"
                                                                    : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300"
                                                                }`}
                                                        >
                                                            <span>{t}</span>
                                                            {selectedDate && (
                                                                <span className={`text-[10px] font-normal ${!isAvailable ? 'text-red-400' : 'text-neutral-400'}`}>
                                                                    {!isAvailable ? "Full" : `${slotInfo.count}/${slotInfo.max} Booked`}
                                                                </span>
                                                            )}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl text-center text-sm text-neutral-500 border border-neutral-100 dark:border-neutral-800">
                                                {selectedDate ? "No time slots available for this day." : "Please select a date first."}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 pb-24"
                                >
                                    <h2 className="text-xl font-bold mb-6">Confirm Details</h2>

                                    <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-2xl space-y-4 mb-6">
                                        <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                                            <span className="text-neutral-500">Service</span>
                                            <span className="font-bold">{selectedService?.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                                            <span className="text-neutral-500">Date</span>
                                            <span className="font-bold">{selectedDate}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                                            <span className="text-neutral-500">Time</span>
                                            <span className="font-bold">{selectedTime}</span>
                                        </div>
                                        {vendor.depositFee > 0 && (
                                            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-neutral-500">Booking Fee</span>
                                                    <div className="group relative">
                                                        <Info className="w-4 h-4 text-neutral-400 cursor-help" />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center z-10">
                                                            Non-refundable deposit to secure your slot. Deducted from total.
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-foreground">GH₵ {vendor.depositFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-neutral-500">Platform Fee</span>
                                                <div className="group relative">
                                                    <Info className="w-4 h-4 text-neutral-400 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center z-10">
                                                        {vendor.depositFee > 0 ? '10% service fee on your booking' : 'Flat service fee for this booking'}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="font-bold text-foreground">GH₵ {chargeBreakdown.platformFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="font-bold text-lg">Total to Pay</span>
                                            <span className="font-bold text-lg">GH₵ {chargeBreakdown.totalCharge.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold ml-1">FULL NAME</label>
                                            <input
                                                className="w-full bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white"
                                                placeholder="John Doe"
                                                value={userDetails.name}
                                                onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold ml-1">EMAIL ADDRESS</label>
                                            <input
                                                type="email"
                                                className="w-full bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white"
                                                placeholder="john@example.com"
                                                value={userDetails.email}
                                                onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold ml-1">PHONE NUMBER</label>
                                            <input
                                                className="w-full bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white"
                                                placeholder="+233 XX XXX XXX"
                                                value={userDetails.phone}
                                                onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-center">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="text-sm font-bold text-neutral-500 hover:text-black dark:hover:text-white"
                                >
                                    BACK
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                disabled={
                                    (step === 1 && !selectedService) ||
                                    (step === 2 && (!selectedDate || !selectedTime)) ||
                                    processing
                                }
                                className={`ml-auto bg-foreground text-background px-8 py-4 rounded-full font-bold tracking-wide transition-all flex items-center gap-2 ${(step === 1 && !selectedService) || (step === 2 && (!selectedDate || !selectedTime)) || processing
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:scale-105"
                                    }`}
                            >
                                {processing ? "PROCESSING..." : step === 3 ? `PAY GH₵ ${chargeBreakdown.totalCharge.toFixed(2)} & BOOK` : "CONTINUE"}
                                {step < 3 && !processing && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepIndicator({ current, number, label }: { current: number, number: number, label: string }) {
    const isActive = current >= number;
    const isCurrent = current === number;

    return (
        <div className={`flex items-center gap-4 transition-colors ${isActive ? "text-foreground" : "text-neutral-300 dark:text-neutral-700"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${isCurrent
                ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                : isActive
                    ? "border-black dark:border-white text-foreground"
                    : "border-current"
                }`}>
                {isActive && !isCurrent ? <Check className="w-4 h-4" /> : number}
            </div>
            <span className="font-bold text-sm tracking-wide">{label}</span>
        </div>
    );
}

export default function BookingPage() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
                <BookingContent />
            </Suspense>
        </main>
    )
}
