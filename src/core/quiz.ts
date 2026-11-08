// Ce que l'écran de question attend d'une série, quelle que soit l'activité.

export interface QuizQuestion {
  /** Texte affiché, ex. « 7 × 8 ». */
  prompt: string;
  /** Texte après la case réponse, ex. « = 56 » pour « 7 × ? = 56 » ; sinon « = » suit le texte. */
  suffix?: string;
  /** En petit au-dessus de la question, ex. « manger · futur ». */
  context?: string;
  /** Réponse attendue : un nombre (pavé, avec la virgule pour un décimal) ou des mots (clavier de lettres). */
  answer: number | string;
  /** Autres réponses justes, ex. « allée » quand le genre ne se voit pas. */
  alsoAccepted?: readonly string[];
  /** L'astuce, montrée après une erreur (« + 9, c'est + 10 − 1 : … »). */
  explain?: string;
  /** Pavé, clavier de lettres, ou colorier en touchant le dessin (`paint` : la réponse est le nombre de parts coloriées). */
  input?: 'digits' | 'letters' | 'paint';
  /** Répondre en touchant un bouton (« < », « oui ») ; la réponse attendue est la `value` du bon. */
  choices?: readonly Choice[];
  /**
   * `number` : les boutons sont les chiffres du nombre, à toucher dans le nombre (« le chiffre des dizaines ») ;
   * `line` : ce sont les graduations de la droite (`value` : leur rang), à toucher pour placer une fraction.
   */
  choiceLayout?: 'number' | 'line';
  /** La question résolue, pour les listes et la correction : « Dans 54, le chiffre des dizaines est 5. » */
  solved?: string;
  /** Une droite graduée ou un dessin (billes, rectangle), au-dessus de la question. */
  figure?: Figure;
  /**
   * Ranger : les `choices` se touchent dans l'ordre, du plus grand au plus petit (`>`) ou l'inverse (`<`) ;
   * la réponse est leurs `label` dans l'ordre, séparés par le signe : « 4,4 > 4,36 > 4,3 > 4,07 ».
   */
  order?: '<' | '>';
  /**
   * Mesures : le nombre au pavé, puis l'unité en touchant un de ces boutons (« mm », « cm », « m »).
   * La réponse s'écrit « 14 m » ; une mesure égale dans une autre unité (`alsoAccepted` : « 1 400 cm ») est juste aussi.
   */
  units?: readonly string[];
}

export type Figure = NumberLineFigure | PartsFigure | RulerFigure;

export interface Choice {
  label: string;
  value: string;
}

/**
 * Une droite graduée : `count` graduations, `step` de l'une à l'autre à partir de `from` ;
 * les nombres écrits au-dessus des graduations `labels` (leur rang), les repères (« A » sur la graduation `at`).
 */
export interface NumberLineFigure {
  from: number;
  step: number;
  count: number;
  labels: readonly number[];
  markers: readonly { at: number; name: string }[];
}

/**
 * Un dessin partagé en `count` parts égales, dont `colored` coloriées (fractions) : des billes,
 * un rectangle quadrillé de `columns` colonnes, ou des barres de `columns` parts (une barre = une unité).
 */
export interface PartsFigure {
  shape: 'marbles' | 'grid' | 'bars';
  count: number;
  columns: number;
  colored: number;
}

/** Mesures : un segment de `length` mm posé sur une règle graduée, son bout gauche à `start` mm du 0. */
export interface RulerFigure {
  ruler: { start: number; length: number };
}

export const isNumberLine = (figure: Figure): figure is NumberLineFigure => 'step' in figure;
export const isRuler = (figure: Figure): figure is RulerFigure => 'ruler' in figure;

export interface QuizSession<Q extends QuizQuestion = QuizQuestion> {
  /** Nombre de questions de la série (sans compter celles qui reviennent). */
  readonly total: number;
  /** Nombre de questions déjà tentées une première fois. */
  readonly attempted: number;
  /** Question à poser, ou undefined quand la série est finie. */
  current(): Q | undefined;
  /** Enregistre la réponse tapée à la question courante ; renvoie true si elle est juste. */
  answer(typed: string, elapsedMs: number): boolean;
  /** Test (ceintures) : annule la dernière réponse et la renvoie, pour la corriger. */
  undo?(): string | undefined;
}

/** Ce qui ne compte pas dans une réponse en mots : espaces en trop, majuscules. Les accents comptent. */
export function normalizeAnswer(text: string): string {
  return text.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');
}

/** Un nombre écrit à la française : 1,2 et non 1.2. */
export const numberText = (n: number) => String(n).replace('.', ',');

/** Les classes séparées par une espace insécable, comme en classe (leçon N10) : 1 808, 57 842,5. */
export function groupDigits(text: string): string {
  const [whole, decimals] = text.split(',') as [string, string?];
  const grouped = whole.length < 4 ? whole : whole.replace(/\B(?=(\d{3})+$)/g, '\u00a0');
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
}

/** La réponse attendue telle qu'on l'écrit : « 1,2 », « mangerons », « 5 » (le chiffre touché). */
export const answerText = (question: QuizQuestion) =>
  typeof question.answer === 'number'
    ? numberText(question.answer)
    : (question.choices?.find((c) => c.value === question.answer)?.label ?? question.answer);

/** Toutes les réponses justes, l'attendue en premier. */
export function acceptedAnswers(question: QuizQuestion): string[] {
  return [answerText(question), ...(question.alsoAccepted ?? [])];
}

/** « 1 400 cm » : le nombre (1400) et l'unité ; l'unité est vide tant qu'elle n'est pas choisie. */
export function splitMeasure(text: string): { number: string; unit: string } {
  const at = text.lastIndexOf(' ');
  return at === -1 ? { number: text, unit: '' } : { number: text.slice(0, at).replace(/\s/g, ''), unit: text.slice(at + 1) };
}

/** Une mesure telle qu'on l'écrit : « 1 400 cm », le nombre par classes. */
export function measureText(text: string): string {
  const { number, unit } = splitMeasure(text);
  return [groupDigits(number), unit].filter(Boolean).join(' ');
}

export function isCorrect(question: QuizQuestion, typed: string): boolean {
  // Une mesure : le même nombre (3,50 = 3,5) dans la même unité, pour l'une des réponses justes.
  if (question.units) {
    const given = splitMeasure(typed);
    const value = (n: string) => Number(n.replace(',', '.'));
    return (
      given.number !== '' &&
      acceptedAnswers(question).some((a) => {
        const expected = splitMeasure(a);
        return expected.unit === given.unit && value(expected.number) === value(given.number);
      })
    );
  }
  // Un décimal se tape avec la virgule ; 3,50 est le même nombre que 3,5.
  if (typeof question.answer === 'number') return typed.trim() !== '' && Number(typed.replace(',', '.')) === question.answer;
  // Un bouton touché : sa valeur, pas ce qu'il montre (deux chiffres 4 dans 44).
  if (question.choices) return typed === question.answer;
  const answer = normalizeAnswer(typed);
  return acceptedAnswers(question).some((a) => normalizeAnswer(a) === answer);
}

/** Mélange de Fisher-Yates ; `random` est remplaçable pour les tests. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
