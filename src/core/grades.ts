// Classe de l'enfant, commune à toutes les activités : chacune s'en sert pour
// proposer d'abord ce qui est de son niveau, sans jamais rien bloquer.

export const GRADES = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e'] as const;

export type Grade = (typeof GRADES)[number];

export const GRADE_LABELS: Record<Grade, string> = {
  CP: 'CP',
  CE1: 'CE1',
  CE2: 'CE2',
  CM1: 'CM1',
  CM2: 'CM2',
  '6e': '6ᵉ',
};

export function isGrade(value: unknown): value is Grade {
  return (GRADES as readonly unknown[]).includes(value);
}
