"use client";

import Navigation from "@/components/Navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, use } from "react";
import { notFound, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, DollarSign, Clock, ImageIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

export default function ManageServicesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const supabase = createClient();
    const { showToast } = useToast();

    const [business, setBusiness] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Fetch Business
            const { data: businessData, error: businessError } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', id)
                .single();

            if (businessError || !businessData) {
                console.error("Error fetching business:", businessError);
                setLoading(false);
                return;
            }
            setBusiness(businessData);

            // 2. Fetch Services
            const { data: servicesData, error: servicesError } = await supabase
                .from('services')
                .select('*')
                .eq('business_id', id)
                .order('created_at', { ascending: false });

            if (servicesData) {
                setServices(servicesData);
            }
            setLoading(false);
        };

        fetchData();
    }, [id, supabase]);

    const handleDelete = async (serviceId: string) => {
        if (!confirm("Are you sure you want to delete this service?")) return;

        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', serviceId);

        if (error) {
            showToast("Error deleting service", "error");
            console.error(error);
        } else {
            setServices(services.filter(s => s.id !== serviceId));
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-neutral-400" /></div>;
    }

    if (!business) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-28 pb-12 container-wide px-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <Link href={`/dashboard/${id}`} className="flex items-center gap-2 text-neutral-500 hover:text-black dark:hover:text-white transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold font-heading">Manage Services</h1>
                        <p className="text-neutral-500">Services for <span className="font-bold text-black dark:text-white">{business.name}</span></p>
                    </div>

                    <Link href={`/list?business_id=${id}`}>
                        <button className="flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg">
                            <Plus className="w-5 h-5" /> Add New Service
                        </button>
                    </Link>
                </div>

                {/* Services Grid */}
                {services.length === 0 ? (
                    <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800 border-dashed">
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-neutral-400" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Services Listed</h3>
                        <p className="text-neutral-500 mb-6 max-w-md mx-auto">You haven't added any services to this business yet. Add your first service to start accepting bookings.</p>
                        <Link href={`/list?business_id=${id}`}>
                            <button className="px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                                Add Service
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {services.map((service) => (
                            <div key={service.id} className="group bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-all">
                                {/* Image */}
                                <div className="w-full md:w-32 h-32 md:h-24 bg-neutral-100 dark:bg-neutral-900 rounded-xl relative overflow-hidden flex-shrink-0">
                                    {(service.image_url || service.images?.[0]) ? (
                                        <Image
                                            src={service.image_url || service.images[0]}
                                            alt={service.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                            <ImageIcon className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="font-heading font-bold text-lg mb-1">{service.name}</h3>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1">
                                            <DollarSign className="w-3.5 h-3.5" />
                                            {service.price_currency} {service.price_amount}
                                        </span>
                                        {service.duration && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {service.duration} mins
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-400 mt-2 line-clamp-1">{service.description}</p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Link href={`/service/edit/${service.id}`} className="flex-1 md:flex-none">
                                        <button className="w-full md:w-auto px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2">
                                            <Edit2 className="w-4 h-4" /> Edit
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        className="px-4 py-2 border border-red-100 dark:border-red-900/30 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
