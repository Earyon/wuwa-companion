# Direction visuelle de l’ensemble des écrans

Demande de l’utilisateur du 13 septembre 2026 : rapprocher autant que possible le design des menus actuels du jeu (Personnage, Compétences, équipement), dans les limites légales. Cette orientation complète les règles permanentes de qualité ; elle autorise l’évolution visuelle des écrans concernés, sans perte de fonction ou de données.

Précision explicite : cette orientation s’applique également à tous les écrans déjà modélisés. Les reprendre par ensembles cohérents, y compris catalogue, compte, inventaires et planification ; adapter les fonctions propres à Companion lorsque le jeu n’a pas de menu équivalent. Le rendu antérieurement validé reste une référence de fonctionnement et de stabilité, pas une interdiction d’évolution visuelle.

## Traduction dans Companion

**Reprise et périmètre actuels :** l'utilisateur autorise la réalisation complète de la phase Collection. Le gel de l'encyclopédie et la pause indiqués plus bas sont historiques. « Mon compte » et l'encyclopédie doivent partager une charte et des composants visuels cohérents ; le premier renseigne les possessions, la seconde présente les données du jeu. Réaliser navigation, fiches, inventaires, traductions, chargement et prise en main ensemble. Les nouvelles recommandations et les objectifs seront traités dans une seconde phase, distincte. Référence principale pour les menus observés : vidéo utilisateur du 13 septembre 2026.

**Confirmation utilisateur du 13 septembre 2026 :** sur sa tablette, le menu du jeu conserve la même organisation et les mêmes actions que la référence ; le doigt remplace la souris. Conserver ces repères pour « Mon compte », avec des zones tactiles accessibles et aucune action indispensable réservée au survol. Cette confirmation décrit le jeu ; la future réalisation de Companion devra encore être vérifiée.

**Cadrage historique, remplacé par la reprise complète :** la première demande concentrait la refonte sur « Mon compte » et gelait l'encyclopédie. L'utilisateur a ensuite autorisé les deux ensembles et leur publication sans validations intermédiaires. La tablette de référence est sous Android ; son modèle, son navigateur et ses dimensions CSS n'ont pas été mesurés.

- Organiser la fiche autour du Résonateur : vue d’ensemble, arme, Échos, Forte et séquence ; navigation cohérente entre rubriques.
- Privilégier une zone centrale consacrée à la sélection et un panneau de détails, avec présentation verticale adaptée aux petits écrans.
- Garder une ambiance sombre, les accents dorés, une sélection claire et des commandes tactiles accessibles. Dessiner les composants en HTML/CSS et les pictogrammes propres au projet.
- Distinguer les données actuelles des objectifs. Les nœuds Forte restent associés aux identifiants vérifiés ; aucune liaison ou position issue du jeu n’est inventée lorsque les données manquent.
- Comparer les références visuelles datées avant la refonte graphique complète. Les premières recherches décrivent l’organisation du menu Forte, mais ne prouvent pas une correspondance avec la toute dernière version du jeu. La ressemblance complète n’est pas encore réalisée ni validée.

## Sources et périmètre de réutilisation

- [Règles officielles de Kuro sur les œuvres dérivées](https://wutheringwaves.kurogames.com/p/en/produce.html), consultées le 13 septembre 2026 : la définition couverte exclut les logiciels. Ce texte ne fournit donc pas une licence générale pour copier l’interface ou ses ressources dans Companion. Ne pas présenter le statut communautaire ou la gratuité comme une autorisation.
- [Présentation du menu Forte sur Google Play](https://play.google.com/store/apps/editorial?id=mc_games_editorialevergreen_postinstall_level_up_forte_in_wuthering_waves_gamehub_fcp) : référence descriptive, pas une licence sur les images ni une preuve de fraîcheur de tous les détails. Les illustrations n’ont pas été récupérées dans le projet.

La première livraison utilisait des éléments graphiques originaux. L'utilisateur a ensuite demandé explicitement la reprise des miniatures et cadres officiels et fourni son installation comme source prioritaire. La réalisation actuelle est décrite plus bas et dans `SOURCE_DATA.md`. Cette demande utilisateur est distinguée des droits de Kuro : aucune licence générale de réutilisation n'a été établie et l'attribution ne vaut pas autorisation juridique. Companion reste présenté comme un outil communautaire non officiel.

## Référence Forte approuvée pour la prochaine reprise

Référence complémentaire choisie par l'utilisateur : chapitre « Resonator Progression » du [Beginner guide de Prydwen](https://www.prydwen.gg/wuthering-waves/guides/beginner-guide). Les cinq captures ont été examinées ; leurs observations et limites sont conservées dans [GAME_KNOWLEDGE.md](GAME_KNOWLEDGE.md). Elles précisent la navigation latérale gauche, la sélection des personnages à droite et le contenu central, avec les informations et actions contextuelles. Elles constituent une référence de cadrage pour « Mon compte », sans garantir la présentation actuelle de toutes les versions ni décrire les interactions absentes des images.

L'utilisateur a approuvé l'adaptation de la capture `1000030006.png`, retrouvée dans la conversation « Wuwa » : arbre à cinq branches, icônes en losange, liaisons et niveaux visibles. Toucher une compétence ouvrira son détail et son réglage de niveau ; toucher un nœud permettra de consulter son effet et de renseigner son état de déblocage. Distinguer sélection, déblocage et état inconnu. Prévoir un panneau adjacent en paysage et une présentation adaptée aux petits écrans, avec les textes français officiels et des éléments graphiques propres à Companion.

Cette capture sert de référence visuelle : vérifier les identifiants, positions et liaisons de chaque Résonateur avant de les représenter. Cette évolution reste à implémenter et à tester après reprise explicite du développement ; l'approbation de la proposition ne lève pas la pause du point d'ensemble.

La vidéo utilisateur `Screenrecorder-20260913-224123.mp4` a ensuite été examinée à partir de vues réparties sur tout l'enregistrement et de détails ciblés. Elle devient la référence visuelle prioritaire pour les menus qu'elle montre ; observations et repères temporels dans [GAME_KNOWLEDGE.md](GAME_KNOWLEDGE.md). Elle documente les attributs, sélection et amélioration d'équipement, arbre et détails des compétences, nœuds activés ou verrouillés, chaîne résonatrice, liste des personnages et plan d'amélioration. Pour les compétences, conserver le panneau de détail adjacent à l'arbre en paysage, cinq niveaux distincts des passifs, de l'Outro et de l'Interruption de tonalité, et séparer sélection, conseil et déblocage. Les sources de données restent nécessaires pour associer les éléments à leurs identifiants. Cette analyse ne constitue ni une reprise du développement ni une validation de Companion sur l'appareil.

## Historique — première application : fiche de progression

La fiche existante de progression du Résonateur comporte maintenant Aperçu, Arme, Échos, Forte et Séquence, avec navigation latérale ou horizontale, zone de contenu stable et enregistrement commun. Les cinq compétences sont présentées ensemble à la largeur tablette testée. Les passifs restent regroupés par nature ; aucune position ou liaison non vérifiée de l'arbre du jeu n'a été ajoutée. Les autres écrans restent dans le périmètre de refonte, et la correspondance exacte avec le menu actuel du jeu n'est pas présentée comme acquise.

La rubrique Échos distingue l’emplacement principal, les quatre autres emplacements et les exemplaires disponibles. Les formulaires de détail partagent la palette et la typographie de la fiche ; leur fermeture reste accessible pendant le défilement. Les changements sont intégrés au même brouillon de Résonateur.

## Historique — application à l’ensemble, revue du 13 septembre 2026

Les menus historiques de compte et catalogue, les inventaires, objectifs, équipes, activités et réglages partagent désormais une typographie système, la palette bleu nuit/doré, les accents de sélection et les commandes tactiles. L’encyclopédie utilise une fiche par rubriques ; les objectifs, builds et équipements réels restent distingués. La grille compacte libère la ligne d’identité et place ensemble progression et actions. Les captures et interactions ont été vérifiées en FR/EN, notamment à 320, 720 et 1152 pixels CSS, avec les régressions de placement et de focus couvertes par les tests.

Audit des ressources : les trois feuilles CSS, les ornements géométriques, icônes d’installation et le nouveau SVG de portrait indisponible sont propres au projet. Aucune police, bande-son, modèle ou nouvelle image extraite des menus du jeu n’est intégrée. Les portraits et icônes distants déjà utilisés proviennent des chemins publics d’Encore, dont la page « About » identifie WW_Data/WW_Asset. Cette provenance ne démontre pas un droit de réutilisation : aucune licence logicielle générale de Kuro n’a été établie. Les attributions et le statut non officiel sont visibles dans les réglages et la documentation. Les règles officielles des œuvres dérivées ne sont pas présentées comme couvrant cette application.

L’orientation demandée a été appliquée à tous les ensembles d’écrans. Elle porte sur l’organisation des menus et une réalisation originale adaptée à Companion ; une copie exacte et juridiquement approuvée des menus actuels du jeu n’est pas revendiquée. La revue utilisateur pourra affiner la ressemblance et le confort sur son appareil sans revenir sur les garanties techniques déjà vérifiées.

## Orientation visuelle actualisée — reproduction fidèle

Dernière demande explicite de l’utilisateur : reprendre au maximum à l’identique l’interface de la vidéo fournie, notamment la disposition exacte de l’arbre, les rubriques et contrôles. Conserver toutes les miniatures officielles sans redessin ; seul le fond est personnalisé. Cette demande remplace l’orientation précédente vers des icônes et compositions inventées. Compléter les vues manquantes avec des sources et vidéos identifiées, en distinguant les versions du jeu. Citer Kuro Games comme créateur du jeu et des ressources, avec le statut communautaire non officiel. Une attribution n’est pas présentée comme une licence. Ne pas afficher un rendu 3D ou une animation comme reproduit si les ressources disponibles ne le permettent pas. Les objectifs et recommandations restent masqués conformément à la phase Collection.

## Réalisation de la phase Collection — 14 septembre 2026

- Même charte bleu nuit/doré pour la collection, les inventaires, l'encyclopédie et les réglages. Ajout des possessions en une sélection multiple avec annulation ou enregistrement explicite.
- Fiche plein écran : Attributs, Arme, Échos, Forte et Chaîne à gauche à partir de 680 pixels CSS ; personnages à droite. Navigation horizontale sur petit écran. Les modifications restent un brouillon commun, avec choix Enregistrer / Abandonner / Rester avant un changement de personnage.
- Attributs et chaîne illustrés par les images officielles de formation ; arme et Écho sélectionnés avec leur grande icône officielle. Cinq emplacements d'Échos distincts de la liste des personnages. Aucun modèle 3D ni animation n'a été intégré.
- Arbre de quinze nœuds à cinq branches selon les parents identifiés dans le jeu ; positions comparées à la vidéo. Outro et Interruption de tonalité restent distincts. Cadres RoleSkillTree, icônes propres au personnage, niveaux, passifs connus/inconnus et déblocages. La hauteur réserve les libellés traduits et les zones tactiles des compétences supplémentaires pour éviter leur chevauchement.
- Le détail de compétence utilise la description locale, un sélecteur de niveau, moins/plus et un curseur reliés au même état. Le panneau reste adjacent à partir de 680 pixels CSS, puis remplace temporairement l'arbre sur téléphone avec un retour explicite.
- Six séquences disposées en arc, avec les icônes du personnage et les cadres RoleDeviceList. La description défile indépendamment pour garder les choix accessibles. Les actions renseignent la progression existante, sans consommer de ressources dans le jeu.
- Tutoriel en cinq étapes, facultatif et rejouable ; pas de second système de bulles d'aide. Objectifs et recommandations masqués, données et code conservés.

Les captures examinées utilisent les vrais composants et images locales avec un compte synthétique : arbre FR/EN à 320 et 1152 pixels CSS, attributs, arme, cinq Échos et chaîne à 1152 pixels CSS. Les tests vérifient aussi les dimensions intermédiaires, les rotations simulées et les zones tactiles. Ils ne constituent pas un essai sur la tablette physique. Une reproduction exacte des modèles 3D, des animations, de toutes les statistiques calculées du jeu ou de son serveur de compte n'est pas revendiquée.


## Correctif de fidélité — prefabs locaux, 14 septembre 2026

La comparaison utilisateur invalide la qualification de « copie conforme » de la livraison Collection. Les cadres avaient été récupérés, mais pas encore leur composition exacte. Onze prefabs sont maintenant décodés : racine du menu, attributs, liste et élément de chaîne, arbre, panneau détaillé, vue, nœuds A/B/C et compétences supplémentaires. Aucun échec dans les flux de propriétés décodés. Les fichiers bruts, outils et la vidéo restent privés dans `test-results`.

`UiItem_RoleSkillTree` utilise un canevas 2560 × 1440. Les acteurs `PnlSkill1` (100317), `PnlSkill2` (100321), `PnlPassiveSkill` (100006), `PnlSkill3` (100325) et `PnlSkill4` (100329), avec leurs instances imbriquées, donnent ces centres arrondis au pixel source :

| Branche | X | Y compétence | Y intermédiaire | Y supérieur |
| --- | ---: | ---: | ---: | ---: |
| Attaques normales | 623 | 1180 | 837 | 540 |
| Compétence résonatrice | 923 | 1000 | 657 | 360 |
| Forte Circuit | 1287 | 937 | 596 | 300 |
| Libération résonatrice | 1643 | 1000 | 657 | 360 |
| Intro | 1940 | 1180 | 837 | 540 |

Outro et Interruption de tonalité : (1126, 1252) et (1450, 1252). Les cadres font 312 × 312 unités **marges transparentes incluses** ; les icônes principales 78 × 78 ; les icônes supplémentaires 66 × 66. Les niveaux utilisent 28/40 unités typographiques. Le panneau source du détail fait 842 unités ; le décalage de sélection de 400 unités est recoupé avec la vidéo. Le canevas est centré et mis à l'échelle sans déformer ses proportions sur les vues larges ; les vues plus étroites cadrent son contenu et préservent des cibles de 44 pixels minimum. Le téléphone affiche la description avec un retour à l'arbre.

Les centres de chaîne proviennent de `UiItem_RoleDeviceList`, `PnlList` et `PnlDeviceItem01` à `06`, en tenant compte des ancres droites : (1262,1295), (1530,1233), (1746,1099), (1918,908), (2025,681), (2060,373). La sélection masque les rails ; le retour les rétablit. La progression reste le brouillon commun existant.

La mise en forme des descriptions provient du texte local : titres, termes soulignés et couleurs nommées. Un formateur commun échappe le texte et accepte seulement une liste fixe de styles ; aucun HTML actif, lien source ou taille arbitraire n'est inséré. Les descriptions simples restent présentes pour les consommateurs existants. Les 58 références restent chargées à la demande.

Limites de conformité : pas de modèle 3D animé, de police extraite, de rendu Niagara ni de simulation d'effets de matériaux. Les onglets de dégâts détaillés et les statistiques finales du personnage ne sont pas reproduits par des chiffres supposés. Le bouton Enregistrer reste nécessaire à Companion. Les autres sous-écrans gardent des contrôles adaptés à un inventaire déclaré. Il serait incorrect de qualifier l'ensemble de copie conforme malgré l'amélioration de l'arbre et de la chaîne.
