"use client";

import Navigation from "@/components/Navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowRight, Check, MapPin, Smartphone, Mail, Store, Briefcase, Loader2, AlertCircle, Clock, Map } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import FileUpload from "@/components/ui/FileUpload";
import { createSubaccountAction, fetchBanksAction, verifyAccountAction } from "@/app/actions/paystack";
import { PaystackBank } from "@/lib/paystack";
import PayoutSection from "./PayoutSection";

// --- VALIDATION SCHEMAS ---

const existingUserSchema = z.object({
    businessName: z.string().min(2, "Business name is required"),
    category: z.string().min(1, "Category is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    location: z.string().min(5, "Location is required"),
    businessType: z.enum(["store", "service"]),
    depositFee: z.string().optional().transform(val => (val === "" ? undefined : Number(val))),
    bio: z.string().max(160, "Bio must be under 160 characters").optional(), // [NEW]
    website: z.string().url("Invalid URL").optional().or(z.literal("")), // [NEW]
    socialInstagram: z.string().optional(), // [NEW]
    socialFacebook: z.string().optional(), // [NEW]
    mapUrl: z.string().optional(), // [NEW]
    // Payout Details
    bankCode: z.string().min(1, "Bank is required"),
    accountNumber: z.string().min(10, "Account number is required"),
    accountName: z.string().min(3, "Account name is required"), // Read-only but required
    // Refinement Fields
    openingHours: z.string().optional(),
    serviceRadius: z.string().optional(),
    coverImage: z.string().min(1, "Cover image is required"),
    logo: z.string().optional(),
});

// Refinement logic to ensure Logo is present for Service businesses
const validateBusinessImages = (data: any, ctx: z.RefinementCtx) => {
    if (data.businessType === "service" && !data.logo) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Business logo is required",
            path: ["logo"],
        });
    }
};

const existingUserSchemaRefined = existingUserSchema.superRefine(validateBusinessImages);

const newUserSchema = existingUserSchema.extend({
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const newUserSchemaRefined = newUserSchema.superRefine(validateBusinessImages);

type NewUserForm = z.infer<typeof newUserSchema>;
type ExistingUserForm = z.infer<typeof existingUserSchema>;

// Shared Input Components would go here or be imported. 
// For this single file refactor, I'll inline cleaner versions.

export default function BusinessSignupPage() {
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    const [isLoadingAuth, setIsLoadingAuth] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dynamic Form Setup
    // We defer form init until we know auth state to pick schema
    // But hooks order must be static. We'll use a wrapper or just use 'mode' to switch resolver.

    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            const { data } = await supabase.auth.getUser();
            setIsLoggedIn(!!data.user);
            setIsLoadingAuth(false);
            setAuthChecked(true);
        }
        checkAuth();


    }, [supabase]);

    if (isLoadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return <BusinessWizard isLoggedIn={isLoggedIn} />;
}


function BusinessWizard({ isLoggedIn }: { isLoggedIn: boolean }) {
    const router = useRouter();
    const { showToast } = useToast();
    const supabase = createClient();

    // Steps configuration
    const steps = isLoggedIn
        ? ["Business Details", "Business Type", "Refinement"]
        : ["Identity", "Business Details", "Business Type", "Refinement"];

    const [currentStep, setCurrentStep] = useState(0);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);


    // Form Initialization
    const {
        control,
        handleSubmit,
        trigger,
        watch,
        setValue,
        formState: { errors, isValid }
    } = useForm({
        resolver: zodResolver(isLoggedIn ? existingUserSchemaRefined : newUserSchemaRefined),
        mode: "onBlur",
        defaultValues: {
            // Business Defaults
            businessName: "",
            category: "",
            description: "",
            location: "",
            businessType: "store",
            depositFee: "",
            // [NEW] Fields
            bio: "",
            website: "",
            socialInstagram: "",
            socialFacebook: "",
            mapUrl: "",
            // Payout
            bankCode: "",
            accountNumber: "",
            accountName: "",
            // Refinement
            openingHours: "Mon - Fri: 9:00 AM - 5:00 PM",
            serviceRadius: "Within 10km of my location",
            coverImage: "",
            logo: "",
            // Identity Defaults - Only included if not logged in
            ...(isLoggedIn ? {} : {
                email: "",
                phone: "",
                password: ""
            })
        }
    });

    // Helper to calculate progress percentage
    const progress = (currentStep / (steps.length - 1)) * 100;

    const handleNext = async () => {
        let stepValid = false;

        // Validation per step
        if (isLoggedIn) {
            // Existing User Flow: Step 0 Details, 1 Type, 2 Refinement
            if (currentStep === 0) stepValid = await trigger(["businessName", "category", "description", "location", "depositFee"]);
            if (currentStep === 1) stepValid = true;
            if (currentStep === 2) stepValid = true;
        } else {
            // New User Flow: Step 0 Identity, 1 Details, 2 Type, 3 Refinement
            if (currentStep === 0) stepValid = await trigger(["email", "phone", "password"] as any);
            if (currentStep === 1) stepValid = await trigger(["businessName", "category", "description", "location", "depositFee"]);
            if (currentStep === 2) stepValid = true;
            if (currentStep === 3) stepValid = true;
        }

        if (stepValid) {
            setSubmitError(null);
            if (currentStep < steps.length - 1) {
                setCurrentStep(prev => prev + 1);
            } else {
                // Final Step -> Submit
                handleSubmit(onSubmit)();
            }
        } else {
            showToast("Please fix the errors before proceeding.", "error");
        }
    };

    const handleBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // 1. Create Paystack Subaccount
            const subResult = await createSubaccountAction(
                data.businessName,
                data.bankCode,
                data.accountNumber,
                `Subaccount for ${data.businessName}`,
                data.email || undefined // email might be in user metadata if logged in, but passed in data for new users
            );

            if (subResult.error) throw new Error(subResult.error);
            const subaccountCode = subResult.data?.subaccount_code;

            if (isLoggedIn) {
                // 2. Existing User: Insert Business Only
                const { data: userData } = await supabase.auth.getUser();
                if (!userData.user) throw new Error("User session lost. Please login again.");

                const { data: businessData, error: insertError } = await supabase.from("businesses").insert({
                    owner_id: userData.user.id,
                    name: data.businessName,
                    category: data.category,
                    bio: data.bio, // [NEW]
                    description: data.description,
                    location_address: data.location,
                    lat: null,
                    lng: null,
                    location_type: data.businessType === "store" ? "physical" : "mobile",
                    deposit_fee: data.depositFee || 0,
                    phone: userData.user.user_metadata?.phone || null,
                    email: userData.user.email,
                    opening_hours: data.openingHours,
                    service_radius: data.serviceRadius,
                    cover_image_url: data.coverImage,
                    image_url: data.logo,
                    website: data.website, // [NEW]
                    paystack_subaccount_code: subaccountCode, // [NEW] [UPDATED]
                    iframe_map_url: data.mapUrl, // [NEW]
                    social_links: { // [NEW]
                        instagram: data.socialInstagram,
                        facebook: data.socialFacebook
                    }
                }).select().single();

                if (insertError) throw insertError;
                if (!businessData) throw new Error("Failed to retrieve business data after creation.");

                showToast("Business Profile Created!");
                router.refresh();
                // Redirect to the SPECIFIC page based on type
                const businessUrl = data.businessType === 'store'
                    ? `/business/store/${businessData.id}`
                    : `/business/service/${businessData.id}`;

                router.push(businessUrl);

            } else {
                // 3. New User: Sign Up (Trigger handles Business Creation)
                const locationType = data.businessType === 'store' ? 'physical' : 'mobile';
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: data.email,
                    password: data.password,
                    options: {
                        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
                        data: {
                            full_name: data.businessName,
                            role: 'business',
                            phone: data.phone,
                            subaccount_code: subaccountCode, // Save to metadata as backup
                            business_data: {
                                name: data.businessName,
                                category: data.category,
                                bio: data.bio, // [NEW]
                                description: data.description,
                                location_address: data.location,
                                location_type: locationType,
                                deposit_fee: data.depositFee || 0,
                                phone: data.phone,
                                email: data.email,
                                opening_hours: data.openingHours,
                                service_radius: data.serviceRadius,
                                cover_image_url: data.coverImage,
                                image_url: data.logo,
                                website: data.website, // [NEW]
                                paystack_subaccount_code: subaccountCode, // [NEW] [UPDATED]
                                iframe_map_url: data.mapUrl, // [NEW]
                                social_links: { // [NEW]
                                    instagram: data.socialInstagram,
                                    facebook: data.socialFacebook
                                }
                            }
                        },
                    },
                });

                if (authError) throw authError;

                if (authData.session) {
                    showToast("Account Created!");
                    router.refresh();
                    router.push(`/dashboard/${authData.user?.id}`);
                } else {
                    router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
                }
            }

        } catch (err: any) {
            console.error(err);
            setSubmitError(err.message || "Failed to create account.");
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStepContent = (step: number) => {
        if (isLoggedIn) {
            switch (step) {
                case 0: return <StepDetails control={control} errors={errors} />;
                case 1: return <StepCustomization control={control} />;
                case 2: return <StepRefinement control={control} watch={watch} setValue={setValue} />;
                default: return <div>Unknown Step</div>;
            }
        } else {
            switch (step) {
                case 0: return <StepIdentity control={control} errors={errors} />;
                case 1: return <StepDetails control={control} errors={errors} />;
                case 2: return <StepCustomization control={control} />;
                case 3: return <StepRefinement control={control} watch={watch} setValue={setValue} />;
                default: return <div>Unknown Step</div>;
            }
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <div className="pt-32 pb-20 container-wide max-w-4xl mx-auto px-6">
                {/* Header */}
                <div className="mb-12">
                    <div className="flex justify-between items-end mb-6">
                        <h1 className="font-heading text-4xl font-bold">
                            {isLoggedIn ? "Create New Business" : "Create Business Account"}
                        </h1>
                        {isLoggedIn && (
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-neutral-500 uppercase tracking-wide">Logged in as</p>
                                <p className="font-bold text-sm">{profile?.full_name?.split(' ')[0] || "User"}</p>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-100 dark:bg-neutral-800 -z-10" />
                        <motion.div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black dark:bg-white -z-10 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />

                        {steps.map((step, index) => (
                            <div key={step} className="flex flex-col items-center gap-2 bg-background px-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${index <= currentStep
                                        ? "bg-black text-white dark:bg-white dark:text-black"
                                        : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800"
                                        }`}
                                >
                                    {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                                </div>
                                <span className={`text-xs font-bold tracking-wider ${index <= currentStep ? "text-foreground" : "text-neutral-300 dark:text-neutral-700"}`}>
                                    {step.toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error Banner */}
                {submitError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400"
                    >
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">{submitError}</p>
                    </motion.div>
                )}

                {/* Wizard Panel */}
                <div className="glass-panel p-8 md:p-12 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* 
                                Step Mapping Logic:
                                IF LoggedOut: 0=Identity, 1=Details, 2=Customization, 3=Refinement
                                IF LoggedIn:  0=Details, 1=Customization, 2=Refinement
                            */}
                            {getStepContent(currentStep)}
                        </motion.div>
                    </AnimatePresence>

                    {/* Actions */}
                    <div className="flex justify-between mt-12 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0 || isSubmitting}
                            className={`px-6 py-3 text-sm font-bold tracking-wide rounded-full transition-opacity ${currentStep === 0 ? "opacity-0 pointer-events-none" : "hover:opacity-60"}`}
                        >
                            BACK
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className="bg-foreground text-background px-8 py-3 text-sm font-bold tracking-wide rounded-full hover:opacity-80 transition-opacity flex items-center gap-2 disabled:opacity-50 min-w-[160px] justify-center"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {currentStep === steps.length - 1 ? (isLoggedIn ? "CREATE BUSINESS" : "COMPLETE SETUP") : "NEXT STEP"}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {!isLoggedIn && (
                    <div className="mt-8 text-center text-sm text-neutral-500">
                        Already have an account? <Link href="/login" className="font-bold underline hover:text-black dark:hover:text-white">Log in</Link> and create a business from there.
                    </div>
                )}
            </div>
        </main>
    );
}

// --- SUB-COMPONENTS (With React Hook Form Control) ---

function StepIdentity({ control, errors }: any) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-heading">Verify Identity</h2>
            <p className="text-neutral-500">Secure your account before setting up your business profile.</p>

            <div className="grid gap-6">
                <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 flex items-center gap-2"><Mail className="w-4 h-4" /> EMAIL ADDRESS</label>
                            <input
                                {...field}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                placeholder="business@example.com"
                                type="email"
                            />
                            {errors.email && <p className="text-xs text-red-500 font-bold ml-1">{errors.email.message}</p>}
                        </div>
                    )}
                />

                <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 flex items-center gap-2"><Smartphone className="w-4 h-4" /> PHONE NUMBER</label>
                            <div className="flex gap-2">
                                <span className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-xl text-sm font-bold flex items-center">+233</span>
                                <input
                                    {...field}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors flex-1"
                                    placeholder="XX XXX XXXX"
                                    type="tel"
                                />
                            </div>
                            {errors.phone && <p className="text-xs text-red-500 font-bold ml-1">{errors.phone.message}</p>}
                        </div>
                    )}
                />

                <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 gap-2">PASSWORD</label>
                            <input
                                {...field}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                placeholder="Create a strong password"
                                type="password"
                            />
                            {errors.password && <p className="text-xs text-red-500 font-bold ml-1">{errors.password.message}</p>}
                        </div>
                    )}
                />
            </div>
        </div>
    );
}

function StepDetails({ control, errors }: any) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-heading">Business Details</h2>
            <div className="space-y-4">
                <Controller
                    name="businessName"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">BUSINESS NAME</label>
                            <input
                                {...field}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                placeholder="Official Business Name"
                            />
                            {errors.businessName && <p className="text-xs text-red-500 font-bold ml-1">{errors.businessName.message}</p>}
                        </div>
                    )}
                />

                <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">CATEGORY</label>
                            <select
                                {...field}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors appearance-none"
                            >
                                <option value="">Select Category...</option>
                                <option value="Beauty & Spa">Beauty & Spa</option>
                                <option value="Home Services">Home Services</option>
                                <option value="Health & Wellness">Health & Wellness</option>
                                <option value="Events">Events</option>
                                <option value="Automotive">Automotive</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.category && <p className="text-xs text-red-500 font-bold ml-1">{errors.category.message}</p>}
                        </div>
                    )}
                />

                <Controller
                    name="bio"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">TAGLINE / BIO</label>
                            <input
                                {...field}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                placeholder="Short catchy slogan (e.g. 'Best Jollof in Accra')"
                            />
                            {errors.bio && <p className="text-xs text-red-500 font-bold ml-1">{errors.bio.message}</p>}
                        </div>
                    )}
                />

                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">DESCRIPTION</label>
                            <textarea
                                {...field}
                                rows={3}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                placeholder="Briefly describe what your business does..."
                            />
                            {errors.description && <p className="text-xs text-red-500 font-bold ml-1">{errors.description.message}</p>}
                        </div>
                    )}
                />

                <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1 flex items-center gap-2"><MapPin className="w-4 h-4" /> HEADQUARTERS LOCATION</label>
                            <div className="relative">
                                <LocationAutocomplete
                                    onSelect={(loc) => field.onChange(loc.address)}
                                    placeholder="Search for location..."
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                            </div>
                            {errors.location && <p className="text-xs text-red-500 font-bold ml-1">{errors.location.message}</p>}
                        </div>
                    )}
                />

                <Controller
                    name="depositFee"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">BOOKING DEPOSIT FEE (GH₵)</label>
                            <input
                                {...field}
                                type="number"
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                placeholder="e.g. 50 (Leave empty for no deposit)"
                            />
                            <p className="text-xs text-neutral-500 ml-1">Non-refundable fee to secure appointments.</p>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}

function StepCustomization({ control }: any) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-heading">Customize Your Page</h2>
            <p className="text-neutral-500">Choose a layout that fits your business model.</p>

            <Controller
                name="businessType"
                control={control}
                render={({ field }) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Store Variant */}
                        <div
                            onClick={() => field.onChange('store')}
                            className={`border-2 rounded-2xl p-6 cursor-pointer transition-all ${field.value === 'store'
                                ? "border-black dark:border-white bg-black/5 dark:bg-white/5"
                                : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300"
                                }`}
                        >
                            <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center">
                                <Store className={`w-12 h-12 ${field.value === 'store' ? 'text-black dark:text-white' : 'text-neutral-400'}`} />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-sm">Physical Location</span>
                                {field.value === 'store' && <Check className="w-4 h-4 text-green-600" />}
                            </div>
                            <p className="text-xs text-neutral-500">For businesses with a physical shop, studio, or office customers visit.</p>
                        </div>

                        {/* Service Variant */}
                        <div
                            onClick={() => field.onChange('service')}
                            className={`border-2 rounded-2xl p-6 cursor-pointer transition-all ${field.value === 'service'
                                ? "border-black dark:border-white bg-black/5 dark:bg-white/5"
                                : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300"
                                }`}
                        >
                            <div className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center">
                                <Briefcase className={`w-12 h-12 ${field.value === 'service' ? 'text-black dark:text-white' : 'text-neutral-400'}`} />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-bold text-sm">Mobile / Remote</span>
                                {field.value === 'service' && <Check className="w-4 h-4 text-green-600" />}
                            </div>
                            <p className="text-xs text-neutral-500">For businesses that travel to customers or operate without a public storefront.</p>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}

function StepRefinement({ control, watch, setValue }: any) {
    const businessType = watch('businessType');

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold font-heading">
                {businessType === 'store' ? "Store Configuration" : "Service Preferences"}
            </h2>
            <p className="text-neutral-500">
                {businessType === 'store'
                    ? "Let customers know when they can visit."
                    : "Tell us a bit more about how you operate."}
            </p>

            {businessType === 'store' ? (
                <div className="space-y-4">
                    <Controller
                        name="openingHours"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1 flex items-center gap-2"><Clock className="w-4 h-4" /> STANDARD OPENING HOURS</label>
                                <input
                                    {...field}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="e.g. Mon - Fri: 9am - 5pm"
                                />
                                <p className="text-xs text-neutral-500 ml-1">You can set detailed hours later in your dashboard.</p>
                            </div>
                        )}
                    />

                    <Controller
                        name="coverImage"
                        control={control}
                        render={({ field }) => (
                            <FileUpload
                                label="FLAGSHIP STORE IMAGE"
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />

                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <h3 className="font-bold text-lg mb-4">Location Details</h3>
                        <Controller
                            name="mapUrl"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">GOOGLE MAPS EMBED URL (Optional)</label>
                                    <input
                                        {...field}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        placeholder="<iframe src='...'>"
                                    />
                                    <p className="text-xs text-neutral-500 ml-1">Paste the embed code from Google Maps to show your exact location on page.</p>
                                </div>
                            )}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Controller
                            name="logo"
                            control={control}
                            render={({ field }) => (
                                <FileUpload
                                    label="BUSINESS LOGO"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                        <Controller
                            name="coverImage"
                            control={control}
                            render={({ field }) => (
                                <FileUpload
                                    label="COVER PHOTO"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>

                    <Controller
                        name="serviceRadius"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1 flex items-center gap-2"><Map className="w-4 h-4" /> SERVICE RADIUS / AREA</label>
                                <input
                                    {...field}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="e.g. Greater Accra Region"
                                />
                                <p className="text-xs text-neutral-500 ml-1">Where are you willing to travel to?</p>
                            </div>
                        )}
                    />
                </div>
            )}

            {/* Online Presence Section */}
            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
                <h3 className="font-bold text-lg mb-4">Online Presence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                        name="website"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">WEBSITE</label>
                                <input
                                    {...field}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="https://"
                                />
                            </div>
                        )}
                    />
                    <Controller
                        name="socialInstagram"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">INSTAGRAM HANDLE</label>
                                <input
                                    {...field}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="@username"
                                />
                            </div>
                        )}
                    />
                    <Controller
                        name="socialFacebook"
                        control={control}
                        render={({ field }) => (
                            <div className="space-y-2">
                                <label className="text-sm font-bold ml-1">FACEBOOK PAGE</label>
                                <input
                                    {...field}
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="Page Name or URL"
                                />
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Payout Section */}
            <PayoutSection control={control} watch={watch} setValue={setValue} />
        </div>
    );
}
