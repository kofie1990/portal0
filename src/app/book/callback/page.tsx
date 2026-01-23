"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/Navigation";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reference = searchParams.get("reference");

    // Status: loading, success, error
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your payment...");

    useEffect(() => {
        if (!reference) {
            setStatus("error");
            setMessage("No payment reference found.");
            return;
        }

        const verifyPayment = async () => {
            try {
                const res = await fetch(`/api/paystack/verify?reference=${reference}`);
                const data = await res.json();

                if (res.ok && data.success) {
                    setStatus("success");
                    setMessage("Payment confirmed! Your booking is securely set.");
                    // Optional: Redirect after a few seconds
                    // setTimeout(() => router.push("/account"), 3000);
                } else {
                    setStatus("error");
                    setMessage(data.error || "Payment verification failed.");
                }
            } catch (error) {
                console.error(error);
                setStatus("error");
                setMessage("Something went wrong verifying the payment.");
            }
        };

        verifyPayment();
    }, [reference]);

    return (
        <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-black rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xl max-w-md w-full mx-4">
            {status === "loading" && (
                <>
                    <Loader2 className="w-16 h-16 text-neutral-400 animate-spin mb-6" />
                    <h2 className="text-2xl font-bold mb-2">Verifying Payment</h2>
                    <p className="text-neutral-500">{message}</p>
                </>
            )}

            {status === "success" && (
                <>
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
                    <p className="text-neutral-500 mb-8">{message}</p>
                    <Link href="/account">
                        <button className="w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold">
                            Go to My Bookings
                        </button>
                    </Link>
                </>
            )}

            {status === "error" && (
                <>
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
                    <p className="text-neutral-500 mb-8">{message}</p>
                    <div className="flex gap-4 w-full">
                        <Link href="/" className="flex-1">
                            <button className="w-full py-3 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-bold text-sm">
                                Go Home
                            </button>
                        </Link>
                        <Link href="/account" className="flex-1">
                            <button className="w-full py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-bold text-sm">
                                Check Bookings
                            </button>
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}

export default function BookCallbackPage() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <Suspense fallback={<div className="text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>}>
                    <CallbackContent />
                </Suspense>
            </div>
        </main>
    );
}
