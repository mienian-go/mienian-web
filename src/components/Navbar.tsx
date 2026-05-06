"use client";

import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ShoppingCart, Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/mienian-go", label: "Mienian GO" },
  { href: "/catering", label: "Mienian Catering" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isHomePage = pathname === "/";

  // Logic to determine text color based on scroll and active state
  const getLinkStyle = (isActive: boolean) => {
    // On pages other than home, or when scrolled on home
    if (!isHomePage || scrolled) {
      return isActive 
        ? "text-primary bg-background shadow-sm border border-black/5" 
        : "text-foreground/60 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5";
    }
    
    // Transparent state on Home Page (dark background)
    return isActive 
      ? "text-primary bg-white shadow-sm" 
      : "text-white/80 hover:text-white hover:bg-white/10";
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || !isHomePage
            ? "glass-panel py-2 shadow-lg shadow-black/5"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <Image
              src="/mienian-logo.png"
              alt="Mienian Logo"
              width={48}
              height={48}
              className="rounded-lg shadow-lg group-hover:scale-105 transition-transform"
            />
            <span className={`text-2xl font-black tracking-tighter hidden sm:block transition-colors duration-300 ${(!isHomePage || scrolled) ? "text-primary" : "text-white"}`}>
              MIENIAN
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${getLinkStyle(isActive)}`}
                >
                  {link.label}
                  {isActive && !scrolled && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              );
            })}
            
            {user && (
              <Link
                href="/dashboard"
                className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${getLinkStyle(pathname.startsWith("/dashboard"))}`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {user ? (
              <Link
                href="/dashboard"
                className={`hidden lg:flex items-center justify-center w-10 h-10 rounded-full transition-all border ${
                  scrolled || !isHomePage
                    ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" 
                    : "bg-white/10 text-white border-white/20 hover:bg-white/20"
                }`}
                title="Customer Dashboard"
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className={`hidden lg:flex items-center justify-center px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  scrolled || !isHomePage
                    ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                    : "bg-white text-primary hover:bg-white/90"
                }`}
              >
                Login / Daftar
              </Link>
            )}
            
            {/* Cart Button */}
            <Link
              href="/catering/cart"
              className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                scrolled || !isHomePage
                  ? "bg-muted hover:bg-accent text-foreground" 
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                scrolled || !isHomePage
                  ? "bg-muted hover:bg-accent text-foreground" 
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-40 glass-panel lg:hidden"
          >
            <nav className="flex flex-col p-6 gap-2">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 rounded-xl text-lg font-bold transition-all ${
                      isActive
                        ? "text-primary bg-background shadow-sm border border-black/5"
                        : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {user ? (
                <Link
                  href="/dashboard"
                  className={`px-4 py-3 rounded-xl text-lg font-bold transition-all ${
                    pathname.startsWith("/dashboard")
                      ? "text-primary bg-background shadow-sm border border-black/5"
                      : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className={`px-4 py-3 rounded-xl text-lg font-bold transition-all ${
                    pathname.startsWith("/dashboard")
                      ? "text-primary bg-background shadow-sm border border-black/5"
                      : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  Login / Daftar
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
