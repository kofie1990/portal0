import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
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

// Generic Map Item Interface
export type MapItem = {
    id: string;
    lat: number;
    lng: number;
    name: string;
    image?: string; // CSS class for background color
    imageUrl?: string | null;
    category?: string;
    rating?: number;
    address?: string | null;
    phone?: string | null;
    type: 'business' | 'profile' | 'individual' | 'service_item';
    businessType?: 'store' | 'service'; // For businesses
};


interface InteractiveMapProps {
    items: MapItem[];
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

export default function InteractiveMap({ items, center, zoom }: InteractiveMapProps) {
    // Default to Accra if no center provided
    const [mapCenter, setMapCenter] = useState(center || { lat: 5.5600, lng: -0.2057 });
    const [mapZoom, setMapZoom] = useState(zoom || 13);
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // User Location State
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        // Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting user location:", error);
                }
            );
        }

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

        return () => {
            observer.disconnect();
            // Cleanup map on unmount to prevent "Map container is being reused" error
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    const handleMarkerClick = (item: MapItem) => {
        setMapCenter({ lat: item.lat, lng: item.lng });
        setMapZoom(16); // Zoom in closer
    };

    const handleGetDirections = (item: MapItem) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;
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

    // User Location Icon (Blue Dot with Pulse)
    const createUserLocationIcon = () => {
        return L.divIcon({
            className: "user-location-marker",
            html: `<div class="relative flex items-center justify-center w-6 h-6">
            <div class="absolute w-full h-full bg-blue-500/30 rounded-full animate-ping"></div>
            <div class="relative w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-md"></div>
        </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    };

    return (
        <div ref={containerRef} className="w-full h-full relative z-0">
            <MapContainer
                key="interactive-map" // Force unique key
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

                {/* User Location Marker */}
                {userLocation && (
                    <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={createUserLocationIcon()}
                    >
                        <Popup className="custom-popup" closeButton={false}>
                            <div className="p-2 text-xs font-bold text-center">
                                You are here
                            </div>
                        </Popup>
                    </Marker>
                )}

                {items.map((item) => (
                    <Marker
                        key={`${item.type}-${item.id}`}
                        position={[item.lat, item.lng]}
                        icon={createCustomIcon()}
                        eventHandlers={{
                            click: () => handleMarkerClick(item),
                        }}
                    >
                        <Popup className="custom-popup" closeButton={false}>
                            <div className="p-0 min-w-[280px] font-sans overflow-hidden">
                                {/* Header Image/Color */}
                                <div className={`h-24 w-full ${item.image || 'bg-neutral-200'} relative`}>
                                    {item.imageUrl && (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                    )}
                                    {item.category && (
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold tracking-wider uppercase">
                                            {item.category}
                                        </div>
                                    )}
                                    {item.rating && (
                                        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/80 text-white px-2 py-1 rounded-full text-xs font-bold">
                                            <span>★</span> {item.rating}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <Link href={
                                        item.type === 'business'
                                            ? item.businessType === 'service'
                                                ? `/business/service/${item.id}`
                                                : `/business/store/${item.id}`
                                            : item.type === 'service_item'
                                                ? `/service/${item.id}`
                                                : `/profile/${item.id}`
                                    } className="group">
                                        <h4 className="font-heading font-bold text-lg leading-tight mb-1 group-hover:underline underline-offset-2 decoration-2 decoration-neutral-300 transition-all">{item.name}</h4>
                                    </Link>
                                    <p className="text-xs text-neutral-500 mb-3 flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full bg-neutral-200 inline-block"></span>
                                        {item.address || "Location available"}
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {item.phone && (
                                            <a
                                                href={`tel:${item.phone}`}
                                                className="flex items-center justify-center gap-2 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold rounded-lg transition-colors"
                                            >
                                                CONTACT
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleGetDirections(item)}
                                            className={`flex items-center justify-center gap-2 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors ${!item.phone ? 'col-span-2' : ''}`}
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
