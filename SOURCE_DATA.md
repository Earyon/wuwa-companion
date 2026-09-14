# Sources du jeu et maintenance — 14 septembre 2026

## État vérifié

La priorité demandée est appliquée : fichiers du jeu installé, recoupement avec les bases publiques, puis guides et vidéo pour comprendre leur présentation. L'installation Windows a été examinée en lecture seule. Aucune exécution du jeu, injection, lecture de mémoire ou modification de ses fichiers n'a été effectuée.

- Inventaire : 1 353 fichiers, 114,11 Gio, aucune erreur d'énumération. Les 493 archives incluent les voix.
- Les index des 55 archives de base et 46 correctifs de ressources ont été lus : 101 index accessibles, 2 166 647 entrées avec doublons entre versions. Les derniers correctifs priment sur les ressources de base.
- Treize bases SQLite de référence ont été extraites et contrôlées : rôles, compétences, arbre, chaîne, propriétés, succès, objets, armes, Échos et textes FR/EN. Douze tables utiles ont été décodées ; les redirections de textes vers la seconde base ont été résolues.
- Le contenu utile a été extrait à la demande. Cette analyse des index ne signifie pas que les 114 Gio de sons, modèles et autres données ont été intégralement décodés.
- Les deux petits stockages locaux lisibles ont été examinés sans transcrire leurs données sensibles. Aucun inventaire personnel complet et exploitable n'y a été trouvé. Cela ne prouve pas son absence dans tous les fichiers binaires. Companion ne se connecte pas au compte Kuro.

Le manifeste `data/game-source.json` conserve les empreintes de 27 fichiers sources revus, leurs bases et archives d'origine. Le jeu est identifié **3.6.0**, correctif local **3.6.13**. L'API publique Encore annonce **3.6.0 / ResVer 3.6.6** : ces deux numérotations ne sont pas interchangeables.

## Recoupement et français

Les champs communs des six tables principales comparées à [WW_Data, révision 353f2ea](https://github.com/Arikatsu/WutheringWaves_Data/tree/353f2eaed119bc9f680eab92807d20ac75a79b40) ne présentaient aucune différence. Les textes locaux sont plus récents : 2 513 textes français et 2 392 anglais diffèrent parmi les identifiants communs, avec six nouveaux identifiants. Les textes locaux sont donc prioritaires ; une ancienne projection publique ne doit pas les remplacer silencieusement.

Les 58 Résonateurs canoniques possèdent une référence bilingue locale : compétences, descriptions, six séquences, identifiants et parents de l'arbre. Les bonus automatiques ne sont pas présentés comme des déblocages payants. Les valeurs personnelles utilisent toujours les identifiants stables.

La projection française couvre 62 noms de personnages locaux (dont les 58 du catalogue), les 122 armes et les 1 207 succès publiables avec leurs descriptions. Parmi les catalogues complémentaires, 244 noms d'Échos sur 311 et 2 220 noms d'objets sur 2 339 ont une correspondance locale établie ; les autres conservent la source française Encore. Pour les Échos, le rapprochement utilise le chemin d'icône officiel et exige un nom unique entre variantes de qualité. Aucun identifiant n'est obtenu par une multiplication arbitraire.

Les formulations restant en anglais dans la traduction officielle sont conservées comme telles : par exemple, le type de compétence « Forte Circuit » est présent ainsi dans les textes FR locaux. Une traduction inventée ne serait pas une traduction officielle. [Slyraf](https://slyraf.com/wuthering-waves/personnages/) complète les références françaises, sans remplacer un texte du jeu identifié.

## Images

`assets/game/sources.json` décrit 2 827 ressources, dédupliquées en **2 822 fichiers WebP** grâce à leur contenu. Leurs noms sont les 20 premiers caractères du SHA-256 ; le manifeste conserve l'empreinte complète, la résolution, le découpage éventuel et l'archive d'origine. Les fichiers totalisent environ 125 Mo et aucun ne dépasse 1 Mio. S'y ajoutent les quinze cadres et icônes de navigation dans `assets/game-ui`.

Les pixels ont été décodés à leur résolution disponible, découpés uniquement suivant les coordonnées du sprite source, puis convertis sans perte. Les portraits de formation, icônes de compétences et grandes icônes d'équipement restent les images du jeu. Certaines icônes officielles d'armes ou d'Échos montrent seulement une partie du modèle : aucune reconstruction graphique n'a été inventée. Les illustrations sont en 2D, sans modèles ni animations du jeu.

`data/game-assets.json` relie les chemins et identifiants du catalogue aux images. Les alias ne sont ajoutés qu'après rapprochement vérifié. Deux images de coffrets absentes de l'installation conservent leur repli distant. Les images se téléchargent à la demande ; la bibliothèque entière n'est pas précachée.

## Reproduction et vérification

Les outils de lecture ont été utilisés uniquement dans le dossier privé ignoré `test-results/local-game-audit/`. Le lecteur repose sur [CUE4Parse](https://github.com/FabianFG/CUE4Parse), avec les bibliothèques de la [publication FModel d'août 2026](https://github.com/4sval/FModel/releases/tag/aug-2026). L'intégrité du paquet téléchargé et d'un premier index déchiffré a été contrôlée. Les informations publiques nécessaires à la lecture des archives proviennent de l'outil maintenu [wuwa-keys](https://github.com/yarik0chka/wuwa-keys). Aucun exécutable du jeu ou de FModel n'a été lancé.

Les bibliothèques, clés, archives, bases brutes, pixels intermédiaires et captures de vidéo ne sont pas publiés. Le dépôt contient seulement les projections utiles à Companion et leurs références. L'extraction des archives n'est pas un service automatique de l'application et n'est pas distribuée comme une chaîne universelle de mise à jour.

Pour vérifier la livraison sans accès au jeu :

```text
node tests/source-data.cjs
node tests/catalogue-version.cjs
```

Pour régénérer les projections depuis l'instantané local déjà revu, définir `WUWA_SOURCE_CACHE` sur son dossier `source-cache`, puis lancer les scripts suivants avec `--check` pour comparer, ou sans cet argument pour écrire :

```text
node scripts/refresh-localization.cjs --check
node scripts/refresh-resonators.cjs --check
node scripts/refresh-weapons.cjs --check
node scripts/refresh-achievements.cjs --check
node scripts/refresh-sonatas.cjs --check
node scripts/refresh-catalogue.cjs --check
node scripts/refresh-inventory.cjs --check
```

Les projections locales refusent un instantané dont les empreintes diffèrent du manifeste. Pour une future version, revoir ensemble les tables, traductions, identifiants, ressources et leurs empreintes avant de mettre à jour le manifeste. La conversion des nouvelles images doit conserver leurs dimensions et coordonnées originales, produire des noms fondés sur le contenu, puis actualiser les deux manifestes. Ne pas réutiliser un ancien script d'extraction privé sans le comparer au format actuel.

Après une évolution : tester les personnages concernés et les composants communs, vérifier les données personnelles existantes, incrémenter le shell PWA si nécessaire et contrôler les fichiers réellement servis après publication. Les noms et images appartiennent à Kuro Games ; leur provenance et cette attribution ne constituent pas une licence de réutilisation.
