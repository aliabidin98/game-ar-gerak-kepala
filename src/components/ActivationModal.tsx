import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, Play, Lock, Sparkles, X, Instagram } from 'lucide-react';
import { soundManager } from '../utils/audio';

// Kode rahasia full versi (TIDAK ditampilkan pada teks UI)
const FULL_VERSION_CODE = 'ARKEPALA';

interface ActivationModalProps {
  isOpen: boolean;
  canClose: boolean; // Bisa ditutup jika sudah berada dalam mode demo atau sudah aktivasi
  onActivateSuccess: () => void;
  onEnterDemoMode: () => void;
  onClose?: () => void;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  canClose,
  onActivateSuccess,
  onEnterDemoMode,
  onClose
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = inputCode.trim().toUpperCase();

    if (!cleaned) {
      setErrorMessage('Harap masukkan kode aktivasi terlebih dahulu.');
      soundManager.playWrong();
      return;
    }

    if (cleaned === FULL_VERSION_CODE) {
      setErrorMessage(null);
      setSuccess(true);
      soundManager.playVictoryFanfare();
      setTimeout(() => {
        onActivateSuccess();
      }, 700);
    } else {
      soundManager.playWrong();
      setErrorMessage('Kode aktivasi salah! Tidak dapat membuka versi penuh. Silakan periksa kembali atau pilih Mode Demo.');
    }
  };

  const handleDemoClick = () => {
    soundManager.playClick();
    setErrorMessage(null);
    onEnterDemoMode();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-pop">
      <div className="relative w-full max-w-md glass-panel-modal p-6 md:p-8 rounded-[2rem] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-center">
        {/* Tombol Tutup (hanya jika diizinkan / sudah dalam mode demo) */}
        {canClose && onClose && (
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon Header */}
        <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/20 border border-cyan-400/40 shadow-[0_0_25px_rgba(6,182,212,0.3)]">
          {success ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
          ) : (
            <KeyRound className="w-10 h-10 text-cyan-400" />
          )}
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-pulse" />
        </div>

        {/* Judul Modal */}
        <h2 className="text-2xl md:text-3xl font-heading mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-emerald-300">
          Aktivasi Aplikasi
        </h2>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
          Masukkan kode lisensi untuk membuka <b>Versi Lengkap</b>, atau masuk melalui <b>Mode Demo</b> untuk mencoba fitur dasar.
        </p>

        {/* Alert Error */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-xs md:text-sm text-red-200 text-left flex items-start gap-2.5 animate-pop">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Alert Sukses */}
        {success && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-sm text-emerald-200 flex items-center justify-center gap-2 animate-pop">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold">Aktivasi Berhasil! Membuka Fitur Penuh...</span>
          </div>
        )}

        {/* Form Aktivasi */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cyan-400" /> Kode Lisensi Aktivasi
            </label>
            <input
              type="text"
              autoFocus
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value.toUpperCase());
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Ketik kode aktivasi di sini..."
              disabled={success}
              className="w-full p-3.5 bg-slate-900/90 rounded-xl text-center text-white text-lg tracking-widest font-mono font-bold border border-slate-600 focus:border-cyan-400 outline-none transition-colors shadow-inner uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={success}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 hover:from-cyan-500 hover:via-sky-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer text-base disabled:opacity-50"
          >
            <KeyRound className="w-5 h-5" />
            <span>Aktivasi Versi Lengkap</span>
          </button>
        </form>

        {/* Pembatas Atau */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="border-t border-slate-700/80 w-full" />
          <span className="bg-slate-900 px-3 text-xs text-gray-400 uppercase tracking-wider font-bold absolute">
            Atau
          </span>
        </div>

        {/* Tombol Masuk Mode Demo */}
        <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/60">
          <button
            type="button"
            onClick={handleDemoClick}
            disabled={success}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-emerald-300 hover:text-emerald-200 font-bold rounded-xl transition-all border border-emerald-500/40 hover:border-emerald-400 flex items-center justify-center gap-2 cursor-pointer text-sm shadow-md"
          >
            <Play className="w-4 h-4 text-emerald-400" />
            <span>Masuk Mode Demo (Uji Coba)</span>
          </button>
          <p className="text-[11px] text-gray-400 mt-2">
            Mode Demo hanya menampilkan menu <b>1 Pemain</b> dan <b>Bantuan</b>.
          </p>
        </div>

        {/* Footer Nama Pembuat & Media Sosial */}
        <div className="mt-5 pt-3 border-t border-slate-800 text-[11px] text-gray-400 font-semibold flex flex-col items-center gap-2">
          <div>
            dibuat oleh : <span className="text-cyan-400 font-bold">M. Nur Ali Abidin, S.Pd.</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <a
              href="https://instagram.com/aliabidin988"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-950/60 border border-pink-500/40 text-pink-300 hover:text-pink-200 transition-all text-[10px]"
            >
              <Instagram className="w-3 h-3 text-pink-400" />
              <span>@aliabidin988</span>
            </a>
            <a
              href="https://www.tiktok.com/@aliabidin98"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-cyan-400/40 text-cyan-200 hover:text-cyan-100 transition-all text-[10px]"
            >
              <svg className="w-3 h-3 fill-current text-cyan-300" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.28 6.28 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.43z"/>
              </svg>
              <span>@aliabidin98</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
