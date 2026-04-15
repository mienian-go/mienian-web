"use client";

import { useState, useRef } from "react";
import { Upload, X, Camera, RefreshCw } from "lucide-react";
import { uploadFile, deleteFile } from "@/lib/storage";

interface ImageUploaderProps {
  label: string;
  folder: string;
  currentUrl?: string;
  onChange: (url: string) => void;
}

export default function ImageUploader({ label, folder, currentUrl, onChange }: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: add file size validation here
    if (file.size > 2 * 1024 * 1024) {
      alert("Maximum file size is 2MB");
      return;
    }

    setLoading(true);
    try {
      // Optional: Delete previous image if exists and we track its path
      // But for simplicity, we just upload the new one
      const { url } = await uploadFile(file, folder);
      onChange(url);
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Gagal upload gambar. Cek koneksi Firebase.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    // We would need the exact storage path to delete properly
    // For now, we just clear the URL in the parent state
    onChange("");
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-foreground/70">
        {label}
      </label>
      
      {currentUrl ? (
        <div className="relative inline-block border border-white/10 rounded-xl bg-muted/30 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentUrl}
            alt={label}
            className="h-32 object-contain rounded-lg"
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              title="Replace Image"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRemove}
              type="button"
              className="w-8 h-8 rounded-full bg-primary/80 text-white flex items-center justify-center hover:bg-primary transition-colors"
              title="Remove Image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-white/20 rounded-xl bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors group"
        >
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-sm text-foreground/50">Uploading...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-foreground/50 group-hover:text-primary transition-colors">
                Click to upload image
              </span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
