import React from 'react';
import {
  Gamepad2,
  User,
  Users,
  PenSquare,
  Settings,
  HelpCircle,
  Volume2,
  VolumeX,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Lock,
  Instagram
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface MenuScreenProps {
  questionCount: number;
  soundEnabled: boolean;
  isFullVersion: boolean;
  onToggleSound: () => void;
  onStartGame: (mode: 1 | 2) => void;
  onOpenQuestions: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenActivation: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  questionCount,
  soundEnabled,
  isFullVersion,
  onToggleSound,
  onStartGame,
  onOpenQuestions,
  onOpenSettings,
  onOpenHelp,
  onOpenActivation
}) => {
  return (
    <div className="relative w-full max-w-lg glass-panel p-8 md:p-10 rounded-[2.5rem] flex flex-col items-center animate-pop border border-white/20 shadow-2xl">
      {/* Sound Toggle Corner */}
      <button
        onClick={() => {
          soundManager.playClick();
          onToggleSound();
        }}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition-all border border-slate-700/60 cursor-pointer"
        title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
      >
        {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
      </button>

      {/* Mode Badge (Full Versi vs Mode Demo) */}
      <div className="absolute top-6 left-6">
        {isFullVersion ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 shadow">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Versi Penuh</span>
          </span>
        ) : (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenActivation();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300 hover:bg-amber-900/80 transition-all cursor-pointer shadow hover:scale-105"
            title="Klik untuk memasukkan kode aktivasi"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode Demo (Aktivasi)</span>
          </button>
        )}
      </div>

      {/* Hero Icon with Pulse Effect */}
      <div className="relative mb-4 mt-4">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-cyan-500/30 to-blue-600/30 border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.4)]">
          <Gamepad2 className="w-12 h-12 text-cyan-400" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl md:text-5xl text-center mb-2 font-heading text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400 filter drop-shadow-md">
        Gerak Kepala
      </h1>
      <p className="text-gray-300 mb-6 text-center text-base md:text-lg max-w-xs font-medium">
        Kuis Augmented Reality: Jawab soal seru dengan memiringkan kepalamu!
      </p>

      {/* Banner Khusus Mode Demo */}
      {!isFullVersion && (
        <div className="w-full mb-6 p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-200">
              <b>Mode Demo Aktif:</b> Akses 1 Pemain & Bantuan terbuka.
            </p>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenActivation();
            }}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer"
          >
            Aktivasi
          </button>
        </div>
      )}

      {/* Game Mode Buttons */}
      <div className="w-full space-y-3 mb-6">
        {/* 1 Pemain (Selalu tampil di Full Version & Mode Demo) */}
        <button
          onClick={() => {
            soundManager.playClick();
            onStartGame(1);
          }}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 hover:from-blue-500 hover:via-sky-500 hover:to-cyan-500 rounded-2xl font-bold text-lg md:text-xl transition-all shadow-[0_0_25px_rgba(14,165,233,0.4)] hover:scale-[1.02] flex items-center justify-center gap-3 text-white border border-cyan-400/30 cursor-pointer group"
        >
          <User className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span>1 Pemain</span>
        </button>

        {/* 2 Pemain (Hanya tampil jika Full Version) */}
        {isFullVersion && (
          <button
            onClick={() => {
              soundManager.playClick();
              onStartGame(2);
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 hover:from-emerald-500 hover:via-teal-500 hover:to-teal-600 rounded-2xl font-bold text-lg md:text-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-[1.02] flex items-center justify-center gap-3 text-white border border-emerald-400/30 cursor-pointer group"
          >
            <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>2 Pemain (Split Screen)</span>
          </button>
        )}
      </div>

      {/* Secondary Menu Buttons */}
      {isFullVersion ? (
        /* Full Version: Menampilkan 3 tombol (Soal, Pengaturan, Bantuan) */
        <div className="grid grid-cols-3 w-full gap-2.5 md:gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenQuestions();
            }}
            className="py-3 px-2 bg-slate-800/80 hover:bg-slate-700 rounded-2xl font-bold transition-all border border-slate-600/60 hover:border-slate-500 flex flex-col justify-center items-center gap-1.5 text-xs md:text-sm text-gray-200 cursor-pointer hover:scale-[1.03] relative"
          >
            <PenSquare className="w-5 h-5 text-yellow-400" />
            <span>Bank Soal</span>
            <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-bold px-1.5 py-0.2 rounded-full border border-yellow-400/40">
              {questionCount} Soal
            </span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings();
            }}
            className="py-3 px-2 bg-orange-950/40 hover:bg-orange-900/50 rounded-2xl font-bold transition-all border border-orange-500/40 hover:border-orange-400 flex flex-col justify-center items-center gap-1.5 text-xs md:text-sm text-orange-200 cursor-pointer hover:scale-[1.03]"
          >
            <Settings className="w-5 h-5 text-orange-400" />
            <span>Pengaturan</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenHelp();
            }}
            className="py-3 px-2 bg-indigo-950/40 hover:bg-indigo-900/50 rounded-2xl font-bold transition-all border border-indigo-500/40 hover:border-indigo-400 flex flex-col justify-center items-center gap-1.5 text-xs md:text-sm text-indigo-200 cursor-pointer hover:scale-[1.03]"
          >
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>Bantuan</span>
          </button>
        </div>
      ) : (
        /* Mode Demo: Hanya menampilkan tombol Bantuan (Bank Soal & Pengaturan disembunyikan) */
        <div className="w-full">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenHelp();
            }}
            className="w-full py-3.5 px-4 bg-indigo-950/40 hover:bg-indigo-900/50 rounded-2xl font-bold transition-all border border-indigo-500/40 hover:border-indigo-400 flex justify-center items-center gap-2.5 text-sm md:text-base text-indigo-200 cursor-pointer hover:scale-[1.02]"
          >
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            <span>Panduan & Cara Bermain</span>
          </button>
        </div>
      )}

      {/* Footer Creator & Social Media Badge */}
      <div className="mt-8 pt-5 border-t border-slate-700/60 w-full text-center flex flex-col items-center">
        <p className="text-xs md:text-sm text-gray-300 font-bold tracking-wide flex items-center justify-center gap-1.5 mb-2.5">
          <span className="text-gray-400">dibuat oleh :</span>
          <span className="text-cyan-400 font-extrabold">M. Nur Ali Abidin, S.Pd.</span>
        </p>

        {/* Media Sosial Pengembang */}
        <div className="flex items-center justify-center gap-2.5 text-xs flex-wrap">
          <a
            href="https://instagram.com/aliabidin988"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-950/60 hover:bg-pink-900/80 border border-pink-500/40 text-pink-300 transition-all hover:scale-105 shadow-sm"
            title="Instagram Pengembang"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="font-semibold">@aliabidin988</span>
          </a>

          <a
            href="https://www.tiktok.com/@aliabidin98"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700/90 border border-cyan-400/40 text-cyan-200 transition-all hover:scale-105 shadow-sm"
            title="TikTok Pengembang"
          >
            <svg className="w-3.5 h-3.5 fill-current text-cyan-300 shrink-0" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.28 6.28 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.43z"/>
            </svg>
            <span className="font-semibold">@aliabidin98</span>
          </a>
        </div>
      </div>
    </div>
  );
};
