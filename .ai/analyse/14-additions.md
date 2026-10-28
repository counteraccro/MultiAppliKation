# Les Additions

Quatrième activité, ajoutée le 28/10/2026 : les tables d'addition, **sur le modèle exact des Tables**.

## Ce qu'on apprend

- 10 tables de 1 à 10 : la table de 3, c'est 3 + 1 … 3 + 10 (résultats jusqu'à 20).
- 3 + 7 et 7 + 3 sont la même chose à retenir : **55 additions** en tout, comme les 55 multiplications.
- Ordre conseillé : + 1 et + 2 (compter), + 10 (la dizaine), + 5, puis 3, 4, 9, 6, 7, 8.
  Aucune table n'est bloquée.

## Les modes

Les mêmes que les Tables (voir [04-modes.md](04-modes.md)), avec les mêmes réglages :

- **Apprendre** une table, avec ses étoiles (★ 8 justes, ★★ tout juste, ★★★ tout juste en moins de **8 s**).
- **Révision** par boîtes de Leitner, « N / 55 connues ».
- **Mélange** : tables au choix, 20 questions au plus.
- **Nombre caché** : « 3 + ? = 7 » ou « ? + 4 = 7 ». Prépare la soustraction sans le dire.
  Pris dans les 45 additions de 1 à 9 : avec 10, « 10 + ? = 13 » se lit directement.
  Comme pour les Tables, il ne touche ni aux boîtes, ni aux étoiles, ni au record.
- **Défi** : 20 additions chronométrées, 5 s par erreur, son propre record.
- **Mes progrès** : la table d'addition (10 × 10 cases), colorée selon les boîtes.
- **Album** : les 24 autocollants des Tables, un fruit par table au lieu d'un animal.

## Comment c'est fait

Pas de copie du code des Tables : le dossier `src/activities/tables/` est commun.
Une `Operation` (dans `questions.ts`) dit ce qui change : le signe, le calcul, le mot
(« multiplication », « addition », féminins tous les deux), l'ordre conseillé,
les calculs du nombre caché et les emojis de l'album.
`src/activities/additions/index.ts` crée l'activité avec `ADDITION`.

Les données sont rangées à part, sous l'identifiant `additions` : les boîtes, étoiles,
record et autocollants des additions ne se mélangent jamais avec ceux des Tables.

## Le seuil « rapide » : 8 s

Une addition est « rapide » en moins de **8 s** (5 s aux multiplications) : c'est ce qui
donne la 3ᵉ étoile et fait monter d'une boîte. Plus long, parce que les additions
s'adressent aussi aux plus petits (CP). Réglé le 28/10/2026, à ajuster à l'essai.
