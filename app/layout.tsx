import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SodaSplash | Wholesale Goli Soda",
  description: "Bright, bubbly goli soda for hotels, restaurants, shops, offices, and events.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
