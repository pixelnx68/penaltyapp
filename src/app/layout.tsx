import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Penalty Tracker",
  description: "Volleyball late arrival penalty tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white pb-16">
        <div className="mx-auto max-w-[480px]">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
