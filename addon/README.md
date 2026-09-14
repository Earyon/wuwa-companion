# Module Windows — développement en cours

L’utilisateur a choisi le 14 septembre 2026 la méthode recommandée : reconnaissance locale des menus sous Windows, puis import dans Companion. Ce dossier contient sa préparation technique, séparée du site. Le lecteur fonctionne sur des images ; le pilotage complet, la distribution et la synchronisation distante restent à développer et vérifier. Ce n’est pas encore un scanner opérationnel du compte. [Comparaison et sources](../ADDON_METHODS.md).

## Lecture locale vérifiée

`windows/recognition.py` utilise RapidOCR 3.9.2 avec ONNX Runtime sur CPU, deux threads par défaut. Les trois modèles doivent être présents dans le paquet ; une absence provoque une erreur, pas un téléchargement pendant la lecture. Le benchmark a chargé le moteur et reconnu les images avec les connexions réseau refusées.

`windows/readers.py` lit les identités, niveaux/paliers, rang d’arme, cinq compétences et statistiques d’Écho dans leurs régions respectives. Les variantes homonymes gardent leurs identifiants distincts. `echo-metadata.json` projette les qualités disponibles depuis les fichiers locaux du jeu ; aucun nom ou rang présumé ne sert de valeur par défaut. L’orientation/résolution et les libellés différents de ceux vérifiés peuvent encore provoquer un refus : il ne faut pas convertir ce refus en valeur inventée.

`windows/traversal.py` vérifie la couverture des cases, notamment la dernière page qui recouvre une partie de la précédente. Ces indices décrivent des visites pendant un scan, **pas une identité durable d’exemplaire**. Le futur pilote doit établir et vérifier la première ligne réellement visible ; le plan de pagination ne mesure pas le défilement à sa place.

`windows/environment.py` consulte seulement les métadonnées de permissions Windows. Essai du 14 septembre : processus local au niveau moyen, jeu au niveau élevé. Ce décalage bloque l’injection de commandes Windows ; aucun lancement administrateur, changement de sécurité, accès à la mémoire du jeu ou élévation automatique n’est effectué. Le prérequis passé ne garantirait pas à lui seul la compatibilité du pilotage.

Résultats : les quatre écrans de la vidéo passent en lecture entière et ciblée, dont les sept statistiques de l’Écho. Le menu réel du PC (1280 × 720, ressources 3.6.15) a fourni Hiyuki, niveau 90, palier 6 en 3 656 ms. Cela valide **ce champ de cet écran**, pas l’inventaire complet, les nœuds ou la navigation. Les références publiques restent explicitement issues du snapshot local 3.6.13, non régénéré silencieusement après la mise à jour.

Les dépendances installées dans un environnement isolé sont figées dans `windows/requirements.txt` (`pip check` réussi). RapidOCR est sous licence Apache-2.0 ; les licences et notices de toutes les dépendances/modèles devront accompagner la distribution. Aucun installateur n’est livré à ce stade.

## Fichiers

- `windows/read-image.ps1` : OCR français d’une image existante avec Windows PowerShell 5.1 et les langues OCR installées. Aucun appel réseau, aucune capture d’écran, aucune modification du jeu. Refuse d’écraser un fichier existant. Les sorties peuvent contenir un identifiant visible sur l’image : conserver ces fichiers localement.
- `import-plan.cjs` : préparation et application contrôlée d’un relevé normalisé. Ne lit pas le jeu. Réutilise le stockage réel dans un contexte mémoire isolé par `account-context.cjs`. L’application d’un plan vérifie que le compte n’a pas changé depuis sa préparation.
- `prepare-backup.cjs` : transforme un relevé normalisé et une sauvegarde Companion en une nouvelle sauvegarde à examiner. Écrit uniquement un nouveau fichier ; ne modifie ni les entrées ni le navigateur. Une sauvegarde complète restaurée ultérieurement reste un remplacement explicite : elle ne doit pas servir de mécanisme de synchronisation concurrente.

## Vérifications reproductibles

```text
node tests/addon-import.cjs
node tests/addon-browser.cjs
node scripts/check-ocr-reference.cjs
python tests/addon-readers.py <chemin-vers-node>
node scripts/build-addon-references.cjs
python scripts/check-rapidocr-reference.py
```

Les tests d’import, navigateur et lecteurs emploient des données synthétiques. Les lecteurs/pagination demandent seulement Python standard et Node ; les dépendances OCR ne sont nécessaires qu’aux benchmarks d’images. Le test navigateur demande Playwright et Edge. Les deux benchmarks OCR nécessitent les observations/images privées de la vidéo dans `test-results/` ; ils sont facultatifs et exclus de la suite générale.

Commande de lecture locale pour le développement :

```text
python addon/windows/read-image.py image.png test-results/addon-references.json observation.json --kind character
```

La commande refuse un fichier de sortie existant et ne modifie pas le compte. Elle ne constitue pas le parcours « Synchroniser » demandé pour l’utilisateur final.

Le lecteur d’image s’utilise dans Windows PowerShell 5.1 lorsque la politique locale autorise les scripts :

```powershell
.\addon\windows\read-image.ps1 -ImagePath .\image.png -OutputPath .\observation.json -Language fr-FR
```

La lecture a également été testée dans un interpréteur PowerShell 5.1 sans modifier la politique d’exécution de la machine. PowerShell 7 ne fournit pas ici la projection WinRT nécessaire. Aucune installation de langue n’est déclenchée automatiquement.

## Contrat du relevé normalisé

Ce format appartient au prototype ; le lecteur d’image n’est pas encore relié à un collecteur produisant un relevé complet. Ce n’est pas le format de WuWa Inventory Kamera et le déclarer `windows-ocr` n’atteste pas sa couverture.

```json
{
  "format": "wuwa-companion-snapshot",
  "version": 1,
  "source": {
    "provider": "windows-ocr",
    "account": "SYNTHETIC_ACCOUNT",
    "server": "europe",
    "capturedAt": "2026-01-02T10:00:00Z",
    "gameVersion": "3.6.0",
    "identity": "observation"
  },
  "characters": [{"gameId": "1108", "level": 90}]
}
```

`provider` distingue `windows-ocr`, `local-export` et `kuro-api`, sans attester que ces méthodes sont disponibles ou autorisées. `identity: observation` autorise des observations par identifiant de catalogue, mais refuse les copies d’armes/Échos. Le mode `stable` exige que le futur fournisseur ait effectivement établi les identifiants d’exemplaires, pas des positions de grille ni des noms.

Champs non lus : les omettre. Ne pas fabriquer de valeur zéro, de niveau 1 ou de nœud verrouillé. Les objets absents d’un relevé ne sont pas supprimés. Les nœuds Forte du convertisseur de sauvegarde sont volontairement indisponibles tant que le fournisseur n’a pas validé leur correspondance. Le moteur commun sait contrôler une correspondance fournie ; ses tests utilisent une référence synthétique explicite.

Pour préparer un fichier sans l’appliquer :

```text
node addon/prepare-backup.cjs snapshot.json existing-backup.json proposed-backup.json
```

La migration de la sauvegarde initiale doit avoir été effectuée par Companion. Le fichier de sortie est refusé s’il existe déjà. Les sorties et sauvegardes personnelles doivent rester dans `test-results/` ou hors du dépôt. La future interface devra automatiser ces étapes ; ces commandes ne sont pas le parcours demandé à l’utilisateur final.
