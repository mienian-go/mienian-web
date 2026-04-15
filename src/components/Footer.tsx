import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { InstagramIcon } from "./ui/InstagramIcon";

export function Footer() {
  return (
    <footer className="w-full bg-dark-maroon text-white/90 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold tracking-tight mb-4 inline-block">
              Mie<span className="text-primary">nian</span>
            </Link>
            <p className="text-white/60 max-w-sm mb-6 leading-relaxed">
              Dari gerobak sampai ke wedding party — Mienian hadir bawa live cooking experience yang bikin acara lo makin hype! 🔥
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/mienian_id"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary/80 flex items-center justify-center transition-all"
                aria-label="Instagram"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
              <a
                href="https://tiktok.com/@mienian_id"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary/80 flex items-center justify-center transition-all"
                aria-label="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.69a8.21 8.21 0 004.76 1.52V6.76a4.83 4.83 0 01-1-.07z" />
                </svg>
              </a>
              <a
                href="https://wa.me/6285216706922"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-tertiary/80 flex items-center justify-center transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 text-white">Navigasi</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link href="/" className="hover:text-secondary transition-colors">Home</Link></li>
              <li><Link href="/mienian-go" className="hover:text-secondary transition-colors">Mienian GO</Link></li>
              <li><Link href="/catering" className="hover:text-secondary transition-colors">Mienian Catering</Link></li>
              <li><Link href="/about" className="hover:text-secondary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-secondary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Catering */}
          <div>
            <h4 className="font-bold mb-4 text-white">Catering</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link href="/catering/menu" className="hover:text-secondary transition-colors">Menu & Paket</Link></li>
              <li><Link href="/catering/cart" className="hover:text-secondary transition-colors">Keranjang</Link></li>
              <li>
                <a href="https://wa.me/6285216706922" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
                  Chat Admin
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 text-xs text-white/40 gap-4">
          <p>© {new Date().getFullYear()} PT Mie Kekinian Sukses. All rights reserved.</p>
          <p>Made with 🔥 by Mienian Crew</p>
        </div>
      </div>
    </footer>
  );
}
