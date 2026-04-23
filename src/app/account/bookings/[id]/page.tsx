"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle, Star, MessageSquare, ShieldCheck, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Navigation from "@/components/Navigation";
import { completeBooking, submitReview } from "@/app/actions/booking";
import { useToast } from "@/components/ui/Toast";
import { MapItem } from "@/components/InteractiveMap";

// Dynamic import for Map to avoid SSR issues
const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-neutral-100 dark:bg-neutral-900 animate-pulse rounded-xl" />
});

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [booking, setBooking] = useState<any>(null);
    const [reviewMode, setReviewMode] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; action: 'complete' | 'cancel' | null }>({ isOpen: false, title: "", message: "", action: null });

    useEffect(() => {
        const fetchBooking = async () => {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    services (name, image_url, price_amount, price_currency, duration_text, lat, lng, location_text),
                    businesses (name, location_address, image_url, phone, email, lat, lng),
                    profiles:profiles!provider_id (full_name, avatar_url, phone, email, lat, lng)
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error(error);
                router.push("/account");
                return;
            }
            setBooking(data);
            setIsLoading(false);
        };

        fetchBooking();
    }, [id, supabase, router]);

    const handleCompletePrompt = () => setConfirmModal({ isOpen: true, title: "Complete Service", message: "Confirm that this service has been completed?", action: 'complete' });
    const handleCancelPrompt = () => setConfirmModal({ isOpen: true, title: "Cancel Booking", message: "Are you sure you want to cancel this booking? This action cannot be undone.", action: 'cancel' });

    const executeAction = async () => {
        const action = confirmModal.action;
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (!action) return;

        setIsSubmitting(true);
        if (action === 'complete') {
            const result = await completeBooking(id);
            if (result.success) {
                setBooking((prev: any) => ({ ...prev, status: 'completed' }));
                showToast("Service marked as completed", "success");
            } else {
                showToast(result.error || "Failed text", "error");
            }
        } else if (action === 'cancel') {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) {
                showToast("Failed to cancel booking: " + error.message, "error");
            } else {
                setBooking((prev: any) => ({ ...prev, status: 'cancelled' }));
                showToast("Booking cancelled successfully", "success");
            }
        }
        setIsSubmitting(false);
    };

    const handleReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await submitReview(id, rating, comment);
        setIsSubmitting(false);

        if (result.success) {
            showToast("Review submitted!", "success");
            setReviewMode(false);
            // Ideally re-fetch or just hide form, knowing review is done. 
            // Since we don't fetch "my review" in the initial query, we just hide the form.
        } else {
            showToast(result.error || "Failed", "error");
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-background text-foreground font-sans">
                <Navigation />
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="animate-spin text-neutral-400 w-8 h-8" />
                </div>
            </main>
        );
    }

    if (!booking) return null;

    const providerName = booking.businesses?.name || booking.profiles?.full_name;
    const providerImage = booking.businesses?.image_url || booking.profiles?.avatar_url;

    // Prioritize Service Location -> Business Location -> Profile Location
    const locationName = booking.services?.location_text || booking.businesses?.location_address;
    const lat = booking.services?.lat || booking.businesses?.lat || booking.profiles?.lat;
    const lng = booking.services?.lng || booking.businesses?.lng || booking.profiles?.lng;
    const hasLocation = lat && lng;

    const mapItems: MapItem[] = hasLocation ? [{
        id: booking.services?.id || booking.businesses?.id || booking.profiles?.id || 'location',
        lat,
        lng,
        name: booking.services?.name || providerName || 'Service Location',
        type: 'service_item',
        image: booking.services?.image_url || providerImage
    }] : [];

    return (
        <main className="min-h-screen bg-background text-foreground font-sans relative">
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
                        <h3 className="font-heading text-xl font-bold mb-2">{confirmModal.title}</h3>
                        <p className="text-neutral-500 mb-6 text-sm">{confirmModal.message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl font-bold text-sm transition-colors text-black dark:text-white"
                            >
                                No, Go Back
                            </button>
                            <button
                                onClick={executeAction}
                                className={`flex-1 py-3 text-white rounded-xl font-bold text-sm transition-colors ${confirmModal.action === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                Yes, Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Navigation />
            <div className="pt-28 pb-20 container-wide max-w-4xl mx-auto px-6">

                <Link href="/account" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-black dark:hover:text-white transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to My Bookings
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 overflow-hidden">
                            {booking.services?.image_url && (
                                <div className="w-full h-48 md:h-64 relative rounded-2xl overflow-hidden mb-6 bg-neutral-100">
                                    <Image
                                        src={booking.services.image_url}
                                        alt={booking.services.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                            booking.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {booking.status.replace('_', ' ')}
                                    </span>
                                    <h1 className="text-3xl font-heading font-bold mt-4 mb-2">{booking.services?.name}</h1>
                                    <p className="text-neutral-500">Booking Reference: <span className="font-mono text-black dark:text-white">{booking.paystack_reference || "N/A"}</span></p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                                    <Calendar className="w-5 h-5 text-neutral-500" />
                                    <div>
                                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Date</p>
                                        <p className="font-medium">{new Date(booking.booking_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                                    <Clock className="w-5 h-5 text-neutral-500" />
                                    <div>
                                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Time</p>
                                        <p className="font-medium">{new Date(booking.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="mb-8">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5" /> Location
                                </h3>
                                <p className="text-neutral-600 dark:text-neutral-400 mb-4">{locationName || "Location provided by service provider"}</p>

                                {hasLocation ? (
                                    <div className="w-full h-64 bg-neutral-100 dark:bg-neutral-900 rounded-2xl overflow-hidden relative z-0">
                                        <InteractiveMap
                                            items={mapItems}
                                            center={{ lat, lng }}
                                            zoom={15}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-48 bg-neutral-100 dark:bg-neutral-900 rounded-xl flex items-center justify-center text-neutral-400 text-sm">
                                        Map View Unavailable
                                    </div>
                                )}
                            </div>

                            {/* Breakdown */}
                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-6">
                                <h3 className="font-bold text-lg mb-4">Payment Summary</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Service Cost</span>
                                        <span>{booking.services?.price_currency} {booking.services?.price_amount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-green-600">
                                        <span>Amount Paid</span>
                                        <span>{booking.services?.price_currency} {booking.amount_paid || 0}</span>
                                    </div>
                                    {booking.platform_fee > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-neutral-500">Platform Fee (incl.)</span>
                                            <span>{booking.services?.price_currency} {booking.platform_fee.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 mt-2">
                                        <span>Total</span>
                                        <span>{booking.services?.price_currency} {booking.services?.price_amount}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Review Section */}
                        {booking.status === 'completed' && (
                            <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8">
                                <h3 className="font-heading text-xl font-bold mb-4">Review & Feedback</h3>
                                {!reviewMode ? (
                                    <div className="text-center py-6">
                                        <p className="text-neutral-500 mb-4">How was your experience?</p>
                                        <button
                                            onClick={() => setReviewMode(true)}
                                            className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-opacity"
                                        >
                                            <Star className="w-4 h-4 inline-block mr-2" /> Write a Review
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleReview} className="space-y-4">
                                        <div>
                                            <label className="text-sm font-bold block mb-2">Rating</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setRating(star)}
                                                        className={`p-2 rounded-lg transition-colors ${rating >= star ? 'text-yellow-400 bg-yellow-400/10' : 'text-neutral-300 bg-neutral-100 dark:bg-neutral-900'}`}
                                                    >
                                                        <Star className="w-6 h-6 fill-current" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold block mb-2">Comment</label>
                                            <textarea
                                                required
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 min-h-[100px] outline-none focus:ring-2 ring-black dark:ring-white"
                                                placeholder="Tell us about your experience..."
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setReviewMode(false)}
                                                className="px-6 py-3 bg-neutral-100 dark:bg-neutral-900 rounded-xl font-bold"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Review"}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Actions */}
                    <div className="md:col-span-1 space-y-6">
                        {/* Provider Card */}
                        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Service Provider</h3>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-neutral-200 rounded-full relative overflow-hidden">
                                    {providerImage ? (
                                        <Image src={providerImage} alt={providerName || "Provider"} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-neutral-400">
                                            {providerName?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold">{providerName}</p>
                                    <p className="text-xs text-neutral-500">Verified Provider</p>
                                </div>
                            </div>
                            <button className="w-full py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                                Message Provider
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6">
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Actions</h3>

                            {booking.status === 'confirmed' && (
                                <button
                                    onClick={handleCompletePrompt}
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mb-3 disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Mark Completed</>}
                                </button>
                            )}

                            {booking.status === 'completed' && (
                                <div className="p-3 bg-green-50 text-green-700 rounded-xl text-center text-sm font-bold mb-3 flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Service Completed
                                </div>
                            )}

                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                <button 
                                    onClick={handleCancelPrompt}
                                    disabled={isSubmitting}
                                    className="w-full py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                                >
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
