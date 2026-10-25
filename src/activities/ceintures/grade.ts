import type { Grade } from '../../core/grades';

/**
 * Les ceintures sont celles d'une classe de CM1 (le classeur) : on prévient seulement les
 * plus petits, sans rien bloquer. Repères du classeur : bleu clair en fin de CM1, noire en fin de CM2.
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

/** L'objectif de fin d'année à mettre en avant pour cette classe (aucun avant le CM1, ni après). */
export function gradeGoal(grade: Grade | undefined): 'CM1' | 'CM2' | undefined {
  return grade === 'CM1' || grade === 'CM2' ? grade : undefined;
}
