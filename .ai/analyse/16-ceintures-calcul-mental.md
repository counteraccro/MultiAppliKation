# Ceintures : le Calcul mental

Cinquième matière de l'activité « Ceintures » (voir [11-ceintures.md](11-ceintures.md)), après les
Homophones, la Conjugaison, les Tables et le Calcul posé. Analyse du 31/10/2026, à partir du classeur
(« Ceintures de calcul mental », p. 14 du suivi) et des leçons de la classe Calc 14 et Calc 15
(« Techniques de calcul mental », p. 20 et 21 de « Leçons Joliot Curie.pdf »). Pas de fiche d'entraînement.

## Décisions du 31/10/2026

- **Mêmes règles d'accès et de validation** que les autres matières : toutes les ceintures ouvertes, la
  prochaine à faire mise en avant ; entraînement libre ; entraînement en conditions réelles jamais bloqué
  (sauf juste après un échec), « tu peux la passer en classe ».
- Le classeur : « Je calcule rapidement (2 minutes par ceinture, maximum 1 erreur) ».
  **Conditions réelles : 20 calculs en 2 minutes, réussi avec 19 justes** (une erreur au plus) ; ceux qu'on
  n'a pas eu le temps de faire comptent faux. Comme les Tables : pas de correction pendant, tout est corrigé
  à la fin.
- **Entraînement : 10 calculs**, corrigés tout de suite avec l'astuce de la leçon (« + 9, c'est + 10 − 1 :
  73 − 10 = 63, 63 + 1 = 64 »), un calcul raté revient un peu plus tard.
- Les calculs **se tirent au hasard** selon la ceinture, sur le modèle des exercices des leçons
  (« 42 + … = 50 », « 73 − 9 », « 6 × 60 »).
- **D'abord la blanche → la violette** (les nombres entiers, dont l'objectif de fin de CE2), puis les
  décimaux (il faudra une touche virgule), puis les fractions.
- Trois nouvelles couleurs dans l'échelle commune : **beige, rouge, gris**. L'ordre des couleurs est celui
  du classeur de la matière (la violette avant les bleus, les verts après).

## Les ceintures

| Ceinture | Classeur | Dans l'app |
| --- | --- | --- |
| Blanche | Additionner et soustraire des petits nombres | **étape 1, faite** |
| Beige | Ajouter et soustraire 10, 100, 1000 à un entier | étape 1, faite |
| Jaune | Complément à 100 d'un nombre entier | étape 1, faite |
| Orange | Ajouter et soustraire 11 et 9 à un nombre entier — **objectif de fin de CE2** | étape 1, faite |
| Rouge | Multiplier et diviser un entier par 10, 100, 1000 | étape 1, faite |
| Rose | Double, triple, quadruple d'un entier | étape 1, faite |
| Violette | Multiplier un entier par 20, 300, 4000… | étape 1, faite |
| Bleu clair | Passer d'une écriture décimale à une fraction décimale et inversement | étape 2 |
| Bleu foncé | Ajouter deux nombres décimaux | étape 2 |
| Vert clair | Soustraire deux nombres décimaux — **objectif de fin de CM1** | étape 2 |
| Vert foncé | Calculer le complément d'un décimal pour aller vers l'entier supérieur | étape 2 |
| Marron | Multiplier et diviser un nombre décimal par 10, 100, 1000… | étape 2 |
| Gris | Tiers, quart et moitié d'un entier | étape 3 |
| Noire | Passer d'une fraction à un nombre décimal — **objectif de fin de CM2** | étape 3 |
| Brillante | Additions astucieuses, fraction = entier + fraction, additionner des fractions, pourcentage | étape 3 |

## Les calculs (étape 1)

Une série alterne les sortes de calculs de la ceinture (`index` dans la série), comme les exercices des leçons.

- **Blanche** : une addition de deux nombres de 2 à 9 (« presque double » : 6 + 7 = 6 + 6 + 1), une
  soustraction sous 20 (13 − 5), un calcul de dizaines entières (40 + 30, 90 − 20 : « 4 dizaines + 3 dizaines »).
- **Beige** : un nombre de 2 à 4 chiffres plus ou moins 10, 100 ou 1000 (395 + 10 = 405 : « le chiffre des
  dizaines augmente de 1 »), sans résultat négatif.
- **Jaune** : « 37 + … = 100 » (la case au milieu), un nombre de 1 à 99 ; on va d'abord à la dizaine
  supérieure, puis à 100 (« 37 + 3 = 40, 40 + 60 = 100 : 3 + 60 = 63 »). Une fois sur trois, une dizaine
  entière (70 + 30), comme la fleur de la leçon.
- **Orange** : un nombre de 2 ou 3 chiffres plus ou moins 9 ou 11 (« + 9, c'est + 10 − 1 »).
- **Rouge** : × 10, 100, 1000 et : 10, 100, 1000 (le quotient tombe juste) : « × 100 : chaque chiffre devient
  100 fois plus grand, on écrit deux 0 à droite ».
- **Rose** : le double, le triple ou le quadruple d'un nombre de 2 chiffres (« Le double de 34 » ; le double
  de 30 et le double de 4 ; quadruple = double du double).
- **Violette** : un nombre de 2 à 9 × 20, 300, 4000… (« 6 × 3 = 18, et on ajoute le nombre de zéros : 180 »).

## Les écrans

Les mêmes que les Tables : un calcul à la fois au pavé (« 37 + ? = 100 » pour un complément), le compte à
rebours en conditions réelles (2 minutes), la correction à la fin (« Pas eu le temps : … »).
Leçon : les astuces de la classe, puis quelques calculs expliqués (un par sorte de calcul).

## Code

`calcul-mental.ts` (les ceintures et leurs tirages, `MentalBelt`, `MentalQuestion` avec son explication),
`table-practice.ts` (les séries de calculs : `CalcPracticeSession`, `CalcTestSession` avec la règle de réussite,
communs aux Tables et au Calcul mental). Matière `calcul-mental` dans `subjects.ts` (identifiant à ne jamais
changer). Le pavé accepte plus de chiffres (`maxDigits`) : 45 × 1000 = 45000.

## Étapes

1. **Blanche → violette : les nombres entiers**, le socle (calculs tirés, entraînement corrigé avec les
   astuces, conditions réelles de 20 calculs en 2 minutes à une erreur près, leçon, progrès et autocollants).
   Faite le 31/10/2026 (0.44.0) : `calcul-mental.ts`, séries communes avec les Tables (`CalcPracticeSession`,
   `CalcTestSession`), l'astuce après une erreur (`explain` des questions), couleurs beige, rouge et grise.
   La matière reste « pas finie » (`unfinished`) tant que les décimaux et les fractions manquent.
2. **Bleu clair → marron : les décimaux** (touche virgule au pavé, fractions décimales).
3. **Gris → brillante : les fractions et les pourcentages** (saisie d'une fraction à préciser).
