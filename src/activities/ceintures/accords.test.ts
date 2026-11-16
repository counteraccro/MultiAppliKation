import { describe, expect, it } from 'vitest';
import { AccordSession } from './accord-session';
import { accordBelt, ACCORDS, boxesOf, isRight, isTrap, parseAccord, pickAccords, sentenceOf, startSentence, SWAP, tipFor } from './accords';

/**
 * Les fiches Charivari recopiées à part : la phrase de départ et sa correction (n° 1 à 36). Les données de
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
  'orange.1': ['Enthousiaste, ce maitre prépare une séance ludique et intéressante !', 'Enthousiastes, ces maitres préparent des séances ludiques et intéressantes !'],
  'orange.2': ['Il a un crayon rouge neuf.', 'Ils ont des crayons rouges neufs.'],
  'orange.3': ['Son ancien stylo préféré ne fonctionnait plus.', 'Ses anciens stylos préférés ne fonctionnaient plus.'],
  'orange.4': ['Elle a une petite main potelée.', 'Elles ont des petites mains potelées.'],
  'orange.5': ['Ce grand paquet encombre ma petite étagère étroite.', 'Ces grands paquets encombrent mes petites étagères étroites.'],
  'orange.6': ['Je n’arrive pas à faire cet exercice long et difficile.', 'Nous n’arrivons pas à faire ces exercices longs et difficiles.'],
  'orange.7': ['Tu ne traverses jamais sur ce passage piéton !', 'Vous ne traversez jamais sur ces passages piétons !'],
  'orange.8': ['Ta cousine a une jolie maison fleurie.', 'Tes cousines ont des jolies maisons fleuries.'],
  'orange.9': ['Apeuré, notre jeune chien aboie sur cette personne inconnue.', 'Apeurés, nos jeunes chiens aboient sur ces personnes inconnues.'],
  'orange.10': ['Effrayés, ces canards bruyants cancanent.', 'Effrayé, ce canard bruyant cancane.'],
  'orange.11': ['Les poissons ont peur des grands requins blancs.', 'Le poisson a peur du grand requin blanc.'],
  'orange.12': ['Tes nouveaux livres ne parlent ni de ces personnages, ni de ces villages !', 'Ton nouveau livre ne parle ni de ce personnage, ni de ce village !'],
  'orange.13': ['Ces fillettes ramassent les fruits mûrs et sucrés.', 'Cette fillette ramasse le fruit mûr et sucré.'],
  'orange.14': ['Mes maitresses ont des idées farfelues mais intéressantes !', 'Ma maitresse a une idée farfelue mais intéressante !'],
  'orange.15': ['Fatigués, ces soldats écrivaient de nouvelles lettres émouvantes.', 'Fatigué, ce soldat écrivait une nouvelle lettre émouvante.'],
  'orange.16': ['Inquiets, les policiers surveillent ces suspects.', 'Inquiet, le policier surveille ce suspect.'],
  'orange.17': ['Nous effaçons ces traces sur vos vieilles tables abimées.', 'J’efface cette trace sur votre vieille table abimée.'],
  'orange.18': ['Ils ne révisent guère les nouvelles leçons !', 'Il ne révise guère la nouvelle leçon !'],
  'orange.19': ['cet invité / l’employé / votre ami', 'cette invitée / l’employée / votre amie'],
  'orange.20': ['le gardien / ce collégien / un musicien', 'la gardienne / cette collégienne / une musicienne'],
  'orange.21': ['cet acteur / notre animateur / un navigateur', 'cette actrice / notre animatrice / une navigatrice'],
  'orange.22': ['mon boucher / un droitier / le sorcier', 'ma bouchère / une droitière / la sorcière'],
  'orange.23': ['un menteur / le dompteur / un chercheur', 'une menteuse / la dompteuse / une chercheuse'],
  'orange.24': ['immortel / mensuel / réel / naturel', 'immortelle / mensuelle / réelle / naturelle'],
  'orange.25': ['Le directeur discute avec notre maitre.', 'La directrice discute avec notre maitresse.'],
  'orange.26': ['Le spectateur applaudit ce nouveau comédien talentueux.', 'La spectatrice applaudit cette nouvelle comédienne talentueuse.'],
  'orange.27': ['Son chien désobéissant grogne sur ton fils apeuré.', 'Sa chienne désobéissante grogne sur ta fille apeurée.'],
  'orange.28': ['Ce pharmacien est très professionnel.', 'Cette pharmacienne est très professionnelle.'],
  'orange.29': ['Mon moniteur d’équitation est phénoménal !', 'Ma monitrice d’équitation est phénoménale !'],
  'orange.30': ['Cet étranger semble perdu et inquiet.', 'Cette étrangère semble perdue et inquiète.'],
  'orange.31': ['Je veux devenir un informaticien exceptionnel !', 'Je veux devenir une informaticienne exceptionnelle !'],
  'orange.32': ['Ce jeune homme sera apprenti-boulanger.', 'Cette jeune femme sera apprentie-boulangère.'],
  'orange.33': ['Mon ancien instituteur passionné enseigne toujours ici.', 'Mon ancienne institutrice passionnée enseigne toujours ici.'],
  'orange.34': ['Quentin est un grand magicien…', 'Éléa est une grande magicienne…'],
  'orange.35': ['Quentin semble motivé et travailleur.', 'Éléa semble motivée et travailleuse.'],
  'orange.36': ['Quentin deviendra un ouvrier qualifié.', 'Éléa deviendra une ouvrière qualifiée.'],
  'rose.1': ['Le cheval blanc trotte puis galope.', 'Les chevaux blancs trottent puis galopent.'],
  'rose.2': ['Son genou ne semblait pas gonflé. Il était bleu.', 'Ses genoux ne semblaient pas gonflés. Ils étaient bleus.'],
  'rose.3': ['L’écolier ouvre et entre par le grand portail vert.', 'Les écoliers ouvrent et entrent par les grands portails verts.'],
  'rose.4': ['Le seigneur construit ce magnifique château fortifié puis habite dans le donjon.', 'Les seigneurs construisent ces magnifiques châteaux fortifiés puis habitent dans les donjons.'],
  'rose.5': ['Le tournoi médiéval est très attendu.', 'Les tournois médiévaux sont très attendus.'],
  'rose.6': ['La reine admire le favori mais n’encourage pas le perdant.', 'Les reines admirent les favoris mais n’encouragent pas les perdants.'],
  'rose.7': ['Les souris grises vivent dans les vastes plaines.', 'La souris grise vit dans la vaste plaine.'],
  'rose.8': ['Les travaux de ces maçons ne commencent pas avant janvier et se terminent en mars.', 'Le travail de ce maçon ne commence pas avant janvier et se termine en mars.'],
  'rose.9': ['Les longs nez roses des cochons sont les groins ou les museaux.', 'Le long nez rose du cochon est le groin ou le museau.'],
  'rose.10': ['Les hiboux sont des animaux nocturnes carnivores.', 'Le hibou est un animal nocturne carnivore.'],
  'rose.11': ['Les plats cuisinés étaient conservés dans des bocaux puis savourés.', 'Le plat cuisiné était conservé dans un bocal puis savouré.'],
  'rose.12': ['Des grosses miettes tombent sur mes jambes et les salissent.', 'Une grosse miette tombe sur ma jambe et la salit.'],
  'rose.13': ['Snoopy est un cheval capricieux.', 'Didoune est une jument capricieuse.'],
  'rose.14': ['Snoopy est un loup un peu fou.', 'Didoune est une louve un peu folle.'],
  'rose.15': ['Snoopy est un coq compétitif.', 'Didoune est une poule compétitive.'],
  'rose.16': ['Le chat blanc et agressif s’enfuit.', 'La chatte blanche et agressive s’enfuit.'],
  'rose.17': ['Le garçon mignon monte le cheval brun.', 'La fille mignonne monte la jument brune.'],
  'rose.18': ['L’affreux canard et le coq maladif picorent.', 'L’affreuse cane et la poule maladive picorent.'],
};

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

  it('écrit chaque phrase proprement : des cases, une majuscule, un point (ou des mots seuls, en minuscules)', () => {
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
        expect(sentence, exercise.id).not.toMatch(/[{}|]|'|\s{2}|\s[.,]|[^\s][!?]/);
        if (sentence.includes(' / ')) expect(sentence, exercise.id).toMatch(/^\p{Ll}[^.!?]*\p{Ll}$/u);
        else expect(sentence, exercise.id).toMatch(/^[A-ZÀ-Ý].*[.!?…]$/u);
      }
      expect(exercise.instruction, exercise.id).toMatch(/^Transpose au (pluriel|singulier|féminin)\.$|^Remplace/);
      if (exercise.instruction.startsWith('Remplace')) expect(exercise.instruction, exercise.id).toMatch(SWAP);
    }
  });

  it('va bien dans le sens de la consigne', () => {
    for (const { exercise } of all) {
      const changed = boxesOf(exercise.text).filter((b) => !isTrap(b));
      const plural = changed.filter((b) => /^(les|des|ils|elles|nous)$/i.test(b.answer.split(' ')[0]!) || /(s|x|nt)$/.test(b.answer));
      if (exercise.instruction === 'Transpose au pluriel.') expect(plural.length, exercise.id).toBeGreaterThan(0);
      if (exercise.instruction === 'Transpose au singulier.') expect(changed.some((b) => /^(les|des|mes|tes|ses|ces|ils|elles|nous)$/i.test(b.start.split(' ')[0]!)), exercise.id).toBe(true);
      if (exercise.instruction === 'Transpose au féminin.') expect(changed.every((b) => !/(s|x)$/.test(b.answer) || /(s|x)$/.test(b.start)), exercise.id).toBe(true);
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
    for (const belt of ACCORDS.slice(1)) {
      expect(belt.texts.filter((e) => boxesOf(e.text).some(isTrap)).length, belt.belt).toBeGreaterThanOrEqual(8);
    }
  });

  it('met la majuscule en début de phrase, pas aux mots seuls', () => {
    expect(boxesOf('{Son|Ses} {genou|genoux} gonfle. {Il|Ils} {est|sont} bleu.').map((b) => b.capital)).toEqual([true, false, true, false]);
    expect(boxesOf('{cet|cette} {acteur|actrice} / {un|une} {musicien|musicienne}').some((b) => b.capital)).toBe(false);
    expect(sentenceOf('{cet|cette} {acteur|actrice} / {réel|réelle}', 'answer')).toBe('cette actrice / réelle');
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
    expect(tip('{Mon}')).toMatch(/voyelle/);
    expect(tip('{souris}')).toMatch(/-s, -x ou -z/);
    expect(tip('{cheval|chevaux}')).toMatch(/-aux/);
    expect(tip('{travaux|travail}')).toMatch(/-ail/);
    expect(tip('{genou|genoux}')).toMatch(/-x/);
    expect(tip('{ce|ces}')).toMatch(/ces/);
    expect(tip('{ces|cette}')).toMatch(/Au singulier/);
    expect(tip('{cet|cette}')).toMatch(/Au féminin/);
    expect(tip('{a|ont}')).toMatch(/avoir/);
    expect(tip('{Nous effaçons|J’efface}')).toMatch(/Je devient nous/);
    expect(tip('{acteur|actrice}')).toMatch(/-trice/);
    expect(tip('{boucher|bouchère}')).toMatch(/-ère/);
    expect(tip('{gardien|gardienne}')).toMatch(/double/);
    expect(tip('{sportif|sportive}')).toMatch(/-ve/);
    expect(tip('{cheval|jument}')).toMatch(/changent complètement/);
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
