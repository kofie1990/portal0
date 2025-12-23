"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Vendor } from "@/lib/mock-data";
import L from "leaflet";
import { useEffect } from "react";

// Fix for default marker icon in Leaflet with Next.js/Webpack
const iconAnchor = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface InteractiveMapProps {
    vendors: Vendor[];
    center?: { lat: number; lng: number };
    zoom?: number;
}

export default function InteractiveMap({ vendors, center, zoom }: InteractiveMapProps) {
    // Default to Accra if no center provided
    const mapCenter = center || { lat: 5.5600, lng: -0.2057 };
    const mapZoom = zoom || 13;

    useEffect(() => {
        // Force resize event to ensure map renders correctly if container size changes
        window.dispatchEvent(new Event('resize'));
    }, []);

    return (
        <div className="w-full h-[600px] relative z-0">
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                className="outline-none"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {vendors.map((vendor) => (
                    <Marker
                        key={vendor.id}
                        position={[vendor.lat, vendor.lng]}
                        icon={iconAnchor}
                    >
                        <Popup className="font-sans">
                            <div className="p-1 min-w-[150px]">
                                <h4 className="font-bold text-sm mb-1">{vendor.name}</h4>
                                <p className="text-xs text-neutral-500 mb-2">{vendor.category}</p>
                                <button className="w-full py-1 bg-black text-white text-xs font-bold rounded">
                                    View Details
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
