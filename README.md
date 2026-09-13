# WuWa Companion

Companion communautaire FR/EN pour Wuthering Waves, utilisable sur ordinateur, tablette et mobile. Application statique, sans compilation, serveur de compte, abonnement ou service payant.

**Site : https://earyon.github.io/wuwa-companion/**

## Utilisation

- **Mon compte** : Résonateurs possédés, niveaux, ascensions, cinq compétences, passifs, séquences, exemplaires d’armes et Échos équipés, stocks connus ou inconnus.
- **Encyclopédie** : Résonateurs, armes et Échos, descriptions FR/EN lorsqu’elles sont disponibles, Forte, séquences, effets de Sonate, builds contextualisés et profils personnalisables.
- **Planner** : objectifs séparés de la progression actuelle, coûts de montée et besoins nets. Un seul Résonateur possédé actif ; pré-farm uniquement sur demande explicite depuis les souhaits.
- **Accueil** : objectif actif, tâches, activités quotidiennes/hebdomadaires et échéances du serveur choisi.
- **Plus** : équipes favorites de trois, succès, événements et activités personnelles, souhaits, invocations et optimisation des ressources partagées. Réglages de langue et d’écran initial.

Les recommandations livrées couvrent les **58 Résonateurs canoniques de la version 3.6**, avec **80 contextes** vérifiés le 13 septembre 2026. Chaque fiche cite ses guides. Les 34 groupes de Sonate et 1 207 succès sont des projections bilingues de WW_Data. Les références datées ne constituent pas une mise à jour automatique des futures versions du jeu.

## Données personnelles et sauvegarde

Les données restent dans le navigateur de chaque appareil. Le compte compact utilise `wwc_companion_v1`, format 7 ; les anciennes versions et les clés historiques sont conservées ou migrées sans réinitialisation. Les valeurs inconnues ne deviennent pas automatiquement zéro. Les équipements par exemplaire et leurs propriétaires utilisent des identifiants stables.

**Deux exports distincts** permettent de changer d’appareil :

1. Plus → Réglages → Exporter ma sauvegarde : compte, possessions, équipements, objectifs, équipes, ressources et réglages.
2. Plus → Invocations → Exporter tous mes historiques : historiques volumineux stockés dans IndexedDB.

La restauration du compte propose un aperçu et conserve l’état antérieur. Les imports JSON WuWa Tracker acceptent ExportProfile (stocks et succès) et ExportPullHistory (historique). Les objectifs Tracker ne prouvent pas l’inventaire actuel. Les profils d’historique restent séparés ; un même export réimporté ne crée pas de doublons, sans supprimer les répétitions d’un tirage multiple. Aucun journal du jeu, token ou lien d’authentification n’est nécessaire.

Il n’y a pas de synchronisation distante. Les protections contre les modifications obsolètes réduisent les conflits entre fenêtres ; une simultanéité exacte entre processus reste une limite de Web Storage. Les historiques utilisent une transaction IndexedDB pour une fusion atomique.

## Démarrage et mises à jour

Servir le dossier par HTTP local ou HTTPS ; ne pas ouvrir directement `index.html` comme fichier. Le premier chargement des catalogues distants nécessite Internet. Les lancements suivants utilisent le dernier catalogue valide avec vérification de sa version. Une source indisponible ne provoque pas de réinitialisation du compte.

Le service worker met en cache les écrans et les références livrées. Les images et détails distants non consultés ne sont pas garantis hors ligne. Les réglages indiquent si une mise à jour attend : enregistrer les modifications et fermer **toutes** les fenêtres de Companion permet son activation à la prochaine ouverture. Ne pas effacer le stockage pour actualiser le site.

GitHub Pages publie `main`, dossier racine, avec des chemins relatifs compatibles avec `/wuwa-companion/`. `_headers` est une configuration historique Cloudflare, ignorée par GitHub Pages. Une livraison modifiant le shell doit incrémenter `CACHE_NAME` et inclure ses nouvelles ressources dans `SHELL` de `sw.js`.

## Développement et vérification

Lire [AGENTS.md](AGENTS.md), [QUALITY.md](QUALITY.md) et [DESIGN.md](DESIGN.md). Le suivi des lots et les preuves de validation sont dans [DEVELOPMENT.md](DEVELOPMENT.md).

La séparation des responsabilités conserve des scripts classiques sans framework : catalogue, stockage personnel, règles de calcul pures, vues et éditeurs. `layout.css` possède les listes historiques et leur géométrie ; `styles.css` les composants généraux ; `companion.css` les parcours complémentaires. Modifier la règle propriétaire plutôt qu’empiler des correctifs.

Les tests utilisent Node.js, Playwright et Edge installé. Playwright est une dépendance de développement seulement (présente dans l’environnement Codex de cette livraison). Sur un autre poste, installer une version compatible de Playwright et Edge avant de lancer :

```text
node scripts/test.cjs
git diff --check
```

Le lanceur exécute 16 suites : stockage/migrations, cycles, invocations, coûts, responsive, inventaires, éditeurs, Échos, Planner, activités, fiches/équipes, recommandations, imports, optimisation, revue finale et mise à jour PWA. Les tests de navigateur utilisent des comptes synthétiques isolés, des fixtures identifiées et aucune donnée du navigateur utilisateur. Ils couvrent FR/EN, clavier, interactions tactiles simulées, 320 à 1536 pixels CSS selon les parcours, changements de largeur, erreurs de stockage, requêtes indisponibles, import/export, rechargement et hors ligne. Les captures et mesures sont dans `test-results/`, exclu de Git.

Le test PWA indique dans son en-tête le commit de départ (actuellement `58fe0e8`) et vérifie deux fenêtres ouvertes, attente d’activation, fermeture, nouveau shell et données préservées. Après publication, comparer aussi les empreintes des fichiers réellement servis. Un push seul ne prouve pas le déploiement.

Les projections de données sont reproductibles avec `scripts/refresh-progression.cjs`, `scripts/refresh-achievements.cjs` et `scripts/refresh-sonatas.cjs`. Elles identifient la révision source WW_Data utilisée. `--check` compare avec les fichiers livrés ; `WUWA_SOURCE_CACHE` réutilise les téléchargements pour éviter les requêtes répétées. Les recommandations sont une synthèse éditoriale sourcée, à revoir à chaque évolution significative du jeu.

## Limites explicites

- Aucun simulateur de dégâts du compte : les recommandations donnent des repères contextualisés, et l’optimisation répartit les stocks connus entre objectifs sans les dépenser.
- Les coûts partent du début du niveau actuel ; l’EXP déjà acquise dans ce niveau n’est pas déduite. Les données manquantes rendent le calcul partiel. Le pré-farm d’un Résonateur sans arme équipée n’établit pas les coûts d’une future arme inconnue.
- Le budget vise les bannières régulières en vedette. Le maximum garanti est distinct d’un modèle médian prudent sans soft pity, explicitement différent des probabilités réelles du jeu. Les compteurs ambigus de l’historique restent des intervalles.
- Les événements intégrés sont datés de la version 3.6. Les activités personnelles complètent le calendrier ; aucune annonce future n’est inventée.
- Les essais automatisés et captures ne remplacent pas une validation sur tablette physique ni une certification d’accessibilité. La revue finale utilisateur porte sur l’usage et le rendu, pas sur le contrôle technique du code.

## Sources et interface

Catalogues/détails : [Encore](https://www.encore.moe/about) et [son schéma public](https://api-v2.encore.moe/openapi.json). Projections : [WW_Data, révision 353f2ea](https://github.com/Arikatsu/WutheringWaves_Data/tree/353f2eaed119bc9f680eab92807d20ac75a79b40). Guides : [Prydwen](https://www.prydwen.gg/wuthering-waves/), Game8 et références détaillées dans les fiches et le suivi de développement.

L’organisation des fiches s’inspire des menus du jeu ; les composants, ornements et visuels de remplacement sont dessinés en HTML/CSS/SVG. Aucune nouvelle police, piste audio ou ressource graphique extraite du jeu n’a été intégrée. Les anciens portraits distants restent attribués à leurs détenteurs ; leur présence sur un service public ne constitue pas une licence. Le projet n’est ni affilié ni approuvé par Kuro. Voir l’analyse de provenance et les limites dans [DESIGN.md](DESIGN.md).
