import type { Metadata } from "next";
import { Playfair_Display, Inter, Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MasManager | Carnival Band Operations",
  description: "The luxury operations platform for Caribbean Carnival bands",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)} style={{ backgroundColor: "#0D1B2E" }}>
      <body className={`${playfair.variable} ${inter.variable} font-sans`} style={{ backgroundColor: "#0D1B2E" }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
