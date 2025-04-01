import { Icons } from "@/components/icons";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "Sailsdock",
  description: "Sailsdock - Din partner innen vekst og markedsføring",
  cta: "Get Started",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  keywords: [
    "Sailsdock",
    "Sailsdock CRM",
    "Vekst og markedsføring",
    "Bedriftsvekst",
    "Markedsføring",
  ],
  links: {
    email: "support@sailsdock.no",
    twitter: "https://twitter.com/sailsdock",
    discord: "https://discord.gg/sailsdock",
    github: "https://github.com/sailsdock",
    instagram: "https://instagram.com/sailsdock",
  },
  footer: {
    socialLinks: [
      {
        icon: <Icons.github className="h-5 w-5" />,
        url: "#",
      },
      {
        icon: <Icons.twitter className="h-5 w-5" />,
        url: "#",
      },
    ],
    links: [
      { text: "Pricing", url: "#" },
      { text: "Contact", url: "#" },
    ],
    bottomText: "All rights reserved.",
    brandText: "Sailsdock",
  },
};

export type SiteConfig = typeof siteConfig;
