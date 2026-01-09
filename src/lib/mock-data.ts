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

export type Business = {
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
    businessType?: 'store' | 'service'; // 'business' subtypes
    bio?: string;
    ownerImage?: string;
    // Richer data
    products?: Product[];
    services?: Service[];
    openNow?: boolean;
    depositFee?: number;
};

export const MOCK_BUSINESSES: Business[] = [
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
        businessType: 'store',
        openNow: true,
        depositFee: 20,
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
        businessType: 'store',
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
        businessType: 'store',
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
        businessType: 'store',
        bio: "Serving the freshest organic produce sourced directly from farmers in the Ashanti region. We believe in quality and sustainability.",
        products: [
            { id: "p1", name: "Organic Tomatoes (Kg)", price: "GH₵ 30", image: "bg-red-400" },
            { id: "p2", name: "Fresh Yam (Tuber)", price: "GH₵ 40", image: "bg-stone-100" },
            { id: "p3", name: "Green Peppers (Pack)", price: "GH₵ 15", image: "bg-green-200" }
        ]
    },
    // Demo Business: Product Store
    {
        id: "atelier-1",
        name: "The Atelier",
        category: "Fashion",
        items: ["Vase", "Tunic", "Tote"],
        location: "Osu, Accra",
        distance: "0km",
        rating: 4.9,
        reviews: 128,
        image: "bg-black",
        imageUrl: "/others/store_2.jpg",
        coverImage: "/others/storefront.jpg",
        lat: 5.5560,
        lng: -0.1800,
        phone: "+233 55 123 4567",
        email: "hello@theatelier.com",
        address: "145 Osu Badu Street, Osu, Accra",
        type: 'business',
        businessType: 'store',
        openNow: true,
        depositFee: 150,
        bio: "A curated concept store featuring handcrafted home goods, contemporary fashion, and artisanal accessories. We celebrate Ghanaian craftsmanship with a modern, minimalist aesthetic.",
        products: [
            { id: "p1", name: "Obsidian Vase", price: "GH₵ 450", image: "bg-neutral-200" },
            { id: "p2", name: "Linen Tunic", price: "GH₵ 280", image: "bg-neutral-300", imageUrl: "/others/clothes.jpg" },
            { id: "p3", name: "Leather Tote", price: "GH₵ 850", image: "bg-stone-200" },
            { id: "p4", name: "Ceramic Plate Set", price: "GH₵ 320", image: "bg-zinc-200", imageUrl: "/others/food_2.jpg" },
            { id: "p5", name: "Woven Basket", price: "GH₵ 150", image: "bg-orange-100" },
            { id: "p6", name: "Brass Jewelry", price: "GH₵ 120", image: "bg-yellow-100" },
        ],
        services: [
            { name: "Private Shopping Session", duration: "1 hr", price: "Free" },
            { name: "Interior Styling Consultation", duration: "2 hrs", price: "GH₵ 500" },
            { name: "Custom Order Measurement", duration: "30 min", price: "GH₵ 100" }
        ]
    },
    // Demo Business: Service Provider
    {
        id: "barber-1",
        name: "Kwame The Barber",
        category: "Service",
        items: ["Haircut", "Shave"],
        location: "East Legon",
        distance: "0km",
        rating: 5.0,
        reviews: 214,
        image: "bg-black",
        imageUrl: "/people/person_6.jpg",
        coverImage: "/others/haircut_1.jpg",
        lat: 5.6350,
        lng: -0.1600,
        phone: "+233 55 987 6543",
        email: "kwame@barber.com",
        address: "East Legon, near A&C Mall",
        type: 'business',
        businessType: 'service',
        openNow: true,
        depositFee: 50,
        bio: "Master barber specializing in precision fades and classic cuts. Bringing over 10 years of experience from London to Accra. Dedicated to the craft of male grooming.",
        services: [
            { name: "Signature Haircut", duration: "45 min", price: "GH₵ 150" },
            { name: "Beard Trim & Shape", duration: "30 min", price: "GH₵ 80" },
            { name: "Full Grooming Package", duration: "90 min", price: "GH₵ 250" },
            { name: "Scalp Treatment", duration: "30 min", price: "GH₵ 120" },
        ]
    },
];

export const MOCK_SERVICES = [
    { id: 1, name: "Kwame The Barber", category: "Barber", location: "East Legon", image: "bg-zinc-800", imageUrl: "/others/haircut_1.jpg", price: "From GH₵ 50" },
    { id: 2, name: "Elite Cleaning", category: "Cleaning", location: "Cantonments", image: "bg-blue-100", imageUrl: "", price: "From GH₵ 150" },
    { id: 3, name: "FitLife Gym", category: "Fitness", location: "Airport City", image: "bg-gray-200", imageUrl: "/people/person_4.jpg", price: "Membership" },
    { id: 4, name: "Tech Fix", category: "Repair", location: "Osu", image: "bg-blue-50", imageUrl: "", price: "Quote" },
    { id: 5, name: "The Atelier", category: "Fashion", location: "Osu", image: "bg-neutral-200", imageUrl: "/others/storefront.jpg", price: "Custom" },
    { id: 6, name: "Mama Kitchen", category: "Culinary", location: "Dzorwulu", image: "bg-orange-100", imageUrl: "/others/fruits.jpg", price: "Menu" },
];
