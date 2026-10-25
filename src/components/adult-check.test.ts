import { describe, expect, it } from 'vitest';
import { adultQuestion } from './adult-check';

describe('question d’adulte', () => {
  it('un pourcentage simple, au résultat entier', () => {
    for (let i = 0; i < 500; i++) {
      const { text, answer } = adultQuestion();
      const [, percent, of] = text.match(/^(\d+) % de (\d+)$/)!.map(Number);
      expect([10, 20, 25, 50]).toContain(percent);
      expect(of).toBeGreaterThanOrEqual(30);
      expect(of).toBeLessThanOrEqual(200);
      expect(Number.isInteger(answer)).toBe(true);
      expect(answer).toBe((of! * percent!) / 100);
    }
  });
});
