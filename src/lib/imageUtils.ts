/**
 * Compress/resize an image file to fit under maxSizeBytes using Canvas.
 * Progressively reduces quality and dimensions until the file is small enough.
 */
export async function compressImage(
  file: File,
  maxSizeBytes: number = 5 * 1024 * 1024, // 5MB
  maxDimension: number = 1920
): Promise<File> {
  // If already under limit, return as-is
  if (file.size <= maxSizeBytes) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      // Calculate new dimensions (maintain aspect ratio)
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Try progressively lower quality until under maxSizeBytes
      const tryCompress = (quality: number, dimension: number) => {
        // If dimension is too small, we've done our best
        if (dimension < 200 || quality < 0.1) {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error("Compression failed"));
              const compressed = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressed);
            },
            "image/jpeg",
            0.1
          );
          return;
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));

            if (blob.size <= maxSizeBytes) {
              // Success — under limit
              const compressed = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressed);
            } else if (quality > 0.3) {
              // Try lower quality first
              tryCompress(quality - 0.1, dimension);
            } else {
              // Quality is already low, reduce dimensions
              const newDim = Math.round(dimension * 0.75);
              const ratio = Math.min(newDim / img.width, newDim / img.height);
              const newW = Math.round(img.width * ratio);
              const newH = Math.round(img.height * ratio);
              canvas.width = newW;
              canvas.height = newH;
              ctx.drawImage(img, 0, 0, newW, newH);
              tryCompress(0.7, newDim);
            }
          },
          "image/jpeg",
          quality
        );
      };

      // Start with 0.85 quality
      tryCompress(0.85, Math.max(width, height));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
