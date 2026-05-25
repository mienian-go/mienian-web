import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { BookingProvider } from "@/context/BookingContext";
import { AuthProvider } from "@/context/AuthContext";
import { GoCartProvider } from "@/context/GoCartContext";
import { ConditionalLayout } from "@/components/ConditionalLayout";
import SplashScreen from "@/components/SplashScreen";
import PushNotificationSetup from "@/components/PushNotificationSetup";

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
    default: "Mienian — Mobile App",
    template: "%s | Mienian",
  },
  description:
    "Mienian GO & Stall — Order warmindo live cooking langsung dari HP kamu! 🔥",
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
              <GoCartProvider>
                <PushNotificationSetup />
                <SplashScreen />
                <ConditionalLayout>{children}</ConditionalLayout>
              </GoCartProvider>
            </BookingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
