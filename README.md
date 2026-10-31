# MultiAppliKation

Application pour apprendre en jouant, du CP à la 6ᵉ, sur iPhone, iPad et ordinateur.

**👉 [Ouvrir l'application](https://counteraccro.github.io/MultiAppliKation/)**

## Les activités

### Les Tables (multiplications de 1 à 10)

- **Apprendre** : une table à la fois, jusqu'à 3 étoiles (tout juste et rapide).
- **Révision** : les multiplications à retravailler reviennent plus souvent (boîtes de Leitner).
- **Mélange** : les tables au choix.
- **Nombre caché** : « 7 × ? = 56 ».
- **Défi** : 20 questions chronométrées, contre son propre record.

### Conjugaison (CM1)

20 verbes (être, avoir, 1ᵉʳ et 2ᵉ groupes, 8 irréguliers) au présent, à l'imparfait,
au futur et au passé composé, soit 480 formes, chacune vérifiée par un test.

- **Apprendre** : un verbe à un temps, les 6 personnes, jusqu'à 3 étoiles (sans chrono : seul le résultat compte).
- **Révision** : seulement les formes déjà vues, par boîtes de Leitner.
- **Mélange** : temps et verbes au choix (une leçon de la semaine, par exemple).
- La réponse se tape sur un clavier de lettres dessiné dans l'app, avec les accents ;
  une faute d'accent compte faux, et la partie fausse est surlignée.

### Les Additions (tables d'addition de 1 à 10)

Les mêmes modes que les Tables (Apprendre, Révision, Mélange, Nombre caché « 3 + ? = 7 », Défi),
pour les 55 additions à retenir, résultats jusqu'à 20.

### Ceintures (CM1)

Les ceintures de compétences du classeur de la classe, comme au judo : on passe la blanche,
puis la jaune… Une matière à la fois, d'autres viendront.

| Matière | Ceintures | Ce qu'on fait |
| --- | --- | --- |
| Homophones | blanche → noire | choisir le bon mot dans une phrase (a / à, et / est…) |
| Conjugaison | blanche → marron | taper les formes d'un verbe, du présent au plus-que-parfait |
| Tables | blanche → bleu foncé, noire, brillante | 20 multiplications en 1 minute (les divisions viendront plus tard) |
| Calcul posé | blanche → marron | poser l'opération à l'écran, un chiffre à la fois, comme en classe : additions, soustractions, multiplications, divisions, nombres décimaux |
| Calcul mental | blanche → violette | calculer de tête avec les astuces de la classe (les décimaux et les fractions viendront ensuite) |

- Pour chaque ceinture : **la leçon**, **l'entraînement** (corrigé tout de suite, avec l'explication)
  et **l'entraînement en conditions réelles**, comme le jour du passage (sans aide, corrigé à la fin).
- Toutes les ceintures sont ouvertes ; l'app montre la prochaine à faire. Réussir en conditions
  réelles dit « tu peux la passer en classe » : la vraie ceinture se passe en classe, et seul un adulte
  la note obtenue (avec sa date).
- Les repères du classeur (objectifs de fin de CE2, de CM1, de CM2) sont mis en avant.

### Dans chaque activité

- **Mes progrès** : une grille colorée, du gris (pas encore vu) au vert (bravo).
- **Mes autocollants** : un album par activité, avec ce qu'il faut faire pour gagner chacun.
- Fête, sons, série « d'affilée » (bonnes réponses du premier coup), et une erreur
  qui revient plus tard dans la série, sans jamais gronder.

## Profils

- Un profil par enfant (prénom, couleur, classe), sans compte ni mot de passe.
- La classe guide ce qui est proposé sans rien bloquer ; la changer demande un adulte,
  comme supprimer un profil.
- Tout reste sur l'appareil (aucun serveur) ; la progression est enregistrée à chaque réponse.

## L'installer sur iPhone ou iPad

1. Ouvrir le lien ci-dessus dans **Safari**.
2. Toucher **Partager** (carré avec une flèche vers le haut).
3. Choisir **« Sur l'écran d'accueil »**, puis **Ajouter**.

Toujours lancer l'app depuis son icône : sur iOS, l'app installée et Safari
ont chacun leur stockage (les profils de l'un ne se voient pas dans l'autre).

Une fois ouverte une première fois, l'app fonctionne **hors ligne**.

## Développement

```sh
npm install
npm run dev      # serveur local
npm test         # tests
npm run build    # version de production dans dist/
npm run preview  # sert dist/ comme sur GitHub Pages (service worker compris)
npm run icons    # régénère les icônes depuis public/icon.svg
```

Chaque push sur `main` lance les tests et publie le site sur GitHub Pages.

Organisation du code (`src/`) :

- `core/` : profils et sauvegarde, séries de questions, boîtes de Leitner, autocollants, niveaux de progrès ;
- `components/` : écrans et pièces communs (question, résultat, pavé et clavier, album…) ;
- `screens/` : « Qui joue ? », profils, choix de l'activité ;
- `activities/` : une activité par dossier (`tables/`, `additions/`, `conjugaison/`, `ceintures/`). Pour en ajouter une,
  créer son dossier puis l'ajouter à `activities/index.ts` ; son identifiant est la clé
  de ses données dans le profil et ne change jamais.
- `activities/ceintures/` : une matière par fichier (`homophones.ts`, `conjugaison.ts`, `tables.ts`,
  `calcul-pose.ts`, `calcul-mental.ts`), listées dans `subjects.ts`.

## Versions

- Le numéro de version est celui de `package.json` (`npm version minor --no-git-tag-version`
  avant de publier une nouveauté). Il s'affiche en bas de l'écran « Qui joue ? ».
- Chaque publication porte aussi un identifiant unique (le commit), écrit dans `version.json`.
- Le service worker garde l'app pour le hors ligne et cherche une nouvelle publication
  au démarrage, quand l'app revient au premier plan et toutes les 30 minutes.
  S'il en trouve une, une fenêtre oblige à mettre à jour (« 0.4.0 → 0.5.0 »).
  La progression est gardée (elle est enregistrée à chaque réponse).

L'analyse du projet (décisions, pédagogie, étapes) est dans [`.ai/analyse`](.ai/analyse/README.md).
