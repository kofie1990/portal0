"use client";

import { useState, useEffect } from 'react';

export function useUserLocation() {
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.log('Location access denied or failed.', err),
                { timeout: 10000, maximumAge: 60000 }
            );
        }
    }, []);

    const calculateDistance = (lat?: number | null, lng?: number | null) => {
        if (!userLocation || !lat || !lng) return null;

        const R = 6371; // Radius of the Earth in km
        const dLat = (lat - userLocation.lat) * (Math.PI / 180);
        const dLng = (lng - userLocation.lng) * (Math.PI / 180);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        
        return distance.toFixed(1) + 'km';
    };

    return { userLocation, calculateDistance };
}
