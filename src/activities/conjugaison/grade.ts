import type { Grade } from '../../core/grades';

/**
 * Ce que la classe change à l'accueil : une phrase sous le titre, rien n'est bloqué.
 * Les 20 verbes et les 4 temps sont ceux du CM1 (programme du cycle 3) : on prévient
 * seulement le CP (pas de conjugaison écrite) et le CE1 / CE2 (cycle 2, programme pas encore lu).
 */
export function gradeNote(grade: Grade | undefined): string | undefined {
  switch (grade) {
    case 'CP':
      return 'La conjugaison écrite viendra plus tard : tu peux essayer quand même !';
    case 'CE1':
    case 'CE2':
      return 'Ces verbes sont ceux du CM1 : essaie, sans te presser !';
    default:
      return undefined;
  }
}
