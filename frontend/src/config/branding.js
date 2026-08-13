import logoAsset from "../assets/logo.png";

const brandName = "AV Silks";

export const BRAND = {
  name: brandName,
  shortName: "AV",
  tagline: "Six Yards of Heritage",

  logo: logoAsset,
  favicon: "/favicon.svg",

  copyright: `© ${new Date().getFullYear()} ${brandName}. All Rights Reserved.`,

  company: {
    legalName: brandName,
    country: "India"
  }
};
