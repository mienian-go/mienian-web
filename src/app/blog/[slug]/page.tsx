"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { getBlogPostBySlug, getBlogPosts, BlogPost } from "@/lib/firestore";
import { ArrowLeft, Calendar, Tag, User, Clock, ArrowRight, Flame } from "lucide-react";

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBlogPostBySlug(slug);
        setPost(data);

        // Load related posts
        const allPosts = await getBlogPosts(true);
        const others = allPosts
          .filter((p) => p.slug !== slug)
          .slice(0, 3);
        setRelated(others);
      } catch (err) {
        console.error("Error loading blog post:", err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) load();
  }, [slug]);

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const estimateReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-28">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background pt-28 gap-4">
        <p className="text-foreground/50 text-lg">Artikel tidak ditemukan.</p>
        <Link href="/blog" className="btn btn-primary btn-sm">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-28 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-foreground/50 hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Blog
          </Link>
        </motion.div>

        {/* Article Header */}
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/40 mb-8 pb-8 border-b border-card-border">
            {post.author && (
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {post.author}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(post.publishedAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {estimateReadTime(post.content)} menit baca
            </div>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden mb-12 shadow-xl">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none text-foreground/80 leading-relaxed">
            {post.content.split("\n").map((paragraph, i) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return <br key={i} />;

              // Heading detection
              if (trimmed.startsWith("### ")) {
                return (
                  <h3 key={i} className="text-xl font-bold text-foreground mt-8 mb-3">
                    {trimmed.replace("### ", "")}
                  </h3>
                );
              }
              if (trimmed.startsWith("## ")) {
                return (
                  <h2 key={i} className="text-2xl font-extrabold text-foreground mt-10 mb-4">
                    {trimmed.replace("## ", "")}
                  </h2>
                );
              }

              // Bold text support
              const parts = trimmed.split(/\*\*(.*?)\*\*/g);
              return (
                <p key={i} className="mb-4 text-base leading-relaxed">
                  {parts.map((part, j) =>
                    j % 2 === 1 ? (
                      <strong key={j} className="font-bold text-foreground">
                        {part}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </p>
              );
            })}
          </div>
        </motion.article>

        {/* Related Posts */}
        {related.length > 0 && (
          <section className="mt-20 pt-12 border-t border-card-border">
            <h2 className="text-2xl font-extrabold mb-8">Artikel Lainnya</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`}>
                  <div className="card overflow-hidden group h-full flex flex-col">
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      {rp.coverImage ? (
                        <Image
                          src={rp.coverImage}
                          alt={rp.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                          <Flame className="w-8 h-8 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {rp.title}
                      </h3>
                      <p className="text-xs text-foreground/40 mt-auto">
                        {formatDate(rp.publishedAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
