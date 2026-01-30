"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Location {
    lat: number;
    lng: number;
    address: string;
}

interface LocationAutocompleteProps {
    onSelect: (location: Location) => void;
    initialValue?: string;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export default function LocationAutocomplete({ onSelect, initialValue = "", placeholder = "Search for a location...", className = "", required = false }: LocationAutocompleteProps) {
    const [query, setQuery] = useState(initialValue);
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2 && isOpen) {
                searchLocation(query);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, isOpen]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const searchLocation = async (searchQuery: string) => {
        setIsLoading(true);
        try {
            // Using OpenStreetMap Nominatim API
            // Note: Nominatim usage policy requires a valid User-Agent
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
                {
                    headers: {
                        "User-Agent": "PortalApp/1.0",
                        "Accept-Language": "en-US,en;q=0.9"
                    }
                }
            );

            if (!response.ok) {
                // If 503 or other error, fallback or throw
                throw new Error(`Location service error: ${response.status}`);
            }

            const data = await response.json();
            setResults(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error searching location:", error);
            setResults([]);
            // Optional: show a toast or small error UI for "Location service busy"
        } finally {
            setIsLoading(false);
        }
    };

    const shortenAddress = (fullAddress: string) => {
        // Init with first 3 parts
        const parts = fullAddress.split(',').map(p => p.trim());
        if (parts.length <= 3) return fullAddress;
        return parts.slice(0, 3).join(', ');
    };

    const handleSelect = (item: any) => {
        const shortAddress = shortenAddress(item.display_name);
        const location: Location = {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: shortAddress
        };
        setQuery(shortAddress);
        onSelect(location);
        setIsOpen(false);
    };

    const handleUseCurrentLocation = (e?: React.MouseEvent) => {
        e?.preventDefault(); // Prevent any form submission or default behavior

        if ("geolocation" in navigator) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Reverse geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                        {
                            headers: {
                                "User-Agent": "PortalApp/1.0"
                            }
                        }
                    );
                    const data = await response.json();

                    const fullAddress = data.display_name || `${latitude}, ${longitude}`;
                    const shortAddress = shortenAddress(fullAddress);

                    const location: Location = {
                        lat: latitude,
                        lng: longitude,
                        address: shortAddress
                    };

                    setQuery(location.address);
                    onSelect(location);
                    setIsOpen(false);
                } catch (error) {
                    console.error("Error getting location details:", error);
                } finally {
                    setIsLoading(false);
                }
            }, (error) => {
                console.error("Error getting current location:", error);
                setIsLoading(false);
            });
        }
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                    type="text"
                    required={required}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-neutral-100 dark:bg-neutral-900 border-none pl-12 pr-12 py-4 rounded-xl text-base font-medium outline-none focus:ring-2 ring-black dark:ring-white transition-all"
                    placeholder={placeholder}
                />
                {isLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                        <div className="p-2">
                            <button
                                type="button"
                                onClick={handleUseCurrentLocation}
                                onMouseDown={(e) => e.preventDefault()}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:bg-neutral-100 dark:active:bg-neutral-700 rounded-lg transition-colors text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="block text-sm font-bold text-blue-600 dark:text-blue-400">Use current location</span>
                                    <span className="block text-xs text-neutral-400">Near you</span>
                                </div>
                            </button>

                            {results.length > 0 && <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-2" />}

                            {results.map((item) => (
                                <button
                                    type="button"
                                    key={item.place_id}
                                    onClick={() => handleSelect(item)}
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 active:bg-neutral-100 dark:active:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="block text-sm font-medium truncate">{item.display_name.split(',')[0]}</span>
                                        <span className="block text-xs text-neutral-500 truncate">{item.display_name}</span>
                                    </div>
                                </button>
                            ))}

                            {results.length === 0 && query.length > 2 && !isLoading && (
                                <div className="px-4 py-8 text-center text-neutral-500 text-sm">
                                    No results found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
