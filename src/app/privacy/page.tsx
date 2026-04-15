import Navigation from "@/components/Navigation";
import Link from "next/link";

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen bg-background text-foreground font-sans">
            <Navigation />

            <div className="pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto">
                <h1 className="font-heading text-4xl md:text-5xl font-bold mb-8">Privacy Policy</h1>
                <p className="text-neutral-500 mb-8">Last Updated: April 2026</p>

                <div className="space-y-8 text-neutral-800 dark:text-neutral-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">1. Introduction</h2>
                        <p>
                            Welcome to Portal ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.
                            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our platform to book services or list your business.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">2. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Personal Data:</strong> Name, email address, phone number, and profile picture when you register or update your account.</li>
                            <li><strong>Location Data:</strong> Address details or geolocation data to help you find nearby services or to set your business service radius.</li>
                            <li><strong>Booking Data:</strong> Information about the services you book or provide, scheduling times, and interaction history.</li>
                            <li><strong>Financial Data:</strong> We utilize third-party payment processors (such as Paystack) to handle transactions. We do not store your full credit card details on our servers.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">3. How We Use Your Information</h2>
                        <p>We use the collected information for various purposes, including to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>Facilitate the creation of and secure your account.</li>
                            <li>Process and manage your bookings, deposits, and service listings.</li>
                            <li>Send administrative information, such as booking confirmations, reminders, and updates.</li>
                            <li>Improve our platform, user experience, and customer service.</li>
                            <li>Calculate distances between clients and providers.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">4. Sharing Your Information</h2>
                        <p>
                            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
                            <strong>Service Providers:</strong> If you book a service, we share necessary details (such as your name, phone number, and location) with the service provider to fulfill the booking.
                            <strong>Third-Party Integrations:</strong> We share necessary data with payment gateways (Paystack) to process transactions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">5. Security of Your Information</h2>
                        <p>
                            We implement a variety of security measures to maintain the safety of your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">6. Your Privacy Rights</h2>
                        <p>
                            You may review, change, or terminate your account at any time by navigating to your Account Settings. If you would like your data to be permanently deleted, or if you have questions about your privacy rights, please contact our support team.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-black dark:text-white mb-4">7. Contact Us</h2>
                        <p>
                            If you have questions or comments about this policy, you may email us at support@mail.myportalgh.com or contact us via our platform.
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
