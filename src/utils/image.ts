/**
 * Utilitas pemrosesan dan optimasi gambar soal
 * Memastikan gambar yang diunggah dikompresi agar muat di localStorage tanpa lag
 */

export async function processImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.82
): Promise<string> {
  // Jika SVG, simpan langsung sebagai data URL teks
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Skalakan proporsional bila melebihi batas maksimal
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback ke data URL asli jika canvas gagal
          return resolve(readerEvent.target?.result as string);
        }

        // Gambar ke canvas dengan smoothing berkualitas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Pertahankan transparansi PNG jika format PNG asli
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(format, format === 'image/jpeg' ? quality : undefined);

        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Gagal memuat file gambar. Format mungkin tidak didukung.'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file dari komputer.'));
    };

    reader.readAsDataURL(file);
  });
}
