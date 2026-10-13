import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface WinnerModalProps {
  winner: 1 | 2;
  score: number;
  gameMode: 1 | 2;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  score,
  gameMode,
  onPlayAgain,
  onGoHome
}) => {
  useEffect(() => {
    soundManager.playVictoryFanfare();

    // Fire celebratory confetti bursts
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#38bdf8', '#34d399', '#facc15']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#ec4899', '#a855f7', '#6366f1']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });

    const interval = setInterval(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden text-center glass-panel p-8 md:p-10 rounded-3xl border border-yellow-500/40 shadow-[0_0_60px_rgba(234,179,8,0.3)] animate-pop">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Animated Trophy Icon */}
        <div className="relative inline-flex items-center justify-center w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-tr from-yellow-500/30 via-amber-400/20 to-yellow-300/40 border-2 border-yellow-400/60 shadow-[0_0_35px_rgba(250,204,21,0.5)]">
          <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
          <Sparkles className="absolute top-2 right-2 w-6 h-6 text-yellow-200 animate-pulse" />
        </div>

        {/* Winner Title */}
        <h2 className="text-4xl md:text-5xl font-heading mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 filter drop-shadow">
          {gameMode === 1 ? 'Hebat, Kamu Menang!' : `Pemain ${winner} Menang!`}
        </h2>

        <p className="text-gray-300 text-lg mb-6">
          {gameMode === 1
            ? 'Selamat! Kamu telah mencapai skor target dengan gerakan kepala yang tepat!'
            : `Pertarungan sengit! Pemain ${winner} berhasil mengungguli lawan dengan refleks kepala yang mantap!`}
        </p>

        {/* Score Badge */}
        <div className="inline-flex items-center gap-3 px-6 py-3 mb-8 bg-slate-900/80 border border-yellow-500/40 rounded-2xl shadow-inner">
          <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Skor Kemenangan</span>
          <span className="text-3xl font-heading text-yellow-400">{score} Poin</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              soundManager.playClick();
              onPlayAgain();
            }}
            className="w-full sm:w-auto flex-1 py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            Main Lagi
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onGoHome();
            }}
            className="w-full sm:w-auto flex-1 py-4 px-6 bg-slate-800 hover:bg-slate-700 text-gray-200 hover:text-white font-bold rounded-2xl transition-all border border-slate-600 hover:border-slate-500 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
};
