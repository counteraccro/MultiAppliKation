# Ceintures : les Mesures

Huitième matière de l'activité « Ceintures » (voir [11-ceintures.md](11-ceintures.md)), après les
Homophones, la Conjugaison, les Tables, le Calcul posé, le Calcul mental, la Numération et la Grammaire.
Analyse du 08/11/2026, à partir :

- du classeur (« Grandeurs et mesures, 20 min », p. 16 de `Suivi ceintures 25-26.pdf`) ;
- des fiches Charivari `Entrainements/ entrainement mesures.pdf` (14 pages scannées, 84 fiches n° 1 à 84 avec
  leur correction, lues en images avec le script Swift PDFKit) ;
- des leçons de la classe Mes 1 à Mes 10 (`Leçons Joliot Curie.pdf`, p. 44 à 53), Géom 2 « Mesurer et tracer
  un segment » (p. 55) et Pb 13 pour la proportionnalité.

## Le classeur et les fiches

Le classeur compte **8 ceintures**, les fiches **9** : pas de violette, une marron différente et une
**brillante** en plus.

| Ceinture | Compétence (classeur) | Leçons | Fiches Charivari |
| --- | --- | --- | --- |
| Blanche | Mesurer un segment ; relations mm, cm, m, km et heures / minutes ; à quoi servent les mesures ; les mois de l'année | Mes 1, 3, 5, 7, Géom 2 | n° 1-12 (p. 1-2) : l'unité qui convient, < > =, `10 × 10 mm = … cm`, mois, minutes dans une heure |
| Jaune | Comparer et calculer des longueurs en unités différentes ; jours, heures, minutes, secondes | Mes 1, 3, 4, 10 | n° 13-18 (p. 3) : le plus petit / le plus grand de quatre enfants, `20 m + 3 mm … 2 cm + 30 mm`, ruban coupé |
| Orange | Périmètre, côté d'un carré à partir du périmètre ; longueurs en 2 unités (2 m 50 cm) ; g, kg, t ; semaines, mois, jours — **objectif fin de CE2** | Mes 1, 3, 5, 8 | n° 19-24 (p. 4) : chambre, mouchoir, champ, clôture, côté du carré, orques |
| Rose | Tableau de conversion (entiers) ; mois, semaines, jours ; côté d'un rectangle à partir du périmètre et de l'autre côté | Mes 3, 8, 10 | n° 25-36 (p. 5-6) : cordes en dm/cm/m, 36 mois, colis en hg/g/dag/kg, bouteilles en dl/cl/ml, animaux en km/dam/m, minutes dans une journée |
| Verte | Aire d'un carré, d'un rectangle ; calculer une durée — **objectif fin de CM1** | Mes 4, 9 | n° 37-48 (p. 7-8) : chambre en m², champ en hm², foulard en dm² / cm², jeux télévisés, train |
| Bleue | Les décimaux pour mesurer et convertir | Mes 10 | n° 49-60 (p. 9-10) : Julie et son chien, sauteurs, cordes partagées, Megasplash, rubans |
| Marron | Trouver l'heure de début ; côté d'un rectangle à partir de son aire | Mes 4, 8, 9 | **les fiches n'en parlent pas** : n° 61-66 (p. 11) sont des problèmes en plusieurs étapes |
| Noire | Problèmes de proportionnalité — **objectif fin de CM2** | Pb 13 | n° 67-78 (p. 12-13) : biscuits, gâteaux, viande, sodas, avec des prix décimaux au niveau 3 |
| Brillante | (pas dans le classeur) | — | n° 79-84 (p. 14) : « Problèmes niveau 4 » (avion, carrelage, naïpode, caissière, vaisselle, élections) |

Toutes les couleurs sont déjà dans `BELTS` (`vert`, `bleu`, `brillante`…).

Erreurs dans les corrections Charivari :
- n° 33 : la consigne de correction dit « trouver 168 » ; c'est 3 600 (secondes dans une heure).
- n° 63 : la consigne dit « trouvé 40 g » (copiée de la n° 62) ; la réponse est 10 190 kg, le camion ne passe pas.
- n° 84 : « 2960 : 4 = 740 », puis « a obtenu 738 voix » ; c'est 740. Et « Mme Legrand » au lieu de M. Legrand.

## Les sortes d'exercices

| Façon de répondre | Exemples des fiches | Dans l'app |
| --- | --- | --- |
| **L'unité qui convient** | « Le mur de la classe peut mesurer 3 … de hauteur » (m), « une canette contient 33 … » (cl) | Boutons d'unités (mm, cm, m, km, g, kg, t, L, cl…) |
| **< > =** | `120 cm … 1 m`, `300 mm + 200 cm … 2 m + 30 cm` | Boutons < > =, déjà faits pour la Numération |
| **Compléter une égalité** | `10 × 10 mm = … cm`, `1 m − … cm = 50 cm`, `50 cm + 50 cm = 1 …` | Pavé pour un nombre, boutons pour une unité |
| **Un mot** | « le mois juste avant septembre » (août) | Boutons des 12 mois |
| **Qui ? Lequel ?** | Le plus petit des quatre enfants, l'orque la plus lourde, la bouteille qui contient le plus | Boutons avec les noms |
| **Un problème** | Périmètre, aire, ruban coupé, durée, proportionnalité | **Nombre au pavé + unité choisie par boutons** |
| **Une durée, une heure** | « Combien de temps dure le jeu ? » (45 min ; 75 min ou 1 h 15 min), « à quelle heure se termine-t-il ? » (18 h 45) | Deux cases h et min |
| **Mesurer un segment** | (classeur, blanche) | Nouveau : un segment sur une règle graduée dessinée (SVG), longueur tapée |

En classe, l'élève écrit **un calcul et une phrase-réponse avec l'unité**. Dans l'app, il donne **le
résultat et l'unité** : oublier ou se tromper d'unité compte comme une faute, comme en classe.
La leçon rappelle qu'il faut écrire le calcul et la phrase-réponse sur le cahier.

## Décisions du 08/11/2026

- **Problèmes : nombre au pavé + unité par boutons.** L'unité est toujours un choix parmi des boutons
  (jamais tapée), avec des pièges cohérents (m, cm, m², km pour un périmètre de chambre).
- **Échelle : les 8 ceintures du classeur + une brillante en bonus** (comme pour les Tables). La marron suit le
  classeur (heure de début, côté d'un rectangle connaissant son aire), en reprenant quelques problèmes des
  fiches n° 61-66 ; la brillante reprend les « Problèmes niveau 4 ».
- **Mesurer un segment : une règle dessinée** à l'écran, l'élève lit la longueur (cm et mm) et la tape.

Choix faits sans lui demander, à faire valider :
- mêmes règles d'accès et de validation que les autres matières (toutes les ceintures ouvertes, la prochaine
  mise en avant, conditions réelles jamais bloquées sauf juste après un échec) ;
- **conditions réelles : 10 questions mélangées, réussi avec 9 justes**, sans minuteur, comme la Numération ;
- une durée est acceptée en minutes ou en heures et minutes (75 min = 1 h 15 min), comme dans les corrections ;
- quand plusieurs unités sont justes (140 cm ou 1,4 m), toutes les réponses égales sont acceptées, sauf si la
  question impose l'unité (« en cm », « en kg ») ;
- correction : sa réponse visible, ses fautes barrées, la bonne réponse et le calcul de la fiche en dessous
  (voir `01-decisions.md`).

## Étapes proposées

1. **Blanche et jaune** : l'unité qui convient, < > =, égalités à compléter, mois, heures / minutes /
   secondes, comparer des longueurs, ruban coupé, segment sur la règle. Nouveaux écrans : nombre + unité,
   règle dessinée. Matière `mesures` (`unfinished`). Leçons Mes 1, 3, 4, 5, 7, 10, Géom 2.
   **Faite le 08/11/2026 (0.55.0)** :
   - `mesures.ts` : les ceintures ont la forme de celles de la Numération (`kinds`, `tips`, `examples`) et
     passent par les mêmes écrans (entraînement de 10, conditions réelles de 10 réussies à 9, leçon).
     Blanche : l'unité qui convient (26 phrases, fiches + les nôtres), < > = (une mesure ronde contre une
     unité plus petite), conversions (3 m = … cm), calculs des fiches (10 × 10 mm = … cm, 1 m − … cm = 50 cm),
     l'unité d'une somme (50 cm + 50 cm = 1 …), le mois d'avant / d'après (4 boutons), heures et minutes,
     segment sur la règle. Jaune : le plus petit / le plus grand de quatre enfants, < > = avec des unités
     mélangées et des sommes, le ruban coupé, jours / heures / minutes / secondes, 2 m + 30 cm = … cm.
   - `core/quiz.ts` : `units` (le nombre au pavé, l'unité par boutons, la réponse « 170 cm » ; une mesure
     égale dans une autre unité est juste aussi) et la figure `ruler` ; `components/ruler.ts` dessine la règle.
   - `question-screen.ts` : le mode « nombre + unité » (les unités au-dessus du pavé, la choisie en bleu ;
     après une erreur, sa réponse barrée, la bonne dans l'unité qu'il a choisie si elle existe, sinon l'unité
     juste mise en avant). La correction du test fait pareil.
   - Sans touche virgule (blanche, jaune), seules les réponses entières sont acceptées dans une autre unité :
     1 700 mm pour 170 cm, mais pas 1,7 m.
   - La durée en heures et minutes est pour l'étape 3 (verte : calculer une durée) : rien dans la blanche et
     la jaune ne la demande.
2. **Orange et rose** : périmètre, côté d'un carré, longueurs en 2 unités, g / kg / t, tableau de conversion
   avec les entiers (dam, hm, dag, hg, cl, dl…), côté d'un rectangle à partir du périmètre.
   **Faite le 08/11/2026 (0.56.0)** :
   - Orange (objectif CE2) : périmètre d'un rectangle (chambre, champ en hm, clôture, cadre, jardin) et d'un
     carré (mouchoir, jardin, table), côté d'un carré à partir du périmètre ; 2 m 50 cm = … cm et l'inverse
     (345 cm = 3 m … cm), avec le piège 1 m 5 cm = 105 cm ; kg ↔ g, t ↔ kg, 1 kg 500 g ; l'orque la plus
     lourde (deux en kg, une en tonnes) ; jours d'un mois (poings fermés, sans février), semaines, année.
   - Rose : le plus long / le plus lourd / qui contient le plus, mesures dans trois ou quatre unités (cordes,
     sauts, animaux en un quart d'heure, colis, bouteilles) ; conversions avec le tableau (longueurs ; masses
     kg → g ; contenances L → ml), toujours avec des nombres entiers ; côté d'un rectangle à partir du
     périmètre (champ, piscine, cadre) ; mois, semaines, jours, minutes d'une journée, secondes d'une heure ;
     périmètre d'un triangle aux côtés en m, cm et mm (leçon Mes 8).
   - Unités à toucher : mm, cm, m, km, ou m, dam, hm, km pour un champ en hm. La tonne reste hors du tableau
     de conversion (pas de quintal dans la leçon).
   - L'autocollant « Objectif CE2 » des Mesures vient tout seul avec l'orange.
   - Tableau de conversion dessiné dans la leçon : ajouté à l'étape 3 (voir plus bas).
3. **Verte et bleue** : aires (m², dm², cm², hm²), durées et heures de fin, les décimaux.
   **Faite le 08/11/2026 (0.57.0)** :
   - **Tableau de conversion dessiné** (validé par l'utilisateur) : dans la leçon, chaque exemple de conversion
     montre le tableau rempli comme la leçon Mes 10 (`components/conversion-table.ts`, figure `conversion`) :
     un chiffre par colonne, les 0 ajoutés en gris, la virgule dans la colonne de la nouvelle unité, une colonne
     sans nom quand le nombre déborde (99 km). Il n'est montré que dans la leçon (`lessonFigure` d'une question),
     jamais pendant la question, pour ne pas donner la réponse. La rose montre 350 m = 35 000 cm et
     76 hg = 760 dag, la bleue 453 cm = 4,53 m.
   - **Saisie des heures** (`clock` dans `core/quiz.ts`, mode `clock` de `question-screen.ts`) : les nombres au
     pavé, « h » et « min » par deux boutons (ou les touches h et m), comme on l'écrit : 1, h, 15, min. Une durée
     est juste en minutes ou en heures et minutes (75 min = 1 h 15 min = 1 h 15), pas « 1 h 75 min » ; une
     heure s'écrit avec « h » (18 h 45 ou 18 h 45 min). La correction écrit la bonne réponse comme la sienne
     (« 75 min » sous « 80 min », « 1 h 15 min » sous « 1 h 20 min »).
   - Verte (objectif CM1) : aire d'un rectangle (chambre en m², champ en hm² et en m², foulard en dm² et en
     cm², tapis), aire d'un carré, et parfois son périmètre pour ne pas confondre (les boutons sont la longueur et
     trois unités d'aire : m, dm², m², dam²). Heure de fin d'une émission (fiches n° 39, 41, 45) et « Il est
     8 h 30, quelle heure sera-t-il dans 1 h 45 min ? » (leçon Mes 4, méthode 4). Durée d'une émission, d'un
     film (leçon) ou d'un voyage en train (fiche n° 48), expliquée par bonds jusqu'aux heures pile (méthode 2).
     « Il est 8 h 40. Il sera 9 h dans … min » (leçon) et « 1 h 15 min, c'est … minutes ».
   - Bleue (touche virgule) : l'unité qui convient à 0,8 … (mouche, feuille, porte, marathon…) ; conversions
     avec la virgule dans les deux sens (453 cm = 4,53 m, 2,5 kg = 2 500 g) ; le sauteur, Sandra et François,
     Camille et Tom, le ruban vert (juste en cm, en m ou en mm) ; Julie et son chien **en kg imposé**, le saut en
     longueur **en cm imposé**, la corde partagée **en cm imposé** (fiches n° 49, 53, 55) ; le Megasplash et le
     cocktail Borabora (L, dl, cl, ml).
   - Mesures égales acceptées avec au plus 3 chiffres après la virgule dans la bleue (2,472 L = 2 472 ml) ; une
     longueur n'est jamais acceptée dans une unité d'aire, ni l'inverse.
4. **Marron, noire et brillante** : heure de début, côté à partir de l'aire, proportionnalité, problèmes
   niveau 4 ; progrès et autocollants de la matière, `unfinished` retiré.
   **Faite le 08/11/2026 (0.58.0)** :
   - Marron (touche virgule) : **l'heure de début** d'une émission (« se termine à 18 h 05, a duré 35 minutes »), d'un
     voyage en train, d'un film, d'une promenade, d'un gâteau au four ; expliquée comme la méthode 3 de la leçon Mes 4
     (on enlève à part les heures et les minutes ; s'il n'y en a pas assez, 10 h 15 = 9 h 75 min). **Le côté d'un
     rectangle à partir de son aire** (jardin, chambre, nappe, affiche : 48 : 6 = 8) et le côté d'un carré (49 cm² →
     7 cm), avec les pièges m² / dm² parmi les unités. Les problèmes des fiches n° 61 à 66 : saute-mouton (nombre
     d'élèves au pavé), balance du primeur (**en grammes imposé**), camion chargé (en kg, juste aussi en t ; on demande
     sa masse plutôt que « oui / non »), ampoules du médecin, robinet qui fuit (**en litres imposé**), verres et
     bouteilles à remplir (la n° 66 en plus simple : 30 L en bouteilles de 75 cl, sans les hL).
   - Noire (objectif CM2, leçon Pb 13) : le prix d'un, puis de plusieurs (biscuits, viande, soda, cahiers ; prix ronds
     au niveau 2, centimes au niveau 3 : 63,60 € → 84,80 €) ; les recettes (3 fois plus de personnes, moins de
     personnes, ou par la moitié comme les fiches n° 73 et 76 : 4 + 4 + 2) ; « un sac de sucre pèse 500 g, combien
     pèsent 8 sacs ? » et « 3 chaises coûtent 75 €, combien coûte une chaise ? » (questions A et B de la leçon).
   - Brillante (« Problèmes niveau 4 », n° 79 à 84) : l'avion (la distance, ou l'heure du décollage), le carrelage
     (paquets entiers : 90 = 11 × 8 + 2, donc 12 paquets), le naïpode (réponse en heures), la caissière (jamais
     « 0 € » à rendre), le marchand de vaisselle (bénéfice, avec des centimes), les élections (avec la correction
     juste : 740 voix pour Mme Lejeune, M. Legrand).
   - **L'euro** devient une unité (`MONEY`) : le prix se tape au pavé, puis « € » se touche parmi des pièges (g, kg,
     L…). Les prix s'écrivent avec deux chiffres après la virgule (84,80 €) ; 84,8 € est juste aussi.
   - Une réponse qui est un nombre de choses (élèves, verres, bouteilles, voix) se tape au pavé, le mot écrit après.
   - `unfinished` retiré : la matière est complète, l'autocollant « dernière ceinture » vient avec la brillante.
