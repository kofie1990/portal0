export type Product = {
    id: string;
    name: string;
    price: string;
    image: string;
    imageUrl?: string;
};

export type Service = {
    name: string;
    duration: string;
    price: string;
    description?: string;
    category?: string;
};

export type Business = {
    id: string;
    name: string;
    category: string;
    items?: string[];
    location: string;
    distance: string;
    rating: number;
    reviews: number;
    image: string;
    imageUrl?: string | null;
    coverImage?: string | null;
    lat?: number;
    lng?: number;
    phone?: string;
    email?: string;
    address?: string;
    type: 'business' | 'individual' | 'profile';
    businessType?: 'store' | 'service';
    bio?: string;
    ownerImage?: string;
    products?: Product[];
    services?: Service[];
    openNow?: boolean;
    depositFee?: number;
};
