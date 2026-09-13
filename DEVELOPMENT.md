# Développement complet — suivi vérifiable

Demande du 13 septembre 2026 : développer les fonctions prévues avant la revue utilisateur, puis présenter une partie à la fois. Les tests techniques restent à la charge de l'agent. Une case vide est du travail restant, pas une fonctionnalité terminée.

## Avancement : 5 / 14 lots vérifiés

- [x] Catalogue Résonateurs / armes, compte et niveaux, cinq compétences et passifs.
- [x] Mise en page consolidée, publication Pages et mises à jour PWA.
- [x] Protection des données, export/import vérifié et retrait durable d'un Résonateur.
- [x] Inventaire d'armes par exemplaire, recherche, modification et équipement compatible.
- [x] Catalogue Échos et suivi des Échos équipés.
- [ ] Ressources connues / inconnues, inventaire et besoins nets.
- [ ] Objectifs personnels et priorités, un seul personnage actif, tâches dérivées.
- [ ] Coûts réels de montée : niveau, ascension, arme, compétences, passifs.
- [ ] Fiches complètes, builds contextualisés, recommandations sourcées et datées.
- [ ] Équipes de trois, favoris et profils de builds.
- [ ] Succès, activités / événements / resets et historique utile.
- [ ] Wishlist et Pull Planner, historique Tracker et imports contrôlés.
- [ ] Optimisation globale fondée sur le compte et ses équipes.
- [ ] Revue finale des parcours FR/EN, tactile, hors ligne, migrations et données absentes.

## Contraintes

La directive permanente `QUALITY.md`, référencée par `AGENTS.md`, s'applique à tous les travaux. Son actualisation explicite inclut une refonte des parties déjà fonctionnelles. Les deux premiers lots cochés indiquent leur état de référence validé ; ils devront repasser les vérifications après refonte. Le compteur actuel ne prétend pas que cette nouvelle refonte est déjà faite.

## Refonte du socle — périmètre autorisé

Point de départ : version fonctionnelle `8401350`, avec ses tests de référence. L'amorce non terminée du lien inventaire/équipement a été retirée avant cette refonte ; elle n'a pas été publiée ni comptée comme terminée.

1. **Vérifié — refonte 1 / 3.** Cartographier les dépendances et séparer les responsabilités encore regroupées dans le script de `index.html` : catalogue, état personnel, navigation et éditeurs. Garantir un démarrage explicite une fois tous les composants disponibles.
2. **Vérifié — refonte 2 / 3.** Unifier la progression et l'équipement autour des identifiants stables. Éviter deux mécanismes concurrents ; prévoir une migration conservant les données existantes et des tests d'échec de stockage/restauration. Les anciens équipements sans correspondance certaine restent conservés jusqu’au choix explicite d’un exemplaire.
3. Reprendre les composants d'interface et leurs événements, réduire le couplage et appliquer `DESIGN.md` à tous les écrans, y compris ceux déjà modélisés. Conserver les comportements validés. Mesurer démarrage/requêtes, vérifier FR/EN et les parcours tactiles, puis exécuter les tests de non-régression et de mise à jour PWA.

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
