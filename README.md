# Atlas · Québec

Maquette 3D interactive et stylisée du Vieux-Québec, construite avec Three.js et Vite. Elle présente le Château Frontenac, la Citadelle, la Place Royale et l’Hôtel du Parlement dans un paysage miniature inspiré du cap Diamant et du Saint-Laurent.

Cette interprétation artistique utilise une géographie et des proportions indicatives. Elle ne repose pas sur des données cadastrales ou photogrammétriques.

## Ouvrir la maquette par double-clic

Téléchargez **[maquette-quebec.html](./maquette-quebec.html)** sur votre ordinateur avec le bouton de téléchargement du fichier GitHub, puis ouvrez ce fichier dans un navigateur récent compatible WebGL. Ce fichier autonome contient le JavaScript, les styles et les polices ; il fonctionne sans serveur, sans Node.js et sans connexion Internet.

GitHub affiche le code des fichiers HTML au lieu d’exécuter l’application. Il faut télécharger le fichier avant de l’ouvrir. Le fichier source `index.html` nécessite le serveur Vite décrit ci-dessous.

Pour régénérer le fichier autonome à partir des sources, exécutez `npm ci` puis `npm run build`. La compilation produit aussi le dossier `dist/` pour l’hébergement Web, avec des chemins relatifs compatibles avec un sous-dossier.

## Développement

Node.js 22.12+ ou 24 et npm sont requis.

```sh
cd maquette
npm ci
npm run dev -- --port 5173
```

## Validation et production

```sh
npm run build
npm run preview -- --port 4173
```

Le serveur doit retourner la page et les ressources JavaScript. Vérifier dans un navigateur avec WebGL que la scène est visible, que la sélection de monument met à jour sa fiche et déplace la caméra, et que les calques, le réglage de lumière, les vues et la capture PNG fonctionnent.

## Navigation

- Glisser : tourner ; molette : zoomer ; clic droit + glisser : déplacer.
- Tactile : un doigt pour tourner, deux pour déplacer ou zoomer.
- Choisir un monument dans la liste ou sur la scène pour afficher sa fiche.
- Les polices et toutes les ressources de la scène sont livrées localement ; aucun compte, service distant ni clé API n’est nécessaire.

Les boutons de capture exportent uniquement la scène 3D, sans les panneaux d’interface. Le plein écran dépend de la prise en charge du navigateur.

## Extension géographique en préparation

La version affichée reste une maquette artistique. La projection métrique et les importeurs de données réelles pour une zone de 8 × 6 km sont préparés, mais l’acquisition est bloquée par les accès réseau de l’environnement. Voir [l’état de préparation et les sources nécessaires](docs/geographic-extension.md). Aucun relevé à l’échelle réelle n’est encore intégré à la scène.
