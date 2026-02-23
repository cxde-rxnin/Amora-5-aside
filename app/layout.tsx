import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalShell from "@/components/layout/ConditionalShell";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Amora Resort – 5-Aside Football Pitch | Lagos, Nigeria",
    template: "%s | Amora Resort",
  },
  description:
    "Book the premium 5-aside football pitch at Amora Resort. Premium artificial turf, professional floodlights, and top-tier facilities.",
  keywords: [
    "5-aside football",
    "football pitch Port Harcourt",
    "Amora Resort",
    "PH football",
    "book football pitch",
    "Port Harcourt sports",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ConditionalShell>{children}</ConditionalShell>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
