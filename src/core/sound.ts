// Petits sons synthétisés (Web Audio) : pas de fichier à télécharger, marche hors ligne.
// Sur iOS, le son ne démarre qu'après un premier appui : on débloque au premier toucher.

const MUTED_KEY = 'multiapplikation.muted';

let context: AudioContext | undefined;

function audio(): AudioContext | undefined {
  if (typeof AudioContext === 'undefined') return undefined;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

// Préférence de l'appareil, pas de la progression : le localStorage suffit.
export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    if (muted) localStorage.setItem(MUTED_KEY, '1');
    else localStorage.removeItem(MUTED_KEY);
  } catch {
    // Stockage indisponible : le réglage ne dure que le temps de la session.
  }
}

/** À appeler une fois : le premier toucher débloque le son (exigence d'iOS). */
export function unlockAudioOnFirstTouch(): void {
  const unlock = () => {
    audio();
    document.removeEventListener('pointerdown', unlock);
    document.removeEventListener('keydown', unlock);
  };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);
}

interface Note {
  /** Fréquence (Hz). */
  freq: number;
  /** Début, en secondes après maintenant. */
  at: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

function play(notes: Note[]): void {
  if (isMuted()) return;
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.type ?? 'sine';
    osc.frequency.value = note.freq;
    const start = now + note.at;
    const end = start + note.duration;
    // Attaque et fin douces : pas de « clic ».
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(note.volume ?? 0.2, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

// Notes : do5, mi5, sol5, do6…
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.5;

export const sounds = {
  /** Bonne réponse : deux notes qui montent. */
  correct: () =>
    play([
      { freq: E5, at: 0, duration: 0.12, type: 'triangle' },
      { freq: C6, at: 0.08, duration: 0.18, type: 'triangle' },
    ]),
  /** Erreur : une note grave et douce, qui ne gronde pas. */
  wrong: () => play([{ freq: 220, at: 0, duration: 0.25, type: 'sine', volume: 0.15 }]),
  /** Palier de série (5, 10…). */
  streak: () =>
    play([
      { freq: G5, at: 0, duration: 0.1, type: 'triangle' },
      { freq: C6, at: 0.07, duration: 0.1, type: 'triangle' },
      { freq: E6, at: 0.14, duration: 0.2, type: 'triangle' },
    ]),
  /** Fin de série réussie, record, autocollant. */
  win: () =>
    play(
      [C5, E5, G5, C6].map((freq, i) => ({ freq, at: i * 0.11, duration: i === 3 ? 0.45 : 0.16, type: 'triangle' })),
    ),
};
