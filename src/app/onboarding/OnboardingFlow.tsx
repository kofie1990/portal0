"use client";

import Navigation from "@/components/Navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, MapPin, Camera, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { useToast } from "@/components/ui/Toast";
import StepPayout from "./StepPayout";
import { createSubaccountAction } from "@/app/actions/paystack";

// INTERESTS MAPPING
const INTERESTS = [
    { id: "barbering", label: "Barbers", icon: "💈" },
    { id: "spa-massage", label: "Spas", icon: "🧖‍♀️" },
    { id: "catering", label: "Food", icon: "🍔" },
    { id: "tailoring-fashion", label: "Fashion", icon: "👗" },
    { id: "fitness-yoga", label: "Fitness", icon: "🏋️‍♂️" },
    { id: "ac-refrigeration", label: "Tech Repair", icon: "📱" },
    { id: "photography", label: "Art & Media", icon: "🎨" },
    { id: "carpentry-furniture", label: "Home Decor", icon: "🏠" },
    { id: "tattoo", label: "Tattoos", icon: "🖋️" },
    { id: "lash-tech", label: "Lash Techs", icon: "👁️" },
    { id: "makeup-artistry", label: "Makeup", icon: "💄" },
    { id: "mechanic", label: "Auto Maint.", icon: "🔧" }
];

export default function OnboardingFlow() {
    const router = useRouter();
    const { showToast } = useToast();
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [location, setLocation] = useState("");
    const [lat, setLat] = useState<number | null>(null);
    const [lng, setLng] = useState<number | null>(null);
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    // Profile State
    const [bio, setBio] = useState("");
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Payout State
    const [bankCode, setBankCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");

    const handleInterestToggle = (id: string) => {
        if (selectedInterests.includes(id)) {
            setSelectedInterests(prev => prev.filter(i => i !== id));
        } else {
            setSelectedInterests(prev => [...prev, id]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            let uploadedAvatarUrl = null;

            // Upload Avatar if Present
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile);

                if (uploadError) {
                    console.error("Avatar upload failed:", uploadError);
                    // Allow continuing even if image fails, but log it
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                    uploadedAvatarUrl = publicUrl;
                }
            }

            // Update Profile
            const updates: any = {
                onboarding_completed: true,
                interests: selectedInterests,
                bio: bio,
                location_text: location,
                lat: lat,
                lng: lng,
            };

            if (uploadedAvatarUrl) {
                updates.avatar_url = uploadedAvatarUrl;
            }

            // Create Paystack Subaccount for Individual
            if (bankCode && accountNumber && accountName) {
                const subResult = await createSubaccountAction(
                    `${user.user_metadata?.full_name || 'Individual'} (${accountName})`,
                    bankCode,
                    accountNumber,
                    `Individual Subaccount for ${user.email}`,
                    user.email || undefined
                );

                if (subResult.data?.subaccount_code) {
                    updates.paystack_subaccount_code = subResult.data.subaccount_code;
                    // Also update user metadata
                    await supabase.auth.updateUser({
                        data: { subaccount_code: subResult.data.subaccount_code }
                    });
                } else {
                    console.error("Failed to create subaccount:", subResult.error);
                    // Decide if we should block or continue. Let's continue but warn.
                    showToast("Could not create payout account. You can retry in settings.", "error");
                }
            }

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            showToast("Profile updated successfully!", "success");

            // Redirect
            router.refresh();
            router.push("/account");
        } catch (error) {
            console.error("Onboarding failed:", error);
            showToast("Something went wrong saving your preferences.", "error");
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl -z-10" />

                <div className="w-full max-w-2xl relative z-10">
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <StepWelcome key="welcome" onNext={() => setStep(1)} />
                        )}
                        {step === 1 && (
                            <StepLocation
                                key="location"
                                location={location}
                                setLocation={setLocation}
                                setLat={setLat}
                                setLng={setLng}
                                onNext={() => setStep(2)}
                                onBack={() => setStep(0)}
                            />
                        )}
                        {step === 2 && (
                            <StepProfile
                                key="profile"
                                bio={bio}
                                setBio={setBio}
                                avatarPreview={avatarPreview}
                                handleFileChange={handleFileChange}
                                onNext={() => setStep(3)}
                                onBack={() => setStep(1)}
                            />
                        )}
                        {step === 3 && (
                            <StepPayout
                                key="payout"
                                bankCode={bankCode}
                                setBankCode={setBankCode}
                                accountNumber={accountNumber}
                                setAccountNumber={setAccountNumber}
                                accountName={accountName}
                                setAccountName={setAccountName}
                                onNext={() => setStep(4)}
                                onBack={() => setStep(2)}
                            />
                        )}
                        {step === 4 && (
                            <StepInterests
                                key="interests"
                                interests={INTERESTS}
                                selected={selectedInterests}
                                toggle={handleInterestToggle}
                                onComplete={handleComplete}
                                onBack={() => setStep(3)}
                                isLoading={isLoading}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}

// --- SUB COMPONENTS ---

function StepWelcome({ onNext }: { onNext: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center"
        >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black dark:bg-white rounded-3xl mb-8 shadow-2xl overflow-hidden">
                <Image src="/portal_logo.png" alt="Portal logo" width={48} height={48} className="invert dark:invert-0" />
            </div>
            <h1 className="font-heading text-5xl font-bold mb-6">Welcome to Portal.</h1>
            <p className="text-xl text-neutral-500 mb-12 max-w-md mx-auto">
                Let's personalize your experience to help you discover the best local businesses.
            </p>
            <button
                onClick={onNext}
                className="bg-foreground text-background px-10 py-4 rounded-full font-bold tracking-wide hover:opacity-90 transition-all transform hover:scale-105 shadow-xl flex items-center gap-2 mx-auto"
            >
                GET STARTED <ArrowRight className="w-5 h-5" />
            </button>
        </motion.div>
    );
}

function StepLocation({ location, setLocation, setLat, setLng, onNext, onBack }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50"
        >
            <h2 className="font-heading text-3xl font-bold mb-2">Where are you?</h2>
            <p className="text-neutral-500 mb-8">We'll show you top-rated spots nearby.</p>

            <div className="space-y-4 mb-10">
                <div className="relative">
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

            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-sm font-bold text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                    BACK
                </button>
                <button
                    onClick={onNext}
                    className="bg-foreground text-background px-8 py-3 rounded-full font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    NEXT <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

function StepProfile({ bio, setBio, avatarPreview, handleFileChange, onNext, onBack }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50"
        >
            <h2 className="font-heading text-3xl font-bold mb-2">Create your profile</h2>
            <p className="text-neutral-500 mb-8">Add a photo and a short bio to help others recognize you.</p>

            <div className="flex flex-col items-center mb-8">
                <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-black dark:hover:border-white transition-colors">
                        {avatarPreview ? (
                            <Image src={avatarPreview} alt="Preview" fill className="object-cover" />
                        ) : (
                            <Camera className="w-8 h-8 text-neutral-400" />
                        )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="w-6 h-6 text-white" />
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                </div>
                <p className="text-xs font-bold text-neutral-400 mt-4 uppercase tracking-wider">Tap to upload</p>
            </div>

            <div className="space-y-4 mb-10">
                <div className="space-y-2">
                    <label className="text-sm font-bold tracking-wide ml-1 text-neutral-500">SHORT BIO</label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us a bit about yourself..."
                        rows={3}
                        className="w-full bg-neutral-100 dark:bg-neutral-900 border-none px-4 py-4 rounded-xl text-base font-medium outline-none focus:ring-2 ring-black dark:ring-white transition-all resize-none"
                    />
                </div>
            </div>

            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-sm font-bold text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                    BACK
                </button>
                <button
                    onClick={onNext}
                    className="bg-foreground text-background px-8 py-3 rounded-full font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                    NEXT <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}

function StepInterests({ interests, selected, toggle, onComplete, onBack, isLoading }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50"
        >
            <h2 className="font-heading text-3xl font-bold mb-2">What do you like?</h2>
            <p className="text-neutral-500 mb-8">Pick a few categories to get tailored recommendations.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                {interests.map((item: any) => {
                    const isSelected = selected.includes(item.id);
                    return (
                        <button
                            key={item.id}
                            onClick={() => toggle(item.id)}
                            className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${isSelected
                                ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-lg scale-105"
                                : "border-neutral-100 dark:border-neutral-800 bg-white/50 dark:bg-black/20 hover:border-neutral-300 dark:hover:border-neutral-600"
                                }`}
                        >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-xs font-bold tracking-wide">{item.label}</span>
                        </button>
                    )
                })}
            </div>

            <div className="flex justify-between items-center">
                <button onClick={onBack} disabled={isLoading} className="text-sm font-bold text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                    BACK
                </button>
                <button
                    onClick={onComplete}
                    disabled={isLoading}
                    className="bg-foreground text-background px-8 py-3 rounded-full font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                >
                    {isLoading ? "SAVING..." : "FINISH"}
                    {!isLoading && <Check className="w-4 h-4" />}
                </button>
            </div>
        </motion.div>
    );
}
