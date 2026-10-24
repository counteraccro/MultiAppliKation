import { describe, expect, it } from 'vitest';
import { dayOf, readTablesData, recordDay } from './data';
import { pairKey, TABLES } from './questions';
import { STICKERS, stickerCount, unlockStickers, type SeriesEvent } from './stickers';

const event = (overrides: Partial<SeriesEvent> = {}): SeriesEvent => ({
  mode: 'learn',
  bestStreak: 0,
  correct: 10,
  total: 10,
  ...overrides,
});

describe('unlockStickers', () => {
  it('colle un autocollant une seule fois', () => {
    const data = readTablesData(undefined);
    data.stars['3'] = 1;
    expect(unlockStickers(data, event()).map((s) => s.id)).toEqual(['first-star']);
    expect(unlockStickers(data, event())).toEqual([]);
    expect(stickerCount(data)).toBe(1);
  });

  it('gagne l’animal d’une table quand ses 10 multiplications sont connues', () => {
    const data = readTablesData(undefined);
    for (const k of TABLES) data.leitner[pairKey(7, k)] = { box: 4, lastSeen: 0 };
    const ids = unlockStickers(data, event()).map((s) => s.id);
    expect(ids).toContain('table-7');
    expect(ids).not.toContain('table-6');
  });

  it('récompense les séries, le défi et le mélange', () => {
    const data = readTablesData(undefined);
    const ids = unlockStickers(data, event({ mode: 'defi', bestStreak: 20, correct: 20, total: 20, defiScoreMs: 55_000 })).map(
      (s) => s.id,
    );
    expect(ids).toEqual(['streak-10', 'streak-20', 'defi-first', 'defi-perfect', 'defi-fast']);
    expect(unlockStickers(data, event({ mode: 'mix', correct: 19, total: 20 }))).toEqual([]);
    expect(unlockStickers(data, event({ mode: 'mix', correct: 20, total: 20 })).map((s) => s.id)).toEqual(['mix-perfect']);
  });

  it('a des identifiants uniques', () => {
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length);
  });
});

describe('recordDay', () => {
  it('compte chaque jour une seule fois', () => {
    const data = readTablesData(undefined);
    const day = new Date(2026, 9, 24, 10).getTime();
    recordDay(data, day);
    recordDay(data, day + 3_600_000);
    recordDay(data, day + 86_400_000);
    expect(data.daysPlayed).toBe(2);
    expect(data.lastPlayedDay).toBe(dayOf(day + 86_400_000));
  });

  it('retrouve les jours déjà joués d’un ancien profil', () => {
    const data = readTablesData(undefined);
    const day = new Date(2026, 9, 20, 10).getTime();
    data.leitner['2x3'] = { box: 2, lastSeen: day };
    data.leitner['2x4'] = { box: 2, lastSeen: day + 3_600_000 };
    data.leitner['3x5'] = { box: 1, lastSeen: day + 2 * 86_400_000 };
    recordDay(data, day + 4 * 86_400_000);
    expect(data.daysPlayed).toBe(3);
  });
});
