import { Icons } from "@/components/icons";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "Vekstloop CRM",
  description: "Vekstloop CRM - Din partner innen vekst og markedsføring",
  cta: "Get Started",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  keywords: [
    "Vekstloop CRM",
    "Vekst og markedsføring",
    "Bedriftsvekst",
    "Markedsføring",
  ],
  links: {
    email: "support@vekstloop.no",
    twitter: "https://twitter.com/vekstloop",
    discord: "https://discord.gg/vekstloop",
    github: "https://github.com/vekstloop",
    instagram: "https://instagram.com/vekstloop",
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
    brandText: "Vekstloop CRM",
  },
};

export type SiteConfig = typeof siteConfig;
