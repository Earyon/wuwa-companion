# Connaissances de référence — Wuthering Waves

## Rôle et sources

**Périmètre actualisé après analyse :** développement repris sur autorisation explicite. Phase Collection complète, y compris encyclopédie partageant la même charte, puis recommandations et objectifs dans une seconde phase. Les mentions de pause et de gel ci-dessous décrivent le contexte des consultations précédentes et sont remplacées par cette consigne.

Mémoire documentaire du projet demandée par l'utilisateur : consulter ce fichier pour comprendre ses demandes, puis les données sources pertinentes avant de coder. Il ne remplace ni `QUALITY.md`, ni les règles de calcul, ni les données personnelles. Il ne constitue pas une nouvelle base chargée par l'application.

Source étudiée le 13 septembre 2026 : [Prydwen — Beginner guide](https://www.prydwen.gg/wuthering-waves/guides/beginner-guide), date affichée `11/02/2026`. Texte lu intégralement. Référence visuelle prioritaire choisie par l'utilisateur : le chapitre « Resonator Progression », dont les cinq captures ont été examinées dans le navigateur. La vidéo de combat intégrée n'a pas été visionnée ; les guides liés n'ont pas tous été relus dans cette analyse.

## Sites complémentaires retenus

- **[Portail de guides Kuro — fiche Hiyuki](https://wuwaguide.kurogames.com/en/?packageId=A1723&svr_area=global&role_id=1108&strategy_id=14114)** — lien fourni par l'utilisateur, consulté le 13 septembre 2026 sans connexion. Portail officiel, fiche attribuée au contributeur « Void Enigma ». Texte et présentation générale examinés : équipement, statistiques conseillées, priorités de compétences, séquences, équipes et rotations. Version anglaise ; aucune option française ni date de version identifiée dans la page consultée. Distinguer les recommandations du contributeur des règles du jeu et de l'état personnel du joueur ; recouper les valeurs avant intégration. Les autres fiches n'ont pas encore été étudiées.
- **[Slyraf](https://slyraf.com/)** — ajouté à la demande de l'utilisateur le 13 septembre 2026 comme source francophone à consulter pour les guides et informations sur le jeu. Point d'entrée : [guides des personnages](https://slyraf.com/wuthering-waves/personnages/), couvrant notamment configurations, armes, rotations et équipes. L'accueil, cet index et la [présentation du site](https://slyraf.com/about/) ont été consultés ; les guides individuels seront examinés selon le besoin. Utiliser cette référence en complément de Prydwen et des sources du jeu, en relevant la version, la date et les hypothèses pertinentes. Le français d'un guide communautaire ne constitue pas à lui seul une preuve de traduction officielle.

## Carte des connaissances du guide Prydwen

Thèmes couverts : présentation, plateformes et langues ; exploration ; combat, rotations, caractéristiques, éléments et types d'armes ; effets négatifs et rupture ; invocations ; niveaux, ascensions, Forte et séquences ; armes ; acquisition, coût et statistiques des Échos ; niveau de compte et difficulté du monde ; énergie et récupération ; quêtes, activités, parcours débutant, succès et passe ; ressources, forge, boss, champs d'Échos et variantes cauchemardesques ; tours chronométrées, endurance des équipes, vagues, défis multiéquipes, hologrammes et parcours roguelike.

Relations à retenir : progression → prérequis et matériaux → activités d'obtention → énergie et limites ; composition des équipes → équipement et mécanismes de combat ; invocations → possessions et améliorations par doublons. Ces relations aident à interpréter les demandes, sans transformer les exemples du guide en règles universelles.

## Lecture des cinq captures du menu Résonateur

Les observations ci-dessous décrivent les images, pas une interaction exécutée dans le jeu. Les intitulés français sont descriptifs ; les libellés définitifs de Companion devront venir de ses textes français officiels.

Confirmation de l'utilisateur le 13 septembre 2026 : sur sa tablette, l'organisation et les actions du menu du jeu sont les mêmes ; les appuis au doigt remplacent les clics de souris. Cette correspondance est confirmée par l'utilisateur, sans constituer un essai de Companion sur l'appareil. Les fenêtres absentes des captures restent à documenter lorsqu'elles sont nécessaires.

### Vue générale et attributs

[Capture examinée](https://cdn.prydwen.gg/images/wuthering-waves/generic/reso_1.webp) : navigation verticale à gauche, liste de portraits à droite, personnage au centre. Le panneau gauche regroupe identité, élément, niveau/plafond, indicateurs d'ascension et statistiques. Une commande de détails et une action d'ascension sont visibles. Cela fournit une référence précise d'organisation, sans montrer la fenêtre d'ascension elle-même.

### Arme

[Capture examinée](https://cdn.prydwen.gg/images/wuthering-waves/generic/reso_3.webp) : même navigation et même liste de personnages. Le Résonateur tient l'arme ; le panneau décrit son nom, son niveau/plafond, ses attributs, son rang et son effet. Les commandes de changement et d'amélioration sont regroupées en bas. Le sous-menu de sélection et la procédure d'amélioration ne sont pas montrés.

### Échos

[Capture examinée](https://cdn.prydwen.gg/images/wuthering-waves/generic/reso_4.webp) : cinq emplacements visibles près du personnage, compteur de coût, statistiques apportées, capacité et effets de Sonate. Les commandes de changement et d'équipement automatique sont visibles. Cette image distingue la liste d'Échos équipés de la liste des Résonateurs ; elle ne documente pas l'algorithme d'équipement automatique ni l'éditeur détaillé d'un Écho.

### Forte

[Capture examinée](https://cdn.prydwen.gg/images/wuthering-waves/generic/fortes.webp) : l'arbre occupe la zone centrale. Cinq compétences avec niveaux sont disposées à la base de branches : attaque, compétence, circuit Forte, libération et introduction. Des bonus et passifs se trouvent au-dessus ; un autre symbole est situé en bas au centre. La capture utilisateur `1000030006.png` précise aussi la présentation de la compétence de sortie. Cadenas, éclairage et sélection aident à différencier les états. Les détails après sélection ne sont pas visibles.

La proposition déjà approuvée reste dans `DESIGN.md` : toucher une compétence pour régler son niveau, toucher un nœud pour consulter son effet et renseigner son déblocage. Ces interactions sont une adaptation prévue pour Companion, pas une observation de clics effectués sur les captures. Vérifier les identifiants et les dépendances propres à chaque Résonateur avant de dessiner les liaisons.

### Séquences

[Capture examinée](https://cdn.prydwen.gg/images/wuthering-waves/generic/reso_2.webp) : six symboles reliés en arc autour du portrait, avec des états visuels différents ; la rubrique correspondante est sélectionnée dans la navigation latérale. L'image ne montre ni le détail d'un bonus sélectionné ni la confirmation de son activation.

## Référence vidéo utilisateur — menus Android en français

Enregistrement `Screenrecorder-20260913-224123.mp4`, fourni et examiné le 13 septembre 2026 : durée 6 min 17,86 s, image encodée 1724 × 1080. Cette résolution ne mesure pas le viewport CSS de Companion. Méthode : examen de 93 vues espacées d'environ quatre secondes couvrant l'enregistrement, complété par 16 vues ciblées en résolution native. Les captures et leurs repères restent dans `test-results/video-reference/`, exclu de Git ; aucune donnée personnelle visible n'est transcrite ici. L'audio n'a pas été analysé, les interactions n'ont pas été exécutées par l'agent et chaque image de transition n'a pas été examinée.

Cette référence montre les menus réellement utilisés par l'utilisateur et complète les anciennes captures Prydwen. Elle devient la référence visuelle prioritaire pour les écrans qu'elle documente, sans prouver que tous les Résonateurs utilisent exactement les mêmes dispositions ni fournir les identifiants internes des nœuds.

| Repères approximatifs | Écrans et comportements observés |
| --- | --- |
| 00:03–00:16 | Attributs : rubriques verticales à gauche, portraits à droite, Résonateur central, statistiques et niveau/plafond à gauche. Les points de suspension ouvrent une liste de statistiques supplémentaires défilante. Une action indique le niveau maximum atteint. |
| 00:18–00:50 | Arme : grille des exemplaires avec niveaux, rangs, cadenas et portraits d'équipement ; sélection avec description à droite. Remplacement, renforcement et syntonisation sont distincts. La syntonisation présente le rang actuel et suivant et un emplacement d'arme identique ; le renforcement possède ses matériaux et son coût. |
| 00:51–01:49 | Échos : cinq emplacements dont un principal, coût total, statistiques cumulées et effets Sonata. Suggestions avec aperçu équipé/recommandé, écarts de statistiques et consultation d'un exemplaire. Sélection dans une grille avec filtres par coût, détails, commande d'équipement ou retrait et amélioration. |
| 01:51–02:28 | Compétences : arbre complet, sélection de compétences, bonus et passifs ; panneau descriptif à gauche tandis que l'arbre reste visible à droite. Niveaux actuels, cible d'amélioration, matériaux et état « Activé » observés. |
| 02:30–03:04 | Chaîne résonatrice et changement de personnage : six positions en arc ; détails d'une séquence sélectionnée, états actifs et non activés, ressource requise. Retour à un autre arbre présentant des niveaux et bonus différents. |
| 03:08–03:40 | Personnage peu développé : arbre sombre avec cadenas, condition d'ascension explicite, emplacements d'Échos vides, équipement et renforcement d'un Écho et d'une arme de bas niveau. |
| 03:44–04:47 | Liste des personnages en grille, puis plan d'amélioration : cible sélectionnée, onglets Personnages/Armes/Échos/Compétences, progression, matériaux disponibles/requis et commandes menant aux sources d'obtention. |
| 04:51–06:17 | Ouverture du portail de guides Kuro depuis le jeu, puis dans le navigateur ; guide Hiyuki en anglais, recommandations et niveaux personnels visibles dans cette session connectée. Retour au plan d'amélioration. |

### Détails utiles pour la future fiche de compétences

- À 01:52, les cinq compétences avec niveaux sont, de gauche à droite : « Attaques normales », « Compétence résonatrice », « Forte Circuit », « Libération résonatrice », « Compétence d'Intro ». Le libellé « Forte Circuit » apparaît ainsi dans ce jeu configuré en français : ne pas remplacer automatiquement un texte officiel par une traduction improvisée.
- Les arbres examinés comportent deux nœuds au-dessus de chaque branche ; les deux passifs centraux sont en losange et les bonus latéraux en cercle. Les icônes et les effets varient selon le Résonateur. Ces observations ne remplacent pas la correspondance avec les identifiants et prérequis des données sources.
- « Compétence d'Outro » et « Interruption de tonalité » sont deux entrées séparées en bas, sans niveau réglable affiché. Le détail de la seconde a été examiné à 02:26 ; aucun coût de déblocage n'y est affiché. Ne pas les confondre avec les cinq compétences à améliorer ou les passifs payants.
- Sélection dorée, nœud activé et nœud verrouillé sont des états distincts : à 03:12 un nœud sélectionné conserve son cadenas et une condition « Disponible après Ascension III ». Les emblèmes de conseil et le commutateur « Conseils » ne doivent pas être interprétés comme des déblocages ; leur logique exacte n'a pas été testée.
- Une compétence sélectionnée affiche description défilante, onglets « Compétence »/« Détails », matériaux, coût et cible de niveau avec commandes moins/plus et curseur. L'état « Matériaux insuffisants » reste séparé du niveau déjà acquis. La présence de l'onglet « Détails » est confirmée ; son contenu n'a pas été examiné dans les vues retenues.
- Les bonus affichent leur effet et leur état ou condition ; les passifs peuvent avoir une longue description. Prévoir un espace défilant sans masquer l'action et garder le contexte de sélection lors du passage entre nœuds.

### Portée de cette observation

Les références suffisent pour préparer l'organisation principale de « Mon compte ». Les confirmations après consommation de ressources, certains réglages avancés d'Échos et le contenu de chaque sous-onglet restent à vérifier uniquement s'ils deviennent nécessaires. La vidéo ne mesure pas les performances de Companion et ne constitue pas un test de son interface sur tablette.

Conserver la séparation entre progression déjà réalisée, objectif et conseil : Companion permet de renseigner l'existant même si les stocks saisis sont insuffisants pour le reproduire. Le guide connecté affiche des informations personnelles ; cela ne démontre pas l'existence d'une API publique permettant de les importer. Cette analyse a précédé la reprise complète ensuite autorisée par l'utilisateur.

## Conséquences pour Companion

Le besoin utilisateur porte sur les repères du joueur : retrouver son Résonateur et naviguer dans ses attributs, son arme, ses Échos, son Forte et ses séquences. Préparer la refonte de « Mon compte » autour de ce parcours, avec les responsabilités déjà établies dans le projet :

| Besoin | Système existant à examiner avant toute modification |
| --- | --- |
| Identité et propriétés du jeu | Catalogue et données normalisées, identifiants stables |
| Progression renseignée par le joueur | Stockage personnel et éditeurs |
| Matériaux nécessaires et manquants | Coûts, stocks et planification |
| Exemplaires et équipement réel | Inventaires d'armes et d'Échos, liens de propriété |
| Compositions et conseils de jeu | Équipes, profils et recommandations sourcées |
| Objectifs d'obtention | Souhaits, historique et budget d'invocations |
| Activités et calendrier | Règles des activités et serveur sélectionné |

Conserver la différence entre donnée du jeu, état personnel connu/inconnu, objectif et recommandation. Une action dans Companion renseigne le suivi ; elle ne réalise aucune amélioration dans le jeu. Un manque de ressources ne prouve pas qu'une amélioration n'a pas déjà été réalisée. Ne pas déduire une possession, un niveau ou un équipement du compte personnel figurant sur une capture de guide.

Le gel initial de l'encyclopédie a été levé par la demande ultérieure : elle partage désormais la charte de la Collection. Voir `DESIGN.md` pour l'orientation actuelle et `SOURCE_DATA.md` pour les ressources effectivement intégrées.

## Fiabilité et vérifications restantes

Des images portent une indication de bêta fermée. Le texte comporte encore des formulations de lancement, des plafonds et des règles de progression à recouper. Conserver les sources et leur date ; ne pas assimiler date de mise à jour du guide, date de chaque capture et version du jeu.

Avant d'utiliser un détail dans une fonctionnalité :

- Comparer plafonds, ascensions, coûts, conditions de déblocage et statistiques aux données du jeu dont la version est identifiée ; réutiliser les projections existantes lorsqu'elles conviennent.
- Vérifier séparément quotas, réinitialisations, récompenses et disponibilités. Ne pas recopier les chiffres du guide dans les calculs sans contrôle.
- Employer les textes français officiels pour les intitulés du jeu, y compris succès et compétences. Les termes anglais du guide ne sont pas une source de traduction officielle.
- Compléter seulement les écrans et interactions absents nécessaires au lot en cours : sélection d'équipement, détails et confirmations de progression, navigation tactile et comportement sur la tablette Android.
- Distinguer observation, déduction et proposition. Des captures fixes ne valident ni une animation, ni une interaction, ni la disposition de tous les Résonateurs.

Pour enrichir cette mémoire, ajouter des notes ciblées et leurs sources vérifiées. Garder les données chiffrées centralisées dans leurs fichiers propriétaires ; ne pas créer ici un deuxième catalogue à maintenir manuellement.

- Référence française confirmée par l’utilisateur : [Slyraf — Wuthering Waves](https://slyraf.com/wuthering-waves/personnages/). Utiliser ses noms et guides comme complément, recouper les appellations officielles avec les textes du jeu par identifiant. Une formulation communautaire ne prouve pas à elle seule une traduction officielle.

## Ressources complémentaires consultées pendant la reprise

L'analyse locale a dépassé l'inventaire initial des archives : les 101 index de base et correctifs de ressources, treize bases utiles et les textures nécessaires ont été lus avec succès. Le correctif local 3.6.13 est la source prioritaire des textes et visuels intégrés. Le périmètre réellement lu, les recoupements, la couverture française, la maintenance et les limites sont consignés dans [SOURCE_DATA.md](SOURCE_DATA.md).

Les atlas RoleSkillTree et RoleDeviceList fournissent les cadres correspondant au menu récent. Les chemins de compétences et les parents des nœuds proviennent des données locales ; leurs cinq branches et l'arc des séquences ont été comparés aux vues ciblées de la vidéo utilisateur. Les grandes illustrations 2D et miniatures sont officielles ; aucune animation 3D n'est présentée comme reproduite.

[WW_Asset](https://github.com/alt3ri/WW_Asset), lié par [Encore About](https://www.encore.moe/about), complète le contrôle des chemins publics. La [vidéo YouTube Hiyuki 3.3](https://www.youtube.com/watch?v=uNC4adzT6Fg) n'a été consultée que par ses métadonnées : elle n'est pas une preuve visuelle supplémentaire. Les captures du guide Prydwen restent des références anciennes, distinguées de la vidéo personnelle et du correctif local.
