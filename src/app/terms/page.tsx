import Navigation from "@/components/Navigation";
import Link from "next/link";

export default function TermsOfUse() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
                <h1 className="font-heading text-4xl md:text-5xl font-bold mb-8">Terms of Use</h1>
                <p className="text-neutral-500 mb-8">Effective Date: April 2026</p>

                <div className="space-y-8 text-neutral-800 dark:text-neutral-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using the Portal platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">2. Description of Service</h2>
                        <p>
                            Portal provides an online platform that connects clients seeking services ("Clients") with businesses and individuals offering services ("Providers"). We solely facilitate these connections and transactions; we do not directly offer or fulfill the services listed on our platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">3. User Accounts</h2>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>You must provide accurate and complete information when creating an account.</li>
                            <li>You are responsible for maintaining the confidentiality of your account and password.</li>
                            <li>You agree to accept responsibility for all activities that occur under your account.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">4. Booking and Payments</h2>
                        <p>
                            <strong>For Clients:</strong> When booking a service, you may be required to pay a non-refundable deposit. Payments are processed securely via third-party providers such as Paystack. Transaction fees may apply and will be disclosed during checkout.
                        </p>
                        <p className="mt-4">
                            <strong>For Providers:</strong> You set your own prices and deposit requirements. You agree to honor all confirmed bookings. Portal acts as an intermediary for deposits but is not responsible for the collection of remaining balances owed directly to you at the time of service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">5. Provider Obligations</h2>
                        <p>
                            Service providers must accurately represent their services, availability, location, and credentials. Providers must communicate promptly with clients regarding cancellations or schedule changes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">6. Prohibited Conduct</h2>
                        <p>Users agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Use the platform for any illegal purpose.</li>
                            <li>Harass, abuse, or harm another person.</li>
                            <li>Bypass the platform to arrange payments externally for services initially discovered through Portal intended to avoid platform fees.</li>
                            <li>Interfere with or disable security-related features of the platform.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">7. Limitation of Liability</h2>
                        <p>
                            Portal is not responsible for the quality, safety, or legality of the services provided by Providers. Any dispute originating from a booked service is strictly between the Client and the Provider. In no event shall Portal be liable for any indirect, incidental, special, or consequential damages.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">8. Modifications to Terms</h2>
                        <p>
                            We reserve the right to modify these terms at any time. We will continually update this page, and your continued use of our platform constitutes acceptance of those changes.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-sm text-neutral-500">
                    <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">&larr; Back to Home</Link>
                    <span>&copy; Portal 2026</span>
                </div>
            </div>
        </main>
    );
}
