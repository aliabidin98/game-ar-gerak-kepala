import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Trash2,
  Check,
  UserCheck,
  Sparkles,
  Shuffle,
  Users,
  User,
  History,
  ListPlus,
  AlertCircle
} from 'lucide-react';
import { soundManager } from '../utils/audio';

const STORAGE_KEY_WHEEL_NAMES = 'edutilt_wheel_names_v1';
const STORAGE_KEY_WHEEL_ELIMINATED = 'edutilt_wheel_eliminated_v1';

const DEFAULT_SAMPLE_NAMES = [
  'Ahmad Fauzi',
  'Budi Santoso',
  'Citra Lestari',
  'Dewi Anggraini',
  'Eka Pratama',
  'Fajar Nugraha',
  'Gita Permata',
  'Hadi Saputra',
  'Indah Wahyuni',
  'Joko Susilo',
  'Kirana Putri',
  'Lukman Hakim'
];

const GROUP_SAMPLE_NAMES = [
  'Kelompok 1 (Garuda)',
  'Kelompok 2 (Rajawali)',
  'Kelompok 3 (Elang)',
  'Kelompok 4 (Merak)',
  'Kelompok 5 (Cendrawasih)',
  'Kelompok 6 (Kasuari)'
];

const SLICE_COLORS = [
  '#0284c7', // Sky 600
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#ec4899', // Pink 500
  '#8b5cf6', // Violet 500
  '#06b6d4', // Cyan 500
  '#f97316', // Orange 500
  '#14b8a6', // Teal 500
  '#e11d48', // Rose 600
  '#6366f1'  // Indigo 500
];

interface RandomPickerScreenProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onBack: () => void;
  onStartGame?: (mode: 1 | 2) => void;
}

export const RandomPickerScreen: React.FC<RandomPickerScreenProps> = ({
  soundEnabled,
  onToggleSound,
  onBack,
  onStartGame
}) => {
  // State Daftar Nama Aktif
  const [namesText, setNamesText] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WHEEL_NAMES);
      if (stored) return stored;
    } catch (e) {
      console.warn('Failed reading wheel names', e);
    }
    return DEFAULT_SAMPLE_NAMES.join('\n');
  });

  // State Daftar Nama yang Sudah Dieliminasi / Terpilih
  const [eliminatedNames, setEliminatedNames] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WHEEL_ELIMINATED);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading eliminated names', e);
    }
    return [];
  });

  // Active Names Array
  const activeNames = useMemo(() => {
    return namesText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
  }, [namesText]);

  // Tab State: 'active' | 'eliminated'
  const [activeTab, setActiveTab] = useState<'active' | 'eliminated'>('active');

  // Wheel State
  const [rotationAngle, setRotationAngle] = useState(0); // in radians
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerModalData, setWinnerModalData] = useState<{
    show: boolean;
    name: string;
    index: number;
  }>({
    show: false,
    name: '',
    index: -1
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTickSliceRef = useRef<number>(-1);

  // Simpan ke LocalStorage saat daftar nama berubah
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WHEEL_NAMES, namesText);
    } catch (e) {
      console.warn('Failed saving wheel names', e);
    }
  }, [namesText]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WHEEL_ELIMINATED, JSON.stringify(eliminatedNames));
    } catch (e) {
      console.warn('Failed saving eliminated names', e);
    }
  }, [eliminatedNames]);

  // Fungsi menggambar Roda di Canvas
  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 18;

    ctx.clearRect(0, 0, width, height);

    const count = activeNames.length;

    // Jika tidak ada nama, gambar roda kosong
    if (count === 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#475569';
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 18px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Daftar nama masih kosong', centerX, centerY - 10);
      ctx.font = '14px Nunito, sans-serif';
      ctx.fillText('Masukkan nama di panel kanan', centerX, centerY + 18);
      ctx.restore();
      return;
    }

    const arcSize = (2 * Math.PI) / count;

    // 1. Bayangan luar roda
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();
    ctx.restore();

    // 2. Gambar setiap irisan segmen
    for (let i = 0; i < count; i++) {
      const sliceStartAngle = angle + i * arcSize;
      const sliceEndAngle = sliceStartAngle + arcSize;

      // Warna irisan
      let color = SLICE_COLORS[i % SLICE_COLORS.length];
      if (count > 1 && i === count - 1 && color === SLICE_COLORS[0]) {
        color = SLICE_COLORS[(i + 2) % SLICE_COLORS.length];
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sliceStartAngle, sliceEndAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Garis tepi tiap irisan
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.stroke();
      ctx.restore();

      // 3. Gambar Teks Nama pada irisan
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(sliceStartAngle + arcSize / 2);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';

      // Ukuran font adaptif berdasarkan jumlah nama
      let fontSize = 16;
      if (count > 25) fontSize = 11;
      else if (count > 15) fontSize = 13;
      else if (count > 8) fontSize = 15;
      else fontSize = 17;

      ctx.font = `800 ${fontSize}px "Nunito", sans-serif`;

      // Shadow pada teks agar kontras tajam
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Pangkas teks jika terlalu panjang
      const maxTextLength = count > 20 ? 12 : 18;
      const rawText = activeNames[i];
      const displayText =
        rawText.length > maxTextLength ? rawText.substring(0, maxTextLength - 1) + '…' : rawText;

      ctx.fillText(displayText, radius - 22, 0);
      ctx.restore();
    }

    // 4. Lingkaran Ring Luar (Rim Roda) dengan aksen titik-titik pin lampu
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Gambar pin/paku pembatas di keliling roda
    for (let i = 0; i < count; i++) {
      const pinAngle = angle + i * arcSize;
      const pinX = centerX + Math.cos(pinAngle) * (radius - 2);
      const pinY = centerY + Math.sin(pinAngle) * (radius - 2);

      ctx.beginPath();
      ctx.arc(pinX, pinY, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#854d0e';
      ctx.stroke();
    }
    ctx.restore();

    // 5. Hub Pusat Roda (Tombol Tengah)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Gradien glossy tombol tengah
    const grad = ctx.createRadialGradient(centerX - 8, centerY - 8, 4, centerX, centerY, 30);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#0284c7');

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();

    // Teks tengah
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 13px "Fredoka One", "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText('PUTAR', centerX, centerY);
    ctx.restore();

    // 6. Jarum / Indikator Penunjuk di Bagian Atas Roda (Pointer Arrow)
    ctx.save();
    ctx.translate(centerX, centerY - radius + 6);

    ctx.beginPath();
    ctx.moveTo(0, 18); // Ujung jarum menunjuk ke bawah ke arah roda
    ctx.lineTo(-14, -14);
    ctx.lineTo(14, -14);
    ctx.closePath();

    ctx.fillStyle = '#ef4444'; // Merah cerah
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Pin bulat pada jarum
    ctx.beginPath();
    ctx.arc(0, -10, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  // Re-draw roda saat activeNames atau rotationAngle berubah
  useEffect(() => {
    drawWheel(rotationAngle);
  }, [activeNames, rotationAngle]);

  // Hitung irisan mana yang saat ini ditunjuk oleh jarum (jarum berada di atas = 12 o'clock = -π/2 atau 3π/2)
  const getSelectedSliceIndex = (angle: number, totalSlices: number): number => {
    if (totalSlices === 0) return -1;
    const arcSize = (2 * Math.PI) / totalSlices;
    // Jarum berada di posisi atas (3 * Math.PI / 2)
    // Sudut relatif dari titik awal roda terhadap jarum:
    const needleAngle = (3 * Math.PI) / 2;
    const normalizedAngle = (needleAngle - (angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const index = Math.floor(normalizedAngle / arcSize) % totalSlices;
    return index;
  };

  // Fungsi Mulai Memutar Roda
  const handleSpin = () => {
    if (isSpinning) return;
    if (activeNames.length === 0) {
      soundManager.playWrong();
      return;
    }

    soundManager.playClick();
    setIsSpinning(true);
    setWinnerModalData({ show: false, name: '', index: -1 });

    const totalSlices = activeNames.length;
    const arcSize = (2 * Math.PI) / totalSlices;

    // Pilih pemenang secara acak
    const winningIndex = Math.floor(Math.random() * totalSlices);

    // Target putaran: 5 sampai 8 putaran penuh (rotations) + penyesuaian sudut agar jarum menunjuk tepat ke irisan winningIndex
    // Jarum berada di 3π/2 (atas)
    const baseRotations = 5 + Math.floor(Math.random() * 3); // 5 - 7 putaran
    const targetSliceCenterAngle = winningIndex * arcSize + arcSize / 2;
    // Tambahkan sedikit variasi acak di dalam irisan (±35% dari setengah lebar irisan)
    const randomOffsetInSlice = (Math.random() - 0.5) * (arcSize * 0.7);

    // Hitung sudut akhir yang diperlukan
    const currentAngleNormalized = rotationAngle % (2 * Math.PI);
    const targetAngleRelative = (3 * Math.PI) / 2 - (targetSliceCenterAngle + randomOffsetInSlice);
    const deltaAngle = (targetAngleRelative - currentAngleNormalized + 4 * Math.PI) % (2 * Math.PI);

    const totalAngleToRotate = baseRotations * 2 * Math.PI + deltaAngle;
    const startAngle = rotationAngle;
    const finalAngle = startAngle + totalAngleToRotate;

    const duration = 4800 + Math.random() * 800; // ~4.8 - 5.6 detik
    const startTime = performance.now();

    lastTickSliceRef.current = getSelectedSliceIndex(startAngle, totalSlices);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: Cubic Out (smooth deceleration)
      const easeOut = 1 - Math.pow(1 - progress, 3.2);

      const currentAngle = startAngle + totalAngleToRotate * easeOut;
      setRotationAngle(currentAngle);

      // Periksa apakah berpindah irisan untuk memainkan suara detak (tick sound)
      const currentSlice = getSelectedSliceIndex(currentAngle, totalSlices);
      if (currentSlice !== lastTickSliceRef.current) {
        lastTickSliceRef.current = currentSlice;
        soundManager.playWheelTick();
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Putaran Selesai!
        setRotationAngle(finalAngle);
        setIsSpinning(false);

        // Ambil nama pemenang
        const verifiedWinnerIndex = getSelectedSliceIndex(finalAngle, totalSlices);
        const winnerName = activeNames[verifiedWinnerIndex] || activeNames[winningIndex] || 'Siswa';

        // Suara kemenangan & selebrasi konfeti
        soundManager.playVictoryFanfare();
        triggerConfetti();

        // Tampilkan Modal Pemenang
        setTimeout(() => {
          setWinnerModalData({
            show: true,
            name: winnerName,
            index: verifiedWinnerIndex
          });
        }, 350);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Bersihkan animation frame jika unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Efek Selebrasi Konfeti
  const triggerConfetti = () => {
    const end = Date.now() + 2500;
    const colors = ['#06b6d4', '#38bdf8', '#fbbf24', '#f43f5e', '#10b981', '#a855f7'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  // Aksi Modal: Hapus nama yang sudah terpilih dari roda
  const handleRemoveWinnerName = () => {
    soundManager.playCorrect();
    const nameToRemove = winnerModalData.name;

    // Hapus dari activeNames text
    const updatedList = activeNames.filter((n) => n !== nameToRemove);
    setNamesText(updatedList.join('\n'));

    // Masukkan ke eliminated list
    if (!eliminatedNames.includes(nameToRemove)) {
      setEliminatedNames((prev) => [nameToRemove, ...prev]);
    }

    setWinnerModalData({ show: false, name: '', index: -1 });
  };

  // Aksi Modal: Simpan nama (tidak dihapus) & tutup modal
  const handleKeepWinnerName = () => {
    soundManager.playClick();
    setWinnerModalData({ show: false, name: '', index: -1 });
  };

  // Kembalikan satu nama dari daftar eliminasi ke roda aktif
  const handleRestoreName = (nameToRestore: string) => {
    soundManager.playClick();
    setEliminatedNames((prev) => prev.filter((n) => n !== nameToRestore));
    setNamesText((prev) => (prev.trim().length > 0 ? prev.trim() + '\n' + nameToRestore : nameToRestore));
  };

  // Kembalikan semua nama yang tereliminasi
  const handleRestoreAll = () => {
    soundManager.playClick();
    if (eliminatedNames.length === 0) return;
    const combined = [...activeNames, ...eliminatedNames];
    setNamesText(combined.join('\n'));
    setEliminatedNames([]);
  };

  // Preset contoh nama
  const handleLoadSampleNames = () => {
    soundManager.playClick();
    setNamesText(DEFAULT_SAMPLE_NAMES.join('\n'));
  };

  // Preset kelompok
  const handleLoadGroupNames = () => {
    soundManager.playClick();
    setNamesText(GROUP_SAMPLE_NAMES.join('\n'));
  };

  // Acak urutan nama
  const handleShuffleNames = () => {
    soundManager.playClick();
    const shuffled = [...activeNames].sort(() => Math.random() - 0.5);
    setNamesText(shuffled.join('\n'));
  };

  // Bersihkan semua nama
  const handleClearNames = () => {
    soundManager.playClick();
    setNamesText('');
  };

  return (
    <div className="glass-panel-modal p-4 md:p-8 rounded-[2.5rem] flex flex-col w-full max-w-5xl h-[94vh] animate-pop overflow-hidden relative border border-white/20 shadow-2xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-700/60 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onBack();
            }}
            className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-gray-300 hover:text-white transition-all border border-slate-600/60 flex items-center gap-2 font-bold text-xs md:text-sm cursor-pointer shadow hover:scale-105"
            title="Kembali ke Menu Utama"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Menu Utama</span>
          </button>

          <div>
            <h2 className="text-xl md:text-2xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-300 flex items-center gap-2">
              <span>🎡 Roda Acak Nama Siswa</span>
            </h2>
            <p className="text-xs text-gray-400 hidden sm:block">
              Putar roda untuk menentukan giliran bermain siswa/kelompok secara seru & adil!
            </p>
          </div>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onToggleSound();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition-all border border-slate-700/60 cursor-pointer"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Wheel Canvas, Right = Name List & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Left Column: Interactive Wheel & Spin Button (7 Cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-2 md:p-4 bg-slate-900/60 rounded-3xl border border-slate-800/80 relative">
          {/* Wheel Container */}
          <div className="relative flex items-center justify-center select-none w-full max-w-[420px] aspect-square">
            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              onClick={handleSpin}
              className={`w-full h-full cursor-pointer transition-transform duration-300 drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] ${
                isSpinning ? 'cursor-not-allowed' : 'hover:scale-[1.01]'
              }`}
              title="Klik langsung pada roda untuk memutar!"
            />
          </div>

          {/* Spin Action Button */}
          <div className="w-full max-w-sm mt-3 flex flex-col items-center gap-2">
            <button
              onClick={handleSpin}
              disabled={isSpinning || activeNames.length === 0}
              className={`w-full py-3.5 px-6 rounded-2xl font-heading text-lg md:text-xl flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl ${
                isSpinning
                  ? 'bg-slate-700 text-gray-400 cursor-not-allowed animate-pulse'
                  : activeNames.length === 0
                  ? 'bg-slate-800 text-gray-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:via-orange-400 hover:to-rose-400 text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:scale-[1.03] active:scale-95 border border-amber-300/40'
              }`}
            >
              {isSpinning ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin text-amber-300" />
                  <span>Sedang Berputar...</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current text-yellow-200" />
                  <span>PUTAR RODA (SPIN)</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-gray-400 text-center flex items-center gap-1.5">
              <span>💡 Klik tombol putar atau klik langsung pada roda untuk mengacak.</span>
            </p>
          </div>
        </div>

        {/* Right Column: Name List Management Tabs (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 min-h-[380px] overflow-hidden">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-700/60 shrink-0">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('active');
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'bg-slate-800 text-gray-400 hover:text-gray-200 hover:bg-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Aktif ({activeNames.length})</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('eliminated');
              }}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'eliminated'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800 text-gray-400 hover:text-gray-200 hover:bg-slate-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Terpilih ({eliminatedNames.length})</span>
            </button>
          </div>

          {/* Tab 1: Active Names Editor */}
          {activeTab === 'active' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <ListPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Daftar Nama (1 nama per baris):</span>
                </label>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold">
                  {activeNames.length} nama di roda
                </span>
              </div>

              {/* Textarea Input */}
              <div className="flex-1 min-h-[140px] relative mb-3">
                <textarea
                  value={namesText}
                  onChange={(e) => setNamesText(e.target.value)}
                  disabled={isSpinning}
                  placeholder="Ketik atau tempel nama siswa/kelompok di sini (satu per baris)...&#10;Contoh:&#10;Ahmad Fauzi&#10;Budi Santoso&#10;Citra Lestari"
                  className="w-full h-full p-3 bg-slate-950/90 rounded-2xl text-white font-medium text-xs md:text-sm border border-slate-700 focus:border-cyan-400 outline-none resize-none leading-relaxed shadow-inner"
                />
              </div>

              {/* Quick Action Preset Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-2 shrink-0">
                <button
                  type="button"
                  onClick={handleLoadSampleNames}
                  disabled={isSpinning}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Muat 12 contoh nama siswa"
                >
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>Contoh Siswa</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadGroupNames}
                  disabled={isSpinning}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  title="Muat 6 kelompok belajar"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kelompok (1-6)</span>
                </button>

                <button
                  type="button"
                  onClick={handleShuffleNames}
                  disabled={isSpinning || activeNames.length < 2}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Acak urutan nama di roda"
                >
                  <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acak Urutan</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearNames}
                  disabled={isSpinning || activeNames.length === 0}
                  className="py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-semibold border border-rose-500/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Kosongkan daftar nama"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Bersihkan</span>
                </button>
              </div>

              <div className="p-2 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] text-gray-400 flex items-center gap-1.5 shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Tekan <b>Enter</b> untuk memisahkan setiap nama siswa/kelompok.</span>
              </div>
            </div>
          )}

          {/* Tab 2: Eliminated / Already Picked Names */}
          {activeTab === 'eliminated' && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                  <span>Siswa yang Sudah Terpilih:</span>
                </label>
                {eliminatedNames.length > 0 && (
                  <button
                    onClick={handleRestoreAll}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Kembalikan Semua</span>
                  </button>
                )}
              </div>

              {/* List of Eliminated Names */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {eliminatedNames.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400">
                    <History className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-xs font-semibold">Belum ada nama yang dieliminasi</p>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
                      Saat roda berhenti dan Anda memilih <b>"Hapus Nama Ini"</b>, nama tersebut akan tercatat di sini dan tidak akan terpilih lagi pada putaran berikutnya.
                    </p>
                  </div>
                ) : (
                  eliminatedNames.map((name, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-gray-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-gray-200 font-semibold truncate line-through opacity-75">
                          {name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRestoreName(name)}
                        className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer hover:scale-105"
                        title="Kembalikan nama ini ke roda aktif"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Kembalikan</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Winner Celebration Modal */}
      {winnerModalData.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-pop">
          <div className="relative w-full max-w-md glass-panel-modal p-6 md:p-8 rounded-[2.5rem] border border-amber-400/50 shadow-[0_0_60px_rgba(245,158,11,0.35)] text-center">
            {/* Sparkle Header Icon */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-amber-500/30 via-orange-500/30 to-rose-500/30 border-2 border-amber-400/60 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] relative">
              <Sparkles className="w-10 h-10 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
              <div className="absolute -top-1.5 -right-1.5">
                <Check className="w-6 h-6 text-emerald-400 bg-slate-900 rounded-full p-1 border border-emerald-400" />
              </div>
            </div>

            <p className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-amber-300 mb-1">
              🎉 Selamat! Siswa Terpilih:
            </p>

            {/* Nama Siswa Terpilih */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-400/40 shadow-inner">
              <h3 className="text-2xl md:text-4xl font-heading text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-300 break-words drop-shadow">
                {winnerModalData.name}
              </h3>
            </div>

            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
              Pilih tindakan lanjutan untuk pengacakan nama berikutnya:
            </p>

            {/* Tombol Aksi Sesuai Kebutuhan Pengguna */}
            <div className="space-y-2.5">
              {/* Tombol Hapus Nama Ini (Sesuai Permintaan) */}
              <button
                type="button"
                onClick={handleRemoveWinnerName}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl transition-all shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base border border-rose-400/40"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>Hapus Nama Ini & Lanjut Memilih</span>
              </button>

              {/* Tombol Tetap Simpan di Roda */}
              <button
                type="button"
                onClick={handleKeepWinnerName}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-xl transition-all border border-slate-600 flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>Tetap Simpan di Roda & Putar Lagi</span>
              </button>

              {/* Pintasan Opsional: Langsung Mainkan */}
              {onStartGame && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveWinnerName();
                      onStartGame(1);
                    }}
                    className="flex-1 py-2 px-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Mulai 1 Pemain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveWinnerName();
                      onStartGame(2);
                    }}
                    className="flex-1 py-2 px-3 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Mulai 2 Pemain</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
