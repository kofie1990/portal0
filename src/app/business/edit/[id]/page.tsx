"use client";

import Navigation from "@/components/Navigation";
import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, MapPin, DollarSign, Store, Tag, Clock, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import CategorySelector from "@/components/CategorySelector";

const ALL_TIME_SLOTS = Array.from({ length: 48 }, (_, i) => { 
    const h = Math.floor(i / 2).toString().padStart(2, '0'); 
    const m = (i % 2 === 0 ? '00' : '30'); 
    return `${h}:${m}`; 
});

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        bio: "",
        description: "",
        bookingPolicies: "",
        locationType: "physical",
        address: "",
        phone: "",
        email: "",
        depositFee: "",
        website: "",
        instagram: "",
        facebook: "",
        timeSlots: { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
        serviceRadius: "",
        mapUrl: "",
        imageUrl: "",
        coverImage: ""
    });

    useEffect(() => {
        const fetchBusiness = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error("Error fetching business:", error);
                setLoading(false);
                // notFound(); // Handle gracefully or redirect
                return;
            }

            // Map DB columns to form state
            setFormData({
                name: data.name || "",
                category: data.category || "",
                bio: data.bio || "",
                description: data.description || "",
                bookingPolicies: data.booking_policies || "",
                locationType: data.location_type || "physical",
                address: data.location_address || "",
                phone: data.phone || "",
                email: data.email || "",
                depositFee: data.deposit_fee ? data.deposit_fee.toString() : "",
                website: data.website || "",
                instagram: data.social_links?.instagram || "",
                facebook: data.social_links?.facebook || "",
                timeSlots: data.time_slots || { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] },
                serviceRadius: data.service_radius || "",
                mapUrl: data.iframe_map_url || "",
                imageUrl: data.image_url || "",
                coverImage: data.cover_image_url || ""
            });
            setLoading(false);
        };

        fetchBusiness();
    }, [id, supabase]);

    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    const toggleTimeSlot = (day: string, time: string) => {
        const currentSlots = (formData.timeSlots as any)[day] || [];
        const isSelected = currentSlots.includes(time);
        
        let newSlots;
        if (isSelected) {
            newSlots = currentSlots.filter((t: string) => t !== time);
        } else {
            newSlots = [...currentSlots, time].sort();
        }

        setFormData(prev => ({
            ...prev,
            timeSlots: {
                ...prev.timeSlots,
                [day]: newSlots
            }
        }));
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const updates = {
            name: formData.name,
            category: formData.category,
            bio: formData.bio,
            description: formData.description,
            booking_policies: formData.bookingPolicies,
            location_address: formData.address,
            phone: formData.phone,
            email: formData.email,
            deposit_fee: formData.depositFee ? parseFloat(formData.depositFee) : 0,
            website: formData.website,
            social_links: {
                instagram: formData.instagram,
                facebook: formData.facebook
            },
            time_slots: formData.timeSlots,
            service_radius: formData.serviceRadius,
            iframe_map_url: formData.mapUrl
        };

        const { error } = await supabase
            .from('businesses')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error("Error saving business:", error);
            showToast("Error saving changes. Please try again.", "error");
            setIsSaving(false);
        } else {
            setIsSaving(false);
            showToast("Changes saved successfully!", "success");
            router.push(`/dashboard/${id}`);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>;
    }

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-28 pb-20 container-wide max-w-4xl mx-auto px-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <Link href={`/dashboard/${id}`} className="flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-xl font-bold">Edit Business Profile</h1>
                </div>

                <form onSubmit={handleSave} className="space-y-8">

                    {/* Cover & Profile Image Section (Read Only for now or need uploder) */}
                    {/* Note: Ideally we'd implement image upload here, but focusing on data binding first as per request */}
                    <div className="relative group cursor-pointer">
                        <div className="w-full h-48 bg-neutral-200 dark:bg-neutral-800 rounded-2xl overflow-hidden relative">
                            {formData.coverImage && (
                                <Image
                                    src={formData.coverImage}
                                    alt="Cover"
                                    fill
                                    className="object-cover opacity-50 group-hover:opacity-40 transition-opacity"
                                />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                    <Upload className="w-4 h-4" /> Change Cover (Coming Soon)
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-black bg-neutral-300 dark:bg-neutral-700 relative overflow-hidden group/profile cursor-pointer">
                                {formData.imageUrl && (
                                    <Image
                                        src={formData.imageUrl}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/profile:opacity-100 transition-opacity">
                                    <Upload className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8">

                        {/* Left Column: Navigation/Status (Simplistic) */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="glass-panel p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                                <h3 className="font-bold text-sm text-neutral-500 uppercase tracking-wider mb-4">Sections</h3>
                                <ul className="space-y-2">
                                    <li className="font-bold text-foreground cursor-pointer">General Info</li>
                                    <li className="text-neutral-500 hover:text-foreground cursor-pointer transition-colors">Contact Details</li>
                                    <li className="text-neutral-500 hover:text-foreground cursor-pointer transition-colors">Operating Hours</li>
                                    <li className="text-neutral-500 hover:text-foreground cursor-pointer transition-colors">Business Settings</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Column: Form Fields */}
                        <div className="md:col-span-2 space-y-8">

                            {/* General Info */}
                            <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Store className="w-5 h-5" /> General Information
                                </h2>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">BUSINESS NAME</label>
                                    <input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">CATEGORY</label>
                                    <CategorySelector 
                                        value={formData.category}
                                        onChange={(val) => setFormData({ ...formData, category: val })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">TAGLINE / BIO</label>
                                    <input
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        placeholder="Short catchy slogan"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">DESCRIPTION</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                        placeholder="Briefly describe what your business does..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">CANCELLATION & BOOKING POLICIES</label>
                                    <textarea
                                        rows={2}
                                        value={formData.bookingPolicies}
                                        onChange={(e) => setFormData({ ...formData, bookingPolicies: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                        placeholder="e.g. Needs 24hr notice for cancellations, no refunds on deposits..."
                                    />
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <MapPin className="w-5 h-5" /> Contact & Location
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">PHONE</label>
                                        <input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">EMAIL</label>
                                        <input
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">ADDRESS</label>
                                    <input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">WEBSITE</label>
                                    <input
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://"
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">INSTAGRAM</label>
                                        <input
                                            value={formData.instagram}
                                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                            placeholder="@username"
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold ml-1">FACEBOOK</label>
                                        <input
                                            value={formData.facebook}
                                            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                            placeholder="facebook.com/username"
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-900">
                                    <label className="text-sm font-bold ml-1">GOOGLE MAPS EMBED URL (Optional)</label>
                                    <input
                                        value={formData.mapUrl}
                                        onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        placeholder="<iframe src='...'>"
                                    />
                                    <p className="text-xs text-neutral-500 ml-1">Paste the embed code from Google Maps to show your exact location on page.</p>
                                </div>
                            </div>

                            {/* Time Slots */}
                            <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Clock className="w-5 h-5" /> Booking Time Blocks
                                </h2>
                                 <p className="text-sm text-neutral-500">Select the specific 30-minute intervals you are available for bookings to automatically generate time slots for customers.</p>

                                <div className="space-y-0 relative border border-neutral-100 dark:border-neutral-900 rounded-xl px-4">
                                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                                        const isExpanded = expandedDay === day;
                                        const daySlots = (formData.timeSlots as any)[day] || [];
                                        return (
                                            <div key={day} className="border-b border-neutral-100 dark:border-neutral-900 last:border-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedDay(isExpanded ? null : day)}
                                                    className="w-full flex items-center justify-between py-4 font-bold uppercase text-sm hover:text-neutral-500 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span>{day}</span>
                                                        <span className="text-xs font-normal text-neutral-400 normal-case bg-neutral-50 dark:bg-neutral-900 px-3 py-1 rounded-full">
                                                            {daySlots.length > 0 ? `${daySlots.length} slots matching` : 'No slots active'}
                                                        </span>
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </button>
                                                
                                                {isExpanded && (
                                                    <div className="pb-6 pt-2">
                                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                                            {ALL_TIME_SLOTS.map(time => {
                                                                const isSelected = daySlots.includes(time);
                                                                return (
                                                                    <button
                                                                        key={time}
                                                                        type="button"
                                                                        onClick={() => toggleTimeSlot(day, time)}
                                                                        className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                                                                            isSelected
                                                                                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                                                                                : "bg-transparent text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:border-black dark:hover:border-white"
                                                                        }`}
                                                                    >
                                                                        {time}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <DollarSign className="w-5 h-5" /> Settings
                                </h2>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">DEPOSIT FEE (GH₵)</label>
                                    <input
                                        type="number"
                                        value={formData.depositFee}
                                        onChange={(e) => setFormData({ ...formData, depositFee: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-neutral-500 ml-1">Non-refundable fee charged at booking.</p>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-neutral-900">
                                    <label className="text-sm font-bold ml-1">SERVICE RADIUS</label>
                                    <input
                                        value={formData.serviceRadius}
                                        onChange={(e) => setFormData({ ...formData, serviceRadius: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        placeholder="e.g. Within 10km of my location"
                                    />
                                    <p className="text-xs text-neutral-500 ml-1">Let customers know how far you're willing to travel for service.</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full sticky bottom-6 bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-2xl"
                            >
                                {isSaving ? "SAVING..." : (
                                    <>
                                        <Save className="w-4 h-4" /> SAVE CHANGES
                                    </>
                                )}
                            </button>

                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}
