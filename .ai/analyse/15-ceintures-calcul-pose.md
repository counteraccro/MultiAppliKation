# Ceintures : le Calcul posé

Quatrième matière de l'activité « Ceintures » (voir [11-ceintures.md](11-ceintures.md)), après les
Homophones, la Conjugaison et les Tables. Analyse du 28/10/2026, à partir du classeur (« Je pose… »)
et du document « entrainements calcul posé.pdf » (fiches scannées, corrections écrites à la main).

Demande de la fille de l'utilisateur (d'abord comprise « fractions », puis « division posée ») :
c'est le **Calcul posé**. Décision du 28/10/2026 : **toute la matière, en commençant par la blanche**,
une ceinture (ou deux voisines) à la fois.

## Décisions du 28/10/2026

- **Mêmes règles d'accès et de validation** que les autres matières : toutes les ceintures ouvertes,
  la prochaine à faire mise en avant ; entraînement libre ; entraînement en conditions réelles jamais
  bloqué (sauf juste après un échec), réussi à **90 %**, « tu peux la passer en classe ».
- **On pose l'opération à l'écran, pas à pas, comme en classe** : l'opération s'affiche en colonnes
  (ou dans la potence pour la division), l'enfant tape un chiffre à la fois au pavé, à la bonne place,
  l'app montre la case en cours. Pas seulement le résultat : c'est la technique qu'on apprend.
- **Entraînement : 3 opérations**, corrigées à chaque étape (la bonne valeur se place, avec l'explication,
  puis on continue). **Conditions réelles : 5 opérations**, sans aide ni correction pendant ; réussi avec
  90 % des étapes justes ; tout est corrigé à la fin. « ← Revenir à l'étape d'avant », comme ailleurs.
- **Les opérations se tirent au hasard** selon les règles de la ceinture (comme les Tables) : les fiches
  donnent la forme des calculs (nombre de termes, de chiffres), pas une liste à recopier.

## Les ceintures

| Ceinture | Classeur | Fiches (pages du PDF) | Dans l'app |
| --- | --- | --- | --- |
| Blanche | Additions (Cal5) | p. 1 : 2 ou 3 nombres de 2 ou 3 chiffres, retenues entourées en haut | **étape 1** |
| Jaune | Soustractions (Cal6) | p. 2 : 3 chiffres moins 2 ou 3 chiffres (405 − 206) | étape 2 |
| Orange | Multiplications à 1 chiffre (Cal7) | p. 3 : 3 chiffres × 1 chiffre, retenues en petit au-dessus | étape 3 |
| Rose | Multiplications à 2 chiffres (Cal7) — **objectif de fin de CE2** | p. 4 : 3 chiffres × 2 chiffres, deux lignes (la 2ᵉ finit par 0) puis leur somme | étape 3 |
| Vert clair | Division par un nombre à 1 chiffre (Cal8) | p. 5 : 3 chiffres : 1 chiffre, potence, sans écrire les soustractions, puis « 738 = 147 × 5 + 3 » | étape 4 |
| Vert foncé | Additions à trois termes, soustractions avec des 0, multiplications à deux ou trois chiffres | pas de fiche : nos calculs | étape 5 |
| Bleu clair | Additions et soustractions de nombres décimaux (Cal13) — **objectif de fin de CM1** | p. 6 : virgules alignées, on complète par des 0 (en rouge sur la fiche) | étape 6 |
| Bleu foncé | Divisions décimales (Cal17) | p. 7 : un entier divisé par 1 chiffre, quotient au centième (100 : 7 = 14,28) | étape 7 |
| Violette | Multiplications de nombres décimaux (Cal16) | p. 8 : décimal × entier ou décimal, la virgule placée au résultat | étape 6 |
| Marron | Divisions par un nombre à deux chiffres ; d'un décimal par un entier (Cal17) — **objectif de fin de CM2** | p. 9 : 198 : 15, 4052 : 16, 45,08 : 7… | étape 7 |
| Noire | Je calcule plus vite | pas de fiche | étape 8, à préciser |

La violette (× décimaux) vient avant la marron dans le classeur, après la bleu foncé : l'ordre de
l'échelle est celui du classeur, l'ordre de travail regroupe ce qui se ressemble.

## Une opération posée

### Addition (blanche, vert foncé, bleu clair)

```
   ①  ②          ← retenues
    4  3  7
 +     7  6
 +  2  0  9
 ─────────
    7  2  2
```

- On commence par **les unités**, de droite à gauche. Pour chaque colonne, l'enfant tape **le chiffre
  du résultat** ; s'il y a une retenue, il la tape ensuite **dans le rond au-dessus de la colonne suivante**
  (comme la fiche). La dernière colonne s'écrit en entier (« 12 » s'écrit 1 puis 2).
- Chaque chiffre et chaque retenue compte pour **une étape**.
- Erreur à l'entraînement : la bonne valeur se place, surlignée, avec l'explication
  (« 7 + 6 + 9 = 22 : on écrit 2 et on retient 2. »), puis « → » pour continuer.
- En conditions réelles, ce qui est tapé se place tel quel et la suite se calcule avec : une retenue
  fausse ne compte qu'une fois (chaque étape est jugée d'après ce qui est déjà écrit, comme un maître
  qui corrige).

### Soustraction, multiplication, division

À préciser à leur étape. Points déjà relevés sur les fiches :
- soustraction : les retenues ne se voient pas sur le scan (méthode « par compensation » ou « par emprunt »
  à demander) ;
- multiplication à 2 chiffres : la 2ᵉ ligne commence par un 0 (ou un point) sous les unités ;
- division : potence « à la française », on n'écrit que les restes, on abaisse le chiffre suivant ; on prend
  d'abord assez de chiffres (34 pour 348 : 7) ; vérification à la fin.

## Les écrans

- **Leçon** : la méthode en quelques phrases, et un exemple posé en entier, chaque étape expliquée.
- **S'entraîner** : 3 opérations au pavé, corrigées à chaque étape. Résultat « 18 / 20 étapes du
  premier coup », les opérations à retravailler (« 437 + 76 + 209 = 722 »).
- **Entraînement en conditions réelles** : « 5 opérations, sans aide ». À la fin, la correction : chaque
  opération fausse, le résultat écrit barré et le bon surligné.

## Code

`src/activities/ceintures/calcul-pose.ts` (les ceintures et leurs règles de tirage), `posed.ts` (une
opération posée : les étapes, la valeur attendue, ce qui est écrit), `posed-session.ts` (entraînement et
conditions réelles), `posed-screen.ts` (l'opération en colonnes et le pavé). Matière `calcul-pose`
dans `subjects.ts` (identifiant à ne jamais changer).

## Étapes

1. **Blanche : les additions**, et le socle commun (opération en colonnes, pas à pas, leçon, entraînement,
   conditions réelles, progrès et autocollants). Faite le 28/10/2026 (0.33.0) : `posed.ts` (`PosedAddition`),
   `posed-session.ts`, `posed-screen.ts`, `calcul-pose.ts` ; tests `posed.test.ts`. Pas d'autocollant
   « dernière ceinture » tant que des ceintures sont à venir (`unfinished` de la matière).
2. **Jaune : les soustractions** (méthode des retenues à confirmer).
3. **Orange et rose : les multiplications.**
4. **Vert clair : la division par un nombre à 1 chiffre** (la potence).
5. **Vert foncé** : additions à trois termes, soustractions avec des 0, multiplications à 2 ou 3 chiffres.
6. **Bleu clair et violette : les décimaux** (+, −, ×) : la virgule.
7. **Bleu foncé et marron : les divisions décimales et par 2 chiffres.**
8. **Noire : « je calcule plus vite »** (toutes les opérations, en temps limité ? à préciser).
