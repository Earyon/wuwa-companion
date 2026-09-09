# WuWa Companion — règles de travail

## Cadre utilisateur
- Communiquer en français, clairement et brièvement. L'utilisateur ne développe pas : il ne doit pas assurer le contrôle technique à notre place.
- Conserver le design bleu nuit/doré, les fonctions validées et les clés de stockage personnelles. Ne pas reconstruire l'application ni ajouter un framework sans besoin démontré.
- Les corrections demandées sont autorisées à être vérifiées, commitées et publiées sur main sans nouvelle confirmation (autorisation explicite du 10 septembre 2026). Jamais de push forcé ni de publication de changements étrangers à la demande. Respecter les permissions de l'environnement.
- Pas de nouvel abonnement, recharge, API payante ou autre dépense. Les crédits déjà achetés peuvent être utilisés. Pas de sous-agents sans demande explicite.
- Recommander un changement de modèle seulement quand la difficulté le justifie ; ne pas interrompre une étape ordinaire pour cela.

## Erreurs observées et prévention
- Des correctifs CSS ajoutés en cascade ont laissé plusieurs grilles concurrentes. Modifier la règle propriétaire d'un composant ; retirer les règles obsolètes au lieu d'ajouter une nouvelle couche en fin de fichier.
- Une capture de 960 pixels physiques ne prouve pas un viewport CSS de 960 pixels. Tenir compte du ratio de pixels, du zoom et de la largeur prise par la sidebar. Tester aussi 720 CSS px pour les captures tablette de 960 px, sans présenter cette estimation comme une mesure du matériel.
- `layout.css` possède les cartes, les contrôles des listes et leur disposition ; `styles.css` conserve les autres composants. Les cartes utilisent la largeur du panneau avec une base compacte sans container queries. Pas de grille dépendant de l'orientation.
- Les anciennes vérifications remplaçaient le DOM par une carte simplifiée. Utiliser les fonctions de rendu et les vrais composants de l'application, dans un navigateur isolé, avec des données de test explicitement identifiées. Ne jamais toucher aux données du navigateur utilisateur.
- Une assertion « aucun débordement » ne vérifie pas l'emplacement demandé. Contrôler aussi alignement, chevauchement, visibilité des boutons, tailles des images et interactions. Examiner les captures avant livraison.
- Les déblocages Forte utilisent les identifiants Encore, jamais le nom ou la position dans une liste. Garder les valeurs enregistrées lorsque des données distantes manquent ; exclure les bonus automatiques sans coût de déblocage. Ne pas inventer la position ou les prérequis d'un nœud si la source ne les fournit pas.
- Un push réussi ne prouve ni le déploiement Pages ni l'activation du service worker sur tablette. Vérifier les fichiers réellement servis et leurs empreintes ; distinguer dépôt, site et appareil. Une ancienne PWA attend la fermeture de tous les onglets/fenêtres. Ne pas effacer le stockage ni forcer une activation qui interromprait une édition.

## Vérification proportionnée
- Pour les changements responsive : `node tests/responsive.cjs` (Playwright installé, navigateur Edge par défaut). FR/EN, noms longs, données incomplètes, largeurs autour des seuils, rotations, recherche/tri/filtres, éditeur, rechargement. Les fixtures synthétiques ne valident pas les données distantes du jeu.
- Pour les changements des fichiers mis en cache : incrémenter `CACHE_NAME`, inclure tous les fichiers d'interface dans `SHELL`, adapter et lancer `node tests/pwa-update.cjs`. Ce test utilise la version Git explicitement identifiée dans son en-tête comme point de départ.
- Vérifier syntaxe et `git diff --check`, examiner le diff pour les fonctions/données non concernées. Garder les tests reproductibles, sans dépendance nécessaire aux API de jeu.
- Consulter au besoin les sources primaires (MDN, documentation officielle du service) pour une décision technique incertaine. La recherche ne remplace pas la reproduction ni les tests.
- Ajouter un test de régression lorsqu'un défaut répété révèle un manque de couverture. Documenter sa cause et les limites restantes. Ne jamais promettre 100 % de fiabilité ni une validation sur appareil non effectuée.
