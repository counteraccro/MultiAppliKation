# Décisions (24/10/2026)

| Sujet | Décision |
|---|---|
| Technique | PWA (Vite + TypeScript, sans framework), pas d'app native Swift |
| Pourquoi pas Swift | Avec un compte Apple gratuit, l'app installée par Xcode expire au bout de 7 jours (99 €/an pour 1 an) |
| Nom | **MultiAppliKation** (deux p) ; sous l'icône : **MultiAppli** |
| Première activité | Les tables de multiplication de 1 à 10 |
| Modes | Étoiles par table, défi chronométré, révision intelligente, mélange de tables au choix |
| Défi | Sur **toutes** les tables |
| Chrono | **Visible** pendant le défi |
| Son | Plus tard |
| Profils | Plusieurs |
| Progression entre appareils | **Un appareil par enfant**, pas de synchronisation |
| Appareils | Navigateur (ordinateur), iPhone, iPad |
| Dépôt | github.com/counteraccro/MultiAppliKation, dossier `~/Documents/htdocs/MultiAppliKation` |

## Écarté

- **QCM comme mode principal** : on devine. Gardé au plus pour découvrir une table.
- **Synchronisation en ligne** (Firebase, Supabase…) : beaucoup de travail, données d'enfant en ligne.
- **Export / import de profil** : pas pour l'instant, en réserve si le besoin vient.
- **Vibrations** : Safari iOS ne les permet pas.
