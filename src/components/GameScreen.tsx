import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Camera,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  Keyboard,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Question, PlayerState, GameSettings } from '../types';
import { soundManager } from '../utils/audio';

// Landmark indexes from MediaPipe FaceMesh
const NOSE_TIP = 1;
const TOP_HEAD = 10;
const BOTTOM_CHIN = 152;

interface GameScreenProps {
  gameMode: 1 | 2;
  questions: Question[];
  settings: GameSettings;
  onEndGame: () => void;
  onWin: (winner: 1 | 2, finalScore: number) => void;
  onToggleSound: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameMode,
  questions,
  settings,
  onEndGame,
  onWin,
  onToggleSound
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [aiActive, setAiActive] = useState(false);
  const [showKeyHints, setShowKeyHints] = useState(true);

  // Player States
  const [p1, setP1] = useState<PlayerState>({
    score: 0,
    currentQ: null,
    tiltProgress: 0,
    tiltFrames: 0,
    tiltDirection: null,
    isAnswering: false,
    feedback: null,
    feedbackText: '',
    currentAngle: 0
  });

  const [p2, setP2] = useState<PlayerState>({
    score: 0,
    currentQ: null,
    tiltProgress: 0,
    tiltFrames: 0,
    tiltDirection: null,
    isAnswering: false,
    feedback: null,
    feedbackText: '',
    currentAngle: 0
  });

  // Keep refs for loop logic
  const p1Ref = useRef(p1);
  const p2Ref = useRef(p2);
  const gameActiveRef = useRef(true);

  useEffect(() => {
    p1Ref.current = p1;
  }, [p1]);

  useEffect(() => {
    p2Ref.current = p2;
  }, [p2]);

  // Pick random question avoiding duplicates when possible
  const getRandomQuestion = useCallback(
    (currentId?: number | string): Question => {
      if (questions.length === 0) {
        return {
          id: 0,
          q: 'Tidak ada soal tersedia',
          l: 'Opsi A',
          r: 'Opsi B',
          a: 'kiri'
        };
      }
      if (questions.length === 1) return questions[0];
      const available = questions.filter((q) => q.id !== currentId);
      const pool = available.length > 0 ? available : questions;
      return pool[Math.floor(Math.random() * pool.length)];
    },
    [questions]
  );

  // Load question for player
  const loadQuestionForPlayer = useCallback(
    (playerIndex: 1 | 2) => {
      if (!gameActiveRef.current) return;

      if (playerIndex === 1) {
        const nextQ = getRandomQuestion(p1Ref.current.currentQ?.id);
        setP1((prev) => ({
          ...prev,
          currentQ: nextQ,
          tiltProgress: 0,
          tiltFrames: 0,
          tiltDirection: null,
          isAnswering: false,
          feedback: null,
          feedbackText: '',
          currentAngle: 0
        }));
      } else {
        const nextQ = getRandomQuestion(p2Ref.current.currentQ?.id);
        setP2((prev) => ({
          ...prev,
          currentQ: nextQ,
          tiltProgress: 0,
          tiltFrames: 0,
          tiltDirection: null,
          isAnswering: false,
          feedback: null,
          feedbackText: '',
          currentAngle: 0
        }));
      }
    },
    [getRandomQuestion]
  );

  // Initialize questions on mount
  useEffect(() => {
    gameActiveRef.current = true;
    loadQuestionForPlayer(1);
    if (gameMode === 2) {
      loadQuestionForPlayer(2);
    }
    return () => {
      gameActiveRef.current = false;
    };
  }, [gameMode, loadQuestionForPlayer]);

  // Handle Answer
  const handleAnswerSubmit = useCallback(
    (playerIndex: 1 | 2, answer: 'kiri' | 'kanan') => {
      const player = playerIndex === 1 ? p1Ref.current : p2Ref.current;
      if (!player.currentQ || player.isAnswering || !gameActiveRef.current) return;

      const isCorrect = player.currentQ.a === answer;
      const nextScore = isCorrect ? player.score + 10 : player.score;

      if (isCorrect) {
        soundManager.playCorrect();
      } else {
        soundManager.playWrong();
      }

      const updateState = (prev: PlayerState): PlayerState => ({
        ...prev,
        isAnswering: true,
        score: nextScore,
        feedback: isCorrect ? 'correct' : 'wrong',
        feedbackText: isCorrect ? 'BENAR! 🎉' : 'SALAH! ❌'
      });

      if (playerIndex === 1) {
        setP1(updateState);
      } else {
        setP2(updateState);
      }

      // Check win condition
      if (nextScore >= settings.targetScore) {
        setTimeout(() => {
          if (gameActiveRef.current) {
            onWin(playerIndex, nextScore);
          }
        }, 700);
        return;
      }

      // Next question after timeout
      setTimeout(() => {
        if (gameActiveRef.current) {
          loadQuestionForPlayer(playerIndex);
        }
      }, 1200);
    },
    [settings.targetScore, onWin, loadQuestionForPlayer]
  );

  // Process head tilt calculation for single face
  const processFaceTilt = useCallback(
    (landmarks: Array<{ x: number; y: number; z: number }>, playerIndex: 1 | 2) => {
      const player = playerIndex === 1 ? p1Ref.current : p2Ref.current;
      if (!player || player.isAnswering || !landmarks[TOP_HEAD] || !landmarks[BOTTOM_CHIN]) return;

      const top = landmarks[TOP_HEAD];
      const chin = landmarks[BOTTOM_CHIN];

      const dx = top.x - chin.x;
      const dy = top.y - chin.y;

      // Calculate tilt angle in degrees
      const angle = Math.atan2(dx, -dy) * (180 / Math.PI);
      const roundedAngle = Math.round(angle);

      let tiltDir: 'kiri' | 'kanan' | null = null;
      if (angle > settings.tiltSensitivity) {
        tiltDir = 'kiri';
      } else if (angle < -settings.tiltSensitivity) {
        tiltDir = 'kanan';
      }

      const setPlayer = playerIndex === 1 ? setP1 : setP2;

      setPlayer((prev) => {
        if (prev.isAnswering) return prev;

        let nextFrames = prev.tiltFrames;
        let nextDir = prev.tiltDirection;

        if (tiltDir !== null && tiltDir === prev.tiltDirection) {
          nextFrames += 1;
        } else if (tiltDir !== null) {
          nextDir = tiltDir;
          nextFrames = 1;
          soundManager.playTiltTick();
        } else {
          nextDir = null;
          nextFrames = 0;
        }

        const progressPercent = Math.min(
          100,
          Math.round((nextFrames / settings.tiltHoldFrames) * 100)
        );

        if (nextFrames >= settings.tiltHoldFrames && nextDir) {
          // Trigger lock-in
          setTimeout(() => {
            handleAnswerSubmit(playerIndex, nextDir as 'kiri' | 'kanan');
          }, 0);
        }

        return {
          ...prev,
          currentAngle: roundedAngle,
          tiltDirection: nextDir,
          tiltFrames: nextFrames,
          tiltProgress: progressPercent
        };
      });
    },
    [settings.tiltSensitivity, settings.tiltHoldFrames, handleAnswerSubmit]
  );

  // Setup Camera and MediaPipe FaceMesh
  useEffect(() => {
    let cameraInstance: { start: () => Promise<void>; stop: () => void } | null = null;

    const setupAI = async () => {
      try {
        setCameraLoading(true);
        setCameraError(null);

        // Check if browser mediaDevices is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser ini tidak mendukung akses webcam.');
        }

        // Wait a tick for DOM video
        const video = videoRef.current;
        if (!video) return;

        // Check if MediaPipe FaceMesh is in global scope
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FaceMeshClass = (window as any).FaceMesh;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const CameraClass = (window as any).Camera;

        if (!FaceMeshClass || !CameraClass) {
          console.warn('MediaPipe library is still loading from CDN, will retry in 1s...');
          setTimeout(setupAI, 1000);
          return;
        }

        const faceMesh = new FaceMeshClass({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 2,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results: { multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>> }) => {
          if (!gameActiveRef.current) return;
          const faces = results.multiFaceLandmarks;

          // Draw landmarks on canvas if enabled
          const canvas = canvasRef.current;
          if (canvas && video) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              if (settings.showLandmarks && faces && faces.length > 0) {
                faces.forEach((f, idx) => {
                  const top = f[TOP_HEAD];
                  const chin = f[BOTTOM_CHIN];
                  if (top && chin) {
                    const x1 = top.x * canvas.width;
                    const y1 = top.y * canvas.height;
                    const x2 = chin.x * canvas.width;
                    const y2 = chin.y * canvas.height;

                    ctx.strokeStyle = idx === 0 ? '#38bdf8' : '#34d399';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();

                    // Points
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(x1, y1, 5, 0, 2 * Math.PI);
                    ctx.arc(x2, y2, 5, 0, 2 * Math.PI);
                    ctx.fill();
                  }
                });
              }
            }
          }

          if (!faces || faces.length === 0) return;

          setAiActive(true);

          if (gameMode === 1) {
            if (faces[0]) {
              processFaceTilt(faces[0], 1);
            }
          } else {
            // 2 Players Mode: Split Screen Left vs Right
            let leftFace = null;
            let rightFace = null;

            if (faces.length === 1 && faces[0][NOSE_TIP]) {
              // With mirrored camera: x > 0.5 is left in physical mirror, or standard
              const cx = faces[0][NOSE_TIP].x;
              if (cx > 0.5) leftFace = faces[0];
              else rightFace = faces[0];
            } else if (faces.length >= 2 && faces[0][NOSE_TIP] && faces[1][NOSE_TIP]) {
              const c0 = faces[0][NOSE_TIP].x;
              const c1 = faces[1][NOSE_TIP].x;
              if (c0 > c1) {
                leftFace = faces[0];
                rightFace = faces[1];
              } else {
                leftFace = faces[1];
                rightFace = faces[0];
              }
            }

            if (leftFace) processFaceTilt(leftFace, 1);
            if (rightFace) processFaceTilt(rightFace, 2);
          }
        });

        cameraInstance = new CameraClass(video, {
          onFrame: async () => {
            if (gameActiveRef.current && video) {
              await faceMesh.send({ image: video });
            }
          },
          width: 640,
          height: 480
        });

        if (cameraInstance) {
          await cameraInstance.start();
        }
        setCameraLoading(false);
      } catch (err: unknown) {
        console.error('Failed to initialize webcam AR:', err);
        const errMsg = err instanceof Error ? err.message : 'Izin kamera ditolak atau tidak dapat diakses.';
        setCameraError(errMsg);
        setCameraLoading(false);
      }
    };

    setupAI();

    return () => {
      try {
        if (cameraInstance) {
          cameraInstance.stop();
        }
      } catch (e) {
        console.error('Cleanup camera error', e);
      }
    };
  }, [gameMode, settings.showLandmarks, processFaceTilt]);

  // Keyboard navigation support for quick play / fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameActiveRef.current) return;
      const key = e.key.toLowerCase();

      // Player 1 controls: 'a' (kiri) / 'd' (kanan)
      if (key === 'a') {
        handleAnswerSubmit(1, 'kiri');
      } else if (key === 'd') {
        handleAnswerSubmit(1, 'kanan');
      }

      // Player 2 controls: ArrowLeft (kiri) / ArrowRight (kanan)
      if (gameMode === 2) {
        if (key === 'arrowleft') {
          handleAnswerSubmit(2, 'kiri');
        } else if (key === 'arrowright') {
          handleAnswerSubmit(2, 'kanan');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, handleAnswerSubmit]);

  const optFontSize = Math.max(16, Math.round(settings.questionFontSize * 0.72));

  // Dynamic Crystal Clear Transparency Styles
  const panelOpacity = Math.max(0.06, Math.min(0.85, (settings.transparencyPercent ?? 20) / 100));
  const boxOpacity = Math.max(0.04, Math.min(0.85, (settings.transparencyPercent ?? 20) / 100));
  const blurValue = settings.enableBlur ? 'blur(10px)' : 'none';

  const panelGlassStyle: React.CSSProperties = {
    backgroundColor: `rgba(15, 23, 42, ${Math.min(0.35, panelOpacity * 1.15)})`,
    backdropFilter: blurValue,
    WebkitBackdropFilter: blurValue
  };

  const questionBoxStyle: React.CSSProperties = {
    backgroundColor: `rgba(15, 23, 42, ${boxOpacity})`,
    backdropFilter: blurValue,
    WebkitBackdropFilter: blurValue
  };

  const getOptionCardStyle = (isActive: boolean, activeColor: 'sky' | 'emerald'): React.CSSProperties => {
    if (isActive) {
      const rgb = activeColor === 'sky' ? '14, 165, 233' : '16, 185, 129';
      return {
        backgroundColor: `rgba(${rgb}, ${Math.max(0.24, boxOpacity * 1.35)})`,
        backdropFilter: blurValue,
        WebkitBackdropFilter: blurValue
      };
    }
    return {
      backgroundColor: `rgba(15, 23, 42, ${boxOpacity})`,
      backdropFilter: blurValue,
      WebkitBackdropFilter: blurValue
    };
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-950 flex flex-col">
      {/* Background Webcam Feed */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-85">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${settings.mirrorCamera ? 'scale-x-[-1]' : ''}`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${settings.mirrorCamera ? 'scale-x-[-1]' : ''}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/70" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 md:px-8 py-3.5 backdrop-blur-md bg-slate-950/50 border-b border-white/10 shrink-0">
        <button
          onClick={() => {
            soundManager.playClick();
            onEndGame();
          }}
          className="py-2 px-4 bg-red-600/90 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl shadow-lg border border-red-400/30 flex items-center gap-2 text-sm transition-transform hover:scale-105 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Keluar
        </button>

        {/* Score Board */}
        <div className="flex items-center gap-3">
          <div className="font-heading text-lg md:text-2xl bg-slate-900/90 px-6 py-2 rounded-2xl border border-yellow-400/40 shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center gap-2">
            {gameMode === 1 ? (
              <>
                <span className="text-yellow-400">Skor:</span>
                <span className="text-white">{p1.score}</span>
                <span className="text-gray-400 text-sm md:text-base font-normal">/ {settings.targetScore}</span>
              </>
            ) : (
              <>
                <span className="text-cyan-400">P1: {p1.score}</span>
                <span className="text-gray-500 font-normal">|</span>
                <span className="text-yellow-400 text-sm md:text-base">Target {settings.targetScore}</span>
                <span className="text-gray-500 font-normal">|</span>
                <span className="text-emerald-400">P2: {p2.score}</span>
              </>
            )}
          </div>
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyHints(!showKeyHints)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 border border-slate-700 text-xs hidden md:flex items-center gap-1.5"
            title="Tampilkan / Sembunyikan Bantuan Tombol"
          >
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">{showKeyHints ? 'Sembunyi Tombol' : 'Bantuan Tombol'}</span>
          </button>

          <button
            onClick={onToggleSound}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 border border-slate-700 cursor-pointer"
            title={settings.soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
          </button>
        </div>
      </header>

      {/* Camera Loading Overlay */}
      {cameraLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md px-6 text-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <div
              className="absolute inset-2 border-4 border-emerald-500/20 border-b-emerald-400 rounded-full animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.4s' }}
            />
            <Camera className="w-8 h-8 text-cyan-300 absolute inset-0 m-auto" />
          </div>
          <h3 className="text-2xl md:text-3xl font-heading text-white mb-2">
            Menyiapkan Kamera & AI Pelacak Wajah...
          </h3>
          <p className="text-gray-300 max-w-md text-sm md:text-base leading-relaxed">
            Mohon izinkan akses kamera pada browser Anda. Posisi kepala akan dideteksi secara otomatis dan aman di perangkat Anda.
          </p>
        </div>
      )}

      {/* Camera Error / Permission Blocked Banner */}
      {cameraError && (
        <div className="relative z-30 mx-4 mt-3 p-3.5 bg-amber-950/80 border border-amber-500/50 rounded-2xl flex items-center justify-between gap-3 text-xs md:text-sm text-amber-200 shadow-xl">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              Kamera tidak dapat aktif ({cameraError}). Anda tetap bisa bermain dengan mengklik tombol pilihan atau menggunakan keyboard (<b>[A] / [D]</b> untuk P1, <b>[←] / [→]</b> untuk P2).
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shrink-0 text-xs"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Main Game Playing Area */}
      <main className="relative z-20 flex-1 flex flex-col md:flex-row items-stretch justify-center p-3 md:p-6 gap-4 md:gap-8 overflow-hidden min-h-0">
        {/* ================= PLAYER 1 AREA ================= */}
        <section
          className={`flex-1 flex flex-col items-center justify-center relative min-h-0 ${
            p1.tiltDirection === 'kiri'
              ? 'tilt-left-anim'
              : p1.tiltDirection === 'kanan'
              ? 'tilt-right-anim'
              : 'tilt-neutral'
          }`}
        >
          <div
            style={panelGlassStyle}
            className="w-full max-w-2xl glass-panel p-5 md:p-8 rounded-[2rem] flex flex-col justify-between border border-white/25 relative shadow-2xl transition-all"
          >
            {/* Player Badge & Tilt Angle HUD */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-4 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider bg-blue-600/40 border border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                Pemain 1
              </span>

              {/* Head Tilt Angle Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-gray-300 font-mono">
                  {p1.tiltDirection === 'kiri'
                    ? `👈 Miring Kiri (${Math.abs(p1.currentAngle)}°)`
                    : p1.tiltDirection === 'kanan'
                    ? `👉 Miring Kanan (${Math.abs(p1.currentAngle)}°)`
                    : `Tegak (${p1.currentAngle}°)`}
                </span>
              </div>
            </div>

            {/* Question Card */}
            <div
              style={questionBoxStyle}
              className="glass-box p-5 md:p-8 rounded-3xl mb-5 min-h-[140px] md:min-h-[160px] flex items-center justify-center text-center relative overflow-hidden border border-white/20 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none" />
              <h2
                className="font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-tight relative z-10 transition-all select-none"
                style={{ fontSize: `${settings.questionFontSize}px` }}
              >
                {p1.currentQ?.q || 'Memuat soal...'}
              </h2>
            </div>

            {/* 2 Options (Left and Right) */}
            <div className="grid grid-cols-2 gap-3 md:gap-5 w-full">
              {/* Option Left */}
              <button
                type="button"
                onClick={() => handleAnswerSubmit(1, 'kiri')}
                disabled={p1.isAnswering}
                style={getOptionCardStyle(p1.tiltDirection === 'kiri', 'sky')}
                className={`option-card text-left p-4 md:p-6 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  p1.tiltDirection === 'kiri'
                    ? 'active-tilt-left border-sky-400'
                    : 'glass-box border-white/20 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1 drop-shadow">
                      👈 Miring Kiri
                    </span>
                    {showKeyHints && (
                      <span className="text-[10px] bg-slate-900/80 text-gray-300 px-1.5 py-0.5 rounded border border-slate-600">
                        Tombol A
                      </span>
                    )}
                  </div>
                  <p
                    className="font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all"
                    style={{ fontSize: `${optFontSize}px` }}
                  >
                    {p1.currentQ?.l || 'Opsi Kiri'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3.5 bg-black/60 rounded-full overflow-hidden mt-4 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all duration-75 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                    style={{
                      width: `${p1.tiltDirection === 'kiri' ? p1.tiltProgress : 0}%`
                    }}
                  />
                </div>
              </button>

              {/* Option Right */}
              <button
                type="button"
                onClick={() => handleAnswerSubmit(1, 'kanan')}
                disabled={p1.isAnswering}
                style={getOptionCardStyle(p1.tiltDirection === 'kanan', 'emerald')}
                className={`option-card text-left p-4 md:p-6 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  p1.tiltDirection === 'kanan'
                    ? 'active-tilt-right border-emerald-400'
                    : 'glass-box border-white/20 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 drop-shadow">
                      Miring Kanan 👉
                    </span>
                    {showKeyHints && (
                      <span className="text-[10px] bg-slate-900/80 text-gray-300 px-1.5 py-0.5 rounded border border-slate-600">
                        Tombol D
                      </span>
                    )}
                  </div>
                  <p
                    className="font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all"
                    style={{ fontSize: `${optFontSize}px` }}
                  >
                    {p1.currentQ?.r || 'Opsi Kanan'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3.5 bg-black/60 rounded-full overflow-hidden mt-4 border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-75 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                    style={{
                      width: `${p1.tiltDirection === 'kanan' ? p1.tiltProgress : 0}%`
                    }}
                  />
                </div>
              </button>
            </div>

            {/* Answer Feedback Overlay P1 */}
            {p1.isAnswering && (
              <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 rounded-[2rem] border border-white/20 animate-pop">
                {p1.feedback === 'correct' ? (
                  <CheckCircle2 className="w-20 h-20 text-emerald-400 mb-2 animate-bounce" />
                ) : (
                  <XCircle className="w-20 h-20 text-red-400 mb-2 animate-pulse" />
                )}
                <h3
                  className={`text-5xl md:text-6xl font-heading ${
                    p1.feedback === 'correct'
                      ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.8)]'
                      : 'text-red-400 drop-shadow-[0_0_25px_rgba(248,113,113,0.8)]'
                  }`}
                >
                  {p1.feedbackText}
                </h3>
              </div>
            )}
          </div>
        </section>

        {/* ================= SPLIT SCREEN DIVIDER ================= */}
        {gameMode === 2 && (
          <div className="hidden md:block w-1.5 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent rounded-full shadow-[0_0_15px_rgba(34,211,238,0.5)] self-stretch" />
        )}

        {/* ================= PLAYER 2 AREA (2P MODE) ================= */}
        {gameMode === 2 && (
          <section
            className={`flex-1 flex flex-col items-center justify-center relative min-h-0 ${
              p2.tiltDirection === 'kiri'
                ? 'tilt-left-anim'
                : p2.tiltDirection === 'kanan'
                ? 'tilt-right-anim'
                : 'tilt-neutral'
            }`}
          >
            <div
              style={panelGlassStyle}
              className="w-full max-w-2xl glass-panel p-5 md:p-8 rounded-[2rem] flex flex-col justify-between border border-white/25 relative shadow-2xl transition-all"
            >
              {/* Player Badge & Tilt Angle HUD */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-4 py-1 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider bg-emerald-600/40 border border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                  Pemain 2
                </span>

                {/* Head Tilt Angle Badge */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-gray-300 font-mono">
                    {p2.tiltDirection === 'kiri'
                      ? `👈 Miring Kiri (${Math.abs(p2.currentAngle)}°)`
                      : p2.tiltDirection === 'kanan'
                      ? `👉 Miring Kanan (${Math.abs(p2.currentAngle)}°)`
                      : `Tegak (${p2.currentAngle}°)`}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <div
                style={questionBoxStyle}
                className="glass-box p-5 md:p-8 rounded-3xl mb-5 min-h-[140px] md:min-h-[160px] flex items-center justify-center text-center relative overflow-hidden border border-white/20 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
                <h2
                  className="font-bold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] leading-tight relative z-10 transition-all select-none"
                  style={{ fontSize: `${settings.questionFontSize}px` }}
                >
                  {p2.currentQ?.q || 'Memuat soal...'}
                </h2>
              </div>

              {/* 2 Options (Left and Right) */}
              <div className="grid grid-cols-2 gap-3 md:gap-5 w-full">
                {/* Option Left */}
                <button
                  type="button"
                  onClick={() => handleAnswerSubmit(2, 'kiri')}
                  disabled={p2.isAnswering}
                  style={getOptionCardStyle(p2.tiltDirection === 'kiri', 'sky')}
                  className={`option-card text-left p-4 md:p-6 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    p2.tiltDirection === 'kiri'
                      ? 'active-tilt-left border-sky-400'
                      : 'glass-box border-white/20 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1 drop-shadow">
                        👈 Miring Kiri
                      </span>
                      {showKeyHints && (
                        <span className="text-[10px] bg-slate-900/80 text-gray-300 px-1.5 py-0.5 rounded border border-slate-600">
                          Panah Kiri
                        </span>
                      )}
                    </div>
                    <p
                      className="font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all"
                      style={{ fontSize: `${optFontSize}px` }}
                    >
                      {p2.currentQ?.l || 'Opsi Kiri'}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-3.5 bg-black/60 rounded-full overflow-hidden mt-4 border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all duration-75 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                      style={{
                        width: `${p2.tiltDirection === 'kiri' ? p2.tiltProgress : 0}%`
                      }}
                    />
                  </div>
                </button>

                {/* Option Right */}
                <button
                  type="button"
                  onClick={() => handleAnswerSubmit(2, 'kanan')}
                  disabled={p2.isAnswering}
                  style={getOptionCardStyle(p2.tiltDirection === 'kanan', 'emerald')}
                  className={`option-card text-left p-4 md:p-6 rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    p2.tiltDirection === 'kanan'
                      ? 'active-tilt-right border-emerald-400'
                      : 'glass-box border-white/20 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 drop-shadow">
                        Miring Kanan 👉
                      </span>
                      {showKeyHints && (
                        <span className="text-[10px] bg-slate-900/80 text-gray-300 px-1.5 py-0.5 rounded border border-slate-600">
                          Panah Kanan
                        </span>
                      )}
                    </div>
                    <p
                      className="font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all"
                      style={{ fontSize: `${optFontSize}px` }}
                    >
                      {p2.currentQ?.r || 'Opsi Kanan'}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-3.5 bg-black/60 rounded-full overflow-hidden mt-4 border border-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-75 shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                      style={{
                        width: `${p2.tiltDirection === 'kanan' ? p2.tiltProgress : 0}%`
                      }}
                    />
                  </div>
                </button>
              </div>

              {/* Answer Feedback Overlay P2 */}
              {p2.isAnswering && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-950/90 rounded-[2rem] border border-white/20 animate-pop">
                  {p2.feedback === 'correct' ? (
                    <CheckCircle2 className="w-20 h-20 text-emerald-400 mb-2 animate-bounce" />
                  ) : (
                    <XCircle className="w-20 h-20 text-red-400 mb-2 animate-pulse" />
                  )}
                  <h3
                    className={`text-5xl md:text-6xl font-heading ${
                      p2.feedback === 'correct'
                        ? 'text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.8)]'
                        : 'text-red-400 drop-shadow-[0_0_25px_rgba(248,113,113,0.8)]'
                    }`}
                  >
                    {p2.feedbackText}
                  </h3>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Floating Status Indicator */}
      <footer className="relative z-30 pb-3 pt-1 px-4 flex items-center justify-between text-xs text-gray-400 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-700/60 shadow">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              aiActive ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] animate-pulse' : 'bg-yellow-400'
            }`}
          />
          <span className="font-semibold text-gray-300">
            {aiActive ? 'AI Melacak Gerak Wajah' : 'Mendeteksi Wajah...'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-gray-400 text-[11px] font-bold pointer-events-auto">
          <span>Game AR Gerak Kepala • M. Nur Ali Abidin, S.Pd.</span>
          <span className="text-gray-600">|</span>
          <a
            href="https://instagram.com/aliabidin988"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-300 transition-colors"
          >
            IG: @aliabidin988
          </a>
          <span className="text-gray-600">•</span>
          <a
            href="https://www.tiktok.com/@aliabidin98"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            TT: @aliabidin98
          </a>
        </div>
      </footer>
    </div>
  );
};
