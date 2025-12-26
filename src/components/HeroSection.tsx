import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
    return (
        <section className="min-h-[auto] pt-16 grid grid-cols-1 lg:grid-cols-12 gap-0">

            {/* Left Content Area - Large Negative Space */}
            <div className="lg:col-span-5 flex flex-col justify-start lg:justify-center px-8 lg:pl-16 lg:pr-12 relative z-10 order-2 lg:order-1 pt-32 lg:py-0 pb-12 lg:pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <h1 className="font-heading text-6xl lg:text-8xl font-bold leading-[0.9] tracking-tighter mb-8 max-w-lg">
                        Find exactly what you need.
                    </h1>
                    <p className="text-lg lg:text-xl text-neutral-500 max-w-sm mb-12 leading-relaxed">
                        Stop searching blindly. Portal connects you directly to local vendors nearby.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => {
                                document.getElementById('search-interface')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // Optional: Focus the input if possible, but scroll is primary intent here
                            }}
                            className="bg-foreground text-background px-8 py-4 text-sm font-bold tracking-wide rounded-full flex items-center justify-center gap-3 hover:scale-105 transition-transform"
                        >
                            START SEARCHING <ArrowRight className="w-4 h-4" />
                        </button>
                        <Link href="/list">
                            <button className="border border-neutral-200 dark:border-neutral-800 px-8 py-4 text-sm font-bold tracking-wide rounded-full hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                LIST YOUR ITEM
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Right Visual Anchor - 1200px High Panel */}
            <div className="lg:col-span-7 h-[60vh] lg:h-[1200px] relative overflow-hidden order-1 lg:order-2">
                <motion.div
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2 }}
                    className="w-full h-full relative"
                >
                    {/* Placeholder for the luxury visual anchor. 
               Using a premium abstract or lifestyle image. 
               For now a solid luxury gradient or Next.js Image placeholder 
               if we had assets. I will use a generated placeholder div with style. 
           */}
                    <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                        {/* 
                            SUGGESTION: Use a minimalist, high-contrast black & white architectural abstract.
                            Place image in public/hero-image.jpg
                         */}
                        <Image
                            src="/hero-image.jpg"
                            alt="Luxury Abstract Architecture"
                            fill
                            className="object-cover opacity-80"
                            priority
                        />
                    </div>

                    {/* Overlay Gradient for integration */}
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background/20 lg:to-transparent lg:bg-gradient-to-r lg:from-background lg:via-background/50 lg:to-transparent lg:to-30%" />
                </motion.div>
            </div>

        </section>
    );
}
