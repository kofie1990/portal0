export const CATEGORY_DIVISIONS = [
    {
        name: "Beauty & Personal Care",
        categories: [
            "Hair & Braiding",
            "Barbering",
            "Makeup Artistry",
            "Nail Tech & Pedicure",
            "Spa & Massage Therapy",
            "Skin Consultation",
            "Tattoo",
            "Lash Tech"
        ]
    },
    {
        name: "Home & Technical Services",
        categories: [
            "Plumbing",
            "Electrical Engineering",
            "AC & Refrigeration Tech",
            "Solar Panel Installation & Maintenance",
            "Carpentry & Furniture Repair",
            "Painting & Wallpapering",
            "Security & CCTV Installation",
            "Fumigation & Pest Control",
            "Cleaning"
        ]
    },
    {
        name: "Automotive",
        categories: [
            "Mechanic",
            "Auto-Electrician",
            "Car Detailing & Wash",
            "Vulcanizing",
            "EV Specialist"
        ]
    },
    {
        name: "Fashion & Craftsmanship",
        categories: [
            "Tailoring & Fashion Design",
            "Cobbler & Shoe Repair",
            "Laundry & Dry Cleaning",
            "Jewelry Design & Goldsmithing"
        ]
    },
    {
        name: "Events & Media",
        categories: [
            "Photography",
            "Videography",
            "Event Decor & Planning",
            "Catering",
            "MC & DJ Services",
            "Drone Pilot"
        ]
    },
    {
        name: "Lifestyle & Education",
        categories: [
            "Home Tutoring",
            "Nanny & Childcare",
            "Fitness Training & Yoga"
        ]
    },
    {
        name: "Software & IT Services",
        categories: [
            "Web Development",
            "Mobile App Development",
            "UI/UX Design",
            "Software Engineering",
            "IT Support & Networking",
            "Data Analysis & AI"
        ]
    },
    {
        name: "Digital & Social Media",
        categories: [
            "Social Media Management",
            "Digital Marketing",
            "Content Creation",
            "SEO & Copywriting",
            "Graphic Design"
        ]
    }
];

// Helper to get a flat list of categories
export const ALL_CATEGORIES = CATEGORY_DIVISIONS.flatMap(division => division.categories);
