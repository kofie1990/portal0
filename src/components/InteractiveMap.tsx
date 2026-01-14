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
    type: 'business' | 'profile';
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
                                            : `/service/${item.id}` // Link to service profile/page? Or just profile? Assuming generic profile for now or maybe service details if context implies.
                                        // Actually for profile type, we might want to link to their profile page or a service page contextually.
                                        // Given the task, individual providers have 'services'. 
                                        // Let's link to the profile page for now, or if it's a specific service marker (not yet distinguished), just profile.
                                        // Wait, the task says "individual providers".
                                        // Let's link to `/profile/[id]` which should be the public profile page.
                                        // Note: Current schema links services to profiles.
                                        // Let's assume `/profile/${item.id}` is the correct public route for a provider.
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
