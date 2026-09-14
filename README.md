# WuWa Companion

Companion communautaire FR/EN pour Wuthering Waves, utilisable sur ordinateur, tablette et mobile. Application statique, sans compilation, serveur de compte, abonnement ou service payant.

**Site : https://earyon.github.io/wuwa-companion/**

## Utilisation

- **Mon compte** : Résonateurs possédés, niveaux, ascensions, cinq compétences, passifs, séquences, exemplaires d’armes et Échos équipés, stocks connus ou inconnus.
- **Encyclopédie** : Résonateurs, armes et Échos, descriptions du jeu FR/EN, compétences, chaîne résonatrice et effets de Sonate. Les filtres s'appliquent à la sélection ; le bouton Rechercher valide seulement le texte saisi.
- **Plus** : équipes, succès, activités et réglages. Le tutoriel peut être passé à la première ouverture et rejoué dans les réglages ; il accompagne aussi une restauration de sauvegarde.

La phase Collection masque les objectifs, recommandations, planification et invocations pour concentrer l'interface sur les possessions et la consultation. Leur code et les données personnelles sont conservés pour la seconde phase.

Les références intégrées couvrent **58 Résonateurs, 122 armes, 34 groupes de Sonate et 1 207 succès**. Les textes sont issus prioritairement du jeu installé, correctif **3.6.13**, contrôlé le 14 septembre 2026. Encore complète les catalogues ; sa version de ressources **3.6.6** est distincte du numéro de correctif local. Voir [SOURCE_DATA.md](SOURCE_DATA.md) pour la provenance, la couverture française et la maintenance.

## Données personnelles et sauvegarde

Les données restent dans le navigateur de chaque appareil. Le compte compact utilise `wwc_companion_v1`, format 7 ; les anciennes versions et les clés historiques sont conservées ou migrées sans réinitialisation. Les valeurs inconnues ne deviennent pas automatiquement zéro. Les équipements par exemplaire et leurs propriétaires utilisent des identifiants stables.

**Deux exports distincts** permettent de changer d’appareil :

1. Plus → Réglages → Exporter ma sauvegarde : compte, possessions, équipements, objectifs, équipes, ressources et réglages.
2. Export des historiques volumineux dans IndexedDB : conservé dans le module Invocations, actuellement masqué avec la seconde phase.

La restauration du compte propose un aperçu et conserve l’état antérieur. Les imports JSON WuWa Tracker acceptent ExportProfile (stocks et succès) et ExportPullHistory (historique). Les objectifs Tracker ne prouvent pas l’inventaire actuel. Les profils d’historique restent séparés ; un même export réimporté ne crée pas de doublons, sans supprimer les répétitions d’un tirage multiple. Aucun journal du jeu, token ou lien d’authentification n’est nécessaire.

Il n’y a pas de synchronisation distante. Les protections contre les modifications obsolètes réduisent les conflits entre fenêtres ; une simultanéité exacte entre processus reste une limite de Web Storage. Les historiques utilisent une transaction IndexedDB pour une fusion atomique.

## Démarrage et mises à jour

Servir le dossier par HTTP local ou HTTPS ; ne pas ouvrir directement `index.html` comme fichier. Les catalogues et les références principales sont livrés avec l'application : leur affichage n'attend plus un service externe. La version distante est contrôlée en arrière-plan ; un cache incomplet ou un service indisponible ne réinitialise pas le compte.

Le service worker met en cache les écrans et les petits catalogues. Les illustrations se chargent à la demande : l'application ne télécharge pas toute la bibliothèque d'images au démarrage. Leur cache est limité à 160 images et 24 Mio, avec un maximum de 1 Mio par image ; les ressources non consultées ne sont pas garanties hors ligne. Les réglages indiquent si une mise à jour attend : enregistrer les modifications et fermer **toutes** les fenêtres de Companion permet son activation à la prochaine ouverture. Ne pas effacer le stockage pour actualiser le site.

GitHub Pages publie `main`, dossier racine, avec des chemins relatifs compatibles avec `/wuwa-companion/`. `_headers` est une configuration historique Cloudflare, ignorée par GitHub Pages. Une livraison modifiant le shell doit incrémenter `CACHE_NAME` et inclure ses nouvelles ressources dans `SHELL` de `sw.js`.

## Développement et vérification

Lire [AGENTS.md](AGENTS.md), [QUALITY.md](QUALITY.md) et [DESIGN.md](DESIGN.md). Le suivi des lots et les preuves de validation sont dans [DEVELOPMENT.md](DEVELOPMENT.md).

La séparation des responsabilités conserve des scripts classiques sans framework : catalogue, stockage personnel, règles de calcul pures, vues et éditeurs. `layout.css` possède les listes historiques et leur géométrie ; `styles.css` les composants généraux ; `companion.css` les parcours complémentaires. Modifier la règle propriétaire plutôt qu’empiler des correctifs.

Les tests utilisent Node.js, Playwright et Edge installé. Playwright est une dépendance de développement seulement (présente dans l’environnement Codex de cette livraison). Sur un autre poste, installer une version compatible de Playwright et Edge avant de lancer :

```text
node scripts/test.cjs
git diff --check
```

Le lanceur exécute 22 suites : stockage/migrations, règles, coûts, versions et sources, responsive, inventaires, éditeurs, Échos, fonctions conservées de la seconde phase, Collection, tutoriel, cache d'images, revue finale, mise à jour PWA et comparaison des performances. Les tests utilisent des comptes synthétiques isolés et aucune donnée du navigateur utilisateur. Ils couvrent FR/EN, clavier, interactions tactiles simulées, 320 à 1536 pixels CSS selon les parcours, changements de largeur, erreurs de stockage, requêtes indisponibles, import/export, rechargement et hors ligne. Les captures et mesures restent dans `test-results/`, exclu de Git.

Le test PWA part de `947c7f8` et vérifie deux fenêtres ouvertes, attente d'activation, fermeture, nouveau shell et données préservées. Après publication, comparer aussi les empreintes des fichiers réellement servis. Un push seul ne prouve pas le déploiement.

Les projections de données sont reproductibles avec `scripts/refresh-progression.cjs`, `scripts/refresh-achievements.cjs` et `scripts/refresh-sonatas.cjs`. Elles identifient la révision source WW_Data utilisée. `--check` compare avec les fichiers livrés ; `WUWA_SOURCE_CACHE` réutilise les téléchargements pour éviter les requêtes répétées. Les recommandations sont une synthèse éditoriale sourcée, à revoir à chaque évolution significative du jeu.

## Limites explicites

- Aucun simulateur de dégâts du compte : les recommandations donnent des repères contextualisés, et l’optimisation répartit les stocks connus entre objectifs sans les dépenser.
- Les coûts partent du début du niveau actuel ; l’EXP déjà acquise dans ce niveau n’est pas déduite. Les données manquantes rendent le calcul partiel. Le pré-farm d’un Résonateur sans arme équipée n’établit pas les coûts d’une future arme inconnue.
- Le budget vise les bannières régulières en vedette. Le maximum garanti est distinct d’un modèle médian prudent sans soft pity, explicitement différent des probabilités réelles du jeu. Les compteurs ambigus de l’historique restent des intervalles.
- Les événements intégrés sont datés de la version 3.6. Les activités personnelles complètent le calendrier ; aucune annonce future n’est inventée.
- Les essais automatisés et captures ne remplacent pas une validation sur tablette physique ni une certification d’accessibilité. La revue finale utilisateur porte sur l’usage et le rendu, pas sur le contrôle technique du code.

## Sources et interface

Catalogues/détails : [Encore](https://www.encore.moe/about) et [son schéma public](https://api-v2.encore.moe/openapi.json). Projections : [WW_Data, révision 353f2ea](https://github.com/Arikatsu/WutheringWaves_Data/tree/353f2eaed119bc9f680eab92807d20ac75a79b40). Guides : [Prydwen](https://www.prydwen.gg/wuthering-waves/), Game8 et références détaillées dans les fiches et le suivi de développement.

Les fiches reprennent l'organisation observée dans la vidéo utilisateur : rubriques à gauche, Résonateurs à droite, arbre à cinq branches et chaîne en arc. Les images officielles proviennent des ressources locales du jeu, converties sans perte en WebP ; origine et empreinte sont conservées. Le fond et les composants web appartiennent à l'implémentation de Companion. Les illustrations sont en 2D : les modèles 3D, animations et améliorations exécutées dans le jeu ne sont pas reproduits. Le projet n'est ni affilié ni approuvé par Kuro ; l'attribution n'est pas une licence. Voir [DESIGN.md](DESIGN.md).
