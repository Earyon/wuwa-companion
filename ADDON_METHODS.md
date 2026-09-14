# Import automatique du compte — comparaison avant choix

État du 14 septembre 2026. Cible : compte international, PC Windows, site et tablette Android. Objectif maintenu : aucune saisie des personnages, armes, Échos ou statistiques. Le module final reste à réaliser après le choix de la méthode. Cette étude ne présente aucune méthode comme capable, aujourd’hui, de récupérer à elle seule tout le compte avec une fiabilité démontrée.

## Recommandation issue des vérifications

Développer en priorité un **module Windows qui parcourt les menus et lit les données affichées**, complété par les exports structurés effectivement disponibles. Garder le traitement d’images local, puis synchroniser seulement les données du compte vers Companion. L’utilisateur ouvrirait le jeu, lancerait « Synchroniser », puis laisserait le module parcourir ses possessions. Une première connexion/association serait nécessaire ; aucune saisie des valeurs ne serait demandée.

C’est la piste la mieux étayée pour le compte international, mais elle demande encore un vrai collecteur fiable. Le scanner tiers inspecté ne doit pas être livré tel quel et le premier moteur OCR testé ne lit pas assez bien toutes les statistiques d’Écho. Accepter un risque contractuel ne résout pas ces défauts techniques.

## Comparaison des méthodes

| Méthode | Ce qui est établi | Limite pour « tout remplir » | Contraintes / risques | Suite possible |
| --- | --- | --- | --- | --- |
| Fichiers locaux et historique des invocations | Les ressources du jeu fournissent les catalogues et textes. WuWa Tracker utilise l’accès à l’historique des invocations. | Aucun inventaire personnel complet trouvé dans les deux stockages lisibles inspectés. Les tirages ne donnent pas les niveaux actuels ni les copies d’Échos. | Conserver les fichiers et secrets locaux ; certains scripts tiers proposent aussi des modifications de configuration. | Complément utile, insuffisant seul. |
| API communautaire Kuro | Des services communautaires documentent statistiques de compte, personnages présentés et progression. | Le fonctionnement pour les comptes chinois ne prouve pas celui du compte international. Aucune API internationale complète de toutes les possessions vérifiée ici. | Authentification, disponibilité et conditions du service ; endpoints non garantis pour une application tierce. | À intégrer seulement après une preuve réelle sur le serveur visé. |
| Lecture visuelle automatique sous Windows | Code public de scanners ; reconnaissance locale testée sur la vidéo fournie. | Navigation, fin d’inventaire, qualités, nœuds, doublons et Échos équipés restent à fiabiliser. | Le jeu doit être ouvert et le parcours ne doit pas être interrompu. L’automatisation des entrées n’est pas garantie conforme aux conditions Kuro. | Piste recommandée pour le premier module. |
| Lecture de mémoire du processus | Windows fournit une API de lecture de mémoire sous permissions adaptées. | Pas de collecteur WuWa actuel, complet et vérifié trouvé. Aucune preuve que tous les champs nécessaires soient accessibles et correctement identifiés. | Interaction avec le processus protégé, compatibilité à chaque version, risque contractuel et anti-triche non quantifiable. | Piste de recherche distincte ; aucun lecteur exécuté sur le compte. |
| Interception du protocole / instrumentation du client | Le serveur et le client échangent nécessairement des états utiles ; ce constat ne fournit pas un export exploitable. | Aucun protocole complet ni module fiable vérifié pour cette version internationale. Déchiffrement éventuel, identification des champs et couverture restent inconnus. | Manipulation potentielle de secrets de session, du client ou des protections ; intrusion et maintenance plus importantes. | Pas de solution prête à sélectionner comme « meilleure » ; hypothèse de recherche uniquement. |

« Contraire aux conditions d’utilisation » et « illégal » ne sont pas des conclusions interchangeables. Les conditions Kuro interdisent notamment certains programmes non autorisés, plugins, modifications et contournements ; elles prévoient des sanctions. Je n’ai ni autorisation spécifique de Kuro ni taux de risque de bannissement vérifiable. Le fait de seulement lire, de travailler en local ou d’utiliser un outil public ne suffit pas à établir une autorisation. [Conditions publiées par Kuro, section 7](https://store.steampowered.com/eula/3513350_eula_0).

Sources des capacités : [import WuWa Tracker](https://wuwatracker.com/import), [script maintenu](https://github.com/wuwatracker/wuwatracker/blob/main/import.ps1), [collection communautaire d’API Kuro](https://github.com/TomyJan/Kuro-API-Collection), [XutheringWavesUID, distinction internationale et OCR](https://github.com/Loping151/XutheringWavesUID), [ReadProcessMemory, Microsoft](https://learn.microsoft.com/en-us/windows/win32/api/memoryapi/nf-memoryapi-readprocessmemory). L’absence d’export complet dans les sources inspectées n’est pas une preuve d’impossibilité générale.

## Pourquoi Windows en premier

Windows permet de travailler avec les menus affichés et des traitements d’image locaux. Sur Android, même l’accès général aux fichiers ne donne pas librement accès au stockage privé des autres applications. Cela ne rend pas un collecteur complet plus simple. Une version Android pourrait employer la capture d’écran et des autorisations appropriées, mais elle constituerait un autre développement et n’apporterait pas une preuve d’accès aux données cachées. [Documentation Android](https://developer.android.com/training/data-storage/manage-all-files).

L’installation locale du jeu a été inspectée en lecture seule, selon la priorité des sources demandée. L’inventaire et les limites exactes de cette analyse restent dans [SOURCE_DATA.md](SOURCE_DATA.md). Les archives d’images ne doivent pas être confondues avec une sauvegarde du compte. Aucun processus de jeu n’était ouvert pendant le contrôle de disponibilité ; aucun essai d’import complet en jeu n’a été réalisé.

## Audit du scanner existant : défauts reproduits

Révision inspectée de **WuWa Inventory Kamera** : `7b5ecf4eca355d3f4a06fb0d65e8419d1f984883`. L’audit porte sur les collecteurs, le traitement OCR commun, les paramètres et les dépendances ; ce n’est pas un audit exhaustif de sécurité du logiciel.

Des fonctions originales ont été exécutées avec de fausses images et commandes, sans lancement de son automatisation :

| Nombre d’Échos simulé | Cases visitées par le collecteur |
| --- | --- |
| 1 | 2 |
| 23 | 24 |
| 24 | 1 |
| 25 | 26 |
| 48 | 25 |

La borne de dernière page est erronée, notamment lorsque le nombre de copies est un multiple de 24. Le code des armes emploie la même expression. Une quantité d’objet illisible devient également 1 dans la fonction testée. Les sources sont identifiées pour pouvoir reproduire ces constats. [Collecteur d’Échos](https://github.com/Psycho-Marcus/WuWa_Inventory_Kamera/blob/7b5ecf4eca355d3f4a06fb0d65e8419d1f984883/scraping/echoesScraper.py), [collecteur d’armes](https://github.com/Psycho-Marcus/WuWa_Inventory_Kamera/blob/7b5ecf4eca355d3f4a06fb0d65e8419d1f984883/scraping/weaponsScraper.py).

À la lecture du code des personnages : une lecture de niveau manquée devient 1 ; la section des Échos équipés est explicitement ignorée ; le Rover est associé à une identité fixe. Ces comportements empêchent de traiter le résultat comme un inventaire complet fiable. Le traitement commun ignore aussi le score de confiance fourni par son moteur OCR. Une reprise de code devrait respecter sa licence GPL-3.0 ; aucun code du scanner n’a été copié dans le module livré ici. [Personnages](https://github.com/Psycho-Marcus/WuWa_Inventory_Kamera/blob/7b5ecf4eca355d3f4a06fb0d65e8419d1f984883/scraping/charactersScraper.py), [traitement OCR](https://github.com/Psycho-Marcus/WuWa_Inventory_Kamera/blob/7b5ecf4eca355d3f4a06fb0d65e8419d1f984883/scraping/utils/common.py).

Autres pistes consultées : [FrequencyManager](https://github.com/Voruzhu/FrequencyManager) et [wuwa-toolkit](https://github.com/MinhBN-dev/wuwa-toolkit), centrés sur les Échos ; [ScoreEcho](https://github.com/Loping151/ScoreEcho), qui utilise aussi l’image et conserve des configurations manuelles. Leurs descriptions ne prouvent pas un import intégral sans saisie sur le compte présent.

## Prototype local réellement testé

`addon/windows/read-image.ps1` lit uniquement un fichier image existant. Il utilise le moteur OCR Windows et la langue française déjà installée ; aucune clé, aucun abonnement ni API payante. Il produit un relevé local des mots et de leur position, sans les appliquer au compte. Il ne capture pas le jeu et ne pilote pas ses menus. [API Microsoft](https://learn.microsoft.com/en-us/uwp/api/windows.media.ocr.ocrengine).

Cinq observations issues de la vidéo utilisateur ont été contrôlées :

- Attributs : les six valeurs chiffrées contrôlées et le niveau 90 sont lus ; l’ascension n’est pas établie par ce relevé.
- Compétences : les cinq niveaux sont lus correctement ; les déblocages graphiques des nœuds ne sont pas établis.
- Syntonisation : le rang actuel et le rang proposé apparaissent ensemble. Prendre automatiquement le plus grand serait faux.
- Écho, image réduite à 862 × 540 : une valeur sur sept correspond exactement au texte attendu.
- Même Écho, image d’origine 1724 × 1080 : quatre valeurs sur sept correspondent exactement ; trois pourcentages sont mal transcrits. Les expériences de recadrage/agrandissement et seuillage n’ont pas suffi à fiabiliser l’ensemble.

Temps mesurés du moteur sur ces cinq images : 53 à 89 ms, hors chargement, capture, navigation et vérification. Ce n’est pas une mesure du temps nécessaire pour synchroniser le compte. Le benchmark facultatif `scripts/check-ocr-reference.cjs` vérifie les relevés privés ; les images, identifiants utilisateur et sorties brutes restent dans `test-results/`, exclus du dépôt.

Conséquence : comparer ou ajuster le moteur de reconnaissance et vérifier les valeurs avec leurs régions d’écran sera nécessaire. Le prototype ne transforme pas un chiffre manquant en zéro et ne prétend pas fournir une confiance numérique que le moteur Windows n’expose pas.

## Préparation de l’import et protection des données

Le module commun prépare une proposition dans un stockage isolé et réutilise les véritables validations de Companion. Les tests couvrent les personnages, niveaux, séquences, armes, Échos, statistiques et ressources ; les inconnues sont omises, les valeurs déjà présentes sont conservées et zéro reste une quantité réelle.

Les exemplaires possèdent des identifiants distincts, même lorsque leurs statistiques sont identiques. Les copies dépourvues d’une identité stable sont refusées : utiliser le nom, l’emplacement dans la grille ou un simple hachage des statistiques ferait perdre des doublons ou créerait des copies à chaque amélioration. Le futur collecteur OCR devra résoudre ce point ; il n’est pas masqué par le prototype.

Une proposition répétée est sans effet. Un relevé ancien, une autre identité de compte, un autre serveur, une modification concurrente, une arme incompatible, une Sonate incompatible et des données mal formées sont rejetés. Aucun objet absent d’un relevé partiel n’est supprimé automatiquement. Les nœuds Forte ne seront importés depuis une source réelle qu’une fois la correspondance des identifiants vérifiée.

Validation réalisée : tests du module avec 37 cas invalides, puis restauration d’une sauvegarde préparée dans l’application réelle sous Edge isolé, sans réseau externe. Personnage, cinq niveaux de compétences affichés, lien d’arme, Écho possédé et rechargement vérifiés. Il s’agit d’un compte synthétique ; aucun scan du compte réel n’est prétendu. Les scripts ne sont pas ajoutés au chargement du site : [mode d’emploi technique et limites](addon/README.md).

## Synchronisation proposée, sans dépense

Conserver GitHub Pages pour le site. Ajouter une authentification Companion et un stockage privé par utilisateur ; le module Windows serait associé une fois au compte Companion. Transmettre uniquement les valeurs normalisées, conserver une sauvegarde locale avant changement et une file d’attente hors connexion. Éviter les transferts pendant une édition et contrôler les versions avant fusion. Ne pas envoyer les journaux, captures brutes ou secrets Kuro.

**Firebase Spark** est une option à privilégier pour le premier déploiement : pas de compte de facturation, pas d’activation de Blaze, authentification adaptée et accès aux documents limité à leur propriétaire. Les quotas gratuits limitent l’usage ; ils ne constituent pas une promesse de service illimité. Aucun projet cloud, aucune règle d’accès ni connexion utilisateur n’a encore été configuré ou testé. La synchronisation n’est donc pas opérationnelle. [Offre Spark](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans), [quotas Firestore](https://firebase.google.com/docs/firestore/quotas), [contrôles d’accès](https://firebase.google.com/docs/firestore/security/rules-conditions).

Le choix de la méthode de collecte précède sa distribution et la validation sur le vrai compte. Le résultat visé demeure « je ne saisis rien » ; le stade actuel est une préparation vérifiée, avec des obstacles techniques identifiés, et non un add-on fini.
