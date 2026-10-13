import { Question } from '../types';

export const DEFAULT_QUESTIONS: Question[] = [
  { id: 1, q: 'Apa nama ibukota negara Indonesia?', l: 'Bandung', r: 'Jakarta', a: 'kanan', category: 'IPS' },
  { id: 2, q: 'Berapa hasil dari 7 x 8?', l: '56', r: '54', a: 'kiri', category: 'Matematika' },
  { id: 3, q: 'Hewan mamalia yang bisa terbang?', l: 'Kelelawar', r: 'Burung Hantu', a: 'kiri', category: 'IPA' },
  { id: 4, q: 'Planet terdekat dari matahari?', l: 'Mars', r: 'Merkurius', a: 'kanan', category: 'IPA' },
  { id: 5, q: 'Siapa penemu bola lampu pijar?', l: 'Thomas A. Edison', r: 'Nikola Tesla', a: 'kiri', category: 'Sejarah' }
];
