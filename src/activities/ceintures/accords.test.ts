import { describe, expect, it } from 'vitest';
import { AccordSession } from './accord-session';
import { accordBelt, ACCORDS, boxesOf, isRight, isTrap, parseAccord, pickAccords, sentenceOf, tipFor, type AccordExercise } from './accords';

/**
 * Les fiches Charivari recopiées à part : la phrase de départ et sa correction (n° 1 à 18). Les données de
 * l'app doivent redonner exactement les mêmes. « La barque charive » (n° 11) est corrigée ici aussi.
 */
const FICHES: Record<string, [string, string]> = {
  'blanche.1': ['L’avion décolle.', 'Les avions décollent.'],
  'blanche.2': ['Le chien aboie.', 'Les chiens aboient.'],
  'blanche.3': ['Une abeille butinait.', 'Des abeilles butinaient.'],
  'blanche.4': ['Le camion freine.', 'Les camions freinent.'],
  'blanche.5': ['Le coiffeur travaillait.', 'Les coiffeurs travaillaient.'],
  'blanche.6': ['Un aigle volait.', 'Des aigles volaient.'],
  'blanche.7': ['Le bébé gazouillait.', 'Les bébés gazouillaient.'],
  'blanche.8': ['Un train passe.', 'Des trains passent.'],
  'blanche.9': ['La radio fonctionne.', 'Les radios fonctionnent.'],
  'blanche.10': ['La pie jacasse.', 'Les pies jacassent.'],
  'blanche.11': ['Un garçon jouait.', 'Des garçons jouaient.'],
  'blanche.12': ['Le moteur explose.', 'Les moteurs explosent.'],
  'blanche.13': ['La chouette dormait.', 'Les chouettes dormaient.'],
  'blanche.14': ['La voiture roule.', 'Les voitures roulent.'],
  'blanche.15': ['Un danseur sautille.', 'Des danseurs sautillent.'],
  'blanche.16': ['Le singe mange.', 'Les singes mangent.'],
  'blanche.17': ['Une fleur pousse.', 'Des fleurs poussent.'],
  'blanche.18': ['L’homme travaillait.', 'Les hommes travaillaient.'],
  'blanche.19': ['Des chats griffent.', 'Un chat griffe.'],
  'blanche.20': ['Les horloges sonnaient.', 'L’horloge sonnait.'],
  'blanche.21': ['Les enfants arrivent.', 'L’enfant arrive.'],
  'blanche.22': ['Les coureurs gagnent.', 'Le coureur gagne.'],
  'blanche.23': ['Les filles chantent.', 'La fille chante.'],
  'blanche.24': ['Des billes roulaient.', 'Une bille roulait.'],
  'blanche.25': ['Les touristes bronzent.', 'Le touriste bronze.'],
  'blanche.26': ['Les garçons lisaient.', 'Le garçon lisait.'],
  'blanche.27': ['Des chenilles se transforment.', 'Une chenille se transforme.'],
  'blanche.28': ['Les trains arrivent.', 'Le train arrive.'],
  'blanche.29': ['Les plongeurs zigzaguaient.', 'Le plongeur zigzaguait.'],
  'blanche.30': ['Les perroquets parlent.', 'Le perroquet parle.'],
  'blanche.31': ['Les barques chavirent.', 'La barque chavire.'],
  'blanche.32': ['Les mouettes plongent.', 'La mouette plonge.'],
  'blanche.33': ['Des bougies brûlaient.', 'Une bougie brûlait.'],
  'blanche.34': ['Les enfants crient.', 'L’enfant crie.'],
  'blanche.35': ['Des lions dormaient.', 'Un lion dormait.'],
  'blanche.36': ['Les gazelles couraient.', 'La gazelle courait.'],
  'jaune.1': ['Il regardait la grosse araignée.', 'Ils regardaient les grosses araignées.'],
  'jaune.2': ['Son frère était sportif et travailleur.', 'Ses frères étaient sportifs et travailleurs.'],
  'jaune.3': ['Le facteur apporte une lettre.', 'Les facteurs apportent des lettres.'],
  'jaune.4': ['Les petits chats couraient après les oiseaux.', 'Le petit chat courait après l’oiseau.'],
  'jaune.5': ['Ils habitaient de belles maisons.', 'Il habitait une belle maison.'],
  'jaune.6': ['Les singes sautent de branche en branche.', 'Le singe saute de branche en branche.'],
  'jaune.7': ['Lina semble fatiguée ce matin.', 'Enzo semble fatigué ce matin.'],
  'jaune.8': ['Lina était une princesse charmante.', 'Enzo était un prince charmant.'],
  'jaune.9': ['Lina est devenue championne de judo.', 'Enzo est devenu champion de judo.'],
  'jaune.10': ['Le magicien maladroit rate le tour.', 'Les magiciens maladroits ratent les tours.'],
  'jaune.11': ['L’étoile filante était très brillante.', 'Les étoiles filantes étaient très brillantes.'],
  'jaune.12': ['Je suis très content d’avoir réussi.', 'Nous sommes très contents d’avoir réussi.'],
  'jaune.13': ['Des comètes visibles à l’œil nu sont rares.', 'Une comète visible à l’œil nu est rare.'],
  'jaune.14': ['Ils sont passés maitres dans l’art du dessin.', 'Il est passé maitre dans l’art du dessin.'],
  'jaune.15': ['Les éruptions volcaniques peuvent être meurtrières.', 'L’éruption volcanique peut être meurtrière.'],
  'jaune.16': ['Anna n’est jamais arrivée en retard.', 'Tom n’est jamais arrivé en retard.'],
  'jaune.17': ['Anna semblait perdue dans ses pensées.', 'Tom semblait perdu dans ses pensées.'],
  'jaune.18': ['Anna est devenue maitresse d’école.', 'Tom est devenu maitre d’école.'],
};

/** « Remplace Lina par Enzo. » : le prénom de départ, mis à la place du nouveau dans la phrase de départ. */
function startSentence(exercise: AccordExercise): string {
  const swap = /^Remplace (\S+) par (\S+)\.$/.exec(exercise.instruction);
  const start = sentenceOf(exercise.text, 'start');
  return swap ? start.replace(swap[2]!, swap[1]!) : start;
}

describe('Accords', () => {
  const all = ACCORDS.flatMap((belt) => belt.texts.map((exercise) => ({ belt, exercise })));

  it('redonne les phrases des fiches et leurs corrections', () => {
    for (const [id, [start, answer]] of Object.entries(FICHES)) {
      const exercise = all.find((e) => e.exercise.id === id)?.exercise;
      expect(exercise, id).toBeDefined();
      expect(startSentence(exercise!), id).toBe(start);
      expect(sentenceOf(exercise!.text, 'answer'), id).toBe(answer);
    }
    // Chaque exercice des fiches est dans la table.
    expect(all.filter((e) => e.exercise.fiche !== undefined).map((e) => e.exercise.id).sort()).toEqual(Object.keys(FICHES).sort());
  });

  it('écrit chaque phrase proprement : des cases, une majuscule, un point', () => {
    for (const { exercise } of all) {
      const boxes = boxesOf(exercise.text);
      expect(boxes.length, exercise.id).toBeGreaterThan(0);
      expect(boxes.some((b) => !isTrap(b)), exercise.id).toBe(true);
      for (const box of boxes) {
        expect(box.start.trim(), exercise.id).toBe(box.start);
        expect(box.answer, exercise.id).not.toBe('');
      }
      for (const side of ['start', 'answer'] as const) {
        const sentence = sentenceOf(exercise.text, side);
        expect(sentence, exercise.id).not.toMatch(/[{}|]|'|\s{2}|\s[.,!?]/);
        expect(sentence, exercise.id).toMatch(/^[A-ZÀ-Ý].*[.!?]$/u);
      }
      expect(exercise.instruction, exercise.id).toMatch(/^(Transpose au (pluriel|singulier)|Remplace \S+ par \S+)\.$/);
    }
  });

  it('va bien dans le sens de la consigne', () => {
    for (const { exercise } of all) {
      const changed = boxesOf(exercise.text).filter((b) => !isTrap(b));
      const plural = changed.filter((b) => /^(les|des|ils|elles|nous)$/i.test(b.answer.split(' ')[0]!) || /(s|x|nt)$/.test(b.answer));
      if (exercise.instruction === 'Transpose au pluriel.') expect(plural.length, exercise.id).toBeGreaterThan(0);
      if (exercise.instruction === 'Transpose au singulier.') expect(changed.some((b) => /^(les|des|mes|tes|ses|ces|ils|elles)$/i.test(b.start.split(' ')[0]!)), exercise.id).toBe(true);
    }
  });

  it('a des identifiants qui se suivent, des exercices des fiches et des nôtres', () => {
    for (const belt of ACCORDS) {
      expect(belt.texts.map((e) => e.id)).toEqual(belt.texts.map((_, i) => `${belt.belt}.${i + 1}`));
      expect(belt.texts.some((e) => e.fiche === undefined)).toBe(true);
      expect(belt.texts.length).toBeGreaterThanOrEqual(belt.testSize * 3);
    }
  });

  it('a des pièges (des mots qui ne changent pas) à partir de la jaune', () => {
    const jaune = accordBelt('jaune')!;
    expect(jaune.texts.filter((e) => boxesOf(e.text).some(isTrap)).length).toBeGreaterThanOrEqual(8);
  });

  it('lit les cases : mot de départ, réponse, autres réponses justes, majuscule', () => {
    expect(parseAccord('{L’avion|Les avions} {décolle|décollent}.')).toEqual([
      { start: 'L’avion', answer: 'Les avions', also: [], capital: true },
      ' ',
      { start: 'décolle', answer: 'décollent', also: [], capital: false },
      '.',
    ]);
    expect(boxesOf('Il est {passé} {maitre|maitres/maîtres}.')[1]).toEqual({ start: 'maitre', answer: 'maitres', also: ['maîtres'], capital: false });
  });

  it('accepte la réponse en minuscules, avec l’apostrophe droite, et les autres orthographes', () => {
    const [box] = boxesOf('{Les enfants|L’enfant} {crient|crie}.');
    expect(isRight(box!, 'l’enfant')).toBe(true);
    expect(isRight(box!, "l'enfant")).toBe(true);
    expect(isRight(box!, ' L’enfant ')).toBe(true);
    expect(isRight(box!, 'l’enfants')).toBe(false);
    const maitre = boxesOf('Il est {passés|passé} {maitres|maitre/maître}.')[1]!;
    expect(isRight(maitre, 'maître')).toBe(true);
    expect(isRight(maitre, 'maitre')).toBe(true);
  });

  it('donne l’astuce qui va avec l’erreur', () => {
    const tip = (text: string) => tipFor(boxesOf(text)[0]!);
    expect(tip('{très}')).toMatch(/ne change pas/);
    expect(tip('{aboie|aboient}')).toMatch(/-nt/);
    expect(tip('{griffent|griffe}')).toMatch(/ne se termine pas par -nt/);
    expect(tip('{chien|chiens}')).toMatch(/prennent un -s/);
    expect(tip('{la|les}')).toMatch(/petit mot devant le nom/);
    expect(tip('{Les horloges|L’horloge}')).toMatch(/Au singulier/);
    expect(tip('{fatiguée|fatigué}')).toMatch(/masculin/);
  });

  it('tire des phrases pas vues la dernière fois', () => {
    const belt = accordBelt('blanche')!;
    const seen = belt.texts.slice(0, 40).map((e) => e.id);
    for (let i = 0; i < 20; i++) {
      expect(pickAccords(belt, 3, seen).every((e) => !seen.includes(e.id))).toBe(true);
    }
  });
});

describe('série d’accords', () => {
  const blanche = accordBelt('blanche')!;
  const exercises = [blanche.texts[0]!, blanche.texts[20]!];

  it('compte case par case et garde les phrases ratées', () => {
    const session = new AccordSession(exercises);
    expect(session.total).toBe(4);
    expect(session.current()).toEqual({ exercise: exercises[0], index: 0 });
    expect(session.answer('les avions')).toBe(true);
    expect(session.answer('décolle')).toBe(false);
    expect(session.current()).toEqual({ exercise: exercises[1], index: 0 });
    session.answer('l’enfant');
    session.answer('arrive');
    expect(session.current()).toBeUndefined();
    expect(session.result()).toEqual({
      correct: 3,
      total: 4,
      passed: false,
      mistakes: [{ exercise: exercises[0], typed: ['les avions', 'décolle'] }],
      toPractice: ['Les avions décollent.'],
    });
  });

  it('revient au mot d’avant en conditions réelles', () => {
    const session = new AccordSession(exercises);
    session.answer('les avion');
    expect(session.undo()).toBe('les avion');
    expect(session.attempted).toBe(0);
    for (const word of ['les avions', 'décollent', 'l’enfant', 'arrive']) session.answer(word);
    expect(session.result()).toMatchObject({ correct: 4, total: 4, passed: true, mistakes: [] });
  });
});
