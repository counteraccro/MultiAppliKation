import { describe, expect, it } from 'vitest';
import { BELTS } from './belts';
import { beltSentences, HOMOPHONES } from './homophones';
import { blanksOf, fullSentence } from './sentence';

// Assez de phrases pour un entraînement de 6 puis un test de 10 sans les revoir.
const MIN_SENTENCES = 24;

const all = HOMOPHONES.flatMap((belt) => beltSentences(belt).map((s) => ({ belt, ...s })));

describe('ceintures d’homophones', () => {
  it('suivent les 11 ceintures du classeur, dans l’ordre', () => {
    expect(HOMOPHONES.map((b) => b.belt)).toEqual(BELTS.map((b) => b.id).filter((id) => id !== 'brillante'));
  });

  it('ont assez de phrases chacune', () => {
    for (const belt of HOMOPHONES) {
      expect(beltSentences(belt).length, belt.belt).toBeGreaterThanOrEqual(MIN_SENTENCES);
    }
  });

  it('expliquent chaque mot et montrent des exemples', () => {
    for (const belt of HOMOPHONES) {
      for (const group of belt.groups) {
        expect(group.rules.length, group.choices.join('/')).toBe(group.choices.length);
        expect(group.tip).not.toBe('');
        expect(group.examples.length).toBeGreaterThan(0);
        for (const example of group.examples) {
          for (const word of blanksOf(example)) expect(group.choices, example).toContain(word.toLowerCase());
        }
      }
    }
  });

  it('font servir chaque bouton au moins une fois', () => {
    for (const belt of HOMOPHONES) {
      for (const group of belt.groups) {
        const answers = new Set(group.sentences.flatMap((s) => blanksOf(s.text)));
        expect([...answers].sort(), belt.belt).toEqual([...group.choices].sort());
      }
    }
  });
});

describe('phrases', () => {
  it('ont des identifiants uniques, préfixés par leur ceinture', () => {
    const ids = all.map((s) => s.sentence.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { belt, sentence } of all) expect(sentence.id).toMatch(new RegExp(`^${belt.belt}\\.\\d+$`));
  });

  it('ne se répètent pas', () => {
    const texts = all.map((s) => s.sentence.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('ont des trous dont la réponse est un des boutons', () => {
    for (const { sentence, group } of all) {
      const blanks = blanksOf(sentence.text);
      expect(blanks.length, sentence.id).toBeGreaterThan(0);
      for (const answer of blanks) expect(group.choices, sentence.id).toContain(answer);
    }
  });

  it('sont bien écrites : apostrophe typographique, espace avant ! ? : ;, point final', () => {
    for (const { sentence } of all) {
      const text = fullSentence(sentence.text);
      expect(text, sentence.id).not.toMatch(/'/);
      expect(text, sentence.id).not.toMatch(/\S[!?:;]/);
      expect(text, sentence.id).not.toMatch(/ {2}|^ | $/);
      expect(text, sentence.id).toMatch(/[.!?]$/);
      expect(text, sentence.id).toMatch(/^[A-ZÀÂÉÈÊÎÔ]/);
    }
  });

  it('reprennent chaque fiche Charivari de la ceinture (3 phrases), sauf celles absentes du PDF', () => {
    HOMOPHONES.forEach((belt, index) => {
      const first = index * 6 + 1;
      const fiches = beltSentences(belt).flatMap(({ sentence }) => (sentence.fiche ? [sentence.fiche] : []));
      if (belt.belt === 'bleu-fonce') {
        expect(fiches).toEqual([]);
        return;
      }
      for (let fiche = first; fiche < first + 6; fiche++) {
        expect(fiches.filter((f) => f === fiche).length, `${belt.belt}, fiche ${fiche}`).toBe(3);
      }
      expect(fiches.every((f) => f >= first && f < first + 6), belt.belt).toBe(true);
    });
  });

  it('se complètent comme dans la correction des fiches', () => {
    const byId = new Map(all.map((s) => [s.sentence.id, fullSentence(s.sentence.text)]));
    expect(byId.get('blanche.16')).toBe('Est-il revenu ?');
    expect(byId.get('orange.13')).toBe('A-t-il appris à plonger ?');
    expect(byId.get('rose.15')).toBe('Quand on a fini, on fait ce qu’on veut.');
    expect(byId.get('rose.17')).toBe('À l’école, on n’a jamais envie de se faire embêter par les grands.');
    expect(byId.get('bleu-clair.16')).toBe('Dormait-il depuis longtemps ?');
    expect(byId.get('marron.8')).toBe('Peux-tu me donner un peu d’eau ?');
    expect(byId.get('noire.12')).toBe('Tout a été dit, ils en sont tous convaincus.');
  });
});
