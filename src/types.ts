export interface Question {
  id: number | string;
  q: string;
  l: string;
  r: string;
  a: 'kiri' | 'kanan';
  category?: string;
}

export interface PlayerState {
  score: number;
  currentQ: Question | null;
  tiltProgress: number; // 0 to 100 percentage
  tiltFrames: number;
  tiltDirection: 'kiri' | 'kanan' | null;
  isAnswering: boolean;
  feedback: 'correct' | 'wrong' | null;
  feedbackText: string;
  currentAngle: number;
}

export interface GameSettings {
  targetScore: number;
  tiltHoldFrames: number; // default ~10 frames
  questionFontSize: number; // default 36px
  soundEnabled: boolean;
  tiltSensitivity: number; // degrees threshold, default 10
  showLandmarks: boolean;
  mirrorCamera: boolean;
  transparencyPercent: number; // default 20% (crystal clear), range 5 - 80%
  enableBlur: boolean; // default false (clear crystal)
}

export type ScreenType = 'menu' | 'game' | 'editor' | 'settings' | 'help';
