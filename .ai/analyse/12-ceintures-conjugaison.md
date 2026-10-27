# Ceintures : la Conjugaison

Deuxième matière de l'activité « Ceintures » (voir [11-ceintures.md](11-ceintures.md)), après les
Homophones. Analyse du 26/10/2026, à partir du classeur (« Je conjugue les verbes au… », avec ses
« Attention aux pièges ! ») et de la fiche « entrainement conjugaison verbe.pdf » (Charivari à l'école).
La fiche scannée « entrainement conj.pdf » n'est pas utilisée (pas de texte).

## Décisions du 26/10/2026

- **Mêmes règles d'accès et de validation que les Homophones** : toutes les ceintures ouvertes,
  la prochaine à faire mise en avant (« À toi ! ») ; entraînement libre ; **entraînement en conditions
  réelles** jamais bloqué (sauf juste après un échec : un entraînement d'abord), réussi à **90 %**,
  sans correction pendant, corrigé à la fin ; « tu peux la passer en classe » ; **seul un adulte note
  une ceinture obtenue** (depuis la 0.28.1, seulement par l'écran « Ceintures obtenues en classe ») ;
  autocollants dès la réussite en conditions réelles.
- **L'enfant tape chaque forme** au clavier de lettres de l'activité Conjugaison, comme sur la fiche :
  « Conjugue le verbe parler au présent », puis le pronom affiché (« nous ») et la forme à taper
  (« parlons »). Pas de boutons à choisir : c'est ce qu'il fera en classe.
- **Bleu clair : passé simple**, comme le classeur (les titres de la fiche annoncent l'imparfait et le
  futur, mais ses corrections sont au passé simple).
- **Pas de ceinture noire pour l'instant** (temps composés avec être et avoir : pas de fiche).
  L'échelle de la Conjugaison s'arrête à la marron.

## Les ceintures

| Ceinture | Compétence (classeur) | Temps | Exercices |
| --- | --- | --- | --- |
| Blanche | Présent des verbes en -er, être et avoir | présent | 7 fiche + 4 |
| Jaune | Imparfait des verbes réguliers, être et avoir | imparfait | 7 + 3 |
| Orange | Futur des verbes réguliers, être, avoir, aller, faire, dire, venir | futur | 13 |
| Rose | Présent des verbes en -ir et -re — **objectif de fin de CM1** | présent | 7 + 4 |
| Vert clair | Passé composé avec avoir ; impératif des verbes réguliers | passé composé, impératif | 14 |
| Vert foncé | Imparfait et futur des verbes en -ger, -cer, -ier | imparfait, futur | 7 + 5 |
| Bleu clair | Passé simple | passé simple | 7 + 3 |
| Bleu foncé | Présent de tous les verbes courants — **objectif de fin de CM2** | présent | 7 + 5 |
| Violette | Conditionnel | conditionnel | 7 + 3 |
| Marron | Futur antérieur et plus-que-parfait | futur antérieur, plus-que-parfait | 6 + 3 |

Les objectifs sont placés comme pour les Homophones : le repère du classeur suit la ceinture qu'il
marque (rose pour le CM1, bleu foncé pour le CM2).

Un exercice = un verbe à un temps : **six formes** (je … ils), ou **trois** à l'impératif (tu, nous,
vous, sans pronom). Avec l'auxiliaire être (« je serai venu »), le participe s'accorde : masculin et
féminin acceptés pour je, tu, nous, vous ; à la 3ᵉ personne, le pronom affiché (il / elle) dit lequel
attendre — comme dans l'activité Conjugaison.

La leçon de chaque ceinture reprend ses **« Attention aux pièges ! »** du classeur.

## Erreurs des fiches, corrigées en recopiant

- Jaune D : « écouter » à l'imparfait est corrigé au présent (« j'écoute ») → « j'écoutais ».
- Violette D : « il ferai » → « il ferait ».
- Marron D et E (plus-que-parfait) : « nous avons fait, vous avez fait » → « nous avions, vous aviez ».
- Marron F : « partir » au plus-que-parfait, corrigé au conditionnel ; la fiche G donne la bonne
  correction (« j'étais parti ») : F n'est pas reprise.
- Orange M reprend Orange I (« préparer » au futur) : gardé une fois.
- Bleu clair : titres « à l'imparfait / au futur », corrections au passé simple (voir plus haut).

## Données

`src/activities/ceintures/conjugaison.ts` : par ceinture, la compétence, l'objectif, les pièges et les
exercices (`blanche.1`… ; lettre de la fiche, ou rien pour les nôtres). Les formes sont écrites à la
main ; `conjugaison.test.ts` les vérifie autrement : mêmes formes que l'activité Conjugaison quand le
verbe y est, terminaisons et radical de chaque temps, présent des verbes en -er (nous mangeons, nous
lançons), table de référence pour les autres présents, futur et conditionnel au même radical,
impératif tiré du présent, auxiliaires des temps composés et accord avec être.

Progression du profil : sous `ceintures`, une nouvelle matière `conjugaison` (même forme que
`homophones` : ceintures obtenues, réussies en conditions réelles, dernier entraînement, échec, stats).

## Étapes proposées

1. **Données** : les 10 ceintures et leurs exercices, avec leurs tests.
   Faite le 26/10/2026 (0.25.0) : 112 exercices dont 82 des fiches. Pas encore visible dans l'app.
2. **La matière dans l'app** : une tuile « Conjugaison » à l'accueil des Ceintures, son échelle et sa
   leçon (les pièges, et un exemple conjugué) ; le code des Ceintures devient commun aux matières
   (aujourd'hui écrit pour les phrases à trous).
   Faite le 26/10/2026 (0.26.0) : `subjects.ts` (deux matières ; une ceinture est `HomophoneBelt` ou
   `ConjugationBelt`, `isHomophoneBelt` les distingue), `data.ts` (une progression par matière, lue pour
   chaque matière de `SUBJECTS`), tuile « ✏️ Conjugaison », échelle avec les mêmes règles (repères CM1
   sur la rose, CM2 sur la bleu foncé), « Ceintures obtenues en classe », « Mes progrès » et autocollants
   de la matière (partie « Conjugaison » de l'album). Leçon : la carte « Attention aux pièges ! », puis un
   verbe conjugué à chaque temps de la ceinture, sur deux colonnes comme la fiche (je, tu, il | nous,
   vous, ils), la forme en couleur ; de préférence un verbe ordinaire (parler plutôt qu'être à
   l'impératif). En attendant l'étape 3, l'échelle dit « L’entraînement arrive bientôt. » à la place
   des boutons d'entraînement.
3. **Entraînement** : un verbe de la ceinture, ses formes tapées une à une, corrigées tout de suite
   (une forme ratée revient plus tard) ; résultat « 5 / 6 du premier coup ».
   Faite le 26/10/2026 (0.27.0) : `verb-practice.ts` (un verbe au hasard dans la ceinture, de préférence
   pas celui du dernier entraînement ; formes dans l'ordre de la fiche, je → ils ; à l'impératif, la
   personne rappelée entre parenthèses, « (tu) », sans pronom à écrire ; avec être, il / elle au hasard
   et le participe accordé), sur l'écran de question de l'activité Conjugaison (clavier de lettres,
   différence surlignée après une erreur). Résultat : « 5 / 6 du premier coup », les formes à
   retravailler (« nous plaçons »), Encore / Leçon. Un entraînement réussi (90 %) demande donc toutes
   les formes justes. Touche « û » ajoutée au clavier (passé simple : nous fûmes, vous eûtes).
   Corrigé au passage : le meilleur score enregistré ne garde plus la liste des phrases à retravailler.
4. **Entraînement en conditions réelles** : 3 verbes de la ceinture (chaque temps de la ceinture
   représenté, de préférence pas celui du dernier entraînement), sans correction pendant, 90 % des
   formes justes, la correction à la fin ; progrès et autocollants de la matière.
   Faite le 26/10/2026 (0.28.0) : `verb-test.ts` (3 verbes différents, chaque temps de la ceinture
   représenté, de préférence pas celui du dernier entraînement ; 18 formes, 15 avec l'impératif ;
   réussi à 90 %, soit une faute au plus sur 18). L'écran de question a un mode test (`test`) : la
   forme se place sans dire si elle est juste. Bouton « Entraînement en conditions réelles · 3 verbes,
   sans aide » sur l'échelle et à la fin d'un entraînement réussi ; mêmes résultats que les Homophones
   (« Réussi ! », « tu peux passer la ceinture en classe », autocollants ; raté : « Entraîne-toi
   d'abord »). Correction verbe par verbe : « Jouer au présent », puis « nous ~~jouon~~ jouons ».
   Progrès et autocollants de la matière : déjà en place depuis l'étape 2.

5. **Plusieurs verbes par série, avec un piège** (0.30.0, 27/10/2026, demandé : « tu ne donnes qu'un
   verbe »). L'entraînement tire maintenant **3 verbes** au hasard parmi ceux de la ceinture (qui
   respectent sa règle : verbes en -er à la blanche, en -ir et -re à la rose…), comme l'entraînement en
   conditions réelles, avec la même fonction (`pickExercises` dans `verb-practice.ts`) : verbes
   différents, chaque temps de la ceinture représenté, de préférence pas ceux de la dernière fois, et
   **au moins un piège**. Les pièges sont marqués exercice par exercice (`Exercise.trap`, liste de
   numéros par ceinture dans `conjugaison.ts`), d'après les « Attention aux pièges ! » :

   | Ceinture | Pièges |
   | --- | --- |
   | Blanche | être, avoir, -ger, -cer (nous mangeons, nous lançons) |
   | Jaune | être, avoir, les deux s (je finissais), nous pliions |
   | Orange | être, avoir, aller, faire, dire, venir, je plierai |
   | Rose | croire, écrire, dire, partir, sortir, lire, rendre (pas comme « nous finissons ») |
   | Vert clair | être, avoir, parle ! (pas de -s), mangeons !, pu, été, eu, cru |
   | Vert foncé | nager, grincer, payer, plier, commencer, crier, travailler à l'imparfait ; courir, pouvoir au futur |
   | Bleu clair | être, avoir, faire, dire, prendre, venir |
   | Bleu foncé | dire, faire, voir, croire (les pièges du classeur) |
   | Violette | être, avoir, faire, vouloir, aller, pouvoir |
   | Marron | venir, partir, aller (auxiliaire être, accord) |

   Chaque ceinture garde aussi des verbes ordinaires. Une série d'entraînement fait 18 formes (15 avec
   l'impératif) : réussie à 90 %, elle permet maintenant une faute.

Depuis la 0.29.0, on peut revenir à la forme d'avant pendant l'entraînement en conditions réelles
(voir 11-ceintures.md).

La Conjugaison est complète, de la blanche à la marron. Reste possible plus tard : la ceinture noire.
