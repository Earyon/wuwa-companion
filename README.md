# WuWa Companion — paquet PWA pour Earyon/wuwa-companion

## Provenance

Source : conversation Wuwa, https://chatgpt.com/c/6a9d7145-437c-83ed-9dd6-52100af8f81c, message V0.5.7 du 9 septembre 2026.
HTML récupéré depuis la vue Code de wuwa-companion-v0.5.7-intro-icon-layout.html.
SHA-256 du texte HTML original : d4a2507e96e2c4c3556d62bc12dc22b98d970b5e53e70e6de241ad0e4007d88f.

La conversation annonce ensuite une V0.5.8 PWA. Son bouton de téléchargement était visible mais ne livrait aucun fichier pendant la récupération. Aucun artefact ultérieur n'a été trouvé dans les messages postérieurs. Ce paquet est donc une adaptation documentée de la V0.5.7 récupérée, et NON l'archive originale V0.5.8.

## Adaptation initiale

- HTML, CSS et logique de la V0.5.7 conservés, y compris leurs sections encore en attente de développement.
- Ajout de 20 px sous la ligne filtres/tri dans les deux listes, conformément au dernier retour validé (la valeur exacte n'était pas précisée).
- Ajout du manifeste, de l'enregistrement du service worker et du cache des seuls fichiers de l'interface.
- Icônes d'installation créées à partir du nom et des couleurs de l'interface ; aucune icône d'application d'origine récupérable.
- Clés de stockage, données et logique de validation d'origine conservées.

## Développement et publication

Le site reste statique, sans compilation ni dépendance à installer pour son utilisation. GitHub Pages publie la branche `main`. Les corrections demandées peuvent être vérifiées, commitées et envoyées directement depuis Codex, conformément au cadre décrit dans `AGENTS.md`.

Depuis la consolidation du 10 septembre 2026, `styles.css` contient les styles généraux et `layout.css` possède la disposition des listes, cartes et filtres. Les anciennes règles concurrentes de ces composants ont été supprimées. La disposition des cartes dépend de la largeur réelle du panneau ; sur un petit panneau, le niveau et l'arme passent ensemble sous l'identité. Les autres fonctions et les clés de stockage sont conservées.

## Hébergement

Pour GitHub Pages : publier la branche main, dossier / (root). Le paquet utilise des chemins relatifs compatibles avec /wuwa-companion/.
Pour Cloudflare Pages : projet statique sans commande de compilation, répertoire publié à la racine du dépôt. _headers concerne Cloudflare ; GitHub Pages l'ignore.
L'installation PWA exige HTTPS ou localhost. Ouvrir index.html directement ne permet pas d'installer le service worker.

## Cache et mises à jour

Le premier lancement des données du jeu nécessite Internet. Le cache local validé de l'application est conservé. Les images distantes et les fiches non encore consultées ne sont pas garanties hors ligne.
Les nouvelles versions du service worker attendent la fermeture de toutes les fenêtres de l'application avant de s'activer. Modifier CACHE_NAME dans sw.js à chaque livraison des fichiers de l'interface.
Les données personnelles restent dans le navigateur et dépendent de l'adresse utilisée : un ancien fichier HTML local et un site HTTPS ne partagent pas automatiquement leur stockage.

## Vérifications reproductibles

Les tests utilisent Node.js, Playwright 1.62.1 et Microsoft Edge installé. Playwright est déjà disponible dans l'environnement Codex utilisé pour cette livraison ; ailleurs, installer cette dépendance de développement avec `npm install --no-save playwright@1.62.1`. L'application publiée n'en dépend pas.

```
node tests/responsive.cjs
node tests/pwa-update.cjs
git diff --check
```

- `responsive.cjs` exécute les vrais scripts de l'application avec des données synthétiques dans un navigateur isolé : 42 cas de dimensions/langue, rotations, noms longs, placement et absence de chevauchement, tri, filtres, recherche, édition et conservation après rechargement. Les captures sont produites dans `test-results/`, exclu de Git.
- `pwa-update.cjs` vérifie le passage du commit `7028d08` au shell courant avec deux anciennes fenêtres ouvertes, l'attente d'activation, la conservation du stockage personnel et d'un cache indépendant, puis un rechargement hors ligne.
- Examiner les captures, la syntaxe JavaScript et le diff avant publication. Après publication, comparer les fichiers réellement servis par Pages avec les fichiers livrés.

Ces essais ne constituent pas une validation sur la tablette physique et ne vérifient pas l'exactitude des données des services de jeu. Ils ne modifient jamais le navigateur ni les données de l'utilisateur.

Références des choix techniques : [container queries, MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries) et [cycle de vie du service worker, web.dev](https://web.dev/articles/service-worker-lifecycle).
