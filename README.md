# WuWa Companion — paquet PWA pour Earyon/wuwa-companion

## Provenance

Source : conversation Wuwa, https://chatgpt.com/c/6a9d7145-437c-83ed-9dd6-52100af8f81c, message V0.5.7 du 9 septembre 2026.
HTML récupéré depuis la vue Code de wuwa-companion-v0.5.7-intro-icon-layout.html.
SHA-256 du texte HTML original : d4a2507e96e2c4c3556d62bc12dc22b98d970b5e53e70e6de241ad0e4007d88f.

La conversation annonce ensuite une V0.5.8 PWA. Son bouton de téléchargement était visible mais ne livrait aucun fichier pendant la récupération. Aucun artefact ultérieur n'a été trouvé dans les messages postérieurs. Ce paquet est donc une adaptation documentée de la V0.5.7 récupérée, et NON l'archive originale V0.5.8.

## Changements limités

- HTML, CSS et logique de la V0.5.7 conservés, y compris leurs sections encore en attente de développement.
- Ajout de 20 px sous la ligne filtres/tri dans les deux listes, conformément au dernier retour validé (la valeur exacte n'était pas précisée).
- Ajout du manifeste, de l'enregistrement du service worker et du cache des seuls fichiers de l'interface.
- Icônes d'installation créées à partir du nom et des couleurs de l'interface ; aucune icône d'application d'origine récupérable.
- Clés de stockage, données et logique de validation d'origine conservées.

## Copier dans le dépôt

Extraire le ZIP puis copier son contenu à la racine du dépôt local wuwa-companion. index.html doit être directement à la racine. Aucun outil de compilation ni installation de dépendances n'est nécessaire.
Vérifier les changements dans GitHub Desktop, puis effectuer le commit et le push lorsque souhaité.

## Hébergement

Pour GitHub Pages : publier la branche main, dossier / (root). Le paquet utilise des chemins relatifs compatibles avec /wuwa-companion/.
Pour Cloudflare Pages : projet statique sans commande de compilation, répertoire publié à la racine du dépôt. _headers concerne Cloudflare ; GitHub Pages l'ignore.
L'installation PWA exige HTTPS ou localhost. Ouvrir index.html directement ne permet pas d'installer le service worker.

## Cache et mises à jour

Le premier lancement des données du jeu nécessite Internet. Le cache local validé de l'application est conservé. Les images distantes et les fiches non encore consultées ne sont pas garanties hors ligne.
Les nouvelles versions du service worker attendent la fermeture de toutes les fenêtres de l'application avant de s'activer. Modifier CACHE_NAME dans sw.js à chaque livraison des fichiers de l'interface.
Les données personnelles restent dans le navigateur et dépendent de l'adresse utilisée : un ancien fichier HTML local et un site HTTPS ne partagent pas automatiquement leur stockage.

## Vérifications

Syntaxe JavaScript d'origine et des ajouts contrôlée ; comparaison confirmant l'absence de modification du script applicatif ; manifeste, icônes et fichiers du cache contrôlés ; intégrité du ZIP contrôlée.
L'installation sur tablette, le comportement hors ligne et les services distants restent à valider sur l'adresse HTTPS finale.
