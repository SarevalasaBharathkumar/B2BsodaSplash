import type { Metadata } from "next";
import { DM_Sans, League_Spartan } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  variable: "--font-league-spartan",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sodasplash.me"),
  title: {
    default: "SodaSplash | Wholesale Goli Soda B2B",
    template: "%s | SodaSplash",
  },
  description: "Premium soft drink manufacturer and B2B supplier. Order premium flavoured goli soda (Mango, Lemon, Orange, Mixed Berry) by the case for hotels, restaurants, cafes, and retailers.",
  keywords: [
    "Goli Soda",
    "Wholesale Soft Drinks",
    "Marble Soda Supply",
    "SodaSplash B2B",
    "Beverage Supplier India",
    "Flavoured Soda Cases",
    "Premium Soft Drinks",
    "Hotel Soft Drink Supplier",
    "Restaurant Beverage Supply"
  ],
  authors: [{ name: "SodaSplash Team", url: "https://sodasplash.me" }],
  creator: "SodaSplash",
  publisher: "SodaSplash",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://sodasplash.me",
    title: "SodaSplash | Premium B2B Wholesale Goli Soda",
    description: "Premium soft drink manufacturer and B2B supplier. Premium flavoured goli soda by the case for hotels, restaurants, cafes, retailers, and events.",
    siteName: "SodaSplash",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "SodaSplash logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SodaSplash | Premium B2B Wholesale Goli Soda",
    description: "Premium flavoured goli soda cases for hotels, restaurants, retailers, and events.",
    images: ["/favicon.png"],
    creator: "@SodaSplash",
  },
  category: "beverage",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://sodasplash.me/#organization",
        "name": "SodaSplash",
        "url": "https://sodasplash.me",
        "logo": {
          "@type": "ImageObject",
          "@id": "https://sodasplash.me/#logo",
          "url": "https://sodasplash.me/favicon.png",
          "contentUrl": "https://sodasplash.me/favicon.png",
          "caption": "SodaSplash Logo"
        },
        "image": {
          "@id": "https://sodasplash.me/#logo"
        },
        "sameAs": [
          "https://www.instagram.com/sodasplash",
          "https://twitter.com/SodaSplash",
          "https://www.linkedin.com/company/sodasplash"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://sodasplash.me/#website",
        "url": "https://sodasplash.me",
        "name": "SodaSplash",
        "description": "Premium wholesale goli soda manufacturer and B2B supplier.",
        "publisher": {
          "@id": "https://sodasplash.me/#organization"
        }
      },
      {
        "@type": "WebPage",
        "@id": "https://sodasplash.me/#webpage",
        "url": "https://sodasplash.me",
        "name": "SodaSplash | Premium Wholesale Goli Soda B2B",
        "isPartOf": {
          "@id": "https://sodasplash.me/#website"
        },
        "about": {
          "@id": "https://sodasplash.me/#organization"
        },
        "description": "Premium soft drink manufacturer and B2B supplier. Order premium flavoured goli soda by the case for hotels, restaurants, cafes, retailers, and events."
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${leagueSpartan.variable}`} suppressHydrationWarning>
        {/* Google Analytics (GTags) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-L2Y9XTR0JF"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-L2Y9XTR0JF');
          `}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
