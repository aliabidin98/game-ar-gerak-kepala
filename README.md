# Game AR - Gerak Kepala 🎮👤

Aplikasi kuis edukasi interaktif berbasis **Augmented Reality (AR)** dengan deteksi kemiringan kepala secara *real-time* menggunakan kamera webcam dan AI MediaPipe Face Mesh.

Dibuat khusus untuk media pembelajaran aktif, cerdas cermat siswa di kelas, maupun permainan interaktif edukatif keluarga.

---

## ✨ Fitur Unggulan

- **Deteksi Gerakan Kepala AI (MediaPipe Face Mesh)**
  - Mengukur sudut kemiringan kepala (kiri / kanan) secara akurat tanpa mengirim video ke server (pemrosesan 100% lokal & aman di peramban).
  - Animasi perspektif 3D dinamis pada kartu pertanyaan saat kepala dimiringkan.
  - Tampilan HUD sudut derajat kepala dan *progress bar* penguncian jawaban (±0.5–1 detik).
- **Mode Permainan**
  - **1 Pemain**: Latihan kuis mandiri dengan pelacakan wajah penuh.
  - **2 Pemain (Split Screen)**: Pertarungan 2 siswa berdampingan di depan satu webcam dengan pembagian otomatis sisi layar kiri dan kanan.
  - **Kontrol Alternatif / Pengujian**: Mendukung klik tombol layar atau navigasi keyboard (`[A]` / `[D]` untuk P1, `[Panah Kiri]` / `[Panah Kanan]` untuk P2).
- **Tampilan Kaca Bening Kristal (*Crystal Clear Glass*)**
  - Kartu soal dan pilihan jawaban berdesain transparan bening sehingga video webcam terlihat jernih di latar belakang.
  - Menu pengaturan fleksibel untuk menyesuaikan tingkat kepekatan transparansi (5% hingga 85%) serta efek kabut/blur.
- **Sistem Lisensi & Mode Demo**
  - **Popup Aktivasi Awal**: Melindungi menu utama sebelum aktivasi atau pemilihan mode.
  - **Mode Demo**: Mengizinkan uji coba dengan fitur dasar (hanya menu 1 Pemain dan Panduan).
  - **Versi Lengkap**: Membuka seluruh menu (Split Screen 2P, Bank Soal, dan Pengaturan).
- **Manajemen Bank Soal Lengkap**
  - Tambah, edit, dan hapus soal dengan mudah.
  - Ekspor bank soal ke file **Microsoft Excel (.xlsx)**.
  - Impor soal langsung dari file **Excel (.xlsx)** atau **CSV**.
  - Unduh template format soal Excel & CSV sekali klik.
  - Reset ke 5 soal standar bawaan dengan modal konfirmasi aman.
- **Efek Suara Sintetis (Web Audio API)**
  - Efek suara ceria saat jawaban benar, salah, klik, dan selebrasi konfeti kemenangan tanpa memerlukan file audio eksternal.

---

## 🚀 Teknologi yang Digunakan

- **React 19** & **TypeScript**
- **Vite 6** (Dikonfigurasi dengan `base: './'` untuk portabilitas maksimal)
- **Tailwind CSS v4**
- **MediaPipe Face Mesh & Camera Utils** (AI pelacak landmark wajah)
- **SheetJS (xlsx)** (Ekspor & impor spreadsheet)
- **Canvas Confetti** (Efek selebrasi juara)
- **Lucide React** (Ikon antarmuka modern)
- **Web Audio API** (Sintesis audio mandiri)

---

## 💻 Menjalankan Proyek Secara Lokal

1. **Clone repository ini**:
   ```bash
   git clone https://github.com/<username-anda>/<nama-repo>.git
   cd <nama-repo>
   ```

2. **Pasang dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Buka peramban pada alamat `http://localhost:3000`.

4. **Uji proses build produksi**:
   ```bash
   npm run build
   ```
   Hasil build siap saji akan berada di folder `dist/`.

---

## 🌐 Panduan Deploy ke GitHub Pages (100% Otomatis)

Proyek ini telah dilengkapi alur kerja **GitHub Actions** otomatis (`.github/workflows/deploy.yml`) dan konfigurasi `base: './'` pada Vite.

### Langkah-langkah:

1. **Buat Repository Baru di GitHub**:
   - Buat repository baru (misal: `game-ar-gerak-kepala`), set ke **Public**.

2. **Unggah (Push) Kode ke GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Inisialisasi Game AR Gerak Kepala"
   git branch -M main
   git remote add origin https://github.com/<username-anda>/game-ar-gerak-kepala.git
   git push -u origin main
   ```

3. **Aktifkan GitHub Pages**:
   - Di halaman repository GitHub Anda, buka tab **Settings** > **Pages**.
   - Pada bagian **Build and deployment** > **Source**, pilih **GitHub Actions**.
   - Alur kerja otomatis akan berjalan dan membangun aplikasi dalam waktu ±1 menit.

4. **Akses Aplikasi**:
   - Tautan web Anda akan langsung aktif di:
     `https://<username-anda>.github.io/game-ar-gerak-kepala/`

---

## 👨‍🏫 Profil Pengembang

Dibuat dengan dedikasi untuk inovasi pendidikan oleh:
**M. Nur Ali Abidin, S.Pd.**

- 📸 **Instagram**: [@aliabidin988](https://instagram.com/aliabidin988)
- 🎵 **TikTok**: [@aliabidin98](https://www.tiktok.com/@aliabidin98)
- 📧 **Email**: mabidin29@guru.smp.belajar.id

---

## 📄 Lisensi

Proyek ini dilindungi di bawah lisensi terbuka untuk pengembangan media pembelajaran interaktif.
