import type { Grade } from '../../core/grades';

/**
 * Les ceintures sont celles d'une classe de CM1 (le classeur) : on prévient seulement les
 * plus petits, sans rien bloquer. Chaque matière a ses repères de fin d'année (CE2 pour les tables, CM1, CM2).
 */
export function gradeNote(grade: Grade | undefined): string | undefined {
  switch (grade) {
    case 'CP':
    case 'CE1':
    case 'CE2':
      return 'Ces ceintures sont celles du CM1 : essaie, sans te presser !';
    default:
      return undefined;
  }
}

/** L'objectif de fin d'année à mettre en avant pour cette classe (aucun avant le CE2, ni après le CM2). */
export function gradeGoal(grade: Grade | undefined): 'CE2' | 'CM1' | 'CM2' | undefined {
  return grade === 'CE2' || grade === 'CM1' || grade === 'CM2' ? grade : undefined;
}
