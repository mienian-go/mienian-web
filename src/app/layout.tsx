import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CartProvider } from "@/context/CartContext";
import { BookingProvider } from "@/context/BookingContext";
import { AuthProvider } from "@/context/AuthContext";
import { ConditionalLayout } from "@/components/ConditionalLayout";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mienian — Warmindo Live Cooking Experience",
    template: "%s | Mienian",
  },
  description:
    "Dari gerobak keliling sampai live cooking di wedding & corporate event. Mienian — taste that slaps, vibes that stick. 🔥",
  keywords: ["mienian", "warmindo", "catering", "live cooking", "indomie", "wedding catering", "Jakarta", "Bandung", "Yogyakarta"],
  openGraph: {
    title: "Mienian — Warmindo Live Cooking Experience",
    description: "Dari gerobak keliling sampai live cooking di wedding & corporate event.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="scroll-smooth">
      <body className={`${outfit.variable} ${inter.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AuthProvider>
            <BookingProvider>
              <CartProvider>
                <ConditionalLayout>{children}</ConditionalLayout>
              </CartProvider>
            </BookingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
