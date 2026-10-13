/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Question, GameSettings, ScreenType } from './types';
import { DEFAULT_QUESTIONS } from './data/defaultQuestions';
import { MenuScreen } from './components/MenuScreen';
import { GameScreen } from './components/GameScreen';
import { QuestionsScreen } from './components/QuestionsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { HelpScreen } from './components/HelpScreen';
import { WinnerModal } from './components/WinnerModal';
import { ActivationModal } from './components/ActivationModal';
import { soundManager } from './utils/audio';

const STORAGE_KEY_QUESTIONS = 'edutilt_questions_v3';
const STORAGE_KEY_SETTINGS = 'edutilt_settings_v3';
const STORAGE_KEY_LICENSE = 'edutilt_license_v1';

const DEFAULT_SETTINGS: GameSettings = {
  targetScore: 50,
  tiltHoldFrames: 10,
  questionFontSize: 36,
  soundEnabled: true,
  tiltSensitivity: 10,
  showLandmarks: false,
  mirrorCamera: true,
  transparencyPercent: 20, // default 20% (transparan bening), range 5 - 80%
  enableBlur: false // default false (kaca bening tanpa blur)
};

export default function App() {
  const [screen, setScreen] = useState<ScreenType>('menu');
  const [gameMode, setGameMode] = useState<1 | 2>(1);

  // License & Activation State
  const [isFullVersion, setIsFullVersion] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LICENSE);
      return stored === 'full';
    } catch {
      return false;
    }
  });

  // Popup aktivasi selalu tampil di awal jika belum pernah aktivasi penuh atau memilih mode demo
  const [showActivationModal, setShowActivationModal] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LICENSE);
      return stored !== 'full' && stored !== 'demo';
    } catch {
      return true;
    }
  });

  // Questions State
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed reading questions from localStorage', e);
    }
    return DEFAULT_QUESTIONS;
  });

  // Settings State
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed reading settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Winner State
  const [winnerData, setWinnerData] = useState<{
    show: boolean;
    winner: 1 | 2;
    score: number;
  }>({
    show: false,
    winner: 1,
    score: 0
  });

  // Sync sound manager enabled state
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Handler Aktivasi Berhasil
  const handleActivationSuccess = () => {
    setIsFullVersion(true);
    setShowActivationModal(false);
    try {
      localStorage.setItem(STORAGE_KEY_LICENSE, 'full');
    } catch (e) {
      console.error('Failed saving license', e);
    }
  };

  // Handler Masuk Mode Demo
  const handleEnterDemoMode = () => {
    setIsFullVersion(false);
    setShowActivationModal(false);
    try {
      localStorage.setItem(STORAGE_KEY_LICENSE, 'demo');
    } catch (e) {
      console.error('Failed saving demo license', e);
    }
  };

  // Persist Questions
  const handleSaveQuestions = (updated: Question[]) => {
    setQuestions(updated);
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save questions to localStorage', e);
    }
  };

  const handleResetQuestions = () => {
    const freshDefaults: Question[] = DEFAULT_QUESTIONS.map((q, idx) => ({
      id: idx + 1,
      q: q.q,
      l: q.l,
      r: q.r,
      a: q.a,
      category: q.category || 'Umum'
    }));
    setQuestions(freshDefaults);
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(freshDefaults));
    } catch (e) {
      console.error('Failed to reset questions in localStorage', e);
    }
  };

  // Persist Settings
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  };

  const toggleSound = () => {
    const nextVal = !settings.soundEnabled;
    handleUpdateSettings({ ...settings, soundEnabled: nextVal });
  };

  // Start Game
  const handleStartGame = (mode: 1 | 2) => {
    // Di mode demo, hanya 1 pemain yang diizinkan
    if (!isFullVersion && mode === 2) {
      setShowActivationModal(true);
      return;
    }
    setGameMode(mode);
    setWinnerData({ show: false, winner: 1, score: 0 });
    setScreen('game');
  };

  // Win Trigger
  const handleGameWin = (winner: 1 | 2, finalScore: number) => {
    setWinnerData({
      show: true,
      winner,
      score: finalScore
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center p-4">
      {/* Dynamic Background subtle glowing orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Screen Routing */}
      {screen === 'menu' && (
        <MenuScreen
          questionCount={questions.length}
          soundEnabled={settings.soundEnabled}
          isFullVersion={isFullVersion}
          onToggleSound={toggleSound}
          onStartGame={handleStartGame}
          onOpenQuestions={() => {
            if (!isFullVersion) {
              setShowActivationModal(true);
              return;
            }
            setScreen('editor');
          }}
          onOpenSettings={() => {
            if (!isFullVersion) {
              setShowActivationModal(true);
              return;
            }
            setScreen('settings');
          }}
          onOpenHelp={() => setScreen('help')}
          onOpenActivation={() => setShowActivationModal(true)}
        />
      )}

      {screen === 'editor' && (
        <QuestionsScreen
          questions={questions}
          onSaveQuestions={handleSaveQuestions}
          onResetQuestions={handleResetQuestions}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'help' && <HelpScreen onBack={() => setScreen('menu')} />}

      {screen === 'game' && (
        <GameScreen
          gameMode={gameMode}
          questions={questions}
          settings={settings}
          onEndGame={() => setScreen('menu')}
          onWin={handleGameWin}
          onToggleSound={toggleSound}
        />
      )}

      {/* Winner Celebration Modal */}
      {winnerData.show && (
        <WinnerModal
          winner={winnerData.winner}
          score={winnerData.score}
          gameMode={gameMode}
          onPlayAgain={() => {
            setWinnerData({ show: false, winner: 1, score: 0 });
            setScreen('game');
          }}
          onGoHome={() => {
            setWinnerData({ show: false, winner: 1, score: 0 });
            setScreen('menu');
          }}
        />
      )}

      {/* Popup Aktivasi Kode Lisensi */}
      <ActivationModal
        isOpen={showActivationModal}
        canClose={isFullVersion || localStorage.getItem(STORAGE_KEY_LICENSE) === 'demo'}
        onActivateSuccess={handleActivationSuccess}
        onEnterDemoMode={handleEnterDemoMode}
        onClose={() => setShowActivationModal(false)}
      />
    </div>
  );
}
