# Directive permanente de qualité professionnelle

Directive de l'utilisateur du 13 septembre 2026. Applicable à tout le développement futur et aux interventions en cours. Lecture obligatoire depuis `AGENTS.md`.

**Actualisation explicite de l'utilisateur : cette directive doit déclencher une refonte des parties qui fonctionnent déjà.** Elle remplace la restriction initiale sur ces parties. La refonte inclut donc le socle existant, en préservant le design, les comportements validés et les données personnelles. Inspecter les dépendances, établir les tests de référence puis procéder par ensembles cohérents avec vérification avant/après. La simplicité et la maîtrise des risques restent obligatoires.

L'objectif n'est pas simplement que l'application fonctionne. Il s'agit d'obtenir, dans la mesure du raisonnable, une application robuste, fiable, performante, maintenable, évolutive et agréable à utiliser, avec le moins possible de bugs, de régressions, d'incohérences et de dette technique.

## 1. Principe général

Travailler comme le ferait une équipe de développement expérimentée responsable d'un produit destiné à être réellement utilisé et maintenu dans le temps.

Ne pas chercher systématiquement la solution la plus rapide à implémenter. Privilégier dans cet ordre :

1. Fiabilité et intégrité des données.
2. Absence de régressions.
3. Qualité et maintenabilité du code.
4. Simplicité de la solution.
5. Performances.
6. Qualité de l'expérience utilisateur.
7. Évolutivité.
8. Rapidité de développement.

Ne pas ajouter de complexité technique sans bénéfice concret. Une solution simple et robuste est préférable à une architecture sophistiquée inutile.

## 2. Toujours comprendre avant de modifier

Avant toute modification significative :

- Inspecter les fichiers et le code réellement concernés.
- Comprendre le fonctionnement existant.
- Identifier les dépendances et les endroits utilisant le même système.
- Vérifier si le problème observé est local ou révèle un problème plus général.
- Rechercher la cause racine plutôt que traiter uniquement le symptôme.
- Évaluer les risques de régression.
- Réutiliser les systèmes existants lorsqu'ils sont correctement conçus.

Ne pas supposer le fonctionnement d'une partie du projet lorsqu'il peut être vérifié directement. Ne pas modifier un fichier simplement parce que son nom semble pertinent : inspecter son rôle réel dans l'application.

## 3. Corriger les causes plutôt que les symptômes

Lorsqu'un problème particulier révèle une faiblesse générale dans les données, l'architecture ou la logique de l'application, corriger de préférence la cause commune.

Si une donnée incorrecte apparaît pour un personnage, une arme ou un élément particulier, vérifier si le mécanisme responsable peut produire la même erreur ailleurs avant d'ajouter un correctif spécifique à cet élément.

Éviter autant que possible :

- Les exceptions codées spécialement pour un cas.
- Les valeurs arbitraires codées en dur.
- Les duplications.
- Les contournements temporaires.
- Les correctifs qui masquent le véritable problème.

Si un correctif temporaire est réellement nécessaire, l'identifier clairement comme tel et expliquer pourquoi.

## 4. Respecter l'architecture du projet

Avant d'introduire une nouvelle architecture, bibliothèque, dépendance ou abstraction, vérifier qu'elle apporte un bénéfice réel. Conserver une séparation claire des responsabilités.

Éviter :

- Les fichiers inutilement gigantesques.
- La duplication de logique.
- Les dépendances circulaires.
- Les composants excessivement couplés.
- Les abstractions prématurées.
- Les systèmes parallèles accomplissant la même fonction.

Lorsqu'une fonctionnalité similaire existe déjà, privilégier son extension ou sa réutilisation plutôt que créer un second mécanisme. Une refactorisation importante ne doit être effectuée que si elle apporte un bénéfice réel et si les risques sont maîtrisés.

## 5. Qualité du code

Le code produit doit être lisible, cohérent, correctement structuré, facile à comprendre par un autre développeur, suffisamment documenté lorsque la logique n'est pas évidente, et dépourvu autant que possible de code mort et de duplication.

Respecter les conventions déjà établies dans le projet lorsqu'elles sont pertinentes. Les noms de variables, fonctions, composants et fichiers doivent refléter clairement leur responsabilité.

Ne pas laisser de code expérimental, de logs de débogage inutiles ou d'anciennes implémentations abandonnées après validation d'une nouvelle solution.

## 6. Gestion des données

L'intégrité des données est prioritaire. Lorsqu'une fonctionnalité dépend de données externes :

- Privilégier les sources fiables.
- Éviter autant que possible la duplication manuelle des données.
- Centraliser les transformations.
- Valider les données reçues lorsque nécessaire.
- Prévoir les données absentes ou incorrectes.
- Gérer proprement les erreurs réseau et les indisponibilités.
- Éviter qu'un changement externe provoque silencieusement des données incohérentes.

Lorsqu'une structure de données évolue, vérifier également les conséquences sur les données utilisateur déjà enregistrées. Une mise à jour ne doit pas supprimer ou réinitialiser involontairement les données personnelles. Si une migration est nécessaire, privilégier une migration contrôlée plutôt qu'une réinitialisation.

## 7. Prévention des régressions

Avant de modifier un comportement existant, identifier ce qui pourrait être affecté indirectement. Après la modification, vérifier le nouveau comportement et les fonctionnalités existantes susceptibles d'avoir été touchées.

Une correction locale ne doit pas casser :

- D'autres personnages ou données.
- Les filtres ou tris.
- La navigation.
- La persistance des données.
- Le responsive.
- Les traductions.
- Les autres écrans utilisant les mêmes composants ou fonctions.

Lorsque pertinent, ajouter ou adapter des tests permettant d'éviter que le problème revienne.

## 8. Tests et validation

Pour toute modification importante, appliquer autant que possible le cycle suivant :

1. **Analyser** : identifier le fonctionnement actuel et la cause du problème.
2. **Planifier** : déterminer la modification minimale mais correcte.
3. **Implémenter** : réaliser proprement la modification.
4. **Tester** : vérifier le comportement attendu et les cas limites pertinents.
5. **Vérifier les régressions** : contrôler les fonctionnalités liées.
6. **Nettoyer** : supprimer le code devenu inutile, les contournements et les traces de débogage.
7. **Valider** : vérifier une dernière fois que la demande initiale est réellement satisfaite.

Utiliser les outils disponibles pour inspecter, exécuter et tester réellement le projet lorsque possible, plutôt que considérer le code comme correct uniquement parce qu'il semble correct à la lecture.

Lorsqu'une suite de tests existe, exécuter les tests pertinents. Si aucun test automatisé raisonnable n'est possible pour une modification, effectuer au minimum les vérifications disponibles et indiquer clairement ce qui n'a pas pu être vérifié.

## 9. Cas limites et erreurs

Pour chaque fonctionnalité importante, réfléchir aux situations réalistes pouvant provoquer un comportement incorrect, notamment :

- Données manquantes ou invalides.
- Absence de connexion.
- Réponse externe incorrecte.
- Chargement lent.
- Premier lancement.
- Mise à jour depuis une ancienne version.
- État utilisateur partiellement renseigné.
- Action répétée.
- Écran de petite ou grande taille.
- Orientation portrait/paysage lorsque pertinente.
- Langue différente.
- Stockage indisponible ou incomplet.

Il n'est pas nécessaire de complexifier l'application pour gérer des scénarios extrêmement improbables, mais les cas réalistes doivent être anticipés.

## 10. Performance

Éviter les optimisations prématurées, sans créer volontairement de mécanismes inefficaces. Surveiller particulièrement :

- Le temps de démarrage.
- Le chargement des images et ressources.
- Les requêtes réseau.
- Les opérations répétitives inutiles.
- Les rerenders inutiles.
- La taille des ressources.
- Le cache.
- Le stockage local.
- La consommation mémoire.

Lorsqu'une modification peut avoir un impact significatif sur les performances, vérifier cet impact.

## 11. Interface et expérience utilisateur

L'interface doit être claire, cohérente, intuitive, responsive, accessible autant que raisonnablement possible et utilisable sur les appareils ciblés par le projet.

Les mêmes actions doivent se comporter de manière cohérente dans toute l'application. Éviter les déplacements inattendus d'éléments, les boutons difficiles à utiliser, les informations tronquées et les interfaces surchargées.

Lorsqu'une fonctionnalité fonctionne techniquement mais produit une mauvaise expérience utilisateur, ne pas considérer automatiquement le travail comme terminé.

## 12. Sécurité et dépendances

Ne pas introduire de dépendance externe sans raison valable. Avant d'ajouter une bibliothèque, vérifier si le projet possède déjà une solution suffisante ou si la fonctionnalité peut être réalisée simplement sans nouvelle dépendance.

Éviter d'exposer secrets, clés privées, tokens ou informations sensibles. Ne pas dégrader volontairement les mécanismes de sécurité pour simplifier le développement.

## 13. Ne pas modifier inutilement

Pour chaque tâche, modifier uniquement ce qui est nécessaire ou réellement bénéfique. Ne pas profiter d'une petite correction pour réécrire de grandes parties fonctionnelles du projet sans justification.

La refonte générale expressément demandée ci-dessus constitue un périmètre autorisé distinct d'une petite correction : les parties déjà fonctionnelles en font partie. Planifier leur évolution et contrôler les régressions ; ne pas interpréter la présente section comme une interdiction de réaliser cette refonte.

En revanche, signaler une faiblesse importante susceptible de provoquer des bugs futurs. La corriger directement lorsqu'elle est clairement liée à la tâche et que le risque est maîtrisé. Si elle implique une refonte importante ou risquée, expliquer le problème avant d'entreprendre une modification disproportionnée.

## 14. Utilisation intelligente des sources externes

Lorsqu'une décision dépend d'informations concernant le jeu, une API, une bibliothèque, un framework ou une technologie susceptible d'avoir évolué, vérifier les informations pertinentes plutôt que se fier uniquement à des connaissances potentiellement anciennes.

Privilégier dans cet ordre :

1. Documentation officielle.
2. Sources primaires.
3. Sources reconnues et maintenues.
4. Recoupement de plusieurs sources lorsque l'information est incertaine.

Ne pas transformer une information incertaine en certitude.

## 15. Contrôle final obligatoire

Avant de considérer une intervention importante comme terminée, effectuer une dernière revue. Vérifier notamment :

- La demande initiale est-elle entièrement satisfaite ?
- La cause racine a-t-elle été traitée ?
- Une régression potentielle a-t-elle été créée ?
- Existe-t-il maintenant deux systèmes accomplissant la même chose ?
- De la duplication ou du code inutile ont-ils été introduits ?
- Les données existantes restent-elles compatibles ?
- Les cas limites importants sont-ils gérés ?
- Les performances restent-elles correctes ?
- L'interface reste-t-elle cohérente sur les appareils concernés ?
- Les tests et vérifications disponibles passent-ils ?
- Reste-t-il des erreurs, warnings, logs ou éléments temporaires liés à l'intervention ?

Si un problème est détecté lors de cette revue et peut être corrigé raisonnablement, le corriger avant de considérer la tâche terminée.

## 16. Ne jamais prétendre avoir vérifié ce qui ne l'a pas été

Distinguer clairement :

- Ce qui a été inspecté.
- Ce qui a été testé.
- Ce qui a été vérifié automatiquement.
- Ce qui reste une hypothèse.
- Ce qui ne peut pas être vérifié dans l'environnement disponible.

Ne jamais déclarer qu'une fonctionnalité fonctionne, qu'un test passe ou qu'une absence de régression est confirmée si cela n'a pas réellement été vérifié.

## 17. Autonomie

Limiter autant que possible les interventions manuelles de l'utilisateur. Lorsque les outils et informations nécessaires sont disponibles, effectuer les inspections, recherches, modifications, tests et vérifications nécessaires.

Ne pas demander à l'utilisateur d'effectuer manuellement une opération réalisable de manière fiable avec les outils disponibles. Demander son intervention lorsqu'une décision dépend réellement de sa préférence, lorsqu'une autorisation est nécessaire ou lorsqu'une action n'est pas réalisable avec les outils disponibles.

Pour les décisions purement techniques, prendre généralement la décision qui maximise la qualité, la fiabilité et la simplicité du projet.

## 18. Amélioration continue sans sur-ingénierie

Au fil du développement, tenir compte des améliorations permettant réellement de réduire :

- Les bugs.
- La duplication.
- Les temps de chargement.
- Les risques de perte de données.
- Les difficultés de maintenance.
- Les incohérences UX.

Ne pas transformer le projet en architecture d'entreprise inutilement complexe. Le niveau de sophistication doit rester proportionné à l'application et à ses besoins réels.

## Règle finale

Une tâche n'est pas terminée simplement lorsque « ça marche ».

Elle est terminée lorsque la solution est correctement intégrée au projet, suffisamment testée, cohérente avec le reste de l'application, sans régression connue, sans complication inutile et suffisamment propre pour pouvoir être maintenue et améliorée ultérieurement.

Lorsqu'il faut choisir entre un bricolage rapide et une solution propre raisonnablement réalisable, choisir la solution propre.
