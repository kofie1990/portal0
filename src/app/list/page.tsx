"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { ArrowRight, Upload, MapPin, Tag, Navigation2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import Image from "next/image";
import LocationAutocomplete from "@/components/LocationAutocomplete";

type Business = Database['public']['Tables']['businesses']['Row'];

export default function ListPage() {
    const supabase = createClient();
    const router = useRouter();
    const { showToast } = useToast();
    const [businesses, setBusinesses] = useState<Business[]>([]);

    // Form State
    const [location, setLocation] = useState("");
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [selectedBusiness, setSelectedBusiness] = useState("individual");
    const [category, setCategory] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");

    // Service State
    const [serviceName, setServiceName] = useState("");
    const [price, setPrice] = useState("");
    const [deposit, setDeposit] = useState(""); // Added
    const [description, setDescription] = useState("");

    // Image Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user businesses
    useEffect(() => {
        async function fetchBusinesses() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('businesses')
                    .select('*')
                    .eq('owner_id', user.id);

                if (data) setBusinesses(data);

                // Pre-fill email/phone if available in metadata (optional optimization)
                if (user.email) setEmail(user.email);
            }
            setIsLoading(false);
        }
        fetchBusinesses();
    }, [supabase]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setIsLoading(true); // Reuse loading state to show processing
            const newFiles = Array.from(files);
            const processedFiles: File[] = [];

            for (const file of newFiles) {
                // Validate size
                if (file.size > 10 * 1024 * 1024) {
                    showToast(`File ${file.name} is too large. Max 10MB.`, "error");
                    continue;
                }

                // Handle HEIC
                if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
                    try {
                        const heic2any = (await import("heic2any")).default;
                        const convertedBlob = await heic2any({
                            blob: file,
                            toType: "image/jpeg",
                            quality: 0.8
                        });

                        const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                        const newFile = new File([blobToUse], file.name.replace(/\.heic$/i, ".jpg"), {
                            type: "image/jpeg"
                        });
                        processedFiles.push(newFile);
                    } catch (err) {
                        console.error("HEIC Conversion failed", err);
                        showToast(`Could not convert ${file.name}.`, "error");
                    }
                } else {
                    processedFiles.push(file);
                }
            }

            if (processedFiles.length > 0) {
                setImageFiles(prev => [...prev, ...processedFiles]);
                const newPreviews = processedFiles.map(file => URL.createObjectURL(file));
                setImagePreviews(prev => [...prev, ...newPreviews]);
            }
            setIsLoading(false);
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            // Revoke object URL to avoid memory leaks
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedBusiness === "individual" && (!email || !phone || !location)) {
            showToast("Please provide email, phone, and location.", "error");
            return;
        }

        if (!serviceName || !price || !description || !category) {
            showToast("Please fill in all service details (Name, Price, Description, Category).", "error");
            return;
        }

        const priceVal = parseFloat(price.replace(/[^0-9.]/g, ''));
        const depositVal = deposit ? parseFloat(deposit.replace(/[^0-9.]/g, '')) : 0;

        if (depositVal > priceVal) {
            showToast("Deposit cannot be higher than the total price.", "error");
            return;
        }

        if (imageFiles.length === 0) {
            showToast("Please upload at least one image.", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showToast("Please log in to list a service.", "error");
                router.push("/login?redirect=/list");
                return;
            }

            // 1. Upload Image if exists
            // 1. Upload Images if exist
            let imageUrls: string[] = [];

            if (imageFiles.length > 0) {
                for (const file of imageFiles) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('service-images')
                        .upload(fileName, file);

                    if (uploadError) {
                        console.error("Error uploading file:", file.name, uploadError);
                        // Continue uploading others or stop? Let's continue but log error.
                        continue;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('service-images')
                        .getPublicUrl(fileName);

                    imageUrls.push(publicUrl);
                }
            }

            // 2. Insert Service
            if (selectedBusiness === "individual") {
                const { error: serviceError } = await supabase
                    .from('services')
                    .insert({
                        profile_id: user.id,
                        business_id: null,
                        name: serviceName,
                        price_amount: parseFloat(price.replace(/[^0-9.]/g, '')),
                        deposit_amount: deposit ? parseFloat(deposit.replace(/[^0-9.]/g, '')) : 0, // Added
                        description: description,
                        category: category || "Uncategorized",
                        location_text: location,
                        lat: lat,
                        lng: lng,
                        image_url: imageUrls[0] || null,
                        images: imageUrls
                    });

                if (serviceError) throw serviceError;

            } else {
                const { error: serviceError } = await supabase
                    .from('services')
                    .insert({
                        business_id: selectedBusiness,
                        profile_id: null,
                        name: serviceName,
                        price_amount: parseFloat(price.replace(/[^0-9.]/g, '')),
                        deposit_amount: deposit ? parseFloat(deposit.replace(/[^0-9.]/g, '')) : 0, // Added
                        description: description,
                        category: category || "Uncategorized",
                        image_url: imageUrls[0] || null,
                        images: imageUrls
                    });

                if (serviceError) throw serviceError;
            }

            showToast("Service Listed Successfully!");

            // Redirect to account page
            setTimeout(() => {
                router.push("/account");
            }, 1000);

        } catch (error: any) {
            console.error("Error publishing service:", error);
            showToast(error.message || "Failed to publish service.", "error");
            setIsSubmitting(false);
        }
    };



    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-24 min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neutral-100 dark:bg-neutral-900 rounded-full blur-3xl -z-10 opacity-50" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-2xl"
                >
                    <div className="text-center mb-12">
                        <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 mb-4 block">PORTAL TO CUSTOMERS</span>
                        <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6">List your service.</h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                            Join the curated marketplace. Reach customers nearby instantly.
                        </p>
                    </div>

                    <div className="glass-panel p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50">
                        <form className="space-y-6" onSubmit={handlePublish}>

                            {/* Listing As Selector */}
                            <div className="bg-neutral-100 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                                <label className="text-xs font-bold tracking-wide text-neutral-500 mb-2 block uppercase">Listing As</label>
                                <select
                                    value={selectedBusiness}
                                    onChange={(e) => setSelectedBusiness(e.target.value)}
                                    className="w-full bg-transparent font-bold text-lg outline-none cursor-pointer"
                                >
                                    <option value="individual">Individual (New Listing)</option>
                                    {businesses.length > 0 && (
                                        <optgroup label="My Businesses">
                                            {businesses.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold tracking-wide ml-1">SERVICE NAME <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={serviceName}
                                        onChange={(e) => setServiceName(e.target.value)}
                                        placeholder="e.g. Home Cleaning Standard"
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold tracking-wide ml-1">PRICE (GH₵) <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold tracking-wide ml-1 text-neutral-500">DEPOSIT (Optional)</label>
                                    <input
                                        type="text"
                                        value={deposit}
                                        onChange={(e) => setDeposit(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                    <p className="text-xs text-neutral-400 ml-1">Client pays this to confirm.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold tracking-wide ml-1">SHORT DESCRIPTION <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={3}
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Briefly describe your service..."
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><Tag className="w-4 h-4" /> CATEGORY <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none appearance-none"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Fashion">Fashion</option>
                                        <option value="Food">Food</option>
                                        <option value="Services">Services</option>
                                        <option value="Art">Art</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><MapPin className="w-4 h-4" /> LOCATION <span className="text-red-500">*</span></label>
                                    {selectedBusiness === "individual" ? (
                                        <div className="relative">
                                            <LocationAutocomplete
                                                required
                                                onSelect={(loc) => {
                                                    setLocation(loc.address);
                                                    setLat(loc.lat);
                                                    setLng(loc.lng);
                                                }}
                                                placeholder="Search for location..."
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl px-5 py-4 text-neutral-500 italic">
                                            Using {businesses.find(b => b.id === selectedBusiness)?.name}'s location
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedBusiness === "individual" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold tracking-wide ml-1">PHONE NUMBER <span className="text-red-500">*</span></label>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+233 XX XXX XXX"
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold tracking-wide ml-1">EMAIL ADDRESS <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                        <p className="text-xs text-neutral-500 ml-1">Used to claim/manage this listing later.</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <label className="text-sm font-bold tracking-wide ml-1 mb-2 block">PHOTOS (Max 5) <span className="text-red-500">*</span></label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                />

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {imagePreviews.map((preview, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                                            <Image src={preview} alt="Preview" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}

                                    {imagePreviews.length < 5 && (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors aspect-square"
                                        >
                                            <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                                            <span className="text-xs font-bold text-neutral-400">ADD PHOTO</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button disabled={isSubmitting} type="submit" className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? "PUBLISHING..." : <>PUBLISH LISTING <ArrowRight className="w-4 h-4" /></>}
                            </button>

                            <div className="pt-6 text-center border-t border-neutral-200 dark:border-neutral-800 mt-6">
                                <p className="text-sm text-neutral-500 mb-3">Running a full business?</p>
                                <Link href="/signup/business" className="text-sm font-bold border-b border-black dark:border-white pb-0.5 hover:opacity-70 transition-opacity">
                                    CREATE BUSINESS ACCOUNT
                                </Link>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
