export type Vendor = {
    id: string;
    name: string;
    category: string;
    items: string[];
    location: string;
    distance: string;
    rating: number;
    image: string; // Placeholder color or class
    lat: number;
    lng: number;
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
        image: "bg-orange-100",
        lat: 5.5560,
        lng: -0.1800,
    },
    {
        id: "2",
        name: "Madam Sarah's Fabrics",
        category: "Fashion",
        items: ["Kente Cloth", "Lace", "Wax Print"],
        location: "Makola Market",
        distance: "2.1km",
        rating: 4.5,
        image: "bg-purple-100",
        lat: 5.5450,
        lng: -0.2030,
    },
    {
        id: "3",
        name: "Kofi Electronics Repair",
        category: "Services",
        items: ["Phone Screen Repair", "Laptop Battery"],
        location: "Circle, Accra",
        distance: "3.4km",
        rating: 4.9,
        image: "bg-blue-100",
        lat: 5.5600,
        lng: -0.2110,
    },
    {
        id: "4",
        name: "The Art Center Collective",
        category: "Art",
        items: ["Wood Carvings", "Bead Jewelry", "Paintings"],
        location: "Accra Central",
        distance: "1.2km",
        rating: 4.7,
        image: "bg-red-100",
        lat: 5.5400,
        lng: -0.1900,
    },
    {
        id: "5",
        name: "Garden City Fresh",
        category: "Food",
        items: ["Fresh Tomatoes", "Peppers", "Yam"],
        location: "East Legon",
        distance: "5.0km",
        rating: 4.6,
        image: "bg-green-100",
        lat: 5.6350,
        lng: -0.1600,
    },
];
