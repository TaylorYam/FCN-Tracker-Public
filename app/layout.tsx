import "./globals.css";
import type { Metadata, Viewport } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: {
    default: "FCN Tracker — Structured Product Monitoring Platform",
    template: "%s · FCN Tracker",
  },
  description:
    "Portfolio demonstration: Fixed Coupon Note terms and multi-underlying price paths translated into structured-product monitoring logic. All data is synthetic.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8dcc4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-base font-sans text-text-primary antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
