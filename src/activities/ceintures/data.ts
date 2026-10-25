// Progression de l'activité « ceintures » dans un profil : par matière, les ceintures
// obtenues et leur date (« obtenue le 25/10 »), comme dans le classeur.

import { BELTS, type BeltId } from './belts';
import type { Subject, SubjectId } from './subjects';

export interface SubjectProgress {
  /** Ceintures obtenues, avec le jour : { "blanche": "2026-10-25" }. */
  passed: Partial<Record<BeltId, string>>;
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
  const passed: SubjectProgress['passed'] = {};
  const source = typeof raw === 'object' && raw !== null && typeof raw.passed === 'object' ? raw.passed : {};
  for (const [belt, day] of Object.entries(source ?? {})) {
    if (BELTS.some((b) => b.id === belt) && typeof day === 'string' && DAY.test(day)) passed[belt as BeltId] = day;
  }
  return { ...raw, passed };
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

/** « 25/10 » cette année, « 25/10/2025 » sinon. */
export function formatDay(day: string, today = new Date()): string {
  const [year, month, date] = day.split('-');
  return year === String(today.getFullYear()) ? `${date}/${month}` : `${date}/${month}/${year}`;
}
