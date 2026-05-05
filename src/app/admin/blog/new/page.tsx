"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBlogPost } from "@/lib/firestore";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/imageUtils";
import { ArrowLeft, Save, Eye, Image as ImageIcon, Tag, FileText, Upload, X, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function NewBlogPostPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    author: "Admin Mienian",
    tags: "",
    status: "draft" as "draft" | "review" | "published",
  });

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar (jpg, png, webp, dll)");
      return;
    }

    // Auto-compress if over 5MB
    let processedFile = file;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      try {
        setUploading(true);
        setUploadProgress(0);
        processedFile = await compressImage(file, maxSize);
      } catch (err) {
        console.error("Compression error:", err);
        alert("Gagal mengompresi gambar.");
        setUploading(false);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);

    const fileName = `blog-covers/${Date.now()}-${processedFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, processedFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload error:", error);
        alert("Gagal mengupload gambar.");
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setForm((prev) => ({ ...prev, coverImage: url }));
        setUploading(false);
      }
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug === generateSlug(prev.title) || !prev.slug ? generateSlug(val) : prev.slug,
    }));
  };

  const handleSubmit = async (status: "draft" | "review" | "published") => {
    if (!form.title.trim()) return alert("Judul wajib diisi!");
    if (!form.slug.trim()) return alert("Slug wajib diisi!");
    if (!form.content.trim()) return alert("Konten wajib diisi!");

    setSaving(true);
    try {
      await createBlogPost({
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim(),
        content: form.content,
        coverImage: form.coverImage.trim(),
        author: form.author.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status,
      });
      router.push("/admin/blog");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Gagal menyimpan artikel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Artikel Baru</h1>
            <p className="text-foreground/50 text-sm">Buat artikel blog baru untuk website.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <div className="card p-6">
          <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
            Judul Artikel *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Contoh: Tips Memilih Catering untuk Pernikahan"
            className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-lg font-bold focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Slug */}
        <div className="card p-6">
          <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
            Slug (URL) *
          </label>
          <div className="flex items-center gap-2">
            <span className="text-foreground/30 text-sm">/blog/</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="tips-memilih-catering"
              className="flex-1 px-4 py-3 rounded-xl border border-card-border bg-background text-sm font-mono focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Cover Image Upload & Author */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
              <ImageIcon className="w-3.5 h-3.5 inline mr-1" /> Cover Image
            </label>

            {form.coverImage ? (
              <div className="relative group">
                <div className="aspect-video rounded-xl overflow-hidden bg-muted border border-card-border">
                  <img src={form.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => setForm((prev) => ({ ...prev, coverImage: "" }))}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Hapus gambar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                  uploading
                    ? "border-primary bg-primary/5"
                    : "border-card-border hover:border-primary hover:bg-primary/5"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                    <p className="text-sm font-bold text-primary">{uploadProgress}%</p>
                    <div className="w-32 h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-foreground/30 mb-2" />
                    <p className="text-sm font-semibold text-foreground/50">Klik atau drag gambar ke sini</p>
                    <p className="text-[11px] text-foreground/30 mt-1">JPG, PNG, WebP • Maks 5MB</p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Fallback: manual URL input */}
            <div className="mt-3">
              <input
                type="text"
                value={form.coverImage}
                onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                placeholder="atau paste URL gambar langsung..."
                className="w-full px-3 py-2 rounded-lg border border-card-border bg-background text-xs focus:outline-none focus:border-primary transition-colors text-foreground/50"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
                Penulis
              </label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                placeholder="Admin Mienian"
                className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="card p-6">
              <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
                <Tag className="w-3.5 h-3.5 inline mr-1" /> Tags (pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                placeholder="catering, wedding, tips"
                className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Excerpt */}
        <div className="card p-6">
          <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
            Ringkasan / Excerpt
          </label>
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
            placeholder="Ringkasan singkat yang muncul di halaman blog listing dan SEO meta description..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-sm focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Content */}
        <div className="card p-6">
          <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5 inline mr-1" /> Konten Artikel *
          </label>
          <p className="text-[11px] text-foreground/30 mb-3">
            Gunakan ## untuk heading besar, ### untuk sub-heading, **teks** untuk bold.
          </p>
          <textarea
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            placeholder={`## Pendahuluan\n\nTulis konten artikel di sini...\n\n### Sub Heading\n\nParagraf dengan **teks tebal** dan penjelasan detail.\n\n### Kesimpulan\n\nPenutup artikel.`}
            rows={20}
            className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-sm font-mono focus:outline-none focus:border-primary transition-colors resize-y leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={() => handleSubmit("draft")}
            disabled={saving}
            className="btn btn-outlined btn-md flex-1"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan sebagai Draft"}
          </button>
          
          {role === "content_writer" ? (
            <button
              onClick={() => handleSubmit("review")}
              disabled={saving}
              className="btn btn-primary btn-md flex-1 shadow-lg bg-blue-600 hover:bg-blue-700 border-blue-600"
            >
              <Send className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Ajukan Publish (Review)"}
            </button>
          ) : (
            <button
              onClick={() => handleSubmit("published")}
              disabled={saving}
              className="btn btn-primary btn-md flex-1 shadow-lg"
            >
              <Eye className="w-4 h-4" />
              {saving ? "Menyimpan..." : "Publish Sekarang"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
