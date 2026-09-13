# Développement complet — suivi vérifiable

Demande du 13 septembre 2026 : développer les fonctions prévues avant la revue utilisateur, puis présenter une partie à la fois. Les tests techniques restent à la charge de l'agent. Une case vide est du travail restant, pas une fonctionnalité terminée.

## Avancement : 4 / 14 lots vérifiés

- [x] Catalogue Résonateurs / armes, compte et niveaux, cinq compétences et passifs.
- [x] Mise en page consolidée, publication Pages et mises à jour PWA.
- [x] Protection des données, export/import vérifié et retrait durable d'un Résonateur.
- [x] Inventaire d'armes par exemplaire, recherche, modification et équipement compatible.
- [ ] Catalogue Échos et suivi des Échos équipés.
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

Avancement actuel : **4 / 14 lots fonctionnels**, **2 / 3 étapes de refonte du socle**. Les paragraphes précédents décrivent les étapes historiques et leurs anciens compteurs.

La nouvelle direction visuelle est inscrite dans `DESIGN.md` et `AGENTS.md` : elle couvre aussi tous les écrans existants. La refonte graphique complète vers les menus du jeu reste à réaliser et à vérifier ; les présentes modifications d’équipement ne sont pas présentées comme son achèvement.
