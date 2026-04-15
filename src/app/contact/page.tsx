"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronDown, Send, Mail, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/ui/InstagramIcon";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

const faqs = [
  {
    q: "Mienian GO mangkal di daerah mana aja?",
    a: "Saat ini gerobak Mienian keliling di area Jakarta Selatan, Jakarta Pusat, dan Bandung. Jadwal dan lokasi update setiap minggu di Instagram kita @mienian_id. Stay tuned!",
  },
  {
    q: "Minimal porsi buat pesan catering berapa?",
    a: "Paket catering kita mulai dari 100 porsi (Paket Topping Super/Komplit) sampai 250 porsi (Paket Mie Tanpa Topping). Pilih sesuai kebutuhan acara lo!",
  },
  {
    q: "Bisa custom menu di luar paket yang tersedia?",
    a: "Bisa banget! Chat admin kita via WhatsApp dan ceritain kebutuhan lo. Kita bisa sesuaikan menu, jumlah porsi, dan topping sesuai budget dan selera tamu.",
  },
  {
    q: "Berapa lama sebelum acara harus booking?",
    a: "Idealnya minimal 2 minggu sebelum hari H biar kita bisa prepare maksimal. Tapi kalau urgent, coba chat admin dulu — siapa tau slot-nya masih available!",
  },
  {
    q: "Apakah sudah termasuk peralatan dan kru?",
    a: "Yes! Semua paket catering udah termasuk setup meja, peralatan masak, bahan baku, dan kru profesional. Lo tinggal siapin venue-nya aja, sisanya kita yang handle.",
  },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="flex flex-col overflow-hidden">
      {/* ============ HERO ============ */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-primary/5" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-sm font-medium mb-6 text-secondary">
            <Mail className="w-4 h-4" />
            <span>Get In Touch</span>
          </motion.div>

          <motion.h1 variants={item} className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Ada Pertanyaan? <span className="gradient-text">Hubungi Kita!</span>
          </motion.h1>

          <motion.p variants={item} className="text-lg text-foreground/60 max-w-xl mx-auto">
            Mau tanya soal menu, catering, atau kolaborasi? Kita fast response kok! Chat langsung atau isi form di bawah.
          </motion.p>
        </motion.div>
      </section>

      {/* ============ QUICK LINKS ============ */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* WhatsApp */}
            <motion.a
              href="https://wa.me/6285216706922"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card p-6 text-center group hover:border-tertiary/30 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-tertiary group-hover:text-white transition-all duration-300">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold mb-1">WhatsApp</h3>
              <p className="text-foreground/50 text-sm">Fast response! Chat langsung admin.</p>
              <p className="text-tertiary text-sm font-semibold mt-2">0852-1670-6922</p>
            </motion.a>

            {/* Instagram */}
            <motion.a
              href="https://instagram.com/mienian_id"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="card p-6 text-center group hover:border-primary/30 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <InstagramIcon className="w-7 h-7" />
              </div>
              <h3 className="font-bold mb-1">Instagram</h3>
              <p className="text-foreground/50 text-sm">Update menu, jadwal, dan behind the scenes.</p>
              <p className="text-primary text-sm font-semibold mt-2">@mienian_id</p>
            </motion.a>

            {/* TikTok */}
            <motion.a
              href="https://tiktok.com/@mienian_id"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="card p-6 text-center group hover:border-secondary/30 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-secondary group-hover:text-secondary-foreground transition-all duration-300">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.69a8.21 8.21 0 004.76 1.52V6.76a4.83 4.83 0 01-1-.07z" />
                </svg>
              </div>
              <h3 className="font-bold mb-1">TikTok</h3>
              <p className="text-foreground/50 text-sm">Konten seru dan review dari customer.</p>
              <p className="text-secondary text-sm font-semibold mt-2">@mienian_id</p>
            </motion.a>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              FAQ <span className="gradient-text">Cepat</span>
            </h2>
            <p className="text-foreground/60">Pertanyaan yang paling sering ditanya. Cek dulu sebelum chat ya!</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold hover:bg-muted/50 transition-colors"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 text-foreground/40 transition-transform duration-200 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-foreground/60 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CONTACT FORM ============ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Formulir <span className="gradient-text">Pesan</span>
            </h2>
            <p className="text-foreground/60">
              Buat inquiry kolaborasi, sponsorship, atau pertanyaan lainnya.
              <br />
              <span className="text-xs text-foreground/40">(Bukan untuk pesan catering ya — gunakan menu Catering untuk itu.)</span>
            </p>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card p-12 text-center"
            >
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">Pesan Terkirim!</h3>
              <p className="text-foreground/50">Tim kita bakal bales secepatnya. Stay tuned! ✌️</p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="card p-6 sm:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Nama</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nama lo"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="email@contoh.com"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-sm appearance-none"
                >
                  <option value="">Pilih subject...</option>
                  <option value="kolaborasi">Kolaborasi / Partnership</option>
                  <option value="sponsorship">Sponsorship</option>
                  <option value="media">Media / Press</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Pesan</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Ceritain aja mau ngapain..."
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-transparent focus:border-primary focus:outline-none transition-colors text-sm resize-none"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-lg w-full">
                <Send className="w-5 h-5" />
                Kirim Pesan
              </button>
            </motion.form>
          )}
        </div>
      </section>
    </div>
  );
}
