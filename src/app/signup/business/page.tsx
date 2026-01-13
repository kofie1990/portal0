"use client";

import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Check, Upload, MapPin, Smartphone, Mail, Store, Briefcase } from "lucide-react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Steps for the wizard
const STEPS = ["Identity", "Details", "Customization"];

export default function BusinessSignupPage() {
    const router = useRouter();

    // Import Supabase
    // Import Supabase


    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        password: "",
        businessName: "",
        description: "",
        category: "",
        location: "",
        businessType: "store", // 'store' (Physical) or 'service' (Mobile)
        depositFee: "",
    });

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Complete Setup
            setIsLoading(true);
            setError(null);

            try {
                const supabase = createClient();

                // 1. Sign Up User
                // 1. Sign Up User (Trigger will create Profile & Business)
                // Map UI 'businessType' to DB 'location_type'
                const locationType = formData.businessType === 'store' ? 'physical' : 'mobile';

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.businessName, // Fallback/Owner name
                            role: 'business',
                            phone: formData.phone,
                            // Pass business details for the trigger
                            business_data: {
                                name: formData.businessName,
                                category: formData.category || 'General',
                                description: formData.description,
                                location_address: formData.location || 'Accra, Ghana',
                                location_type: locationType,
                                deposit_fee: formData.depositFee ? parseFloat(formData.depositFee) : 0,
                                phone: formData.phone,
                                email: formData.email
                            }
                        },
                    },
                });

                if (authError) throw authError;
                if (!authData.user) throw new Error("No user returned");

                // Manual insert removed - handled by DB trigger

                if (authData.session) {
                    // 3. Success -> Route
                    router.refresh();
                    router.push(`/dashboard/${authData.user.id}`);
                } else {
                    // Email verification required
                    router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
                }

            } catch (err: any) {
                setError(err.message);
                setIsLoading(false);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-32 pb-20 container-wide max-w-4xl mx-auto px-6">
                {/* Progress Header */}
                <div className="mb-12">
                    <h1 className="font-heading text-4xl font-bold mb-6">Create Business Account</h1>
                    <div className="flex items-center justify-between relative">
                        {/* Progress Bar Background */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-100 dark:bg-neutral-800 -z-10" />
                        {/* Active Progress */}
                        <motion.div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black dark:bg-white -z-10 transition-all duration-500"
                            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                        />

                        {error && (
                            <div className="absolute -top-16 left-0 right-0 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                {error}
                            </div>
                        )}

                        {STEPS.map((step, index) => (
                            <div key={step} className="flex flex-col items-center gap-2 bg-background px-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${index <= currentStep
                                        ? "bg-black text-white dark:bg-white dark:text-black"
                                        : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                                        }`}
                                >
                                    {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                                </div>
                                <span className={`text-xs font-bold tracking-wider ${index <= currentStep ? "text-foreground" : "text-neutral-400"}`}>
                                    {step.toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Wizard Content */}
                <div className="glass-panel p-8 md:p-12 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentStep === 0 && (
                                <StepIdentity formData={formData} setFormData={setFormData} />
                            )}
                            {currentStep === 1 && (
                                <StepDetails formData={formData} setFormData={setFormData} />
                            )}
                            {currentStep === 2 && (
                                <StepCustomization formData={formData} setFormData={setFormData} />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex justify-between mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={`px-6 py-3 text-sm font-bold tracking-wide rounded-full transition-opacity ${currentStep === 0 ? "opacity-0 pointer-events-none" : "hover:opacity-60"
                                }`}
                        >
                            BACK
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={isLoading}
                            className="bg-foreground text-background px-8 py-3 text-sm font-bold tracking-wide rounded-full hover:opacity-80 transition-opacity flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? "CREATING..." : currentStep === STEPS.length - 1 ? "COMPLETE SETUP" : "NEXT STEP"}
                            {!isLoading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

// --- Icons & Types ---
// (Normally separated files, kept here for brevity in initial scaffold)

function StepIdentity({ formData, setFormData }: any) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-heading">Verify Identity</h2>
            <p className="text-neutral-500">We need to verify it's you before setting up your business profile.</p>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 flex items-center gap-2"><Mail className="w-4 h-4" /> EMAIL ADDRESS</label>
                    <input
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border-none p-4 rounded-xl outline-none focus:ring-1 ring-black dark:ring-white"
                        placeholder="business@example.com"
                    />
                    <p className="text-xs text-green-600 font-medium ml-1 hidden">✓ Verified via link</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 flex items-center gap-2"><Smartphone className="w-4 h-4" /> PHONE NUMBER</label>
                    <div className="flex gap-2">
                        <span className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl text-sm font-bold flex items-center">+233</span>
                        <input
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-neutral-50 dark:bg-neutral-900 border-none p-4 rounded-xl outline-none focus:ring-1 ring-black dark:ring-white"
                            placeholder="XX XXX XXXX"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 flex items-center gap-2">PASSWORD</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border-none p-4 rounded-xl outline-none focus:ring-1 ring-black dark:ring-white"
                        placeholder="Create a strong password"
                    />
                </div>
            </div>
        </div>
    );
}

function StepDetails({ formData, setFormData }: any) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-heading">Business Details</h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">BUSINESS NAME</label>
                    <input
                        value={formData.businessName}
                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border-none p-4 rounded-xl outline-none focus:ring-1 ring-black dark:ring-white"
                        placeholder="Official Business Name"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 flex items-center gap-2"><MapPin className="w-4 h-4" /> HEADQUARTERS LOCATION</label>
                    <button
                        className="w-full bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl text-left text-sm font-medium flex items-center justify-between hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        onClick={() => alert("Requesting Location Access...")}
                    >
                        <span>Accra, Ghana (Detected)</span>
                        <span className="text-xs font-bold bg-white dark:bg-black px-2 py-1 rounded">ENABLE LOCATION</span>
                    </button>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">BOOKING DEPOSIT FEE (GH₵)</label>
                    <input
                        type="number"
                        value={formData.depositFee}
                        onChange={e => setFormData({ ...formData, depositFee: e.target.value })}
                        className="w-full bg-neutral-50 dark:bg-neutral-900 border-none p-4 rounded-xl outline-none focus:ring-1 ring-black dark:ring-white"
                        placeholder="e.g. 50 (Leave empty for no deposit)"
                    />
                    <p className="text-xs text-neutral-500 ml-1">Non-refundable fee to secure appointments.</p>
                </div>
            </div>
        </div>
    );
}


function StepCustomization({ formData, setFormData }: any) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-heading">Customize Your Page</h2>
            <p className="text-neutral-500">Choose a layout that fits your business model.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Variant */}
                <div
                    onClick={() => setFormData({ ...formData, businessType: 'store' })}
                    className={`border-2 rounded-2xl p-6 cursor-pointer transition-all ${formData.businessType === 'store'
                        ? "border-black dark:border-white bg-black/5 dark:bg-white/5"
                        : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300"
                        }`}
                >
                    <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-4 relative overflow-hidden">
                        <div className="absolute inset-2 grid grid-cols-2 gap-2">
                            <div className="bg-white/50 rounded-lg"></div>
                            <div className="bg-white/50 rounded-lg"></div>
                            <div className="bg-white/50 rounded-lg"></div>
                            <div className="bg-white/50 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <Store className="w-4 h-4" />
                        <span className="font-bold text-sm">Flagship Store</span>
                    </div>
                    <p className="text-xs text-neutral-500">For businesses with a physical location. Showcase your space and inventory.</p>
                </div>

                {/* Service Variant */}
                <div
                    onClick={() => setFormData({ ...formData, businessType: 'service' })}
                    className={`border-2 rounded-2xl p-6 cursor-pointer transition-all ${formData.businessType === 'service'
                        ? "border-black dark:border-white bg-black/5 dark:bg-white/5"
                        : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300"
                        }`}
                >
                    <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-4 relative overflow-hidden flex flex-col gap-2 p-2 justify-center">
                        <div className="h-4 w-3/4 bg-white/50 rounded mb-2"></div>
                        <div className="h-2 w-full bg-white/50 rounded"></div>
                        <div className="h-2 w-5/6 bg-white/50 rounded"></div>
                        <div className="h-8 w-1/3 bg-black/20 rounded mt-2"></div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <span className="font-bold text-sm">Mobile Service</span>
                    </div>
                    <p className="text-xs text-neutral-500">For door-to-door services or businesses without a flagship store.</p>
                </div>
            </div>
        </div>
    );
}
