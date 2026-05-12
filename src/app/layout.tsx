import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Penalty Tracker",
  description: "Volleyball late arrival penalty tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${outfit.className}`}>
      <body className="min-h-full bg-background pb-20 text-foreground">
        <div className="mx-auto min-h-screen max-w-[480px] shadow-2xl shadow-primary/5">
          <main className="px-4 pt-6 animate-in">
            {children}
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
