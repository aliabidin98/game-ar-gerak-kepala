import { Question } from '../types';

export const DEFAULT_QUESTIONS: Question[] = [
  { id: 1, q: 'Apa nama ibukota negara Indonesia?', l: 'Bandung', r: 'Jakarta', a: 'kanan', category: 'IPS' },
  { id: 2, q: 'Berapa hasil dari 7 x 8?', l: '56', r: '54', a: 'kiri', category: 'Matematika' },
  { id: 3, q: 'Hewan mamalia yang bisa terbang?', l: 'Kelelawar', r: 'Burung Hantu', a: 'kiri', category: 'IPA' },
  {
    id: 4,
    q: 'Planet terdekat dari matahari?',
    l: 'Mars',
    r: 'Merkurius',
    a: 'kanan',
    category: 'IPA',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120"><defs><radialGradient id="sun" cx="15%" cy="50%" r="50%"><stop offset="0%" stop-color="%23ffdd00"/><stop offset="100%" stop-color="%23ff5500"/></radialGradient><radialGradient id="planet" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="%23fed7aa"/><stop offset="100%" stop-color="%23ea580c"/></radialGradient></defs><rect width="200" height="120" rx="16" fill="%230f172a"/><circle cx="10" cy="60" r="45" fill="url(%23sun)"/><circle cx="115" cy="60" r="22" fill="url(%23planet)"/><ellipse cx="115" cy="60" rx="36" ry="9" fill="none" stroke="%23fb923c" stroke-width="2" stroke-dasharray="3 3"/><circle cx="165" cy="30" r="1.5" fill="%23ffffff"/><circle cx="180" cy="85" r="2" fill="%23ffffff"/><circle cx="70" cy="25" r="1.5" fill="%23fde047"/></svg>'
  },
  {
    id: 5,
    q: 'Siapa penemu bola lampu pijar?',
    l: 'Thomas A. Edison',
    r: 'Nikola Tesla',
    a: 'kiri',
    category: 'Sejarah',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120"><defs><linearGradient id="glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23fef08a"/><stop offset="100%" stop-color="%23eab308"/></linearGradient></defs><rect width="200" height="120" rx="16" fill="%230f172a"/><circle cx="100" cy="50" r="28" fill="url(%23glow)"/><path d="M92 76h16v8h-16z" fill="%2394a3b8"/><path d="M94 84h12v4h-12z" fill="%2364748b"/><path d="M96 88h8v3h-8z" fill="%23475569"/><path d="M100 18v-8M70 28l-6-6M130 28l6-6M60 50h-8M148 50h-8" stroke="%23fde047" stroke-width="2.5" stroke-linecap="round"/></svg>'
  }
];
