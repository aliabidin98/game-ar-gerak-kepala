import React from 'react';
import {
  Settings,
  Type,
  Flag,
  Timer,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Compass,
  Save,
  X,
  Scan,
  Sparkles,
  Layers
} from 'lucide-react';
import { GameSettings } from '../types';
import { soundManager } from '../utils/audio';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onBack
}) => {
  const adjustFontSize = (amount: number) => {
    soundManager.playClick();
    const nextVal = Math.min(60, Math.max(20, settings.questionFontSize + amount));
    onUpdateSettings({ ...settings, questionFontSize: nextVal });
  };

  const adjustScore = (amount: number) => {
    soundManager.playClick();
    const nextVal = Math.min(200, Math.max(10, settings.targetScore + amount));
    onUpdateSettings({ ...settings, targetScore: nextVal });
  };

  const adjustTiltTime = (amount: number) => {
    soundManager.playClick();
    const nextVal = Math.min(30, Math.max(4, settings.tiltHoldFrames + amount));
    onUpdateSettings({ ...settings, tiltHoldFrames: nextVal });
  };

  const adjustSensitivity = (amount: number) => {
    soundManager.playClick();
    const nextVal = Math.min(25, Math.max(5, settings.tiltSensitivity + amount));
    onUpdateSettings({ ...settings, tiltSensitivity: nextVal });
  };

  const adjustTransparency = (amount: number) => {
    soundManager.playClick();
    const nextVal = Math.min(85, Math.max(5, (settings.transparencyPercent || 20) + amount));
    onUpdateSettings({ ...settings, transparencyPercent: nextVal });
  };

  const setTransparencyPreset = (val: number, blur: boolean = false) => {
    soundManager.playClick();
    onUpdateSettings({ ...settings, transparencyPercent: val, enableBlur: blur });
  };

  const toggleBlur = () => {
    soundManager.playClick();
    onUpdateSettings({ ...settings, enableBlur: !settings.enableBlur });
  };

  const toggleSound = () => {
    soundManager.playClick();
    const next = !settings.soundEnabled;
    soundManager.setEnabled(next);
    onUpdateSettings({ ...settings, soundEnabled: next });
  };

  const toggleMirror = () => {
    soundManager.playClick();
    onUpdateSettings({ ...settings, mirrorCamera: !settings.mirrorCamera });
  };

  const toggleLandmarks = () => {
    soundManager.playClick();
    onUpdateSettings({ ...settings, showLandmarks: !settings.showLandmarks });
  };

  const currentOpacity = (settings.transparencyPercent ?? 20) / 100;

  return (
    <div className="glass-panel-modal p-6 md:p-10 rounded-[2rem] flex flex-col w-full max-w-xl animate-pop relative max-h-[92vh] overflow-y-auto">
      <button
        onClick={() => {
          soundManager.playClick();
          onBack();
        }}
        className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full hover:bg-slate-800/60 transition-colors cursor-pointer"
        aria-label="Tutup"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex items-center justify-center gap-3 mb-2">
        <Settings className="w-8 h-8 text-orange-400" />
        <h2 className="text-3xl md:text-4xl font-heading text-orange-400 text-center">
          Pengaturan Game
        </h2>
      </div>
      <p className="text-gray-300 text-center text-sm mb-6">
        Sesuaikan preferensi tampilan transparansi, kontrol AI, dan aturan kuis
      </p>

      <div className="space-y-4 md:space-y-5">
        {/* PENGATURAN TRANSPARANSI KOTAK SOAL & JAWABAN */}
        <div className="bg-slate-900/85 p-5 rounded-2xl border border-cyan-500/30 shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Transparansi Kotak Soal & Jawaban
            </label>
            <span className="text-xs text-cyan-300 font-mono font-bold bg-cyan-950/70 px-2.5 py-0.5 rounded border border-cyan-500/50">
              {settings.transparencyPercent ?? 20}% Kepekatan ({100 - (settings.transparencyPercent ?? 20)}% Bening)
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Atur tingkat tembus pandang kartu agar kamera di belakang terlihat jelas (bening kristal)
          </p>

          <div className="flex items-center justify-center bg-slate-800 rounded-xl overflow-hidden border border-slate-600 mb-3">
            <button
              onClick={() => adjustTransparency(-5)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Lebih Bening"
              title="Lebih Bening / Transparan"
            >
              -
            </button>
            <div className="flex-1 text-center font-bold text-cyan-300 text-base md:text-lg">
              {(settings.transparencyPercent ?? 20) <= 25 ? '✨ Sangat Bening' : (settings.transparencyPercent ?? 20) <= 45 ? '🌤️ Sedang' : '🛡️ Tebal / Pekat'} ({settings.transparencyPercent ?? 20}%)
            </div>
            <button
              onClick={() => adjustTransparency(5)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Lebih Gelap"
              title="Lebih Gelap / Pekat"
            >
              +
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              onClick={() => setTransparencyPreset(20, false)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                (settings.transparencyPercent ?? 20) === 20 && !settings.enableBlur
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800/80 border-slate-700 text-gray-300 hover:border-slate-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bening Kristal</span>
              <span className="text-[10px] text-gray-400">20% (Bawaan)</span>
            </button>

            <button
              onClick={() => setTransparencyPreset(35, false)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                (settings.transparencyPercent ?? 20) === 35
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800/80 border-slate-700 text-gray-300 hover:border-slate-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Transparan 35%</span>
              <span className="text-[10px] text-gray-400">Seimbang</span>
            </button>

            <button
              onClick={() => setTransparencyPreset(65, false)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                (settings.transparencyPercent ?? 20) === 65
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-800/80 border-slate-700 text-gray-300 hover:border-slate-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pekat 65%</span>
              <span className="text-[10px] text-gray-400">Kontras Tinggi</span>
            </button>
          </div>

          {/* Toggle Blur Filter */}
          <div className="flex items-center justify-between p-2.5 bg-slate-800/70 rounded-xl border border-slate-700 text-xs mb-3">
            <span className="text-gray-300">Efek Kabut / Blur Kaca:</span>
            <button
              onClick={toggleBlur}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                settings.enableBlur
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {settings.enableBlur ? 'Aktif (Kaca Buram)' : 'Nonaktif (Bening Tembus Pandang)'}
            </button>
          </div>

          {/* Live Transparency Preview Box over patterned backdrop */}
          <div className="relative p-4 rounded-xl border border-slate-700 overflow-hidden min-h-[110px] flex flex-col justify-center items-center">
            {/* Background elements simulating live camera feed */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/60 via-slate-900 to-emerald-900/60" />
            <div className="absolute top-2 left-4 w-16 h-16 bg-blue-500/40 rounded-full blur-md" />
            <div className="absolute bottom-2 right-4 w-16 h-16 bg-emerald-500/40 rounded-full blur-md" />
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/30 font-bold uppercase tracking-widest select-none pointer-events-none">
              [ Simulasi Tampilan Kamera ]
            </div>

            {/* Simulated Live Question and Answer Box */}
            <div
              className="relative z-10 w-full p-2.5 rounded-xl border border-white/25 text-center transition-all mb-2 shadow-lg"
              style={{
                backgroundColor: `rgba(15, 23, 42, ${currentOpacity})`,
                backdropFilter: settings.enableBlur ? 'blur(10px)' : 'none',
                WebkitBackdropFilter: settings.enableBlur ? 'blur(10px)' : 'none'
              }}
            >
              <p className="text-xs font-bold text-white drop-shadow-md">
                Pratinjau Kotak Soal ({settings.transparencyPercent ?? 20}%)
              </p>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-2 w-full">
              <div
                className="p-2 rounded-xl border border-sky-400/50 text-center transition-all shadow-md"
                style={{
                  backgroundColor: `rgba(14, 165, 233, ${Math.max(0.12, currentOpacity * 0.9)})`,
                  backdropFilter: settings.enableBlur ? 'blur(8px)' : 'none'
                }}
              >
                <p className="text-[11px] font-bold text-sky-200 drop-shadow">Opsi Kiri (👈)</p>
              </div>
              <div
                className="p-2 rounded-xl border border-emerald-400/50 text-center transition-all shadow-md"
                style={{
                  backgroundColor: `rgba(16, 185, 129, ${Math.max(0.12, currentOpacity * 0.9)})`,
                  backdropFilter: settings.enableBlur ? 'blur(8px)' : 'none'
                }}
              >
                <p className="text-[11px] font-bold text-emerald-200 drop-shadow">Opsi Kanan (👉)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Font Size Card */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/60 shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Type className="w-4 h-4 text-cyan-400" /> Ukuran Huruf Soal & Opsi
            </label>
            <span className="text-xs text-cyan-300 font-mono font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              {settings.questionFontSize}px
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Atur besar-kecil teks agar mudah dibaca di layar laptop atau proyektor kelas
          </p>
          <div className="flex items-center justify-center bg-slate-800 rounded-xl overflow-hidden border border-slate-600">
            <button
              onClick={() => adjustFontSize(-2)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Perkecil huruf"
            >
              -
            </button>
            <div className="flex-1 text-center font-bold text-cyan-300 text-lg">
              {settings.questionFontSize} px
            </div>
            <button
              onClick={() => adjustFontSize(2)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Perbesar huruf"
            >
              +
            </button>
          </div>

          {/* Live Preview */}
          <div className="mt-3 p-3 bg-slate-800/70 rounded-xl border border-slate-700 text-center flex flex-col items-center justify-center gap-1.5 min-h-[90px] overflow-hidden">
            <p
              className="font-bold text-white transition-all leading-tight drop-shadow-md"
              style={{ fontSize: `${settings.questionFontSize}px` }}
            >
              Contoh Teks Soal Kuis
            </p>
            <p
              className="font-bold text-cyan-300 transition-all drop-shadow-md"
              style={{ fontSize: `${Math.max(16, Math.round(settings.questionFontSize * 0.72))}px` }}
            >
              Contoh Pilihan Jawaban
            </p>
          </div>
        </div>

        {/* Target Score Card */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/60 shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Flag className="w-4 h-4 text-yellow-400" /> Skor Target Kemenangan
            </label>
            <span className="text-xs text-yellow-300 font-mono font-bold bg-yellow-950/60 px-2 py-0.5 rounded border border-yellow-800/50">
              {settings.targetScore} Poin
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Jumlah poin untuk menyelesaikan game (setiap jawaban benar bernilai 10 poin)
          </p>
          <div className="flex items-center justify-center bg-slate-800 rounded-xl overflow-hidden border border-slate-600">
            <button
              onClick={() => adjustScore(-10)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Kurangi skor target"
            >
              -
            </button>
            <div className="flex-1 text-center font-bold text-yellow-400 text-2xl font-heading">
              {settings.targetScore}
            </div>
            <button
              onClick={() => adjustScore(10)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Tambah skor target"
            >
              +
            </button>
          </div>
        </div>

        {/* Tilt Hold Time Card */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/60 shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-400" /> Waktu Tahan Kemiringan
            </label>
            <span className="text-xs text-emerald-300 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              {settings.tiltHoldFrames} frame (~{(settings.tiltHoldFrames * 0.08).toFixed(1)}s)
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Semakin kecil nilainya, semakin cepat jawaban terkunci saat kepala miring
          </p>
          <div className="flex items-center justify-center bg-slate-800 rounded-xl overflow-hidden border border-slate-600">
            <button
              onClick={() => adjustTiltTime(-2)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Kurangi waktu tahan"
            >
              -
            </button>
            <div className="flex-1 text-center font-bold text-emerald-400 text-2xl font-heading">
              {settings.tiltHoldFrames}
            </div>
            <button
              onClick={() => adjustTiltTime(2)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Tambah waktu tahan"
            >
              +
            </button>
          </div>
        </div>

        {/* Tilt Sensitivity Card */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700/60 shadow-inner">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" /> Sudut Kemiringan Minimum
            </label>
            <span className="text-xs text-indigo-300 font-mono font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
              {settings.tiltSensitivity}° derajat
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Derajat kemiringan kepala untuk memicu pemilihan opsi (default: 10°)
          </p>
          <div className="flex items-center justify-center bg-slate-800 rounded-xl overflow-hidden border border-slate-600">
            <button
              onClick={() => adjustSensitivity(-2)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Kurangi sudut"
            >
              -
            </button>
            <div className="flex-1 text-center font-bold text-indigo-300 text-2xl font-heading">
              {settings.tiltSensitivity}°
            </div>
            <button
              onClick={() => adjustSensitivity(2)}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 font-bold text-xl text-white transition-colors w-16 cursor-pointer"
              aria-label="Tambah sudut"
            >
              +
            </button>
          </div>
        </div>

        {/* Quick Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              settings.soundEnabled
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700 text-gray-400'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="text-xs font-bold">
              {settings.soundEnabled ? 'Suara: Aktif' : 'Suara: Hening'}
            </span>
          </button>

          {/* Mirror Camera Toggle */}
          <button
            onClick={toggleMirror}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              settings.mirrorCamera
                ? 'bg-blue-950/50 border-blue-500/50 text-blue-300'
                : 'bg-slate-800/60 border-slate-700 text-gray-400'
            }`}
          >
            <FlipHorizontal className="w-5 h-5" />
            <span className="text-xs font-bold">
              {settings.mirrorCamera ? 'Kamera: Cermin' : 'Kamera: Normal'}
            </span>
          </button>

          {/* Show Face Points Toggle */}
          <button
            onClick={toggleLandmarks}
            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              settings.showLandmarks
                ? 'bg-purple-950/50 border-purple-500/50 text-purple-300'
                : 'bg-slate-800/60 border-slate-700 text-gray-400'
            }`}
          >
            <Scan className="w-5 h-5" />
            <span className="text-xs font-bold">
              {settings.showLandmarks ? 'Titik AI: Tampil' : 'Titik AI: Sembunyi'}
            </span>
          </button>
        </div>
      </div>

      <button
        onClick={() => {
          soundManager.playClick();
          onBack();
        }}
        className="mt-6 py-4 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl font-bold transition-all w-full shadow-lg flex items-center justify-center gap-2 text-lg text-white cursor-pointer hover:scale-[1.01]"
      >
        <Save className="w-5 h-5" /> Simpan & Selesai
      </button>
    </div>
  );
};
