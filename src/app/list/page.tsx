"use client";

import Navigation from "@/components/Navigation";
import { motion } from "framer-motion";
import { ArrowRight, Upload, MapPin, Tag, Navigation2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MOCK_BUSINESSES } from "@/lib/mock-data";

export default function ListPage() {
    const [location, setLocation] = useState("");
    const [selectedBusiness, setSelectedBusiness] = useState("individual");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock User Businesses
    const MY_BUSINESSES = [
        { id: "atelier-1", name: "The Atelier", location: "Osu, Accra" },
        { id: "barber-1", name: "Kwame The Barber", location: "East Legon" }
    ];

    const handlePublish = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedBusiness === "individual" && (!email || !phone)) {
            alert("Please provide both email and phone number to list your service.");
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            if (selectedBusiness !== "individual") {
                // Mock existing businesses for the dropdown
                const business = MOCK_BUSINESSES.find(b => b.id === selectedBusiness);
                if (business) {
                    alert(`Service added to ${business?.name}!`);
                } else {
                    alert(`Could not find business with ID: ${selectedBusiness}. Service listed as individual.`);
                }
            } else {
                alert(`Service Listed Successfully! \n\nA confirmation has been sent to ${email}. You can claim and manage this listing by creating an account.`);
            }
        }, 1500);
    };

    const handleUseLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }, (error) => {
                console.error("Error getting location:", error);
                alert("Could not get your location. Please check browser permissions.");
            });
        } else {
            alert("Geolocation is not available in your browser.");
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
                        <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 mb-4 block">PORTAL FOR VENDORS</span>
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
                                    <optgroup label="My Businesses">
                                        {MY_BUSINESSES.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold tracking-wide ml-1">SERVICE NAME</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Home Cleaning Standard"
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold tracking-wide ml-1">PRICE (GH₵)</label>
                                    <input
                                        type="text"
                                        placeholder="0.00"
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold tracking-wide ml-1">SHORT DESCRIPTION</label>
                                <textarea
                                    rows={3}
                                    placeholder="Briefly describe your service..."
                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><Tag className="w-4 h-4" /> CATEGORY</label>
                                    <select className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none appearance-none">
                                        <option>Select Category</option>
                                        <option>Fashion</option>
                                        <option>Food</option>
                                        <option>Services</option>
                                        <option>Art</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold tracking-wide ml-1 flex items-center gap-2"><MapPin className="w-4 h-4" /> LOCATION</label>
                                    {selectedBusiness === "individual" ? (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Accra, GH"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-5 pr-12 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleUseLocation}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                                title="Use Current Location"
                                            >
                                                <Navigation2 className="w-4 h-4 text-neutral-500" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl px-5 py-4 text-neutral-500 italic">
                                            Using {MY_BUSINESSES.find(b => b.id === selectedBusiness)?.name}'s location
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
                                <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors group">
                                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-5 h-5 text-neutral-500" />
                                    </div>
                                    <p className="font-medium text-sm">Upload Photos</p>
                                    <p className="text-xs text-neutral-500 mt-1">PNG, JPG up to 10MB</p>
                                </div>
                            </div>

                            <button disabled={isSubmitting} type="submit" className="w-full bg-foreground text-background py-4 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mt-4">
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
