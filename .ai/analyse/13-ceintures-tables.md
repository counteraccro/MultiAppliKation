# Ceintures : les Tables de multiplication

Troisième matière de l'activité « Ceintures » (voir [11-ceintures.md](11-ceintures.md)), après les
Homophones et la Conjugaison. Analyse du 27/10/2026, à partir du classeur (« En une minute, je réponds
à des calculs sur… »). Pas de fiche d'entraînement : les calculs se tirent des tables de la ceinture.

## Décisions du 27/10/2026

- **Mêmes règles d'accès et de validation** que les autres matières : toutes les ceintures ouvertes,
  la prochaine à faire mise en avant ; entraînement libre ; entraînement en conditions réelles jamais
  bloqué (sauf juste après un échec), réussi à **90 %**, « tu peux la passer en classe ».
- **Conditions réelles : 20 calculs en 1 minute**, comme en classe. Réussi avec au moins 18 calculs
  justes ; ceux qu'on n'a pas eu le temps de faire comptent faux. Pas de correction pendant, tout est
  corrigé à la fin (« Pas eu le temps : … »).
- **Les divisions plus tard** (mauve : sans reste ; violette et marron : avec reste — même intitulé dans
  le classeur, à préciser). Pour l'instant : blanche → bleu foncé, puis noire et brillante.
- **Brillante : 30 calculs en 1 minute**, toutes les tables de 1 à 12.

## Les ceintures

| Ceinture | Classeur | Calculs |
| --- | --- | --- |
| Blanche | Tables de 2 et 10 | 19 (2 × 10 une seule fois) |
| Jaune | Table de 5 | 10 |
| Orange | Table de 3 | 10 |
| Rose | Table de 4 | 10 |
| Vert clair | Table de 6 | 10 |
| Vert foncé | Table de 7 | 10 |
| Bleu clair | Table de 8 | 10 |
| Bleu foncé | Table de 9 — **objectif de fin de CE2** | 10 |
| *Mauve* | *Division sans reste — objectif de fin de CM1* | *plus tard* |
| *Violette* | *Division avec reste* | *plus tard* |
| *Marron* | *Division avec reste* | *plus tard* |
| Noire | Tables de 1 à 12 — **objectif de fin de CM2** | 1 à 12, × 1 à × 10 |
| Brillante | Toutes les précédentes, plus rapidement | les mêmes, 30 en 1 minute |

Une table va de × 1 à × 10 (comme l'activité Tables) ; 3 × 7 et 7 × 3 sont le même calcul, posé dans
un sens au hasard. Nouvelle couleur : brillante (`#F2C94C`, doré), après la noire. Le repère « CE2 »
s'ajoute aux repères de classe (`gradeGoal`) : il est mis en avant pour un profil de CE2.
**Progrès et autocollants** : comme les autres matières, une partie « Tables » dans « Mes progrès »
et dans l'album (première ceinture, trois ceintures, ceinture brillante, sans faute, entraînement
parfait, en feu). En plus, **🏅 Objectif CE2** (`tables.goal-ce2`) : réussir la bleu foncé.
L'autocollant « Objectif CM1 » viendra avec la mauve.

## Les écrans

- **Leçon** : les astuces (table de 2 = le double, de 4 = le double du double, de 9 = 10 fois moins
  une fois…), puis les tables pas encore vues aux ceintures d'avant, en deux colonnes
  (noire : 1, 11 et 12 ; brillante : seulement les astuces).
- **S'entraîner** : 10 calculs au pavé, corrigés tout de suite, un raté revient plus tard ; chaque
  calcul de la ceinture une fois avant qu'un autre revienne, ceux du dernier entraînement en dernier.
  Résultat « 9 / 10 du premier coup », les calculs à retravailler (« 7 × 8 = 56 »).
- **Entraînement en conditions réelles** : « 20 calculs en 1 minute » (30 à la brillante). Un compte à
  rebours remplace le chrono (`timeLimitMs` de l'écran de question, `components/countdown.ts`) ; il ne
  tourne que pendant que la question est posée (pas pendant la petite pause entre deux calculs) et
  passe en rouge les 10 dernières secondes. À zéro : « ⏰ Temps écoulé ! », puis le résultat ; ce qui
  était tapé sans être validé ne compte pas. « ← Revenir à la réponse d’avant » marche comme ailleurs.

## Code

`src/activities/ceintures/tables.ts` (les ceintures, `beltFacts`, `newTables`), `table-practice.ts`
(`pickFacts`, `TablePracticeSession`, `TableTestSession`), matière `tables` dans `subjects.ts`
(`isTableBelt`). Tests : `tables.test.ts` (ceintures du classeur, calculs, astuces vérifiées, séries).

## Étapes

1. **Blanche → bleu foncé, noire et brillante** : données, leçon, entraînement, conditions réelles.
   Faite le 27/10/2026 (0.31.0).
2. **Les divisions** (mauve, violette, marron) : une case pour le quotient et une pour le reste.
   À préciser : ce qui distingue la violette de la marron.
