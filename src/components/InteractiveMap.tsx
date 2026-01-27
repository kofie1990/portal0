import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";

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
    services?: {
        id: string;
        name: string;
        price: string;
        description?: string;
        image?: string | null;
        category?: string;
    }[];
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

// Component to handle map clicks to deselect
const MapEventHandler = ({ onMapClick }: { onMapClick: () => void }) => {
    useMapEvents({
        click: () => onMapClick(),
    });
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
    const [selectedItem, setSelectedItem] = useState<MapItem | null>(null);

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
        setSelectedItem(item);
    };

    const handleGetDirections = (item: MapItem) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;
        window.open(url, '_blank');
    };

    // Custom Black Dot Marker
    const createCustomIcon = (isSelected: boolean) => {
        return L.divIcon({
            className: "custom-map-marker",
            html: `<div class="w-4 h-4 ${isSelected ? 'bg-black scale-150' : 'bg-black'} rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.3)] border-2 border-white hover:scale-125 transition-transform"></div>`,
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
                <MapEventHandler onMapClick={() => setSelectedItem(null)} />

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
                        icon={createCustomIcon(selectedItem?.id === item.id)}
                        eventHandlers={{
                            click: (e) => {
                                L.DomEvent.stopPropagation(e); // Prevent map click from firing
                                handleMarkerClick(item);
                            },
                        }}
                    >
                        {/* Removed Popup - Using Bottom Sheet Instead */}
                    </Marker>
                ))}
            </MapContainer>

            {/* Bottom Listings Sheet */}
            {selectedItem && (
                <div className="absolute bottom-4 left-4 right-4 z-[500] flex flex-col gap-2 animate-in slide-in-from-bottom-10 fade-in duration-300 pointer-events-none">
                    <div className="flex items-center justify-between mb-2 px-2 pointer-events-auto">
                        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-black/5">
                            <span className="w-2 h-2 rounded-full bg-black"></span>
                            <span className="text-xs font-bold tracking-wide uppercase text-black">{selectedItem.name}</span>
                        </div>
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-black/5 hover:bg-neutral-100 transition-colors text-black"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-1 no-scrollbar pointer-events-auto">
                        {/* Profile/Business Card (First Card) */}
                        <div className="min-w-[280px] w-[85vw] max-w-[320px] md:w-[320px] bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden snap-center flex-shrink-0">
                            <div className={`h-32 w-full ${selectedItem.image || 'bg-neutral-200'} relative`}>
                                {selectedItem.imageUrl && (
                                    <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-3 left-4 text-white">
                                    <h3 className="font-heading font-bold text-lg leading-tight">{selectedItem.name}</h3>
                                    <p className="text-xs opacity-90">{selectedItem.address || "Location available"}</p>
                                </div>
                            </div>
                            <div className="p-4 grid grid-cols-2 gap-3">
                                {selectedItem.phone && (
                                    <a
                                        href={`tel:${selectedItem.phone}`}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold rounded-xl transition-colors"
                                    >
                                        CALL
                                    </a>
                                )}
                                <button
                                    onClick={() => handleGetDirections(selectedItem)}
                                    className={`flex items-center justify-center gap-2 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-colors ${!selectedItem.phone ? 'col-span-2' : ''}`}
                                >
                                    DIRECTIONS
                                </button>
                                <Link
                                    href={
                                        selectedItem.type === 'business'
                                            ? selectedItem.businessType === 'service'
                                                ? `/business/service/${selectedItem.id}`
                                                : `/business/store/${selectedItem.id}`
                                            : `/profile/${selectedItem.id}`
                                    }
                                    className="col-span-2 flex items-center justify-center gap-2 py-2.5 border-2 border-black text-black hover:bg-black hover:text-white text-xs font-bold rounded-xl transition-all"
                                >
                                    VIEW FULL PROFILE
                                </Link>
                            </div>
                        </div>

                        {/* Service Cards */}
                        {selectedItem.services && selectedItem.services.map((service, idx) => (
                            <Link
                                key={idx}
                                href={selectedItem.type === 'business' ? `/business/service/${selectedItem.id}` : `/service/${service.id}`}
                                className="min-w-[240px] max-w-[240px] bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden snap-center flex-shrink-0 group hover:ring-2 ring-black transition-all"
                            >
                                <div className="h-32 w-full bg-neutral-100 relative overflow-hidden">
                                    {service.image ? (
                                        <img src={service.image} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                            <span className="text-4xl">✨</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold tracking-wider text-black">
                                        {service.price}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-sm truncate mb-1 text-black">{service.name}</h4>
                                    <p className="text-xs text-neutral-500 line-clamp-2 mb-3 h-8">
                                        {service.description || "No description available."}
                                    </p>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 group-hover:text-black transition-colors">
                                        VIEW DETAILS <ArrowRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
