# Développement complet — suivi vérifiable

Demande du 13 septembre 2026 : développer les fonctions prévues avant la revue utilisateur, puis présenter une partie à la fois. Les tests techniques restent à la charge de l'agent. Une case vide est du travail restant, pas une fonctionnalité terminée.

## Reproduction complète — reprise du 14 septembre 2026

L'utilisateur demande de terminer l'ensemble sans nouvelle validation. Cette reprise couvre les cinq rubriques et leurs commandes de consultation/édition, et non uniquement l'arbre. Les recommandations et objectifs restent masqués.

Suivi : **4 / 5 lots vérifiés**.

- [x] Sources complémentaires : statistiques, détails des compétences, armes, Échos, éléments graphiques et faisabilité des modèles animés.
- [x] Attributs et arme : panneaux de référence, statistiques sourcées, progression, sélection et syntonisation.
- [x] Échos : cinq emplacements, attributs cumulés, Sonates, sélection et modification des exemplaires.
- [x] Compétences, chaîne et navigation : détails chiffrés, états, transitions et cohérence des sous-écrans.
- [ ] Revue globale : captures comparées à la vidéo, tests, performances, PWA et publication contrôlée.

Les limites réellement rencontrées seront consignées ; aucun compteur ne certifiera une reproduction du moteur 3D ou des transactions du compte Kuro sans réalisation et vérification.

Les 24 suites ont passé sur l'intégration. Après revue visuelle, les corrections de paysage compact et de stabilité du panneau ont été revérifiées par `menu-completion`, `talent-editor`, `echoes`, `collection`, `pwa-update` et `source-data`. Le nouveau contrôle couvre 50 dispositions des cinq menus (FR/EN ; 1724 × 1080, 1152 × 800, 720 × 1122, 720 × 450, 360 × 640), les valeurs de compétences au niveau choisi, les rangs d'armes, les niveaux frontières ambigus, les cumuls d'Échos, les doublons de Sonate, les filtres, les brouillons et leur sauvegarde/rechargement. La revue distingue explicitement statistiques de base et bonus d'équipement. Les arrondis suivent `AttributeModel` : troncature des valeurs entières et des pourcentages à une décimale.

L'audit supplémentaire de 458 sprites confirme les 457 ressources existantes à l'identique ; seule la nouvelle étoile d'ascension utilise le format de texture séparée. Les chemins immuables existants ont été conservés. Les 2 889 images officielles référencées correspondent aux empreintes contrôlées. Les nouvelles courbes, traductions et valeurs par niveau se régénèrent sans différence.

Mesures de cette intégration dans le banc existant (Edge isolé, trois essais, services simulés à 150 ms) : médianes Collection/portraits froids **206 / 224 ms**, réouverture **140 / 160 ms** ; une vérification réseau de version, aucune image distante au démarrage. Ces mesures ne certifient pas la connexion ou la tablette physique de l'utilisateur.

Limites effectives : les illustrations officielles restent en 2D, l'export de la géométrie 3D actuelle échoue avec le lecteur disponible ; les animations/materials du moteur Kuro et sa police commerciale ne sont pas reproduits. Les commandes enregistrent la progression déclarée dans Companion ; elles n'exécutent aucune transaction dans le jeu. Les petits écrans gardent des adaptations tactiles. Les recommandations et objectifs restent masqués. Les cinq rubriques sont opérationnelles dans ce périmètre ; une copie strictement identique du client de jeu n'est pas obtenue.

## Fidélité au menu du jeu — correction du 14 septembre 2026

Le bilan fonctionnel Collection ci-dessous ne validait pas une copie conforme. Le retour utilisateur a révélé des écarts réels : marges transparentes des cadres ignorées, grille estimée, colonnes latérales conservées lors de la sélection et mise en forme officielle du texte supprimée.

Suivi de cette intervention : **3 / 3 lots vérifiés**.

- [x] Source primaire : onze prefabs de menus décodés sans erreur ; positions, dimensions, états et références de sprites identifiés et comparés à la vidéo.
- [x] Intégration : arbre et chaîne depuis les coordonnées sources, navigation commune, détail séparé et texte officiel mis en forme ; tests de tous les parcours concernés.
- [x] Livraison : revue des captures, contrôles complets, mise à jour PWA et vérification des ressources publiées.

Validation exécutée : les 23 suites ont passé sur l'intégration. La dernière revue visuelle a ensuite déplacé l'enregistrement pour dégager les libellés et séparé le défilement de la description des commandes. Après ces ajustements, `talent-editor`, `collection` et `pwa-update` ont été relancés avec succès. Le premier contrôle couvre 116 arbres (58 personnages × 2 langues), 56 dispositions de détail et dix parcours de chaîne avec rotations simulées. Il compare aussi les centres à la vidéo, vérifie les zones réellement accessibles, le focus, le texte officiel mis en forme, le filtrage du balisage, le brouillon, l'annulation et la lecture indépendante. Les captures finales en 1724 × 1080, 720 × 450 et téléphone ont été examinées. Les 58 projections se régénèrent à l'identique ; en retirant uniquement leurs nouveaux champs de texte enrichi, leur contenu est identique au commit précédent. Syntaxe et `git diff --check` passent.

Publication confirmée : commit applicatif `9d6b3d9`, [déploiement Pages 34818770854 réussi](https://github.com/Earyon/wuwa-companion/actions/runs/34818770854). Les empreintes de 149 fichiers réellement servis correspondent au commit ; parcours public isolé validé pour tutoriel, images officielles, édition/enregistrement/rechargement et prise en charge PWA. Capture publiée examinée. L'essai n'utilise pas le navigateur personnel et ne constitue pas une validation sur tablette physique.

Le compteur porte sur cette correction et ne signifie pas que tous les menus sont des copies conformes. Restent des différences explicites : illustration 2D du personnage, police système, animations et effets de matériaux du moteur du jeu, sous-écrans de statistiques/dégâts et actions propres au jeu. Les contrôles Companion enregistrent la progression déclarée, sans simuler une consommation de ressources dans le compte Kuro. Les petits écrans conservent des adaptations tactiles.

## Phase Collection — 4 / 4 lots vérifiés

Reprise expressément autorisée le 13 septembre 2026 : réaliser la phase en une traite, tests et publication inclus. L'encyclopédie doit partager le code graphique de toute l'application. Les nouvelles recommandations et les objectifs restent pour une seconde phase ; leurs données existantes sont conservées.

- [x] Socle de consultation : démarrage, textes français sourcés et ressources de référence cohérentes.
- [x] Collection et encyclopédie : charte commune, recherche et filtres, possessions et inventaires accessibles.
- [x] Fiche Résonateur : navigation, équipement, arbre de compétences, états de progression et chaîne résonatrice.
- [x] Livraison : prise en main, performances mesurées, régressions, responsive et mise à jour publiée vérifiés.

Le compteur porte sur cette nouvelle phase, sans réutiliser les résultats de la livraison précédente. Les tests utilisent des profils isolés ; les essais réels sur la tablette de l'utilisateur restent distingués des simulations.

### Vérifications de la phase Collection — 14 septembre 2026

Les 22 suites de `node scripts/test.cjs` passent, y compris les parcours conservés mais masqués de la seconde phase. La revue utilise les vrais composants avec des comptes synthétiques : FR/EN, largeurs de 320 à 1536 pixels CSS selon les parcours, édition et sauvegarde, changement de personnage, clavier, import/export, échecs de stockage, services indisponibles, cache et fonctionnement hors ligne. Les captures de l'arbre, des attributs, de l'arme, des Échos et de la chaîne ont été examinées. L'arbre vérifie aussi l'absence de chevauchement des zones tactiles et la visibilité des quinze nœuds et deux compétences supplémentaires.

La cause d'un rechargement inutile a été identifiée dans la réponse réelle de l'API : la version arrive dans un tableau, alors que l'ancien code supposait un objet. Un lecteur partagé valide les deux formes et refuse les métadonnées ambiguës. Les catalogues intégrés permettent de démarrer sans attendre l'API ; un ancien cache sans version est réparé sans modifier les données personnelles. La revue finale a aussi corrigé la normalisation répétée des images locales : les catalogues enregistrent leurs URLs sources et la résolution locale reste propre à l'affichage. Un test force une actualisation puis recharge les images et contrôle le compte. Les six suites concernées ont été relancées avec succès après cette correction ; les sept projections et la syntaxe des scripts ont été contrôlées.

La source primaire et les 2 837 fichiers d'images officiels sont vérifiés par empreinte. Les traductions et références locales sont documentées dans `SOURCE_DATA.md`. Le cache d'images limite simultanément le nombre et les octets, regroupe les requêtes identiques et conserve un repli hors ligne ; les données personnelles restent séparées.

Mesures reproductibles : comparaison au commit publié `947c7f8`, Edge headless, 720 × 1122 pixels CSS, trois lancements froids et trois réouvertures par version, profils isolés, identités du catalogue réel et compte synthétique. Les réponses externes sont retardées de 150 ms ; le débit et le processeur ne sont pas bridés, le service worker est désactivé pour isoler les changements de démarrage. Médianes de la dernière exécution complète :

| Mesure | Avant | Après |
| --- | ---: | ---: |
| Collection, premier chargement | 521 ms | 233 ms |
| Portraits visibles, premier chargement | 691 ms | 258 ms |
| Collection, réouverture | 121 ms | 142 ms |
| Portraits visibles, réouverture | 271 ms | 165 ms |
| Requêtes API au démarrage | 3 | 1 |
| Requêtes d'images vers un service externe | 3 | 0 |

La réouverture du texte de collection est 21 ms plus lente dans cette série ; les gains ne concernent donc pas chaque mesure. L'amélioration principale est la suppression de l'attente du catalogue distant et le chargement local des portraits. Une série exploratoire précédente avait donné 441 → 165 ms au démarrage : cette variation rappelle la portée limitée d'un petit banc d'essai. Les rapports détaillés restent dans `test-results/performance-comparison.json`.

La mise à jour PWA depuis `947c7f8` passe avec deux fenêtres, attente d'activation, fermeture puis nouveau shell disponible hors ligne, données et cache non lié préservés. Le commit applicatif `f58cbe1` est publié sur `main` ; le déploiement [Pages 34791533692](https://github.com/Earyon/wuwa-companion/actions/runs/34791533692) a réussi. Les empreintes de **138 ressources réellement servies** correspondent au commit, incluant le shell, les 58 fiches de référence et des illustrations de chaque catégorie. Un navigateur Edge isolé sur le site public a vérifié le tutoriel, les images de l'arbre, une modification suivie d'un enregistrement/rechargement et le contrôle PWA, sans erreur JavaScript. La capture publiée a été examinée. Les rapports privés restent dans `test-results/production-verification.json` et `published-tree-fr.png`.

Permissions : l'écriture dans le projet, le commit et le push sur `main` ont fonctionné ; les métadonnées du dépôt confirment le droit `push`. Aucun push forcé ni changement étranger au périmètre n'a été publié. Les données personnelles n'ont pas été réinitialisées. La phase Collection est livrée ; les recommandations et objectifs restent volontairement masqués pour la seconde phase demandée.

Limites : aucun essai sur tablette physique, Safari ou Firefox ; aucune mesure de débit Internet réel, d'animation 3D ou de connexion au compte Kuro. Les icônes et illustrations 2D officielles sont utilisées à leur résolution disponible. Ces limites ne sont pas présentées comme des contrôles réussis.

## Historique : 14 / 15 lots vérifiés — livraison initiale

Les 14 lots cochés décrivent les vérifications techniques de la livraison initiale. Ils ne prouvent ni une traduction intégrale, ni une ergonomie satisfaisante, ni des performances validées en conditions réelles. Les retours utilisateur restent à traiter ; les bilans historiques ci-dessous ne constituent pas une validation de ces corrections.

- [x] Catalogue Résonateurs / armes, compte et niveaux, cinq compétences et passifs.
- [x] Mise en page consolidée, publication Pages et mises à jour PWA.
- [x] Protection des données, export/import vérifié et retrait durable d'un Résonateur.
- [x] Inventaire d'armes par exemplaire, recherche, modification et équipement compatible.
- [x] Catalogue Échos et suivi des Échos équipés.
- [x] Ressources connues / inconnues, inventaire et besoins nets.
- [x] Objectifs personnels et priorités, un seul personnage actif, tâches dérivées.
- [x] Coûts réels de montée : niveau, ascension, arme, compétences, passifs.
- [x] Fiches complètes, builds contextualisés, recommandations sourcées et datées.
- [x] Équipes de trois, favoris et profils de builds.
- [x] Succès, activités / événements / resets et historique utile.
- [x] Wishlist et Pull Planner, historique Tracker et imports contrôlés.
- [x] Optimisation globale fondée sur le compte et ses équipes.
- [x] Revue finale des parcours FR/EN, tactile, hors ligne, migrations et données absentes.
- [ ] Optimisation mesurée de la rapidité, du chargement des images et de la compatibilité en conditions représentatives.

## Historique — cadrage initial de l'étape 15

Les paragraphes suivants conservent le cadrage du point d'ensemble antérieur à la reprise. La demande ultérieure de réaliser toute la phase Collection, décrite en tête du document, les remplace. La tablette ciblée utilise Android.

**Statut : à faire.** Ajout demandé pendant le point d'ensemble ; le développement reste en pause jusqu'à sa reprise par l'utilisateur. Les modifications locales commencées ne sont ni validées ni publiées et ne comptent pas comme une étape terminée.

- Établir des mesures reproductibles avant/après : première ouverture sans cache, réouverture avec cache, affichage des images visibles, navigation et réactivité des principaux écrans. Consigner les conditions réseau, les volumes transférés et les requêtes.
- Identifier les causes des lenteurs, puis optimiser les images, les ressources, le cache et les traitements coûteux lorsque les mesures justifient une modification.
- Vérifier les connexions lentes, les services externes indisponibles, le fonctionnement hors ligne et les limites de stockage, avec des états de chargement et des solutions de repli compréhensibles.
- Contrôler les navigateurs et appareils ciblés, notamment la tablette en portrait/paysage et l'application installée. Distinguer les tests automatisés dans Edge/Chromium, Firefox et WebKit selon les outils disponibles des essais sur Safari ou sur un appareil physique ; noter explicitement toute couverture manquante.
- Vérifier les fonctions liées après modification : stabilité de la mise en page, FR/EN, filtres, saisies, sauvegardes/imports et mises à jour PWA, sans perte de données personnelles.

**Critère de fin :** mesures avant/après consignées, lenteurs identifiées traitées ou limites expliquées, contrôles pertinents réussis et couverture de compatibilité documentée. Un chargement rapide en local ou une simulation de tablette ne suffit pas à valider les performances sur l'appareil réel.

## Contraintes

La directive permanente `QUALITY.md`, référencée par `AGENTS.md`, s'applique à tous les travaux. Son actualisation explicite inclut une refonte des parties déjà fonctionnelles. Les deux premiers lots cochés indiquent leur état de référence validé ; ils devront repasser les vérifications après refonte. Le compteur actuel ne prétend pas que cette nouvelle refonte est déjà faite.

## Refonte du socle — périmètre autorisé

Point de départ : version fonctionnelle `8401350`, avec ses tests de référence. L'amorce non terminée du lien inventaire/équipement a été retirée avant cette refonte ; elle n'a pas été publiée ni comptée comme terminée.

1. **Vérifié — refonte 1 / 3.** Cartographier les dépendances et séparer les responsabilités encore regroupées dans le script de `index.html` : catalogue, état personnel, navigation et éditeurs. Garantir un démarrage explicite une fois tous les composants disponibles.
2. **Vérifié — refonte 2 / 3.** Unifier la progression et l'équipement autour des identifiants stables. Éviter deux mécanismes concurrents ; prévoir une migration conservant les données existantes et des tests d'échec de stockage/restauration. Les anciens équipements sans correspondance certaine restent conservés jusqu’au choix explicite d’un exemplaire.
3. **Vérifié — refonte 3 / 3.** Reprendre les composants d'interface et leurs événements, réduire le couplage et appliquer `DESIGN.md` à tous les écrans, y compris ceux déjà modélisés. Conserver les comportements validés. Mesurer démarrage/requêtes, vérifier FR/EN et les parcours tactiles, puis exécuter les tests de non-régression et de mise à jour PWA.

Les nouvelles fonctions continuent ensuite sur le socle refondu. Aucune réécriture graphique, nouvelle dépendance ou réinitialisation du compte n'est implicite dans cette autorisation.

Première étape : `catalog.js` porte les données du jeu et leur chargement, `app.js` la navigation et les vues existantes, `skills.js` les données de compétences, `account-editor.js` les éditeurs, `bootstrap.js` le démarrage. Les scripts classiques restent provisoirement liés par leurs interfaces globales existantes ; leur découpage n'est pas présenté comme la fin de la réduction du couplage. Les cinq extractions correspondent exactement au code publié `8401350`, hors fins de ligne. Les nouveaux fichiers sont inclus dans le même cache PWA.

Vérifications : suites responsive, features et mise à jour PWA réussies après extraction. HTML réduit de 57 432 à 6 047 octets ; HTML + scripts extraits : 57 663 octets. Il s'agit d'un contrôle de volume, pas d'une mesure de vitesse sur tablette. Les scripts sont téléchargés sans bloquer l'analyse HTML et exécutés dans l'ordre déclaré grâce à [`defer`, documenté par MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script#defer).

Le résumé historique de l'autre conversation est du contexte, pas une preuve de réalisation. Aucun inventaire personnel ne sera déduit d'anciennes captures. Les dates de bannières, taux, coûts et recommandations exigent une source vérifiée ; une valeur indisponible reste inconnue.

État de départ vérifié : commit `5da557a`. Les rubriques armes/Échos/ressources, Planner et tâches contiennent encore des ébauches dans cette version.

## Résultats du 13 septembre

- Export JSON réellement téléchargé, réimporté dans le navigateur, contrôle du contenu ; rejet des sauvegardes incompatibles et des valeurs hors limites avant écriture.
- Simulation d'un échec de stockage pendant une restauration : retour à l'état précédent. Les caches de jeu et les autres clés du site ne sont pas effacés.
- Données personnelles illisibles préservées ; l'accès à l'export reste possible.
- Retrait d'un Résonateur vérifié après rechargement, sans effacer sa progression conservée. Une liste canonique vide ne réimporte plus les anciens noms.
- Parcours FR/EN des nouvelles interfaces et 36 combinaisons écran/largeur ; maintien des 42 cas de non-régression existants.

Les inventaires et le Planner disposent maintenant d'une première implémentation testée. Ils ne sont pas comptés comme lots terminés : il reste notamment le lien entre exemplaires d'armes et équipement, les champs structurés des Échos, les coûts nets et les objectifs d'armes/passifs.

## Références techniques consultées

- [Schéma public Encore](https://api-v2.encore.moe/openapi.json) : endpoints `echo`, `item`, `character/{id}`, `weapon/{id}` vérifiés. Projections compactes du catalogue, identifiants vérifiés, cache précédent conservé en cas d'échec.
- [Quotas et éviction, MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) : traiter l'échec d'écriture, ne pas annoncer une sauvegarde réussie avant sa réussite.
- [Web Storage, MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API) : événement entre fenêtres ; relire l'état récent avant modification.
- [Transactions IndexedDB, MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB) : à utiliser pour le futur historique d'invocations volumineux. La couche personnelle compacte reste provisoirement compatible avec le stockage existant ; la migration complète n'est pas annoncée faite.

## Refonte 2 — progression centralisée, sous-étape vérifiée

Le format personnel passe à la version 2 sous la même clé de stockage. La possession et la progression utilisent désormais les identifiants du catalogue ; les anciens enregistrements restent intacts comme copie de migration. Une liste vide reste vide, les identifiants inconnus et les noms non résolus ou en collision sont conservés. Les vues historiques lisent une projection du stockage commun, sans second circuit d’écriture. Le rattachement aux exemplaires d’armes reste à terminer : refonte toujours **1 / 3**, fonctions toujours **3 / 14**.

Tests ajoutés : migration v1, répétition sans changement, échec de stockage et reprise, refus d’écraser une modification plus récente du même personnage, préservation des autres personnages, validation des sauvegardes v2, changement de nom du catalogue, échec réel dans l’éditeur avec maintien du formulaire ouvert. Les anciennes sauvegardes restent importables. La détection des conflits n’est pas une transaction multi-fenêtres garantie : une simultanéité exacte entre deux processus reste une limite du stockage local actuel.

Le test PWA part maintenant de `22a0621` et observe l’activation depuis le service worker : ouvrir une fenêtre de contrôle dans le périmètre du site avant l’activation maintenait l’ancienne version en vie. Vérifications sur navigateur Edge isolé ; aucune validation physique sur tablette n’est déduite de ces tests.

## Refonte 2 terminée — armes partagées entre inventaire et Résonateur

Le format personnel 3 conserve les clés existantes et accepte les sauvegardes précédentes. Chaque arme possède un identifiant d’exemplaire ; le Résonateur ne conserve qu’une référence à cet exemplaire. Le niveau et le rang n’ont plus deux valeurs concurrentes. Une arme ne peut équiper qu’un personnage à la fois ; la compatibilité est vérifiée à l’enregistrement. Déséquiper conserve l’arme dans l’inventaire. Retirer un exemplaire équipé annonce la conséquence puis retire le lien et l’exemplaire dans la même écriture.

Les anciens équipements décrits uniquement par nom restent visibles et conservés : aucune fusion avec un exemplaire ressemblant ni création silencieuse de doublon. Leur modification demande de choisir un exemplaire existant ou d’en ajouter explicitement un. L’ajout explicite du même ancien équipement reprend son niveau et son rang connus. Les valeurs inconnues restent inconnues. Une donnée du catalogue devenue indisponible ne détruit pas l’équipement enregistré.

Vérifications : tests du stockage (liens, doublons, compatibilité, échecs d’écriture, données absentes), parcours réels FR/EN (annuler, équiper, modifier depuis les deux écrans, refuser une édition obsolète, retirer, créer, déséquiper et restaurer), contrôles du sélecteur à 320/720/1152 pixels CSS et captures examinées. Suites responsive (42 cas), features et PWA validées. Le test PWA part de `e649d13`. Aucune validation sur appareil physique n’est revendiquée.

À l’issue de cette étape : **4 / 14 lots fonctionnels**, **2 / 3 étapes de refonte du socle**. Les paragraphes précédents décrivent les étapes historiques et leurs anciens compteurs.

La nouvelle direction visuelle est inscrite dans `DESIGN.md` et `AGENTS.md` : elle couvre aussi tous les écrans existants. La refonte graphique complète vers les menus du jeu reste à réaliser et à vérifier ; les présentes modifications d’équipement ne sont pas présentées comme son achèvement.

## Refonte 3 en cours — fiche de progression du Résonateur vérifiée

La fiche existante devient un espace à quatre rubriques : Aperçu, Arme, Forte et Séquence. La navigation passe d’une barre horizontale à une barre latérale selon la largeur disponible. L’aperçu réutilise le portrait déjà référencé par le catalogue, avec un visuel de remplacement propre au projet si l’image manque. Les composants et ornements sont réalisés en HTML/CSS ; aucune nouvelle ressource extraite du jeu n’a été ajoutée.

Les réglages restent en mémoire lors du changement de rubrique et sont enregistrés ensemble. Fermer ou utiliser Échap annule les changements non enregistrés. Le niveau d’une compétence non renseignée apparaît comme inconnu ; le sélecteur permet de le renseigner ou de le rendre à nouveau inconnu. Les identifiants et les déblocages Forte sont conservés, sans inventer un arbre de prérequis.

Les dialogues natifs remplacent l’ancien affichage manuel des fenêtres. Un défaut de placement initial du focus a été reproduit : rendre le contenu visible seulement après `showModal()` laissait le focus hors de la fiche. Le contenu est maintenant rendu visible avant l’ouverture native, et ce comportement est testé. Les retours du focus après modification du rang et après fermeture du sélecteur de niveau sont également vérifiés. Les messages d’échec d’enregistrement sont placés dans le dialogue actif, pour rester visibles.

Vérifications : 64 cas rubrique/écran/langue (FR/EN, 320 à 1536 pixels CSS, portrait et paysage), sélection au clavier, focus, Échap imbriqué, annulation puis réouverture, sauvegarde commune des rubriques, niveaux inconnus, équipement partagé, et captures examinées. Les suites responsive (42 cas), features, stockage et mise à jour PWA passent. Le test PWA part de `b9265c8` et vérifie aussi les nouveaux scripts hors ligne. Aucun test sur tablette physique n’est revendiqué.

Sur navigateur Edge isolé, 10 ouvertures avec données de test déjà en cache atteignent la prochaine frame en environ 7 à 13 ms ; ce n’est ni une mesure de démarrage réseau, ni une comparaison de vitesse avec la version précédente, ni une mesure sur l’appareil utilisateur. Le changement de rubrique n’effectue aucune requête de données de jeu, vérification automatisée à l’appui.

La refonte des autres écrans reste à réaliser. Compteurs inchangés : **4 / 14 lots fonctionnels**, **2 / 3 étapes complètes de refonte du socle**. Cette fiche constitue une sous-étape vérifiée de la troisième étape.

Autorisation complémentaire de l’utilisateur : une remise à zéro de ses saisies peut être utilisée si elle simplifie réellement la refonte. Elle n’a pas été nécessaire pour cette étape et n’a pas été effectuée.

Références techniques : [onglets accessibles, W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) et [dialogue natif, MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog). Les recherches d’images de menus Forte ont fourni des exemples historiques ; elles ne prouvent pas la correspondance exacte avec la toute dernière version du jeu. L’objectif d’une interface inspirée des menus actuels reste à affiner lors des étapes suivantes.

## Échos — lot vérifié

L’inventaire suit désormais chaque exemplaire, équipé ou disponible : qualité, coût, niveau, Sonate, deux statistiques principales et cinq sous-statistiques structurées. Chaque champ peut rester inconnu. La fiche Résonateur possède cinq emplacements, avec un Écho principal ; déplacer ou remplacer un exemplaire conserve les autres. Un exemplaire affecté à un autre personnage est indisponible dans le sélecteur. Les modifications et les nouveaux exemplaires créés depuis la fiche restent provisoires jusqu’à l’enregistrement commun.

Le format personnel 4 conserve les clés et importe les versions 1 à 3. Les anciennes statistiques libres restent consultables telles quelles dans « Anciennes saisies conservées », sans interprétation automatique ambiguë. Les modifications touchent uniquement les exemplaires concernés, gardent leur ordre et refusent une version obsolète ; l’édition du Résonateur et des Échos s’enregistre dans une seule écriture. Aucune remise à zéro effectuée. La limite de simultanéité exacte du stockage local, documentée plus haut, reste applicable.

Causes corrigées : remplacement supprimant l’ancien Écho ; sélection par nom seul malgré plusieurs identifiants homonymes ; cache facultatif corrompu empêchant la requête ; arrivée tardive du catalogue effaçant la saisie. Les libellés des variantes incluent les Sonates et une référence de catalogue lorsque le nom ne suffit pas. Une actualisation échouée conserve le dernier catalogue valide. Les formulaires gardent leur fermeture accessible pendant le défilement et recommencent en haut à l’ouverture.

Sources consultées le 13 septembre 2026 : [catalogue public Encore](https://api-v2.encore.moe/api/en/echo), [schéma Encore](https://api-v2.encore.moe/openapi.json), [système des Échos, Prydwen](https://www.prydwen.gg/wuthering-waves/guides/echoes-explained) (mise à jour indiquée : 11 février 2026), [statistiques des Échos, Prydwen](https://www.prydwen.gg/wuthering-waves/guides/echo-stats) (22 juin 2024). Les catégories de statistiques, plafonds de niveau par qualité et nombre de sous-statistiques sont contrôlés ; les plages exactes de jets ne sont pas imposées. Le plafond absolu de coût 12 est vérifié ; la limite individuelle de Banque de données 10/12 n’est pas encore renseignée et l’interface le précise. Les coûts inconnus ne sont pas comptés comme un zéro confirmé. Le catalogue Échos est chargé à la première utilisation puis réutilisé ; les changements de rubrique ne redemandent pas les détails de compétences.

Le catalogue inspecté contient 311 identifiants, dont des variantes homonymes. Ses champs Rarity et PhantomType ne sont pas assimilés à la qualité de l’exemplaire ou au coût. Le détail de Tempest Mephis contient aussi des intitulés contradictoires : aucune déduction de coût, aucun effet de Sonate ni bonus chiffré n’en est calculé. Les noms de la source restent en anglais ; les commandes et statistiques sont disponibles en FR/EN. L’audit des ressources et la correspondance graphique exacte avec le jeu restent ouverts dans DESIGN.md.

Vérifications : tests du stockage et migrations ; parcours Échos FR/EN avec saisie partielle, homonymes, catalogue retardé/corrompu/indisponible, remplacement, déplacement, annulation, enregistrement, autre propriétaire, conflit d’édition, sauvegarde et édition hors ligne ; 16 dispositions remplies sur 320/720/1152 pixels CSS, dont paysage court. Les suites editor (80 cas), responsive (42 cas) et features (36 écrans) passent. Le test PWA part de 5ce27ea, préserve un ancien Écho et vérifie le nouveau shell et ses scripts hors ligne. Captures examinées et détails visuels corrigés. Pas de validation sur tablette physique.

Avancement : **5 / 14 lots fonctionnels vérifiés**, **2 / 3 étapes de refonte complètes**. Les ressources, besoins nets et coûts de progression constituent la prochaine partie du travail restant.

## Ressources, objectifs et coûts — lots 6 à 8 vérifiés

Les stocks inconnus restent distincts de zéro. Recherche, pagination et filtre des besoins utilisent le catalogue partagé ; seules les saisies modifiées sont enregistrées, après contrôle des conflits. Les brouillons restent présents pendant la navigation. Les objectifs de niveau, ascension, arme, compétences et passifs sont indépendants des données actuelles. Un seul objectif possédé est actif ; annuler les modifications permet aussi de repartir de la version récente après un conflit.

Le moteur pur centralise les sommes et besoins nets. Les coûts d’ascension, d’arme, des cinq compétences et des déblocages proviennent des détails Encore. Les courbes d’EXP proviennent d’une projection reproductible de WW_Data 3.6 (révision 353f2eaed119bc9f680eab92807d20ac75a79b40). `scripts/refresh-progression.cjs --check` compare le résultat à la projection livrée ; `WUWA_SOURCE_CACHE` permet d’utiliser les fichiers source déjà téléchargés. La version personnelle 5 accepte les anciens formats et les objectifs partiellement renseignés.

Les tables de personnage indexent l’EXP par niveau d’arrivée, celles d’arme par niveau de départ : cette différence est testée. Les types de compétence de la source passent par la normalisation existante. Un palier d’ascension ambigu ou un passif non renseigné produit un calcul partiel explicite. Les quantités invalides ne sont pas interprétées comme gratuites. Les potions/tubes connus sont convertis en EXP sans considérer les stocks inconnus comme nuls ; un stock confirmé suffisant couvre toutefois le besoin. L’EXP déjà acquise dans le niveau actuel n’est pas déduite, limite indiquée à l’écran. Une version majeure/mineure du jeu différente désactive les anciennes courbes d’EXP.

Contrôles indépendants : personnage Qingxiao du niveau 1 à 90, cinq compétences 1 à 10 et passifs, 3 053 300 crédits ; arme 5 étoiles testée, 2 692 400 EXP et 1 406 960 crédits. Les cas intermédiaires, frontières, données manquantes/incorrectes et anciennes sauvegardes sont testés. Parcours réels FR/EN du Planner, ressources, conseils quotidiens, conflits et écrans 320/720/1152 CSS px. Suites stockage, progression, editor (80 cas), Échos, features et responsive (42 cas) réussies. PWA depuis 954e145, hors ligne et données préservées. Captures inspectées, regroupement compétence/priorité corrigé. Aucune vérification sur appareil physique.

Références consultées le 13 septembre 2026 : [WW_Data 3.6](https://github.com/Arikatsu/WutheringWaves_Data/tree/353f2eaed119bc9f680eab92807d20ac75a79b40), [Encore](https://api-v2.encore.moe/openapi.json), [totaux Qingxiao](https://hthgaming.com/wuthering-waves-qingxiao-ascension-materials/), [EXP de Résonateur](https://wutheringwaves.fandom.com/wiki/Resonator/Leveling). Les conseils Waveplates portent sur les manques confirmés, sans inventer de rendement de donjon ou de nombre de runs.

Avancement : **8 / 14 lots fonctionnels vérifiés**, refonte globale **2 / 3**. Les fiches, builds et équipes constituent les lots suivants.

## Équipes et activités — lots 10 et 11 vérifiés

Les équipes enregistrent trois Résonateurs possédés distincts, un favori et le profil choisi pour chaque membre. Plusieurs formes de Rover ne peuvent pas être enregistrées ensemble. Retirer un membre du compte conserve la composition comme référence et la signale incomplète. Les profils personnels décrivent le rôle, contexte, arme, Sonate, Écho principal, statistiques et notes, sans modifier l’équipement réel. Les références de profil sont contrôlées ; supprimer un profil retire ses liens dans les équipes. Conflits et erreurs de stockage ne sont pas annoncés comme des sauvegardes réussies.

Le catalogue de succès contient 1 207 entrées en français et anglais, 35 groupes, conditions et récompenses Astrites. La projection WW_Data exclut 102 entrées provenant de groupes désactivés ou sans texte utilisable. Elle se régénère avec `scripts/refresh-achievements.cjs` (même révision et cache source que la progression). Les états inconnus/à faire/terminés, recherche, catégories, filtre et révélation des succès cachés sont disponibles. Marquer un succès terminé ne crédite pas automatiquement le stock.

Les activités quotidiennes et hebdomadaires suivent le serveur explicitement choisi : réinitialisation à 04 h serveur, semaine le lundi. Les frontières UTC, l’absence de serveur et l’indépendance des changements d’heure de l’appareil sont testées. Un nouveau cycle présente un état inconnu en conservant la déclaration précédente et le journal. Les événements 3.6 sont datés d’après les notes publiées de Kuro, relayées par WutheringWaves.gg. Le calendrier indique sa date de vérification ; aucune mise à jour automatique des futures annonces n’est prétendue. Les événements expirés ou marqués terminés cessent d’être proposés. Les échéances locales sont converties depuis l’heure du serveur ; une activité personnelle peut compléter le calendrier.

La version personnelle 6 migre les formats précédents sans effacement. Nouveaux tests du stockage pour équipes/profils, doublons, Rover, liens incompatibles, conflits, quota, activités et succès. Parcours navigateur FR/EN : recherche de succès, rechargement, transitions de cycles, exclusion des événements expirés, activité personnelle, profils, favoris, liens/suppression et textes échappés. Captures sur 320/720/1152 CSS px inspectées. Responsive (42 cas), features (36 écrans) et PWA depuis 98ba5bb passent, y compris le catalogue de succès hors ligne. Pas de validation physique sur tablette.

Sources : [WW_Data 3.6](https://github.com/Arikatsu/WutheringWaves_Data/tree/353f2eaed119bc9f680eab92807d20ac75a79b40), [notes 3.6 relayant Kuro](https://wutheringwaves.gg/patch-notes-for-version-3-6-lamplight-in-mirage-swords-resolve-in-heart/), [horaires détaillés des serveurs](https://wutheringwaves.gg/server/), [réinitialisations Game8](https://game8.co/games/Wuthering-Waves/archives/454085), consultés le 13 septembre 2026. La ligne récapitulative Europe du premier guide est contradictoire avec sa section détaillée ; la valeur quotidienne 03 h UTC et le lundi à 04 h serveur sont recoupés, pas déduits de cette ligne erronée.

## Fiches et recommandations — lot 9 toujours en cours

La fiche publique utilise maintenant un dialogue natif : aperçu, build, Forte, séquence et équipes. Des descriptions réellement françaises sont disponibles via Encore ; les données du détail sont projetées dans un cache facultatif séparé. Les textes distants et les notes personnelles ne sont jamais insérés comme HTML actif. Le catalogue comporte aussi des vues armes et Échos avec recherche. Les valeurs de compétences affichées aux niveaux 1 et 10 proviennent des lignes explicitement nommées par la source. Les effets chiffrés de Sonates restent écartés car des incohérences d’identifiants ont été constatées dans cette source.

Huit recommandations initiales sont rattachées aux identifiants du jeu, avec références et date de consultation. Le classement général des armes reste indépendant du compte et indique les rangs utilisés par le guide. Les objectifs préparés depuis une recommandation demeurent des brouillons à enregistrer ; ils ne changent pas la progression. Les autres recommandations et les contextes restent à compléter : le lot 9 n’est pas compté comme terminé. Les nouveaux parcours de fiches, navigation, absence de requêtes répétées entre rubriques, brouillons et création de profils passent leurs tests FR/EN.

Avancement après ces deux lots : **10 / 14 lots vérifiés** (1 à 8, 10 et 11), refonte **2 / 3**.

## Souhaits, invocations et optimisation — lots 12 et 13 vérifiés

Les souhaits ne déclenchent aucun farming. Un bouton explicite prépare un pré-farm depuis le niveau 1, ascension 0, compétences 1 et passifs verrouillés ; ce scénario ne crée pas de possession et ne remplace pas l’objectif actif possédé. Les calculs réutilisent le moteur de coûts existant.

Le budget concerne les bannières régulières en vedette : copies supplémentaires, compteurs distincts, garantie connue/inconnue, monnaies de l’inventaire. Minimum théorique et maximum garanti sont séparés de la somme des médianes d’un modèle prudent explicitement sans soft pity. Ce modèle ne prétend pas reproduire les probabilités réelles du jeu. Les Astrites sont partagées une seule fois entre les deux budgets. Les bannières spéciales ne reprennent pas automatiquement ces règles.

Imports JSON contrôlés de WuWa Tracker : stocks et succès pour ExportProfile, invocations pour ExportPullHistory. Les plans Tracker ne sont pas assimilés à une preuve d’inventaire. Aperçu avant application, conservation par défaut des valeurs déjà connues, remplacement explicite, refus des changements devenus obsolètes. Les journaux ou champs d’authentification sont rejetés. Les horodatages doivent préciser leur fuseau. Les profils d’historique sont séparés ; la fusion conserve les répétitions d’un tirage multiple et rend les imports répétés idempotents. Un identifiant absent reste inconnu, sauf correspondance unique dans les données importées. L’ordre ambigu d’un tirage multiple donne un intervalle de compteur. Aucun compteur ni possession n’est déduit automatiquement pour le compte actuel.

Les historiques volumineux utilisent une transaction IndexedDB ; un échec annule toute la transaction. Leur export/import est séparé de la sauvegarde compacte du compte, ce qui est indiqué dans les deux écrans. La réussite est annoncée après la fin de transaction. Export réellement téléchargé et rechargement testés.

L’optimisation classe les Résonateurs possédés selon l’objectif actif, les équipes favorites puis leur réutilisation. Les coûts connus sont répartis dans cet ordre, sans compter deux fois les stocks ; les besoins inconnus restent inconnus et aucun stock n’est dépensé. Les objectifs et informations manquantes sont présentés avec des liens vers les éditeurs existants. L’actualisation volontaire limite les chargements à trois personnages simultanément. Aucun score fictif de dégâts ou nombre de runs n’est calculé.

Vérifications : règles de budget, import strict, fusion multiensemble, compteurs ambigus, stock partagé, rollback IndexedDB ; parcours réels FR/EN d’import, conflits, export, rechargement, pré-farm, analyse, recherche et navigation ; vues 320/720/1152 CSS px. Suites account-store, planning, responsive, features et PWA réussies. PWA 17 vérifiée depuis 09dbddc, maintien de l’ancienne version avec deux fenêtres ouvertes, activation après fermeture et imports disponibles hors ligne. Les exports originaux de l’utilisateur n’étant pas disponibles, les parcours utilisent des fixtures explicitement identifiées, conformes aux formats publics inspectés.

Sources consultées le 13 septembre 2026 : [paramètres et export public WuWa Tracker](https://wuwatracker.com/settings), [importeur maintenu, révision identifiée](https://github.com/GoneTone/wuthering-waves-convene-gacha-analyzer/blob/12f49ab878874649c29147b2ec4ba6391970be14/lib/services/importers/wuwa_tracker_importer.dart), [catégories d’invocations](https://github.com/GoneTone/wuthering-waves-convene-gacha-analyzer/blob/12f49ab878874649c29147b2ec4ba6391970be14/lib/data/gacha_types.dart), [règles d’invocation Prydwen](https://www.prydwen.gg/wuthering-waves/guides/gacha), [transactions IndexedDB, MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB). Seules les catégories sont reprises de l’importeur tiers, pas ses suppositions horaires ni ses correspondances approximatives de noms.

Avancement : **12 / 14 lots vérifiés**, refonte **2 / 3**. Restent la couverture des recommandations contextualisées et la revue finale de l’ensemble.

## Recommandations et références — lot 9 vérifié

Couverture des 58 Résonateurs canoniques de la version 3.6, avec 80 contextes. Les listes d’armes, rangs, statistiques, recharge et priorités proviennent des guides Prydwen individuellement consultés le 13 septembre 2026 ; Shorekeeper conserve également sa référence Game8. Les conditions significatives sont conservées : investissement nécessaire à Empyrean/Midnight, Erosion pour Windward, seuils de recharge de Brant/Mornye/Suisui, modes de Denia/Lucilla/Phoebe, PV de Cartethyia/Jingran. Les noms d’armes ont tous une correspondance dans le catalogue Encore actuel et tous les types sont compatibles. Aucune comparaison de dégâts chiffrée n’est recopiée comme simulation du compte. Les suggestions d’équipe reproduisent uniquement les compositions effectivement identifiées dans les références, pas des partenaires inventés pour remplir les cases.

Les profils prennent en charge 43311 et 44111 ainsi que les Sonates 5, 3+2 et 1+2+2. Les variantes héritent des données communes sans dupliquer les classements. La sauvegarde personnelle passe en version 7 ; les anciens profils conservent implicitement leur disposition 43311 et leur ensemble de 5 pièces. Le choix d’un build reste distinct de l’équipement réel.

La cause des effets de Sonate incohérents a été isolée : les identifiants de groupe ne doivent pas être utilisés comme identifiants d’effet. `scripts/refresh-sonatas.cjs` joint les 34 groupes via `FetterMap`, vérifie leur nom de groupe, développe les paramètres depuis WW_Data et conserve les conditions en français/anglais. Les effets sont présentés en référence dans les fiches Écho, sans calculer abusivement des bonus permanents. Les données locales sont liées à la version 3.6. Le script se régénère depuis la révision WW_Data déjà identifiée, ou se vérifie hors réseau avec `WUWA_SOURCE_CACHE=test-results` et `--check`.

Les caches de personnages et d’armes vérifient désormais l’identité et la version du jeu. Un cache facultatif ancien sans ces preuves doit être rechargé ; la progression personnelle demeure conservée. Les fixtures historiques qui associaient les données de Sanhua à un personnage synthétique portent maintenant explicitement l’identité synthétique attendue. L’identifiant masculin du Rover Electro (1309) a été vérifié dans `RoleBody: MaleM`, son équivalent 1310 dans `FemaleM`, avant l’ajout à la liste canonique.

Validation : 80 contextes contrôlés (identifiants, cinq priorités, statistiques autorisées, rangs et équipes), profils FR/EN 44111 et Sonates combinées réellement créés/enregistrés, changement de variante, rejet du cache d’une autre identité et effets de Sonate affichés. Les suites account-store, editor (80 cas), responsive (42 cas), planning, profiles-teams, features et PWA passent. PWA 18 testée depuis ee54e28, avec les 34 Sonates disponibles hors ligne. Captures des nouvelles fiches examinées ; aucune validation matérielle sur tablette n’est prétendue.

Avancement : **13 / 14 lots vérifiés**, refonte **2 / 3**. Reste la revue finale de l’ensemble, incluant les écrans historiques et les parcours de démarrage/réglages.

## Revue finale — lot 14 et refonte 3 vérifiés

L’orientation visuelle commune couvre les écrans historiques : typographie système, panneaux sobres, navigation dorée, commandes tactiles et fiches par rubriques. Les cartes compactes réservent la première ligne au portrait et à l’identité ; progression et actions restent regroupées dessous. Au-delà de 620 pixels de panneau, la progression reprend sa place à droite. Les règles propriétaires sont modifiées, sans couches CSS concurrentes. La version 320 px a été corrigée après examen de capture : agrandir les boutons sans réorganiser la ligne fragmentait inutilement le nom. Le visuel de remplacement local évite les portraits cassés ; les traitements d’image spécifiques existants restent prioritaires.

Les cartes de l’encyclopédie sont des boutons natifs utilisables au clavier. Focus visible, lien d’accès au contenu, langue du document, noms accessibles des recherches et état de navigation sont harmonisés. Les réglages conservent le choix d’écran initial et expliquent le stockage local, les deux exports et le fonctionnement hors ligne. La mise à jour PWA est visible dans les réglages et attend toujours la fermeture des fenêtres ; aucune activation forcée ni perte de brouillon. Les informations personnelles codées en dur du prototype et les marqueurs de possession supposée ont été retirés, sans toucher au stockage du compte.

Le budget d’invocations apparaît en premier. Un assistant calcule les copies supplémentaires depuis une séquence S0–S6 et un rang R1–R5 visés ; une situation inconnue n’est pas assimilée à S0/R0. La recherche des Sonates/Échos préserve le choix courant et les autres champs du build. Un défaut de déplacement des options entre sélecteurs a été reproduit : retirer les options d’un sélecteur temporaire peut changer leur état sélectionné. La valeur du sélecteur réel est maintenant conservée explicitement après remplacement, avec test de régression.

Durcissement de fin de revue : détails facultatifs de structure invalide rejetés, attributs d’images échappés, imports asynchrones protégés contre les réponses arrivant dans le désordre ou après navigation, catalogue tardif ne remplaçant plus une saisie en cours, requêtes JSON annulées après 15 secondes, première ouverture sans connexion permettant encore l’accès aux réglages. Une erreur du cache facultatif ne fait plus échouer le chargement de données valides. Aucun nouveau framework, abonnement, API payante ou réinitialisation n’a été nécessaire.

**Validation exécutée : 16 suites réussies** via `node scripts/test.cjs` : account-store, activity-rules, convene-rules, progression, responsive (42 cas), features (36 écrans), editor (80 cas), echoes (16 dispositions remplies), planning, activities, profiles-teams, recommendations (80 contextes), convenes, optimization, final-review et pwa-update. Les derniers durcissements d’attributs ont ensuite repassé les parcours éditeur et la revue finale ; la PWA a été revérifiée. Syntaxe de tous les scripts, présence des ressources dans le shell et `git diff --check` contrôlées. Captures FR/EN et 320/720/1152 px inspectées. Les scénarios tactiles sont simulés dans Edge isolé, pas sur l’appareil physique.

Mesure locale finale : cinq démarrages avec catalogue synthétique validé en cache, DOM prêt en **94 à 101 ms**, 30 scripts différés, **une seule requête externe de vérification de version**. Le passage entre les rubriques d’une fiche ne recharge pas les détails. Ces chiffres ne mesurent ni le réseau réel ni la tablette et ne prouvent pas une accélération par rapport à une version antérieure. Le cache PWA 19 est testé depuis `58fe0e8` : deux fenêtres maintiennent la version précédente, leur fermeture permet l’activation, puis les scripts, références et données personnelles sont disponibles comme prévu hors ligne.

Sources techniques complémentaires consultées le 13 septembre 2026 : [AbortController, MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), [boutons natifs, MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button). Sources visuelles et périmètre juridique documentés dans `DESIGN.md` ; une identité communautaire n’est pas présentée comme une autorisation de Kuro.

**Bilan : 14 / 14 lots fonctionnels vérifiés ; refonte 3 / 3.** Le périmètre développé est prêt pour la revue utilisateur des usages, partie par partie. Restent des limites déclarées, pas des validations prétendues : aucune vérification sur tablette physique, pas de synchronisation cloud, pas de simulateur de dégâts, données/recommandations/événements datés 3.6, coûts partiels lorsque les données nécessaires manquent. Le README expose ces limites et les procédures de maintenance.

- Phase Collection : objectifs, recommandations et leurs accès sont masqués à la demande expresse de l’utilisateur. Le code et les données restent conservés pour la phase suivante.

## Orientation visuelle actualisée — reproduction fidèle

Dernière demande explicite de l’utilisateur : reprendre au maximum à l’identique l’interface de la vidéo fournie, notamment la disposition exacte de l’arbre, les rubriques et contrôles. Conserver toutes les miniatures officielles sans redessin ; seul le fond est personnalisé. Cette demande remplace l’orientation précédente vers des icônes et compositions inventées. Compléter les vues manquantes avec des sources et vidéos identifiées, en distinguant les versions du jeu. Citer Kuro Games comme créateur du jeu et des ressources, avec le statut communautaire non officiel. Une attribution n’est pas présentée comme une licence. Ne pas afficher un rendu 3D ou une animation comme reproduit si les ressources disponibles ne le permettent pas. Les objectifs et recommandations restent masqués conformément à la phase Collection.

### Socle Collection vérifié

Le 13 septembre : contrôles reproductibles des projections locales réussis sur les sources versionnées (58 Résonateurs, 122 armes, 311 Échos, 2 339 objets, 2 700 termes français, 632 textes Forte). Les 58 fiches bilingues incluent les statistiques de base, les identifiants et parents des nœuds ainsi que six séquences ; aucune substitution de paramètres non résolue. Les traductions restent séparées des identifiants enregistrés. Les détails de montée servant au calcul des coûts gardent leur circuit existant. Les références se chargent par personnage. Démarrage avec services externes bloqués et parcours FR/EN de Collection vérifiés ; contrôle de vitesse, PWA et validation complète des nouveaux visuels encore en cours.
