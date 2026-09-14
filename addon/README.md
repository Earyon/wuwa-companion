# Prototype d’import — avant choix de la méthode

Ce dossier contient un prototype technique autonome. Il n’est pas chargé par le site, n’est pas un installateur et ne constitue pas un scanner opérationnel du compte. Aucune connexion Kuro, lecture de mémoire, interception réseau ou automatisation des menus n’est implémentée. L’utilisateur choisira la méthode après consultation de [la comparaison](../ADDON_METHODS.md).

## Fichiers

- `windows/read-image.ps1` : OCR français d’une image existante avec Windows PowerShell 5.1 et les langues OCR installées. Aucun appel réseau, aucune capture d’écran, aucune modification du jeu. Refuse d’écraser un fichier existant. Les sorties peuvent contenir un identifiant visible sur l’image : conserver ces fichiers localement.
- `import-plan.cjs` : préparation et application contrôlée d’un relevé normalisé. Ne lit pas le jeu. Réutilise le stockage réel dans un contexte mémoire isolé par `account-context.cjs`. L’application d’un plan vérifie que le compte n’a pas changé depuis sa préparation.
- `prepare-backup.cjs` : transforme un relevé normalisé et une sauvegarde Companion en une nouvelle sauvegarde à examiner. Écrit uniquement un nouveau fichier ; ne modifie ni les entrées ni le navigateur. Une sauvegarde complète restaurée ultérieurement reste un remplacement explicite : elle ne doit pas servir de mécanisme de synchronisation concurrente.

## Vérifications reproductibles

```text
node tests/addon-import.cjs
node tests/addon-browser.cjs
node scripts/check-ocr-reference.cjs
```

Les deux premiers tests emploient uniquement des données synthétiques. Le test navigateur demande Playwright et Edge comme les autres tests du projet. Le dernier nécessite les observations privées de la vidéo dans `test-results/` ; il est facultatif et exclu de la suite générale.

Le lecteur d’image s’utilise dans Windows PowerShell 5.1 lorsque la politique locale autorise les scripts :

```powershell
.\addon\windows\read-image.ps1 -ImagePath .\image.png -OutputPath .\observation.json -Language fr-FR
```

La lecture a également été testée dans un interpréteur PowerShell 5.1 sans modifier la politique d’exécution de la machine. PowerShell 7 ne fournit pas ici la projection WinRT nécessaire. Aucune installation de langue n’est déclenchée automatiquement.

## Contrat du relevé normalisé

Ce format appartient au prototype ; aucun fournisseur réel ne le produit encore. Ce n’est pas le format de WuWa Inventory Kamera et le déclarer `windows-ocr` n’ajoute pas un collecteur OCR.

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

La migration de la sauvegarde initiale doit avoir été effectuée par Companion. Le fichier de sortie est refusé s’il existe déjà. Les sorties et sauvegardes personnelles doivent rester dans `test-results/` ou hors du dépôt. La future interface devra automatiser ces étapes après choix du collecteur ; ces commandes ne sont pas le parcours demandé à l’utilisateur final.
