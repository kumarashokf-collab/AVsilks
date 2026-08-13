import { BRAND } from "./branding";

export const THEME = {
  name: `${BRAND.name} Classic`,

  mode: "light",

  cssVariables: {
    primary: "--color-wine-700",
    primaryDark: "--color-wine-800",
    accent: "--color-gold-600",
    background: "--color-cream-50",
    surface: "--color-white",
    textPrimary: "--color-text-primary",
    textSecondary: "--color-text-secondary",
    success: "--color-success",
    warning: "--color-warning",
    danger: "--color-danger",
    info: "--color-info"
  },

  layout: {
    containerMaxWidth: 1200,
    mobileBreakpoint: 768
  },

  branding: {
    style: "premium-boutique",
    visualTone: "heritage-modern",
    density: "comfortable"
  }
};
