// Progression de l'activité « ceintures » dans un profil : par matière, les ceintures
// obtenues et leur date (« obtenue le 25/10 »), comme dans le classeur.

import { BELTS, type BeltId } from './belts';
import type { Subject, SubjectId } from './subjects';

export interface SubjectProgress {
  /** Ceintures obtenues, avec le jour : { "blanche": "2026-10-25" }. */
  passed: Partial<Record<BeltId, string>>;
  /** Phrases du dernier entraînement fini, par ceinture : le test en choisit d'autres. */
  lastPractice?: Partial<Record<BeltId, string[]>>;
  /** Test raté, avec le jour : il faut un entraînement avant de le repasser. */
  failedTest?: Partial<Record<BeltId, string>>;
}

export type CeinturesData = Partial<Record<SubjectId, SubjectProgress>>;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Lit la progression enregistrée, sans garder ce qui est abîmé (ceinture inconnue, date illisible). */
export function readCeinturesData(raw: unknown): CeinturesData {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const copy: CeinturesData = { ...(data as CeinturesData) };
  const homophones = data.homophones as Partial<SubjectProgress> | undefined;
  if (homophones !== undefined) copy.homophones = readProgress(homophones);
  return copy;
}

function readProgress(raw: Partial<SubjectProgress>): SubjectProgress {
  const progress: SubjectProgress = { ...(typeof raw === 'object' && raw !== null ? raw : {}), passed: readDays(raw?.passed) };
  const failedTest = readDays(raw?.failedTest);
  if (Object.keys(failedTest).length > 0) progress.failedTest = failedTest;
  else delete progress.failedTest;
  const lastPractice: SubjectProgress['lastPractice'] = {};
  for (const [belt, ids] of entries(raw?.lastPractice)) {
    if (Array.isArray(ids)) lastPractice[belt] = ids.filter((id): id is string => typeof id === 'string');
  }
  if (Object.keys(lastPractice).length > 0) progress.lastPractice = lastPractice;
  else delete progress.lastPractice;
  return progress;
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

export type BeltStatus = 'passed' | 'current' | 'locked';

/** Obtenue (avec sa date), en cours (la première pas encore obtenue), ou fermée : on ne saute pas de ceinture. */
export function beltStatuses(subject: Subject, progress: SubjectProgress): BeltStatus[] {
  let currentFound = false;
  return subject.belts.map(({ belt }) => {
    if (progress.passed[belt]) return 'passed';
    if (currentFound) return 'locked';
    currentFound = true;
    return 'current';
  });
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
export function recordPractice(data: CeinturesData, subject: Subject, belt: BeltId, sentenceIds: string[]): void {
  update(data, subject, (progress) => {
    progress.lastPractice = { ...progress.lastPractice, [belt]: sentenceIds };
    if (progress.failedTest) delete progress.failedTest[belt];
  });
}

/** Test fini : la ceinture est obtenue ce jour-là, ou il faudra s'entraîner avant de repasser. */
export function recordTest(data: CeinturesData, subject: Subject, belt: BeltId, passed: boolean, day: string): void {
  update(data, subject, (progress) => {
    if (passed) {
      progress.passed[belt] ??= day;
      if (progress.failedTest) delete progress.failedTest[belt];
    } else {
      progress.failedTest = { ...progress.failedTest, [belt]: day };
    }
  });
}

/** Le test se passe sur la ceinture en cours, sauf s'il vient d'être raté sans entraînement depuis. */
export function mustPracticeFirst(progress: SubjectProgress, belt: BeltId): boolean {
  return progress.failedTest?.[belt] !== undefined;
}

/** « 25/10 » cette année, « 25/10/2025 » sinon. */
export function formatDay(day: string, today = new Date()): string {
  const [year, month, date] = day.split('-');
  return year === String(today.getFullYear()) ? `${date}/${month}` : `${date}/${month}/${year}`;
}
