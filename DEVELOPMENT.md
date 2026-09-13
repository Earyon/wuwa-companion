# Développement complet — suivi vérifiable

Demande du 13 septembre 2026 : développer les fonctions prévues avant la revue utilisateur, puis présenter une partie à la fois. Les tests techniques restent à la charge de l'agent. Une case vide est du travail restant, pas une fonctionnalité terminée.

## Avancement : 3 / 14 lots vérifiés

- [x] Catalogue Résonateurs / armes, compte et niveaux, cinq compétences et passifs.
- [x] Mise en page consolidée, publication Pages et mises à jour PWA.
- [x] Protection des données, export/import vérifié et retrait durable d'un Résonateur.
- [ ] Inventaire d'armes par exemplaire, recherche, modification et équipement compatible.
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
