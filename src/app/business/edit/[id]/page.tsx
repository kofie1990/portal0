"use client";

import Navigation from "@/components/Navigation";
import { useState, use } from "react";
import { MOCK_BUSINESSES } from "@/lib/mock-data";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, MapPin, DollarSign, Store, Tag, Clock } from "lucide-react";
import Image from "next/image";

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const vendor = MOCK_BUSINESSES.find((v) => v.id === id);

    if (!vendor) {
        notFound();
    }

    const [formData, setFormData] = useState({
        name: vendor.name,
        category: vendor.category,
        bio: vendor.bio || "",
        location: vendor.location,
        address: vendor.address,
        phone: vendor.phone,
        email: vendor.email,
        depositFee: vendor.depositFee || "",
        website: "",
        instagram: "",
        twitter: "",
        acceptCash: true,
        acceptMobileMoney: true,
        autoConfirm: false,
        hours: {
            mon: { open: "09:00", close: "17:00", closed: false },
            tue: { open: "09:00", close: "17:00", closed: false },
            wed: { open: "09:00", close: "17:00", closed: false },
            thu: { open: "09:00", close: "17:00", closed: false },
            fri: { open: "09:00", close: "17:00", closed: false },
            sat: { open: "10:00", close: "15:00", closed: false },
            sun: { open: "10:00", close: "15:00", closed: true },
        }
    });

    const handleHourChange = (day: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            hours: {
                ...prev.hours,
                [day]: { ...prev.hours[day as keyof typeof prev.hours], [field]: value }
            }
        }));
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            alert("Changes saved successfully!");
            router.push(`/dashboard/${id}`);
        }, 1000);
    };

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-28 pb-20 container-wide max-w-4xl mx-auto px-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </button>
                    <h1 className="text-xl font-bold">Edit Business Profile</h1>
                </div>

                <form onSubmit={handleSave} className="space-y-8">

                    {/* Cover & Profile Image Section */}
                    <div className="relative group cursor-pointer">
                        <div className="w-full h-48 bg-neutral-200 dark:bg-neutral-800 rounded-2xl overflow-hidden relative">
                            {vendor.coverImage && (
                                <Image
                                    src={vendor.coverImage}
                                    alt="Cover"
                                    fill
                                    className="object-cover opacity-50 group-hover:opacity-40 transition-opacity"
                                />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                    <Upload className="w-4 h-4" /> Change Cover
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-12 left-8">
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-black bg-neutral-300 dark:bg-neutral-700 relative overflow-hidden group/profile cursor-pointer">
                                {vendor.imageUrl && (
                                    <Image
                                        src={vendor.imageUrl}
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
                                    <div className="relative">
                                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <input
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-12 pr-4 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold ml-1">BIO / DESCRIPTION</label>
                                    <textarea
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors resize-none"
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
                                        <label className="text-sm font-bold ml-1">TWITTER / X</label>
                                        <input
                                            value={formData.twitter}
                                            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                            placeholder="@username"
                                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Operating Hours */}
                            <div className="bg-white dark:bg-black p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Clock className="w-5 h-5" /> Operating Hours
                                </h2>

                                <div className="space-y-4">
                                    {Object.entries(formData.hours).map(([day, schedule]) => (
                                        <div key={day} className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900 pb-4 last:border-0 last:pb-0">
                                            <div className="w-24 font-bold uppercase text-sm">{day}</div>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 text-sm text-neutral-500 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={schedule.closed}
                                                        onChange={(e) => handleHourChange(day, 'closed', e.target.checked)}
                                                        className="rounded text-black focus:ring-black"
                                                    />
                                                    Closed
                                                </label>
                                                {!schedule.closed && (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="time"
                                                            value={schedule.open}
                                                            onChange={(e) => handleHourChange(day, 'open', e.target.value)}
                                                            className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-2 py-1 text-sm outline-none border border-transparent focus:border-black dark:focus:border-white transition-colors"
                                                        />
                                                        <span className="text-neutral-400">-</span>
                                                        <input
                                                            type="time"
                                                            value={schedule.close}
                                                            onChange={(e) => handleHourChange(day, 'close', e.target.value)}
                                                            className="bg-neutral-100 dark:bg-neutral-900 rounded-lg px-2 py-1 text-sm outline-none border border-transparent focus:border-black dark:focus:border-white transition-colors"
                                                        />
                                                    </div>
                                                )}
                                                {schedule.closed && <span className="text-sm italic text-neutral-400 w-[150px] text-center">Closed all day</span>}
                                            </div>
                                        </div>
                                    ))}
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

                                <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-900">
                                    <h3 className="font-bold text-sm">Payment Methods</h3>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.acceptCash}
                                                onChange={(e) => setFormData({ ...formData, acceptCash: e.target.checked })}
                                                className="w-5 h-5 rounded-md border-neutral-300 text-black focus:ring-black"
                                            />
                                            <span className="text-sm">Cash</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.acceptMobileMoney}
                                                onChange={(e) => setFormData({ ...formData, acceptMobileMoney: e.target.checked })}
                                                className="w-5 h-5 rounded-md border-neutral-300 text-black focus:ring-black"
                                            />
                                            <span className="text-sm">Mobile Money</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-neutral-100 dark:border-neutral-900">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-sm">Auto-Confirm Bookings</h3>
                                            <p className="text-xs text-neutral-500">Automatically accept bookings without manual approval.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.autoConfirm}
                                                onChange={(e) => setFormData({ ...formData, autoConfirm: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                                        </label>
                                    </div>
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
