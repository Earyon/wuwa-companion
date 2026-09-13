# Direction visuelle de l’ensemble des écrans

Demande de l’utilisateur du 13 septembre 2026 : rapprocher autant que possible le design des menus actuels du jeu (Personnage, Compétences, équipement), dans les limites légales. Cette orientation complète les règles permanentes de qualité ; elle autorise l’évolution visuelle des écrans concernés, sans perte de fonction ou de données.

Précision explicite : cette orientation s’applique également à tous les écrans déjà modélisés. Les reprendre par ensembles cohérents, y compris catalogue, compte, inventaires et planification ; adapter les fonctions propres à Companion lorsque le jeu n’a pas de menu équivalent. Le rendu antérieurement validé reste une référence de fonctionnement et de stabilité, pas une interdiction d’évolution visuelle.

## Traduction dans Companion

- Organiser la fiche autour du Résonateur : vue d’ensemble, arme, Échos, Forte et séquence ; navigation cohérente entre rubriques.
- Privilégier une zone centrale consacrée à la sélection et un panneau de détails, avec présentation verticale adaptée aux petits écrans.
- Garder une ambiance sombre, les accents dorés, une sélection claire et des commandes tactiles accessibles. Dessiner les composants en HTML/CSS et les pictogrammes propres au projet.
- Distinguer les données actuelles des objectifs. Les nœuds Forte restent associés aux identifiants vérifiés ; aucune liaison ou position issue du jeu n’est inventée lorsque les données manquent.
- Comparer les références visuelles datées avant la refonte graphique complète. Les premières recherches décrivent l’organisation du menu Forte, mais ne prouvent pas une correspondance avec la toute dernière version du jeu. La ressemblance complète n’est pas encore réalisée ni validée.

## Sources et périmètre de réutilisation

- [Règles officielles de Kuro sur les œuvres dérivées](https://wutheringwaves.kurogames.com/p/en/produce.html), consultées le 13 septembre 2026 : la définition couverte exclut les logiciels. Ce texte ne fournit donc pas une licence générale pour copier l’interface ou ses ressources dans Companion. Ne pas présenter le statut communautaire ou la gratuité comme une autorisation.
- [Présentation du menu Forte sur Google Play](https://play.google.com/store/apps/editorial?id=mc_games_editorialevergreen_postinstall_level_up_forte_in_wuthering_waves_gamehub_fcp) : référence descriptive, pas une licence sur les images ni une preuve de fraîcheur de tous les détails. Les illustrations n’ont pas été récupérées dans le projet.

La nouvelle interface utilise une implémentation et des éléments graphiques originaux. L’inspiration porte d’abord sur l’organisation et les interactions. Ne pas extraire ou intégrer de nouveaux fichiers graphiques, polices, sons ou modèles du jeu sur la seule base de ces règles. Toute reproduction nécessitant des droits supplémentaires doit faire l’objet d’une autorisation appropriée. Le projet reste présenté comme un outil communautaire non officiel. Les liens vers des ressources déjà présents ne valent pas preuve de licence ; leur provenance et leurs conditions restent à examiner lors de la revue des ressources.

## Première application : fiche de progression

La fiche existante de progression du Résonateur comporte maintenant Aperçu, Arme, Échos, Forte et Séquence, avec navigation latérale ou horizontale, zone de contenu stable et enregistrement commun. Les cinq compétences sont présentées ensemble à la largeur tablette testée. Les passifs restent regroupés par nature ; aucune position ou liaison non vérifiée de l’arbre du jeu n’a été ajoutée. Les autres écrans restent dans le périmètre de refonte, et la correspondance exacte avec le menu actuel du jeu n’est pas présentée comme acquise.

La rubrique Échos distingue l’emplacement principal, les quatre autres emplacements et les exemplaires disponibles. Les formulaires de détail partagent la palette et la typographie de la fiche ; leur fermeture reste accessible pendant le défilement. Les changements sont intégrés au même brouillon de Résonateur.

## Application à l’ensemble — revue finale du 13 septembre 2026

Les menus historiques de compte et catalogue, les inventaires, objectifs, équipes, activités et réglages partagent désormais une typographie système, la palette bleu nuit/doré, les accents de sélection et les commandes tactiles. L’encyclopédie utilise une fiche par rubriques ; les objectifs, builds et équipements réels restent distingués. La grille compacte libère la ligne d’identité et place ensemble progression et actions. Les captures et interactions ont été vérifiées en FR/EN, notamment à 320, 720 et 1152 pixels CSS, avec les régressions de placement et de focus couvertes par les tests.

Audit des ressources : les trois feuilles CSS, les ornements géométriques, icônes d’installation et le nouveau SVG de portrait indisponible sont propres au projet. Aucune police, bande-son, modèle ou nouvelle image extraite des menus du jeu n’est intégrée. Les portraits et icônes distants déjà utilisés proviennent des chemins publics d’Encore, dont la page « About » identifie WW_Data/WW_Asset. Cette provenance ne démontre pas un droit de réutilisation : aucune licence logicielle générale de Kuro n’a été établie. Les attributions et le statut non officiel sont visibles dans les réglages et la documentation. Les règles officielles des œuvres dérivées ne sont pas présentées comme couvrant cette application.

L’orientation demandée a été appliquée à tous les ensembles d’écrans. Elle porte sur l’organisation des menus et une réalisation originale adaptée à Companion ; une copie exacte et juridiquement approuvée des menus actuels du jeu n’est pas revendiquée. La revue utilisateur pourra affiner la ressemblance et le confort sur son appareil sans revenir sur les garanties techniques déjà vérifiées.
