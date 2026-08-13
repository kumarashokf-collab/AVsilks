import { BRAND } from "../config/branding";

export const STORE = {
  description:
    "Traditional and contemporary sarees selected with care for every celebration.",

  address: {
    line1: BRAND.name,
    city: "Your City",
    state: "Andhra Pradesh",
    country: "India",
    postalCode: ""
  },

  social: {
    instagram: "",
    facebook: "",
    youtube: ""
  },

  navigation: [
    { label: "Home", path: "/" },
    { label: "Cart", path: "/cart" },
    { label: "Privacy", path: "/privacy" }
  ],

  categories: [
    {
      id: "silk",
      name: "Silk Sarees",
      description: "Elegant silks for special occasions"
    },
    {
      id: "kanchipuram",
      name: "Kanchipuram",
      description: "Timeless South Indian craftsmanship"
    },
    {
      id: "dharmavaram",
      name: "Dharmavaram",
      description: "Traditional richness and vibrant colours"
    },
    {
      id: "cotton",
      name: "Cotton Sarees",
      description: "Comfortable sarees for everyday elegance"
    },
    {
      id: "wedding",
      name: "Wedding Collection",
      description: "Statement sarees for memorable celebrations"
    },
    {
      id: "new-arrivals",
      name: "New Arrivals",
      description: `The latest additions to ${BRAND.name}`
    }
  ],

  trustPoints: [
    {
      title: "Quality Checked",
      description: "Every saree is inspected before dispatch."
    },
    {
      title: "Secure Shopping",
      description: "Your information is handled carefully."
    },
    {
      title: "Customer Support",
      description: "Get assistance before and after your purchase."
    },
    {
      title: "Pan-India Delivery",
      description: "Delivery depends on serviceable locations."
    }
  ]
};
