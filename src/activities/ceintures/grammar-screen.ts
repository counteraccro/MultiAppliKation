import { soundToggle } from '../../components/sound-toggle';
import { h } from '../../core/dom';
import { sounds } from '../../core/sound';
import {
  decodeMarks,
  encodeMarks,
  mainTag,
  paint,
  sameMarks,
  TAGS,
  wordsOf,
  type GrammarQuestion,
  type GrammarTag,
  type Piece,
  type WordMarks,
} from './grammaire';
import { withNbsp } from './sentence';
import type { CalcPracticeSession, CalcTestSession } from './table-practice';

/** Une phrase juste reste affichée un instant avant la suivante. */
const NEXT_PAUSE_MS = 800;
/** Comme les autres écrans : « d'affilée » à partir de 3, fête tous les 5. */
const STREAK_SHOWN_FROM = 3;
const STREAK_MILESTONE = 5;
/** Au-delà de ces mots (les petits textes des pronoms), la phrase s'écrit plus petit. */
const LONG_SENTENCE = 22;

export interface GrammarScreenOptions {
  session: CalcPracticeSession<GrammarQuestion> | CalcTestSession<GrammarQuestion>;
  /** Test de passage : la phrase se valide sans dire si elle est juste, tout est corrigé à la fin. */
  test?: boolean;
  label: string;
  onDone(summary: { bestStreak: number }): void;
  onQuit(): void;
}

/**
 * Grammaire. Les fonctions : l'enfant prend un crayon (Verbe, Sujet…), touche les mots pour les colorier,
 * puis valide ; retoucher un mot avec le même crayon l'efface. Les natures : le mot souligné en cours est
 * entouré, l'enfant touche sa nature et passe au suivant ; toucher un mot souligné y revient.
 * La phrase est juste si tout est exact : chaque groupe en entier, sans mot en trop. Une erreur montre
 * sa phrase, les mots faux barrés, et la correction en dessous. Renvoie la fonction de nettoyage.
 */
export function renderGrammarScreen(root: HTMLElement, options: GrammarScreenOptions): () => void {
  const { session } = options;
  let question: GrammarQuestion | undefined;
  let marks: WordMarks[] = [];
  let pencil: GrammarTag = 'V';
  /** Natures : le premier mot du groupe souligné en cours. */
  let current: number | undefined;
  let state: 'asking' | 'correct' | 'wrong' = 'asking';
  let timer: number | undefined;
  let started = 0;
  let streak = 0;
  let bestStreak = 0;

  const instruction = h('p', { class: 'gram-instruction' });
  const sentence = h('div', { class: 'gram-sentences', 'aria-live': 'polite' });
  const feedback = h('p', { class: 'feedback', 'aria-live': 'polite' });
  const streakEl = h('p', { class: 'streak', 'aria-live': 'polite' });
  const progress = h('div', { class: 'progress', 'aria-hidden': 'true' });
  const progressText = h('span', { class: 'visually-hidden' });
  const buttons = h('div', { class: 'gram-buttons' });
  const testSession = options.test ? (session as CalcTestSession<GrammarQuestion>) : undefined;
  const undoButton =
    testSession && h('button', { class: 'link-button undo', type: 'button', onclick: undo }, '← Revenir à la phrase d’avant');

  const isNature = () => question?.exercise.mode === 'nature';
  /** Natures : les mots du même groupe souligné que `index`. */
  const unitOf = (index: number) => {
    const words = wordsOf(question!.pieces);
    const unit = words[index]!.unit;
    return words.flatMap((w, i) => (w.unit !== undefined && w.unit === unit ? [i] : []));
  };
  /** Natures : le premier mot de chaque groupe souligné, dans l'ordre. */
  const unitStarts = () => wordsOf(question!.pieces).flatMap((w, i, all) => (w.tags.length > 0 && (i === 0 || all[i - 1]!.unit !== w.unit) ? [i] : []));

  function undo() {
    const typed = testSession?.undo();
    if (typed === undefined) return;
    window.clearTimeout(timer);
    question = session.current();
    if (!question) return;
    marks = decodeMarks(typed, question.expected.length);
    pencil = question.exercise.pencils[0]!;
    current = isNature() ? unitStarts()[0] : undefined;
    ask();
    renderProgress();
  }

  function tap(index: number) {
    if (state !== 'asking' || !question) return;
    if (isNature()) {
      current = unitOf(index)[0];
      renderSentence();
      return;
    }
    marks[index] = paint(marks[index]!, pencil);
    renderSentence();
  }

  /** Natures : la nature touchée va au mot en cours, puis on passe au suivant sans nature. */
  function giveNature(tag: GrammarTag) {
    if (state !== 'asking' || current === undefined) return;
    for (const i of unitOf(current)) marks[i] = [tag];
    const starts = unitStarts();
    const after = [...starts.filter((s) => s > current!), ...starts.filter((s) => s < current!)];
    current = after.find((s) => marks[s]!.length === 0) ?? current;
    renderSentence();
  }

  function validate() {
    if (state !== 'asking' || !question) return;
    const firstTry = !options.test && !(session as CalcPracticeSession<GrammarQuestion>).attempts().some((a) => a.question === question);
    const correct = session.answer(encodeMarks(marks, question.exercise.pencils), Date.now() - started);
    current = undefined;
    if (options.test) {
      state = 'correct';
      sounds.placed();
      renderSentence();
      buttons.replaceChildren();
      timer = window.setTimeout(next, NEXT_PAUSE_MS / 2);
    } else if (correct) {
      state = 'correct';
      if (firstTry) streak++;
      bestStreak = Math.max(bestStreak, streak);
      const milestone = firstTry && streak % STREAK_MILESTONE === 0;
      if (milestone) sounds.streak();
      else sounds.correct();
      renderStreak(milestone);
      feedback.textContent = 'Bravo !';
      renderSentence();
      buttons.replaceChildren();
      timer = window.setTimeout(next, NEXT_PAUSE_MS);
    } else {
      state = 'wrong';
      streak = 0;
      sounds.wrong();
      renderStreak(false);
      feedback.textContent = withNbsp(question.exercise.tip);
      renderSentence();
      buttons.replaceChildren(h('button', { class: 'button primary continue', type: 'button', onclick: next }, 'Continuer →'));
    }
    renderProgress();
  }

  function next() {
    window.clearTimeout(timer);
    question = session.current();
    if (!question) return options.onDone({ bestStreak });
    marks = question.expected.map(() => []);
    pencil = question.exercise.pencils[0]!;
    current = isNature() ? unitStarts()[0] : undefined;
    ask();
    renderProgress();
  }

  function ask() {
    if (!question) return;
    state = 'asking';
    started = Date.now();
    feedback.textContent = '';
    instruction.textContent = question.exercise.instruction;
    renderSentence();
    renderButtons();
  }

  function renderSentence() {
    if (!question) return;
    const { pieces, expected, exercise } = question;
    const nature = exercise.mode === 'nature';
    sentence.classList.toggle('long', expected.length > LONG_SENTENCE);
    if (state === 'wrong') {
      // Sa phrase, les mots faux barrés ; la bonne en dessous, ce qui change en couleur.
      sentence.replaceChildren(
        h('p', { class: 'gram-sentence gram-given' }, ...drawSentence(pieces, marks, { nature, expected })),
        h('p', { class: 'gram-fix-title' }, 'La correction :'),
        h('p', { class: 'gram-sentence gram-fixed' }, ...drawSentence(pieces, expected, { nature, given: marks })),
      );
      return;
    }
    const asking = state === 'asking';
    sentence.replaceChildren(
      h(
        'p',
        { class: `gram-sentence${state === 'correct' && !options.test ? ' is-correct' : ''}` },
        ...drawSentence(pieces, marks, {
          nature,
          onTap: asking ? tap : undefined,
          current: asking && current !== undefined ? unitOf(current) : undefined,
        }),
      ),
    );
  }

  function renderButtons() {
    if (!question) return;
    const { pencils, mode } = question.exercise;
    if (mode === 'nature') {
      buttons.replaceChildren(
        h(
          'div',
          { class: 'natures', role: 'group', 'aria-label': 'Natures' },
          ...pencils.map((tag) =>
            h('button', { class: `nature gram-nature-${tag}`, type: 'button', onclick: () => giveNature(tag) }, TAGS[tag].name),
          ),
        ),
        h('button', { class: 'button primary gram-ok', type: 'button', onclick: validate }, 'Valider'),
      );
      return;
    }
    // Un seul crayon : déjà dans la main, pas besoin de le choisir.
    const choice =
      pencils.length > 1 &&
      h(
        'div',
        { class: 'pencils', role: 'group', 'aria-label': 'Crayons' },
        ...pencils.map((tag) =>
          h(
            'button',
            {
              class: 'pencil',
              type: 'button',
              'aria-pressed': String(tag === pencil),
              onclick: () => {
                pencil = tag;
                renderButtons();
              },
            },
            h('span', { class: `gram-group gram-${tag}` }, TAGS[tag].name),
          ),
        ),
      );
    buttons.replaceChildren(
      ...(choice ? [choice] : []),
      h('button', { class: 'button primary gram-ok', type: 'button', onclick: validate }, 'Valider'),
    );
  }

  function renderStreak(milestone: boolean) {
    streakEl.textContent = streak >= STREAK_SHOWN_FROM ? `🔥 ${streak} d’affilée !` : '';
    streakEl.classList.remove('bump', 'milestone');
    void streakEl.offsetWidth;
    if (streak >= STREAK_SHOWN_FROM) streakEl.classList.add(milestone ? 'milestone' : 'bump');
  }

  function renderProgress() {
    progress.replaceChildren(
      ...Array.from({ length: session.total }, (_, i) => h('span', { class: i < session.attempted ? 'dot done' : 'dot' })),
    );
    progressText.textContent = `Phrase ${Math.min(session.attempted + 1, session.total)} sur ${session.total}`;
    if (undoButton) undoButton.hidden = session.attempted === 0;
  }

  // Au clavier d'ordinateur : 1, 2… pour les crayons (fonctions), Entrée pour valider ou continuer.
  const onKeydown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey || document.querySelector('.overlay')) return;
    if (event.key === 'Enter') {
      if (state === 'asking') validate();
      else if (state === 'wrong') next();
      else return;
    } else if (/^[1-9]$/.test(event.key) && state === 'asking' && question && !isNature()) {
      const tag = question.exercise.pencils[Number(event.key) - 1];
      if (!tag) return;
      pencil = tag;
      renderButtons();
    } else {
      return;
    }
    event.preventDefault();
  };
  document.addEventListener('keydown', onKeydown);

  root.append(
    h(
      'section',
      { class: 'play choices grammar' },
      h(
        'header',
        { class: 'play-bar' },
        h('button', { class: 'quit', type: 'button', 'aria-label': 'Arrêter', onclick: options.onQuit }, '✕'),
        h('span', { class: 'play-label' }, options.label),
        progress,
        progressText,
        soundToggle(),
      ),
      h('div', { class: 'question' }, instruction, sentence, feedback, streakEl, undoButton),
      h('div', { class: 'keypad-area' }, buttons),
    ),
  );

  next();

  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('keydown', onKeydown);
  };
}

export interface DrawOptions {
  /** Exercice de natures : seuls les mots soulignés se touchent, leur nature s'écrit dessous. */
  nature?: boolean;
  /** Les mots se touchent pour les colorier (ou, aux natures, pour y revenir). */
  onTap?: (index: number) => void;
  /** Natures : les mots du groupe souligné en cours. */
  current?: readonly number[];
  /** Sa phrase à corriger : les mots marqués à tort barrés, les oubliés marqués d'un trait rouge. */
  expected?: readonly WordMarks[];
  /** La correction : les mots qui changent par rapport à sa phrase sont mis en couleur. */
  given?: readonly WordMarks[];
}

/**
 * La phrase marquée. Fonctions : les mots qui se suivent avec le même crayon forment un groupe (surligné,
 * souligné, entouré) avec son étiquette dessous (S, COD) ; un complément du nom forme un petit groupe dedans.
 * Natures : chaque mot souligné, et dessous la nature donnée. Sert à l'écran, à la correction et à la leçon.
 */
export function drawSentence(pieces: readonly Piece[], marks: readonly WordMarks[], options: DrawOptions = {}): Node[] {
  return options.nature ? drawNatures(pieces, marks, options) : drawFunctions(pieces, marks, options);
}

function drawFunctions(pieces: readonly Piece[], marks: readonly WordMarks[], options: DrawOptions): Node[] {
  const nodes: Node[] = [];
  // Le groupe en cours (une fonction), et dedans le complément du nom en cours.
  let outer: { tag: GrammarTag; el: HTMLElement } | undefined;
  let inner: HTMLElement | undefined;
  /** L'espace entre deux mots du même groupe : il va dans le groupe, avec le mot d'après. */
  let pending = '';
  let index = 0;
  const count = wordsOf(pieces).length;
  const groupOf = (tag: GrammarTag) => h('span', { class: `gram-group gram-${tag}`, 'data-label': TAGS[tag].label });
  for (const piece of pieces) {
    if (typeof piece === 'string') {
      const next = index < count ? marks[index]! : undefined;
      const goesOn =
        next !== undefined &&
        /^\s+$/.test(piece) &&
        (outer ? mainTag(next) === outer.tag : inner !== undefined && next.includes('CdN') && !mainTag(next));
      if (goesOn) pending = withNbsp(piece);
      else {
        outer = undefined;
        inner = undefined;
        nodes.push(document.createTextNode(withNbsp(piece)));
      }
      continue;
    }
    const i = index++;
    const wordMarks = marks[i]!;
    const tag = mainTag(wordMarks);
    if (outer?.tag !== tag) {
      outer = tag ? { tag, el: groupOf(tag) } : undefined;
      inner = undefined;
      if (outer) nodes.push(outer.el);
    }
    const add = (parent: HTMLElement | undefined, ...children: (Node | string)[]) =>
      parent ? parent.append(...children) : nodes.push(...children.map((c) => (typeof c === 'string' ? document.createTextNode(c) : c)));
    if (pending) add(wordMarks.includes('CdN') && inner ? inner : outer?.el, pending);
    pending = '';
    if (wordMarks.includes('CdN')) {
      if (!inner) {
        inner = groupOf('CdN');
        add(outer?.el, inner);
      }
    } else {
      inner = undefined;
    }
    add(inner ?? outer?.el, drawWord(piece.word, i, wordMarks, options));
  }
  return nodes;
}

function drawNatures(pieces: readonly Piece[], marks: readonly WordMarks[], options: DrawOptions): Node[] {
  const nodes: Node[] = [];
  let index = 0;
  let unit: { id: number; el: HTMLElement; text: HTMLElement } | undefined;
  const words = wordsOf(pieces);
  for (const piece of pieces) {
    if (typeof piece === 'string') {
      const text = withNbsp(piece);
      // L'espace entre deux mots du même groupe souligné reste dans le groupe (« ai pu »).
      if (unit && /^\s*$/.test(piece) && words[index]?.unit === unit.id) unit.text.append(text);
      else {
        unit = undefined;
        nodes.push(document.createTextNode(text));
      }
      continue;
    }
    const i = index++;
    // Aux natures, seuls les mots soulignés se touchent.
    const word = drawWord(piece.word, i, marks[i]!, piece.unit === undefined ? { ...options, onTap: undefined } : options);
    if (piece.unit === undefined) {
      unit = undefined;
      nodes.push(word);
      continue;
    }
    if (!unit || unit.id !== piece.unit) {
      // Un groupe souligné : ses mots, et dessous la nature donnée (vide tant qu'il n'en a pas).
      const tag = marks[i]![0];
      const isCurrent = options.current?.includes(i) ?? false;
      const text = h('span', { class: 'gram-unit-text' });
      const el = h(
        'span',
        { class: `gram-unit${tag ? ` gram-nature-${tag}` : ''}${isCurrent ? ' current' : ''}` },
        text,
        h('span', { class: 'gram-unit-label' }, tag ? TAGS[tag].label! : '?'),
      );
      unit = { id: piece.unit, el, text };
      nodes.push(el);
    }
    unit.text.append(word);
  }
  return nodes;
}

function drawWord(text: string, index: number, marks: WordMarks, { onTap, expected, given }: DrawOptions): HTMLElement {
  const classes = ['gram-word'];
  if (expected && !sameMarks(marks, expected[index]!)) classes.push(marks.length > 0 ? 'is-wrong' : 'is-missed');
  if (given && !sameMarks(marks, given[index]!)) classes.push('is-fix');
  if (!onTap) return h('span', { class: classes.join(' ') }, text);
  return h(
    'span',
    {
      class: `${classes.join(' ')} tappable`,
      role: 'button',
      tabindex: 0,
      'aria-pressed': String(marks.length > 0),
      onclick: () => onTap(index),
      onkeydown: (event: Event) => {
        const key = (event as KeyboardEvent).key;
        if (key !== ' ' && key !== 'Enter') return;
        event.preventDefault();
        event.stopPropagation();
        onTap(index);
      },
    },
    text,
  );
}
