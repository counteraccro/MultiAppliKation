// Progression de l'activité « ceintures » dans un profil : par matière, les ceintures
// obtenues et leur date (« obtenue le 25/10 »), comme dans le classeur.

import { readStickers, type WithStickers } from '../../core/stickers';
import { BELTS, type BeltId } from './belts';
import { SUBJECTS, type Subject, type SubjectId } from './subjects';
import { isPassing } from './test-session';

export interface SubjectProgress {
  /** Ceintures obtenues en classe (cochées par un adulte), avec le jour : { "blanche": "2026-10-25" }. */
  passed: Partial<Record<BeltId, string>>;
  /** Entraînement en conditions réelles réussi, avec le jour : l'enfant peut passer la ceinture en classe. */
  passedTest?: Partial<Record<BeltId, string>>;
  /** Phrases du dernier entraînement fini, par ceinture : le test en choisit d'autres. */
  lastPractice?: Partial<Record<BeltId, string[]>>;
  /** Test raté, avec le jour : il faut un entraînement avant de le repasser. */
  failedTest?: Partial<Record<BeltId, string>>;
  /** Pour « Mes progrès » : entraînements et tests de chaque ceinture. */
  stats?: Partial<Record<BeltId, BeltStats>>;
}

/** Un score : trous justes sur trous. */
export interface Score {
  correct: number;
  total: number;
}

export interface BeltStats {
  /** Entraînements finis, et le meilleur. */
  practices: number;
  bestPractice?: Score;
  /** Entraînements réussis (au moins 90 % du premier coup) : à partir de 3, l'enfant est prêt. */
  goodPractices?: number;
  /** Tests passés, et le meilleur. */
  tests: number;
  bestTest?: Score;
}

/** Une progression par matière, sous son identifiant. */
export interface CeinturesData extends WithStickers, Partial<Record<SubjectId, SubjectProgress>> {}

/** Autocollants de la 0.21.0, d'avant le rangement par matière : tous étaient ceux des homophones. */
const OLD_STICKERS: Record<string, string> = {
  'first-belt': 'homophones.first-belt',
  'three-belts': 'homophones.three-belts',
  'goal-cm1': 'homophones.goal-cm1',
  'black-belt': 'homophones.last-belt',
  'perfect-test': 'homophones.perfect-test',
  'perfect-practice': 'homophones.perfect-practice',
  'streak-10': 'homophones.streak-10',
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Lit la progression enregistrée, sans garder ce qui est abîmé (ceinture inconnue, date illisible). */
export function readCeinturesData(raw: unknown): CeinturesData {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const copy: CeinturesData = { ...(data as CeinturesData) };
  for (const { id } of SUBJECTS) {
    const progress = data[id] as Partial<SubjectProgress> | undefined;
    if (progress !== undefined) copy[id] = readProgress(progress);
  }
  const stickers = readStickers(data.stickers);
  if (stickers) copy.stickers = renameOldStickers(stickers);
  else delete copy.stickers;
  // Les jours de jeu (0.21.0) ne servent plus.
  delete (copy as Record<string, unknown>).daysPlayed;
  delete (copy as Record<string, unknown>).lastPlayedDay;
  return copy;
}

function renameOldStickers(stickers: Record<string, number>): Record<string, number> {
  const renamed: Record<string, number> = {};
  for (const [id, date] of Object.entries(stickers)) {
    if (id === 'days-5' || id === 'days-15') continue;
    renamed[OLD_STICKERS[id] ?? id] ??= date;
  }
  return renamed;
}

function readProgress(raw: Partial<SubjectProgress>): SubjectProgress {
  const progress: SubjectProgress = { ...(typeof raw === 'object' && raw !== null ? raw : {}), passed: readDays(raw?.passed) };
  const passedTest = readDays(raw?.passedTest);
  if (Object.keys(passedTest).length > 0) progress.passedTest = passedTest;
  else delete progress.passedTest;
  const failedTest = readDays(raw?.failedTest);
  if (Object.keys(failedTest).length > 0) progress.failedTest = failedTest;
  else delete progress.failedTest;
  const lastPractice: SubjectProgress['lastPractice'] = {};
  for (const [belt, ids] of entries(raw?.lastPractice)) {
    if (Array.isArray(ids)) lastPractice[belt] = ids.filter((id): id is string => typeof id === 'string');
  }
  if (Object.keys(lastPractice).length > 0) progress.lastPractice = lastPractice;
  else delete progress.lastPractice;
  const stats: SubjectProgress['stats'] = {};
  for (const [belt, value] of entries(raw?.stats)) {
    const read = readStats(value);
    if (read) stats[belt] = read;
  }
  if (Object.keys(stats).length > 0) progress.stats = stats;
  else delete progress.stats;
  return progress;
}

const isCount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0;

function readScore(raw: unknown): Score | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const { correct, total } = raw as Partial<Score>;
  return isCount(correct) && isCount(total) && total > 0 && correct <= total ? { correct, total } : undefined;
}

function readStats(raw: unknown): BeltStats | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const stats: BeltStats = { practices: isCount(r.practices) ? r.practices : 0, tests: isCount(r.tests) ? r.tests : 0 };
  if (isCount(r.goodPractices) && r.goodPractices > 0) stats.goodPractices = r.goodPractices;
  const bestPractice = readScore(r.bestPractice);
  const bestTest = readScore(r.bestTest);
  if (bestPractice) stats.bestPractice = bestPractice;
  if (bestTest) stats.bestTest = bestTest;
  return stats;
}

/** Le meilleur des deux scores, en proportion ; seulement le score (pas le reste d'un résultat). */
function best(a: Score | undefined, b: Score): Score {
  return a && a.correct * b.total >= b.correct * a.total ? a : { correct: b.correct, total: b.total };
}

/** Les ceintures connues d'un objet enregistré { ceinture: valeur }. */
function entries(raw: unknown): [BeltId, unknown][] {
  if (typeof raw !== 'object' || raw === null) return [];
  return Object.entries(raw).filter((entry): entry is [BeltId, unknown] => BELTS.some((b) => b.id === entry[0]));
}

function readDays(raw: unknown): Partial<Record<BeltId, string>> {
  const days: Partial<Record<BeltId, string>> = {};
  for (const [belt, day] of entries(raw)) if (typeof day === 'string' && DAY.test(day)) days[belt] = day;
  return days;
}

export function progressOf(data: CeinturesData, subject: Subject): SubjectProgress {
  return data[subject.id] ?? { passed: {} };
}

/**
 * Obtenue (notée par un adulte), réussie en conditions réelles (à passer en classe),
 * en cours (la première ni obtenue ni réussie : celle à faire ensuite), ou à faire.
 * Toutes sont ouvertes : on peut s'entraîner sur n'importe laquelle.
 */
export type BeltStatus = 'passed' | 'tested' | 'current' | 'todo';

export function beltStatuses(subject: Subject, progress: SubjectProgress): BeltStatus[] {
  let currentFound = false;
  return subject.belts.map(({ belt }) => {
    if (progress.passed[belt]) return 'passed';
    if (progress.passedTest?.[belt]) return 'tested';
    if (currentFound) return 'todo';
    currentFound = true;
    return 'current';
  });
}

/**
 * Ceintures réussies par l'enfant : réussies en conditions réelles ou notées obtenues par un adulte.
 * Pour les autocollants, qui ne dépendent pas de la validation en classe.
 */
export function beltsSucceeded(subject: Subject, progress: SubjectProgress): number {
  return beltStatuses(subject, progress).filter((s) => s === 'passed' || s === 'tested').length;
}

/** La plus haute ceinture obtenue (celle qu'on « porte »), ou -1. */
export function highestPassed(subject: Subject, progress: SubjectProgress): number {
  const statuses = beltStatuses(subject, progress);
  return statuses.lastIndexOf('passed');
}

/**
 * Un adulte note la dernière ceinture obtenue en classe (-1 : aucune) : celles d'en dessous
 * le sont aussi (on ne saute pas de ceinture), celles d'au-dessus sont retirées.
 * Une ceinture déjà obtenue garde sa date ; les nouvelles prennent `day`.
 */
export function setClassLevel(data: CeinturesData, subject: Subject, highest: number, day: string): void {
  const passed = { ...progressOf(data, subject).passed };
  subject.belts.forEach(({ belt }, index) => {
    if (index > highest) delete passed[belt];
    else passed[belt] ??= day;
  });
  data[subject.id] = { ...progressOf(data, subject), passed };
}

function update(data: CeinturesData, subject: Subject, change: (progress: SubjectProgress) => void): void {
  const progress = readProgress(progressOf(data, subject));
  change(progress);
  data[subject.id] = progress;
}

/** Entraînement fini (jusqu'au bout) : le test peut être repassé, et choisira d'autres phrases. */
export function recordPractice(data: CeinturesData, subject: Subject, belt: BeltId, sentenceIds: string[], score: Score): void {
  update(data, subject, (progress) => {
    progress.lastPractice = { ...progress.lastPractice, [belt]: sentenceIds };
    if (progress.failedTest) delete progress.failedTest[belt];
    const stats = statsOf(progress, belt);
    const good = (stats.goodPractices ?? 0) + (isPassing(score.correct, score.total) ? 1 : 0);
    progress.stats = {
      ...progress.stats,
      [belt]: {
        ...stats,
        practices: stats.practices + 1,
        bestPractice: best(stats.bestPractice, score),
        ...(good > 0 ? { goodPractices: good } : {}),
      },
    };
  });
}

/**
 * Entraînement en conditions réelles fini : réussi, l'enfant peut passer la ceinture en classe
 * (seul un adulte la note obtenue) ; raté, il faudra s'entraîner avant de le refaire.
 */
export function recordTest(data: CeinturesData, subject: Subject, belt: BeltId, score: Score, passed: boolean, day: string): void {
  update(data, subject, (progress) => {
    const stats = statsOf(progress, belt);
    progress.stats = { ...progress.stats, [belt]: { ...stats, tests: stats.tests + 1, bestTest: best(stats.bestTest, score) } };
    if (passed) {
      progress.passedTest = { ...progress.passedTest, [belt]: day };
      if (progress.failedTest) delete progress.failedTest[belt];
    } else {
      progress.failedTest = { ...progress.failedTest, [belt]: day };
    }
  });
}

export function statsOf(progress: SubjectProgress, belt: BeltId): BeltStats {
  return progress.stats?.[belt] ?? { practices: 0, tests: 0 };
}

/** Entraînements réussis à partir desquels on dit à l'enfant qu'il est prêt. */
export const READY_PRACTICES = 3;

/** Prêt pour la ceinture : au moins 3 entraînements réussis, et pas encore obtenue. */
export function isReady(progress: SubjectProgress, belt: BeltId): boolean {
  return !progress.passed[belt] && (statsOf(progress, belt).goodPractices ?? 0) >= READY_PRACTICES;
}

/** Le test vient d'être raté sans entraînement depuis : il faut s'entraîner avant de le refaire. */
export function mustPracticeFirst(progress: SubjectProgress, belt: BeltId): boolean {
  return progress.failedTest?.[belt] !== undefined;
}

/** L'entraînement en conditions réelles d'une ceinture pas encore obtenue, sauf juste après un échec. */
export function canTakeTest(progress: SubjectProgress, belt: BeltId): boolean {
  return !progress.passed[belt] && !mustPracticeFirst(progress, belt);
}

/** « 25/10 » cette année, « 25/10/2025 » sinon. */
export function formatDay(day: string, today = new Date()): string {
  const [year, month, date] = day.split('-');
  return year === String(today.getFullYear()) ? `${date}/${month}` : `${date}/${month}/${year}`;
}
