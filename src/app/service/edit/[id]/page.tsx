"use client";

import Navigation from "@/components/Navigation";
import { use, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Trash2, Repeat, Upload, DollarSign, Tag, MapPin, AlertTriangle, Check, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { useToast } from "@/components/ui/Toast";

type Service = Database['public']['Tables']['services']['Row'] & {
    businesses: { id: string; name: string } | null;
};

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [service, setService] = useState<Service | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [location, setLocation] = useState("");
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);

    // Image Upload
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modals
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [myBusinesses, setMyBusinesses] = useState<{ id: string; name: string }[]>([]);
    const [selectedTransferTarget, setSelectedTransferTarget] = useState("");

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Service
                const { data: serviceData, error } = await supabase
                    .from('services')
                    .select('*, businesses(id, name)')
                    .eq('id', id)
                    .single();

                if (error || !serviceData) throw new Error("Service not found");

                setService(serviceData as any);
                setName(serviceData.name);
                setPrice(serviceData.price_amount.toString());
                setDescription(serviceData.description || "");
                setCategory(serviceData.category || "");
                setLocation(serviceData.location_text || (serviceData.businesses?.name ? "Business Location" : "")); // Handle location logic
                setImagePreview(serviceData.image_url);

                // 2. Fetch User's Businesses (for Transfer)
                const { data: userData } = await supabase.auth.getUser();
                if (userData.user) {
                    const { data: businesses } = await supabase
                        .from('businesses')
                        .select('id, name')
                        .eq('owner_id', userData.user.id);

                    if (businesses) setMyBusinesses(businesses);
                }

            } catch (err) {
                console.error(err);
                showToast("Failed to load service.", "error");
                router.push("/account");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, supabase, router, showToast]);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) return showToast("File too large (Max 10MB)", "error");
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            let imageUrl = service?.image_url;

            // Upload new image if selected
            if (imageFile) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("Not authenticated");

                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('service-images')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('service-images')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            // Update Service
            const { error } = await supabase
                .from('services')
                .update({
                    name,
                    price_amount: parseFloat(price),
                    description,
                    category,
                    location_text: service?.profile_id ? location : undefined, // Only update location text if individual
                    image_url: imageUrl
                })
                .eq('id', id);

            if (error) throw error;

            showToast("Service updated successfully!");
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsSaving(true); // Reuse loading state
        try {
            const { error } = await supabase.from('services').delete().eq('id', id);
            if (error) throw error;
            showToast("Service deleted.");
            router.push("/account");
        } catch (err: any) {
            showToast(err.message, "error");
            setIsSaving(false);
            setShowDeleteModal(false);
        }
    };

    const handleTransfer = async () => {
        if (!selectedTransferTarget) return;
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const updates: any = {};

            if (selectedTransferTarget === "individual") {
                // Transfer to Individual
                updates.business_id = null;
                updates.profile_id = user.id;
            } else {
                // Transfer to Business
                updates.business_id = selectedTransferTarget;
                updates.profile_id = null;
            }

            const { error } = await supabase.from('services').update(updates).eq('id', id);
            if (error) throw error;

            showToast("Service transferred successfully!");
            router.refresh();
            setService(prev => prev ? { ...prev, ...updates } : null); // Optimistic update
            setShowTransferModal(false);

        } catch (err: any) {
            showToast(err.message, "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-neutral-400" /></div>;
    }

    return (
        <main className="min-h-screen bg-background text-foreground font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
            <Navigation />

            <div className="pt-28 pb-20 container-wide max-w-5xl mx-auto px-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                >
                    <div className="flex items-center gap-4">
                        <Link href="/account" className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <span className="text-xs font-bold tracking-wider text-neutral-500 uppercase">Manage Service</span>
                            <h1 className="text-3xl font-heading font-bold">{name}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTransferModal(true)}
                            className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <Repeat className="w-4 h-4" /> Transfer
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-900/30 text-sm font-bold flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left Column: Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-8 space-y-8"
                    >
                        <form id="edit-form" onSubmit={handleSave} className="space-y-8">

                            {/* Card: Basic Details */}
                            <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
                                <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-neutral-400" /> Basic Information
                                </h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Service Name</label>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 font-bold text-lg outline-none focus:ring-2 ring-black dark:ring-white transition-all"
                                            placeholder="e.g. Premium Haircut"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Price (GH₵)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                                <input
                                                    type="number"
                                                    value={price}
                                                    onChange={(e) => setPrice(e.target.value)}
                                                    className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-10 pr-4 py-3 font-medium outline-none focus:ring-2 ring-black dark:ring-white transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Category</label>
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 ring-black dark:ring-white transition-all cursor-pointer appearance-none"
                                            >
                                                <option value="">Select Category</option>
                                                <option value="Fashion">Fashion</option>
                                                <option value="Food">Food</option>
                                                <option value="Beauty">Beauty</option>
                                                <option value="Hair">Hair</option>
                                                {/* Add more categories as needed */}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Description</label>
                                        <textarea
                                            rows={5}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-black dark:ring-white transition-all resize-none"
                                            placeholder="Describe your service in detail..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card: Location (Only for Individual) */}
                            {service?.profile_id && (
                                <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-sm">
                                    <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-neutral-400" /> Service Location
                                    </h2>
                                    <div className="space-y-2">
                                        <LocationAutocomplete
                                            initialValue={location}
                                            onSelect={(loc) => {
                                                setLocation(loc.address);
                                                setLat(loc.lat);
                                                setLng(loc.lng);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                        </form>
                    </motion.div>

                    {/* Right Column: Media & Save */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-4 space-y-6"
                    >
                        {/* Image Uploader */}
                        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-bold text-sm mb-4">Service Image</h3>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full aspect-square bg-neutral-100 dark:bg-neutral-900 rounded-2xl relative overflow-hidden group cursor-pointer border-2 border-dashed border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
                            >
                                {imagePreview ? (
                                    <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
                                        <Upload className="w-8 h-8 mb-2" />
                                        <span className="text-xs font-bold uppercase tracking-wide">Upload Photo</span>
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-sm font-bold">Change Image</span>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                        </div>

                        {/* Save Button (Sticky on mobile?) */}
                        <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm sticky top-28">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-neutral-500">Status</span>
                                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                            >
                                {isSaving ? "SAVING..." : <><Save className="w-4 h-4" /> SAVE CHANGES</>}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* DELETE MODAL */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 max-w-sm w-full rounded-3xl p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xl"
                        >
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="font-heading text-xl font-bold mb-2">Delete Service?</h3>
                            <p className="text-neutral-500 mb-8">This action cannot be undone. This service and all its history will be permanently removed.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 text-sm font-bold bg-neutral-100 dark:bg-neutral-800 rounded-xl hover:bg-neutral-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 py-3 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* TRANSFER MODAL */}
            <AnimatePresence>
                {showTransferModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 max-w-md w-full rounded-3xl p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xl"
                        >
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                <Repeat className="w-6 h-6" />
                            </div>
                            <h3 className="font-heading text-xl font-bold mb-2">Transfer Listing</h3>
                            <p className="text-neutral-500 mb-6 text-sm">Move this service to another business page or back to your individual profile.</p>

                            <div className="space-y-3 mb-8">
                                <label className="block p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-black dark:hover:border-white transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="transfer"
                                            value="individual"
                                            checked={selectedTransferTarget === "individual"}
                                            onChange={(e) => setSelectedTransferTarget(e.target.value)}
                                            className="w-4 h-4 text-black focus:ring-black"
                                        />
                                        <div>
                                            <span className="font-bold block text-sm">My Individual Profile</span>
                                            <span className="text-xs text-neutral-400">Listed under your name</span>
                                        </div>
                                    </div>
                                </label>

                                {myBusinesses.map(bus => (
                                    <label key={bus.id} className="block p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 cursor-pointer hover:border-black dark:hover:border-white transition-colors">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="transfer"
                                                value={bus.id}
                                                checked={selectedTransferTarget === bus.id}
                                                onChange={(e) => setSelectedTransferTarget(e.target.value)}
                                                className="w-4 h-4 text-black focus:ring-black"
                                            />
                                            <div>
                                                <span className="font-bold block text-sm">{bus.name}</span>
                                                <span className="text-xs text-neutral-400">Business Page</span>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowTransferModal(false)}
                                    className="flex-1 py-3 text-sm font-bold bg-neutral-100 dark:bg-neutral-800 rounded-xl hover:bg-neutral-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTransfer}
                                    disabled={!selectedTransferTarget || isSaving}
                                    className="flex-1 py-3 text-sm font-bold bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {isSaving ? "Transferring..." : "Confirm Transfer"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </main>
    );
}
