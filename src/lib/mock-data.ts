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
};

export type Vendor = {
    id: string;
    name: string;
    category: string;
    // Legacy simple items
    items: string[];
    location: string;
    distance: string;
    rating: number;
    reviews: number;
    image: string; // Placeholder color or class
    imageUrl?: string; // Path to real image in public folder
    coverImage?: string; // Background banner
    lat: number;
    lng: number;
    phone: string;
    email: string;
    address: string;
    type: 'business' | 'individual'; // 'individual' gets specific layout
    businessType?: 'product' | 'service'; // 'business' subtypes
    bio?: string;
    ownerImage?: string;
    // Richer data
    products?: Product[];
    services?: Service[];
    openNow?: boolean;
};

export const MOCK_VENDORS: Vendor[] = [
    {
        id: "1",
        name: "Osu Night Market Stalls",
        category: "Food",
        items: ["Kenkey", "Fried Fish", "Kelewele"],
        location: "Osu, Accra",
        distance: "0.5km",
        rating: 4.8,
        reviews: 230,
        image: "bg-orange-100",
        imageUrl: "/others/food_1.jpg",
        coverImage: "/others/market_night.jpg",
        lat: 5.5560,
        lng: -0.1800,
        phone: "+233 20 123 4567",
        email: "contact@osunightmarket.com",
        address: "Osu Oxford Street, near Frankies",
        type: 'business',
        businessType: 'product',
        openNow: true,
        bio: "Experience the vibrant nightlife and authentic flavors of Accra at the Osu Night Market. We offer a wide variety of local delicacies.",
        products: [
            { id: "p1", name: "Kenkey & Fish", price: "GH₵ 25", image: "bg-orange-200" },
            { id: "p2", name: "Kelewele", price: "GH₵ 15", image: "bg-yellow-200" },
            { id: "p3", name: "Grilled Tilapia", price: "GH₵ 40", image: "bg-neutral-200" }
        ]
    },
    {
        id: "2",
        name: "Madam Sarah's Fabrics",
        category: "Fashion",
        items: ["Kente Cloth", "Lace", "Wax Print"],
        location: "Makola Market",
        distance: "2.1km",
        rating: 4.5,
        reviews: 85,
        image: "bg-purple-100",
        imageUrl: "/others/clothes.jpg",
        coverImage: "/others/fabrics_bg.jpg",
        lat: 5.5450,
        lng: -0.2030,
        phone: "+233 24 987 6543",
        email: "sarah@fabrics.com",
        address: "Makola Market Lane 3, Accra Central",
        type: 'business',
        businessType: 'product',
        bio: "Madam Sarah's Fabrics has been serving the Accra community for over 20 years with high-quality authentic fabrics sourced from across West Africa.",
        products: [
            { id: "p1", name: "Authentic Kente", price: "GH₵ 800", image: "bg-red-200" },
            { id: "p2", name: "Wax Print (6 Yards)", price: "GH₵ 250", image: "bg-blue-200" },
            { id: "p3", name: "Lace Material", price: "GH₵ 400", image: "bg-purple-200" }
        ]
    },
    {
        id: "3",
        name: "Kofi Electronics Repair",
        category: "Services",
        items: ["Phone Screen Repair", "Laptop Battery"],
        location: "Circle, Accra",
        distance: "3.4km",
        rating: 4.9,
        reviews: 142,
        image: "bg-blue-100",
        lat: 5.5600,
        lng: -0.2110,
        phone: "+233 50 555 1234",
        email: "kofi@repair.com",
        address: "Kwame Nkrumah Circle, opposite Vodafone",
        type: 'individual',
        bio: "I am a skilled electronics technician with a passion for fixing gadgets. Bringing dead devices back to life is my specialty.",
    },
    {
        id: "4",
        name: "The Art Center Collective",
        category: "Art",
        items: ["Wood Carvings", "Bead Jewelry", "Paintings"],
        location: "Accra Central",
        distance: "1.2km",
        rating: 4.7,
        reviews: 310,
        image: "bg-red-100",
        lat: 5.5400,
        lng: -0.1900,
        phone: "+233 27 333 4444",
        email: "info@artcenter.gh",
        address: "Centre for National Culture, Accra",
        type: 'business',
        businessType: 'product',
        coverImage: "bg-neutral-800",
        bio: "A collective of local artists showcasing the rich cultural heritage of Ghana through handmade wood carvings, paintings, and traditional jewelry.",
        products: [
            { id: "p1", name: "Ebony Wood Carving", price: "GH₵ 350", image: "bg-stone-300" },
            { id: "p2", name: "Beaded Necklace", price: "GH₵ 80", image: "bg-red-300" },
            { id: "p3", name: "Canvas Painting", price: "GH₵ 1200", image: "bg-blue-300" }
        ]
    },
    {
        id: "5",
        name: "Garden City Fresh",
        category: "Food",
        items: ["Fresh Tomatoes", "Peppers", "Yam"],
        location: "East Legon",
        distance: "5.0km",
        rating: 4.6,
        reviews: 54,
        image: "bg-green-100",
        imageUrl: "/others/fruits.jpg",
        coverImage: "/others/farm_bg.jpg",
        lat: 5.6350,
        lng: -0.1600,
        phone: "+233 55 888 9999",
        email: "fresh@gardencity.com",
        address: "A&C Mall Parking Lot, East Legon",
        type: 'business',
        businessType: 'product',
        bio: "Serving the freshest organic produce sourced directly from farmers in the Ashanti region. We believe in quality and sustainability.",
        products: [
            { id: "p1", name: "Organic Tomatoes (Kg)", price: "GH₵ 30", image: "bg-red-400" },
            { id: "p2", name: "Fresh Yam (Tuber)", price: "GH₵ 40", image: "bg-stone-100" },
            { id: "p3", name: "Green Peppers (Pack)", price: "GH₵ 15", image: "bg-green-200" }
        ]
    },
];
