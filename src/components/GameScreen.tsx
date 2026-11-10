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
  EyeOff,
  Maximize,
  Tv,
  ZoomOut,
  ZoomIn
} from 'lucide-react';
import { Question, PlayerState, GameSettings } from '../types';
import { soundManager } from '../utils/audio';
import { ensureMediaPipeLoaded } from '../utils/mediapipe';

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
  onUpdateSettings?: (newSettings: GameSettings) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameMode,
  questions,
  settings,
  onEndGame,
  onWin,
  onToggleSound,
  onUpdateSettings
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

  // Shuffle helper function (Fisher-Yates)
  const shuffleQuestions = useCallback((arr: Question[]): Question[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);

  // Deck of unasked questions to guarantee zero duplicate questions
  const unusedDeckRef = useRef<Question[]>([]);
  // Set of questions answered in the current session
  const answeredIdsRef = useRef<Set<string | number>>(new Set());

  // Initialize deck with full shuffled questions
  const initDeck = useCallback(() => {
    unusedDeckRef.current = shuffleQuestions(questions);
    answeredIdsRef.current = new Set();
  }, [questions, shuffleQuestions]);

  // Pull next unique question that has not yet appeared
  const getNextUniqueQuestion = useCallback(
    (playerIndex: 1 | 2): Question | null => {
      if (questions.length === 0) {
        return {
          id: 0,
          q: 'Tidak ada soal tersedia',
          l: 'Opsi A',
          r: 'Opsi B',
          a: 'kiri'
        };
      }

      // In 2P mode, avoid question currently displayed by the other player
      const otherQId = playerIndex === 1 ? p2Ref.current.currentQ?.id : p1Ref.current.currentQ?.id;

      // Find first unused question that is not on the other screen
      let targetIdx = unusedDeckRef.current.findIndex((q) => q.id !== otherQId);

      // If unused deck has run out of questions:
      if (targetIdx === -1 && unusedDeckRef.current.length === 0) {
        // All questions in the bank have appeared!
        // If target score requires continuing, reshuffle all questions avoiding current on-screen questions
        const currentP1Id = p1Ref.current.currentQ?.id;
        const currentP2Id = p2Ref.current.currentQ?.id;
        const freshDeck = shuffleQuestions(questions).filter(
          (q) => q.id !== otherQId && q.id !== currentP1Id && q.id !== currentP2Id
        );
        unusedDeckRef.current = freshDeck.length > 0 ? freshDeck : shuffleQuestions(questions);
        targetIdx = unusedDeckRef.current.findIndex((q) => q.id !== otherQId);
      }

      if (targetIdx !== -1) {
        const [picked] = unusedDeckRef.current.splice(targetIdx, 1);
        return picked;
      }

      return questions[0] || null;
    },
    [questions, shuffleQuestions]
  );

  // Load question for player without duplicates
  const loadQuestionForPlayer = useCallback(
    (playerIndex: 1 | 2) => {
      if (!gameActiveRef.current) return;

      const nextQ = getNextUniqueQuestion(playerIndex);
      if (!nextQ) return;

      const setPlayer = playerIndex === 1 ? setP1 : setP2;
      setPlayer((prev) => ({
        ...prev,
        currentQ: nextQ,
        questionNumber: (prev.questionNumber || 0) + 1,
        tiltProgress: 0,
        tiltFrames: 0,
        tiltDirection: null,
        isAnswering: false,
        feedback: null,
        feedbackText: '',
        currentAngle: 0
      }));
    },
    [getNextUniqueQuestion]
  );

  // Initialize questions on mount
  useEffect(() => {
    gameActiveRef.current = true;
    initDeck();
    loadQuestionForPlayer(1);
    if (gameMode === 2) {
      loadQuestionForPlayer(2);
    }
    return () => {
      gameActiveRef.current = false;
    };
  }, [gameMode, initDeck, loadQuestionForPlayer]);

  // Handle Answer
  const handleAnswerSubmit = useCallback(
    (playerIndex: 1 | 2, answer: 'kiri' | 'kanan') => {
      const player = playerIndex === 1 ? p1Ref.current : p2Ref.current;
      if (!player.currentQ || player.isAnswering || !gameActiveRef.current) return;

      if (player.currentQ.id) {
        answeredIdsRef.current.add(player.currentQ.id);
      }

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

      // Win condition:
      // 1. Score reaches target score
      // 2. Or all questions in the bank have been answered without any duplicates left
      const isTargetScoreReached = nextScore >= settings.targetScore;
      const allUniqueQuestionsAnswered =
        questions.length > 0 &&
        unusedDeckRef.current.length === 0 &&
        answeredIdsRef.current.size >= questions.length;

      if (isTargetScoreReached || allUniqueQuestionsAnswered) {
        setTimeout(() => {
          if (gameActiveRef.current) {
            if (gameMode === 2) {
              const p1Score = playerIndex === 1 ? nextScore : p1Ref.current.score;
              const p2Score = playerIndex === 2 ? nextScore : p2Ref.current.score;
              const winner = p1Score >= p2Score ? 1 : 2;
              const finalScore = Math.max(p1Score, p2Score);
              onWin(winner, finalScore);
            } else {
              onWin(playerIndex, nextScore);
            }
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
    [settings.targetScore, questions.length, gameMode, onWin, loadQuestionForPlayer]
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

        // Pastikan modul MediaPipe termuat dari CDN (dengan fallback otomatis)
        const isLoaded = await ensureMediaPipeLoaded();
        if (!isLoaded) {
          throw new Error('Gagal memuat modul kamera MediaPipe dari internet.');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const FaceMeshClass = (window as any).FaceMesh;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const CameraClass = (window as any).Camera;

        if (!FaceMeshClass || !CameraClass) {
          throw new Error('Library MediaPipe tidak tersedia di browser.');
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

  const isLargeScreen = !!settings.largeScreenMode;
  const optFontSize = Math.max(isLargeScreen ? 24 : 16, Math.round(settings.questionFontSize * 0.72));

  const toggleFullscreen = () => {
    soundManager.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const cycleCameraZoom = () => {
    soundManager.playClick();
    if (!onUpdateSettings) return;
    const current = settings.cameraZoom ?? 100;
    // Siklus zoom: 100% -> 85% (Luas) -> 75% (Ultra Luas) -> 115% (Dekat) -> 100%
    let next = 100;
    if (current === 100) next = 85;
    else if (current === 85) next = 75;
    else if (current === 75) next = 115;
    else next = 100;
    onUpdateSettings({ ...settings, cameraZoom: next });
  };

  // Camera Zoom & Transform calculations
  const zoomFactor = (settings.cameraZoom ?? 100) / 100;
  const mirrorX = settings.mirrorCamera ? -1 : 1;
  const cameraTransform = `scale(${mirrorX * zoomFactor}, ${zoomFactor})`;
  const cameraFitClass = settings.cameraFit === 'contain' ? 'object-contain' : 'object-cover';

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
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-85 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: cameraTransform, transformOrigin: 'center center' }}
          className={`w-full h-full ${cameraFitClass} transition-transform duration-300`}
        />
        <canvas
          ref={canvasRef}
          style={{ transform: cameraTransform, transformOrigin: 'center center' }}
          className={`absolute inset-0 w-full h-full pointer-events-none ${cameraFitClass} transition-transform duration-300`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/70" />
      </div>

      {/* Top Header Bar */}
      <header className={`relative z-30 flex items-center justify-between backdrop-blur-md bg-slate-950/50 border-b border-white/10 shrink-0 ${
        isLargeScreen ? 'px-6 md:px-12 py-4' : 'px-4 md:px-8 py-3.5'
      }`}>
        <button
          onClick={() => {
            soundManager.playClick();
            onEndGame();
          }}
          className={`bg-red-600/90 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl shadow-lg border border-red-400/30 flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer ${
            isLargeScreen ? 'py-2.5 px-5 text-base' : 'py-2 px-4 text-sm'
          }`}
        >
          <ArrowLeft className={isLargeScreen ? 'w-5 h-5' : 'w-4 h-4'} /> Keluar
        </button>

        {/* Score Board */}
        <div className="flex items-center gap-3">
          <div className={`font-heading bg-slate-900/90 rounded-2xl border border-yellow-400/40 shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center gap-2 ${
            isLargeScreen ? 'text-2xl md:text-3xl px-8 py-2.5' : 'text-lg md:text-2xl px-6 py-2'
          }`}>
            {gameMode === 1 ? (
              <>
                <span className="text-yellow-400">Skor:</span>
                <span className="text-white font-extrabold">{p1.score}</span>
                <span className="text-gray-400 text-sm md:text-base font-normal">/ {settings.targetScore}</span>
                {questions.length > 0 && (
                  <span className="text-[11px] md:text-xs text-cyan-300 font-bold bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 rounded-full ml-1 hidden sm:inline-block shadow">
                    Soal {Math.min(p1.questionNumber || 1, questions.length)}/{questions.length}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-cyan-400 font-extrabold">P1: {p1.score}</span>
                <span className="text-gray-500 font-normal">|</span>
                <span className="text-yellow-400 text-sm md:text-base">Target {settings.targetScore}</span>
                <span className="text-gray-500 font-normal">|</span>
                <span className="text-emerald-400 font-extrabold">P2: {p2.score}</span>
              </>
            )}
          </div>

          {isLargeScreen && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 text-xs font-bold shadow">
              <Tv className="w-3.5 h-3.5" />
              <span>75" TV Mode</span>
            </span>
          )}
        </div>

        {/* Right utility buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Camera Zoom Button */}
          {onUpdateSettings && (
            <button
              onClick={cycleCameraZoom}
              className={`rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105 shadow ${
                isLargeScreen ? 'p-3 text-sm' : 'p-2.5 text-xs'
              }`}
              title="Atur Zoom Kamera (Klik untuk ganti: Luas 85% / Ultra Luas 75% / Dekat 115% / Normal 100%)"
            >
              {(settings.cameraZoom ?? 100) < 100 ? (
                <ZoomOut className={isLargeScreen ? 'w-5 h-5 text-cyan-400' : 'w-4 h-4 text-cyan-400'} />
              ) : (
                <Camera className={isLargeScreen ? 'w-5 h-5 text-cyan-400' : 'w-4 h-4 text-cyan-400'} />
              )}
              <span className="hidden sm:inline font-bold">
                {(settings.cameraZoom ?? 100) === 100
                  ? 'Zoom: 100%'
                  : `${settings.cameraZoom}% (Luas)`}
              </span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className={`rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-slate-700 cursor-pointer flex items-center gap-1.5 ${
              isLargeScreen ? 'p-3 text-sm' : 'p-2.5 text-xs'
            }`}
            title="Layar Penuh (Fullscreen)"
          >
            <Maximize className={isLargeScreen ? 'w-5 h-5' : 'w-4 h-4'} />
            <span className="hidden xl:inline">Layar Penuh</span>
          </button>

          <button
            onClick={() => setShowKeyHints(!showKeyHints)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 border border-slate-700 text-xs hidden md:flex items-center gap-1.5"
            title="Tampilkan / Sembunyikan Bantuan Tombol"
          >
            <Keyboard className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">{showKeyHints ? 'Sembunyi Tombol' : 'Bantuan Tombol'}</span>
          </button>

          <button
            onClick={onToggleSound}
            className={`rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 border border-slate-700 cursor-pointer ${
              isLargeScreen ? 'p-3' : 'p-2.5'
            }`}
            title={settings.soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {settings.soundEnabled ? (
              <Volume2 className={isLargeScreen ? 'w-5 h-5 text-emerald-400' : 'w-4 h-4 text-emerald-400'} />
            ) : (
              <VolumeX className={isLargeScreen ? 'w-5 h-5 text-gray-400' : 'w-4 h-4 text-gray-400'} />
            )}
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
            className={`w-full glass-panel border border-white/25 relative shadow-2xl transition-all flex flex-col justify-between ${
              isLargeScreen
                ? (gameMode === 1 ? 'max-w-4xl p-6 md:p-10 rounded-[2.5rem]' : 'max-w-2xl p-5 md:p-7 rounded-[2rem]')
                : 'max-w-2xl p-5 md:p-8 rounded-[2rem]'
            }`}
          >
            {/* Player Badge & Tilt Angle HUD */}
            <div className={`flex items-center justify-between ${isLargeScreen ? 'mb-5' : 'mb-4'}`}>
              <span className={`rounded-full font-bold uppercase tracking-wider bg-blue-600/40 border border-blue-400 text-blue-200 shadow-[0_0_15px_rgba(96,165,250,0.3)] flex items-center gap-1.5 ${
                isLargeScreen ? 'px-5 py-1.5 text-sm md:text-base' : 'px-4 py-1 text-xs md:text-sm'
              }`}>
                <span>Pemain 1</span>
                {p1.questionNumber ? (
                  <span className="text-cyan-300 font-mono font-bold">
                    #{p1.questionNumber}
                  </span>
                ) : null}
              </span>

              {/* Head Tilt Angle Badge */}
              <div className={`flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-700 ${
                isLargeScreen ? 'px-4 py-1.5 text-xs md:text-sm' : 'px-3 py-1 text-xs'
              }`}>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-gray-300 font-mono font-bold">
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
              className={`glass-box rounded-3xl mb-5 flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/20 transition-all ${
                isLargeScreen
                  ? 'p-5 md:p-8 min-h-[170px] md:min-h-[220px]'
                  : 'p-4 md:p-6 min-h-[140px] md:min-h-[170px]'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent pointer-events-none" />

              {/* Question Image if present */}
              {p1.currentQ?.image && (
                <div className={`relative z-10 mb-2.5 flex items-center justify-center max-w-full ${
                  isLargeScreen ? 'max-h-48 md:max-h-60' : 'max-h-32 md:max-h-44'
                }`}>
                  <img
                    src={p1.currentQ.image}
                    alt="Gambar Soal"
                    className="max-h-full max-w-full object-contain rounded-2xl border border-white/30 shadow-xl bg-slate-950/60 p-1"
                  />
                </div>
              )}

              <h2
                className="font-bold text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] leading-tight relative z-10 transition-all select-none"
                style={{
                  fontSize: p1.currentQ?.image
                    ? `${Math.max(18, Math.round(settings.questionFontSize * 0.85))}px`
                    : `${settings.questionFontSize}px`
                }}
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
                className={`option-card text-left rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  isLargeScreen ? 'p-5 md:p-7 min-h-[140px]' : 'p-4 md:p-6'
                } ${
                  p1.tiltDirection === 'kiri'
                    ? 'active-tilt-left border-sky-400'
                    : 'glass-box border-white/20 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1 drop-shadow ${
                      isLargeScreen ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                    }`}>
                      👈 Miring Kiri
                    </span>
                    {showKeyHints && (
                      <span className="text-[10px] md:text-xs bg-slate-900/80 text-gray-300 px-2 py-0.5 rounded border border-slate-600 font-bold">
                        Tombol A
                      </span>
                    )}
                  </div>
                  <p
                    className="font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all leading-snug"
                    style={{ fontSize: `${optFontSize}px` }}
                  >
                    {p1.currentQ?.l || 'Opsi Kiri'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className={`w-full bg-black/60 rounded-full overflow-hidden mt-4 border border-white/10 ${
                  isLargeScreen ? 'h-5' : 'h-3.5'
                }`}>
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
                className={`option-card text-left rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  isLargeScreen ? 'p-5 md:p-7 min-h-[140px]' : 'p-4 md:p-6'
                } ${
                  p1.tiltDirection === 'kanan'
                    ? 'active-tilt-right border-emerald-400'
                    : 'glass-box border-white/20 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 drop-shadow ${
                      isLargeScreen ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                    }`}>
                      Miring Kanan 👉
                    </span>
                    {showKeyHints && (
                      <span className="text-[10px] md:text-xs bg-slate-900/80 text-gray-300 px-2 py-0.5 rounded border border-slate-600 font-bold">
                        Tombol D
                      </span>
                    )}
                  </div>
                  <p
                    className="font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all leading-snug"
                    style={{ fontSize: `${optFontSize}px` }}
                  >
                    {p1.currentQ?.r || 'Opsi Kanan'}
                  </p>
                </div>

                {/* Progress bar */}
                <div className={`w-full bg-black/60 rounded-full overflow-hidden mt-4 border border-white/10 ${
                  isLargeScreen ? 'h-5' : 'h-3.5'
                }`}>
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
                  <CheckCircle2 className={`${isLargeScreen ? 'w-28 h-28' : 'w-20 h-20'} text-emerald-400 mb-2 animate-bounce`} />
                ) : (
                  <XCircle className={`${isLargeScreen ? 'w-28 h-28' : 'w-20 h-20'} text-red-400 mb-2 animate-pulse`} />
                )}
                <h3
                  className={`font-heading font-extrabold ${
                    isLargeScreen ? 'text-6xl md:text-8xl' : 'text-5xl md:text-6xl'
                  } ${
                    p1.feedback === 'correct'
                      ? 'text-emerald-400 drop-shadow-[0_0_35px_rgba(52,211,153,0.9)]'
                      : 'text-red-400 drop-shadow-[0_0_35px_rgba(248,113,113,0.9)]'
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
              className={`w-full glass-panel border border-white/25 relative shadow-2xl transition-all flex flex-col justify-between ${
                isLargeScreen
                  ? 'max-w-2xl p-5 md:p-7 rounded-[2rem]'
                  : 'max-w-2xl p-5 md:p-8 rounded-[2rem]'
              }`}
            >
              {/* Player Badge & Tilt Angle HUD */}
              <div className={`flex items-center justify-between ${isLargeScreen ? 'mb-5' : 'mb-4'}`}>
                <span className={`rounded-full font-bold uppercase tracking-wider bg-emerald-600/40 border border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.3)] flex items-center gap-1.5 ${
                  isLargeScreen ? 'px-5 py-1.5 text-sm md:text-base' : 'px-4 py-1 text-xs md:text-sm'
                }`}>
                  <span>Pemain 2</span>
                  {p2.questionNumber ? (
                    <span className="text-emerald-300 font-mono font-bold">
                      #{p2.questionNumber}
                    </span>
                  ) : null}
                </span>

                {/* Head Tilt Angle Badge */}
                <div className={`flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-700 ${
                  isLargeScreen ? 'px-4 py-1.5 text-xs md:text-sm' : 'px-3 py-1 text-xs'
                }`}>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-gray-300 font-mono font-bold">
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
                className={`glass-box rounded-3xl mb-5 flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/20 transition-all ${
                  isLargeScreen
                    ? 'p-5 md:p-8 min-h-[170px] md:min-h-[220px]'
                    : 'p-4 md:p-6 min-h-[140px] md:min-h-[170px]'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

                {/* Question Image if present */}
                {p2.currentQ?.image && (
                  <div className={`relative z-10 mb-2.5 flex items-center justify-center max-w-full ${
                    isLargeScreen ? 'max-h-44 md:max-h-56' : 'max-h-28 md:max-h-40'
                  }`}>
                    <img
                      src={p2.currentQ.image}
                      alt="Gambar Soal"
                      className="max-h-full max-w-full object-contain rounded-2xl border border-white/30 shadow-xl bg-slate-950/60 p-1"
                    />
                  </div>
                )}

                <h2
                  className="font-bold text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] leading-tight relative z-10 transition-all select-none"
                  style={{
                    fontSize: p2.currentQ?.image
                      ? `${Math.max(18, Math.round(settings.questionFontSize * 0.82))}px`
                      : `${settings.questionFontSize}px`
                  }}
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
                  className={`option-card text-left rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isLargeScreen ? 'p-4 md:p-6 min-h-[130px]' : 'p-4 md:p-6'
                  } ${
                    p2.tiltDirection === 'kiri'
                      ? 'active-tilt-left border-sky-400'
                      : 'glass-box border-white/20 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1 drop-shadow ${
                        isLargeScreen ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                      }`}>
                        👈 Miring Kiri
                      </span>
                      {showKeyHints && (
                        <span className="text-[10px] md:text-xs bg-slate-900/80 text-gray-300 px-2 py-0.5 rounded border border-slate-600 font-bold">
                          Panah Kiri
                        </span>
                      )}
                    </div>
                    <p
                      className="font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all leading-snug"
                      style={{ fontSize: `${optFontSize}px` }}
                    >
                      {p2.currentQ?.l || 'Opsi Kiri'}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className={`w-full bg-black/60 rounded-full overflow-hidden mt-4 border border-white/10 ${
                    isLargeScreen ? 'h-5' : 'h-3.5'
                  }`}>
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
                  className={`option-card text-left rounded-3xl border-2 transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isLargeScreen ? 'p-4 md:p-6 min-h-[130px]' : 'p-4 md:p-6'
                  } ${
                    p2.tiltDirection === 'kanan'
                      ? 'active-tilt-right border-emerald-400'
                      : 'glass-box border-white/20 hover:border-slate-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 drop-shadow ${
                        isLargeScreen ? 'text-sm md:text-base' : 'text-xs md:text-sm'
                      }`}>
                        Miring Kanan 👉
                      </span>
                      {showKeyHints && (
                        <span className="text-[10px] md:text-xs bg-slate-900/80 text-gray-300 px-2 py-0.5 rounded border border-slate-600 font-bold">
                          Panah Kanan
                        </span>
                      )}
                    </div>
                    <p
                      className="font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] transition-all leading-snug"
                      style={{ fontSize: `${optFontSize}px` }}
                    >
                      {p2.currentQ?.r || 'Opsi Kanan'}
                    </p>
                  </div>

                  {/* Progress bar */}
                  <div className={`w-full bg-black/60 rounded-full overflow-hidden mt-4 border border-white/10 ${
                    isLargeScreen ? 'h-5' : 'h-3.5'
                  }`}>
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
                    <CheckCircle2 className={`${isLargeScreen ? 'w-28 h-28' : 'w-20 h-20'} text-emerald-400 mb-2 animate-bounce`} />
                  ) : (
                    <XCircle className={`${isLargeScreen ? 'w-28 h-28' : 'w-20 h-20'} text-red-400 mb-2 animate-pulse`} />
                  )}
                  <h3
                    className={`font-heading font-extrabold ${
                      isLargeScreen ? 'text-6xl md:text-8xl' : 'text-5xl md:text-6xl'
                    } ${
                      p2.feedback === 'correct'
                        ? 'text-emerald-400 drop-shadow-[0_0_35px_rgba(52,211,153,0.9)]'
                        : 'text-red-400 drop-shadow-[0_0_35px_rgba(248,113,113,0.9)]'
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
