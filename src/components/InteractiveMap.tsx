import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Vendor } from "@/lib/mock-data";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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

const MapController = ({ center, zoom }: { center: { lat: number, lng: number }, zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom);
    }, [center, zoom, map]);
    return null;
};

export default function InteractiveMap({ vendors, center, zoom }: InteractiveMapProps) {
    // Default to Accra if no center provided
    const [mapCenter, setMapCenter] = useState(center || { lat: 5.5600, lng: -0.2057 });
    const [mapZoom, setMapZoom] = useState(zoom || 13);
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Resize observer to handle container size changes (animation)
        const observer = new ResizeObserver(() => {
            if (mapRef.current) {
                mapRef.current.invalidateSize();
            }
        });

        observer.observe(containerRef.current);

        // Initial invalidation
        setTimeout(() => {
            mapRef.current?.invalidateSize();
        }, 100);

        return () => observer.disconnect();
    }, []);

    const handleMarkerClick = (vendor: Vendor) => {
        setMapCenter({ lat: vendor.lat, lng: vendor.lng });
        setMapZoom(16); // Zoom in closer
    };

    const handleGetDirections = (vendor: Vendor) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${vendor.lat},${vendor.lng}`;
        window.open(url, '_blank');
    };

    // Custom Black Dot Marker
    const createCustomIcon = () => {
        return L.divIcon({
            className: "custom-map-marker",
            html: `<div class="w-4 h-4 bg-black rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] border-2 border-white hover:scale-125 transition-transform"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            popupAnchor: [0, -10]
        });
    };

    return (
        <div ref={containerRef} className="w-full h-full relative z-0">
            <MapContainer
                ref={mapRef}
                center={mapCenter}
                zoom={mapZoom}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                className="outline-none bg-neutral-100"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                <MapController center={mapCenter} zoom={mapZoom} />

                {vendors.map((vendor) => (
                    <Marker
                        key={vendor.id}
                        position={[vendor.lat, vendor.lng]}
                        icon={createCustomIcon()}
                        eventHandlers={{
                            click: () => handleMarkerClick(vendor),
                        }}
                    >
                        <Popup className="custom-popup" closeButton={false}>
                            <div className="p-0 min-w-[280px] font-sans overflow-hidden">
                                {/* Header Image/Color */}
                                <div className={`h-24 w-full ${vendor.image} relative`}>
                                    {vendor.imageUrl && (
                                        <img src={vendor.imageUrl} alt={vendor.name} className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-wider uppercase">
                                        {vendor.category}
                                    </div>
                                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/80 text-white px-2 py-1 rounded-full text-xs font-bold">
                                        <span>★</span> {vendor.rating}
                                    </div>
                                </div>

                                <div className="p-4">
                                    <Link href={`/profile/${vendor.id}`} className="group">
                                        <h4 className="font-heading font-bold text-lg leading-tight mb-1 group-hover:underline underline-offset-2 decoration-2 decoration-neutral-300 transition-all">{vendor.name}</h4>
                                    </Link>
                                    <p className="text-xs text-neutral-500 mb-3 flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-neutral-200 inline-block"></span>
                                        {vendor.address}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        <a
                                            href={`tel:${vendor.phone}`}
                                            className="flex items-center justify-center gap-2 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold rounded-lg transition-colors"
                                        >
                                            CONTACT
                                        </a>
                                        <button
                                            onClick={() => handleGetDirections(vendor)}
                                            className="flex items-center justify-center gap-2 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors"
                                        >
                                            DIRECTIONS
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
