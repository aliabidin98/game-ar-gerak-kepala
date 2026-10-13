import React from 'react';
import { Camera, ArrowLeftRight, Hourglass, Trophy, Sparkles, X, Lightbulb } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HelpScreenProps {
  onBack: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  return (
    <div className="glass-panel-modal p-6 md:p-10 rounded-[2rem] flex flex-col w-full max-w-3xl animate-pop relative max-h-[92vh] overflow-y-auto">
      <button
        onClick={() => {
          soundManager.playClick();
          onBack();
        }}
        className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full hover:bg-slate-800/60 transition-colors"
        aria-label="Tutup"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex items-center justify-center gap-3 mb-2">
        <Sparkles className="w-7 h-7 text-indigo-400" />
        <h2 className="text-3xl md:text-4xl font-heading text-indigo-400 text-center">
          Cara Bermain Game AR
        </h2>
      </div>
      <p className="text-gray-300 text-center text-sm md:text-base mb-8">
        Kuis edukatif inovatif: gerakkan kepala ke kiri atau kanan untuk memilih jawaban kuis secara alami!
      </p>

      <div className="space-y-4 md:space-y-6 text-base text-gray-200">
        {/* Step 1 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0 mt-0.5">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white mb-1">1. Izinkan Akses Kamera Browser</h3>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Saat game dimulai, klik <b>"Allow" / "Izinkan"</b> pada notifikasi izin kamera browser. Teknologi AI Face Mesh akan mendeteksi posisi dahi dan dagu secara real-time tanpa menyimpan rekaman video Anda.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50">
          <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl shrink-0 mt-0.5">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white mb-1">2. Miringkan Kepala ke Kiri atau Kanan</h3>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Lihat pilihan jawaban di layar. Miringkan kepalamu ke arah opsi yang menurutmu benar:
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs md:text-sm">
              <span className="px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-cyan-300 font-semibold">
                👈 Miring Kiri = Opsi Jawaban Kiri
              </span>
              <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-lg text-emerald-300 font-semibold">
                👉 Miring Kanan = Opsi Jawaban Kanan
              </span>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 mt-0.5">
            <Hourglass className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white mb-1">3. Tahan Posisi Kemiringan</h3>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Tahan posisi kemiringan kepala selama <b>±0.5 hingga 1 detik</b> hingga bilah hijau pada kartu jawaban terisi penuh untuk mengunci jawabanmu.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50">
          <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl shrink-0 mt-0.5">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white mb-1">4. Raih Skor Target Kemenangan</h3>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed">
              Setiap jawaban benar memberikan <b>+10 poin</b>. Pemain pertama yang mencapai skor target (default: 50) akan dinobatkan sebagai pemenang!
            </p>
          </div>
        </div>

        {/* Guru / Tips Edukasi */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200/90 leading-relaxed">
            <b className="text-yellow-300 font-bold">Tips Pembelajaran di Kelas:</b>
            <br />
            Game ini sangat cocok ditampilkan di proyektor kelas atau Smart TV. Anda dapat menggunakan mode <b>2 Pemain (Split Screen)</b> untuk perlombaan cerdas cermat antar siswa! Gunakan menu <b>Bank Soal</b> untuk menyesuaikan materi pelajaran Anda dengan mudah.
          </div>
        </div>
      </div>

      <div className="mt-8 text-center flex flex-col items-center">
        <button
          onClick={() => {
            soundManager.playClick();
            onBack();
          }}
          className="py-3.5 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 cursor-pointer mb-5"
        >
          Mengerti, Kembali ke Menu
        </button>

        <div className="pt-4 border-t border-slate-700/60 w-full text-xs text-gray-400 flex flex-col items-center gap-2">
          <div>
            dibuat oleh : <span className="text-cyan-400 font-bold">M. Nur Ali Abidin, S.Pd.</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/aliabidin988"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:text-pink-300 font-semibold"
            >
              Instagram: @aliabidin988
            </a>
            <span className="text-gray-600">•</span>
            <a
              href="https://www.tiktok.com/@aliabidin98"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              TikTok: @aliabidin98
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
