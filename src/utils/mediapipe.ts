/**
 * Dynamic loader for MediaPipe FaceMesh & CameraUtils
 * Memuat library kamera secara asynchronous hanya saat dibutuhkan (GameScreen),
 * sehingga menu utama dapat terbuka INSTAN (<100ms) tanpa loading terus menerus.
 */

let loadPromise: Promise<boolean> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Cek jika script sudah pernah disuntikkan ke DOM
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Gagal memuat ${src}`));
    document.head.appendChild(script);
  });
}

export async function ensureMediaPipeLoaded(): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).FaceMesh && (window as any).Camera) {
    return true;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      // Coba CDN Utama: jsdelivr
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return !!((window as any).FaceMesh && (window as any).Camera);
    } catch (err1) {
      console.warn('CDN jsdelivr gagal atau lambat, mencoba CDN cadangan (unpkg)...', err1);
      try {
        // Coba CDN Cadangan: unpkg
        await loadScript('https://unpkg.com/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://unpkg.com/@mediapipe/face_mesh/face_mesh.js');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return !!((window as any).FaceMesh && (window as any).Camera);
      } catch (err2) {
        console.error('Semua CDN MediaPipe gagal dimuat:', err2);
        return false;
      }
    }
  })();

  return loadPromise;
}
