# Extension géographique — relief intégré, ville OSM bloquée

La vue par défaut affiche désormais le relief réel dans la scène Three.js. Le bouton « Maquette artistique » conserve la miniature originale, sans échelle annoncée.

## Données intégrées

`data/quebec-terrain.json` est importé par `src/terrain-scene.js`, puis ajouté à la scène dans `src/main.js`. Le terrain comporte 161 × 121 sommets sur une emprise de 8 000 × 6 000 mètres, centrée à 46,815° N, 71,225° O. X pointe vers l’est, Z vers le sud ; une unité représente un mètre. Les altitudes ne sont pas exagérées.

Les neuf tuiles Terrarium Mapzen / AWS Open Data ont été téléchargées, décodées avec contrôle CRC, puis interpolées sur une grille de 50 m. Les valeurs obtenues vont de 3 à 103,3 m. Cet espacement ne garantit pas la précision de la source. Attribution détaillée : https://github.com/tilezen/joerd/blob/master/docs/attribution.md.

Les quatre monuments restent des modèles artistiques simplifiés, repositionnés à des coordonnées indicatives et posés sur le relief interpolé. Leurs dimensions et leurs orientations ne constituent pas une restitution architecturale vérifiée. L’eau utilise un plan à 4,5 m pour couvrir le plancher du raster : ce n’est pas un tracé de rive OSM. Les limites restent affichées dans l’interface.

## Blocage restant

L’environnement fonctionne et les deux domaines nécessaires sont autorisés. Toutefois, `https://overpass-api.de/api/interpreter` et `/api/status` renvoient HTTP 406 depuis le serveur distant. Les essais GET et POST ont échoué. Aucun fichier de ville OSM n’a été acquis. Les rues et les empreintes de bâtiments réelles ne sont donc **pas intégrées**. La vue de relief ne prétend pas représenter une ville complète.

Les outils préparés dans le commit `69e3946` sont conservés : projection métrique, acquisition et conversion OSM avec trous de multipolygones, provenance des hauteurs, tests et import du terrain.

## Reproduction

```sh
npm ci
npm run test:geo
npm run data:terrain
npm run build
npm run test:browser
```

Le test navigateur requiert Chromium installé (`/usr/bin/chromium` par défaut, variable `CHROMIUM_PATH` possible). Il sert temporairement le fichier HTML autonome sur localhost, vérifie WebGL et les interactions et refuse les requêtes externes. L’ouverture directe `file://` est interdite par la politique du Chromium de cet environnement ; elle n’a pas été validée ici. La compilation autonome garantit une seule feuille de style et un script incorporés, sans ressource externe.

Pour reprendre la ville réelle : obtenir une réponse Overpass complète avec `npm run data:city` ou `node scripts/import-city.mjs /chemin/overpass.json`, inspecter couverture et avertissements, puis implémenter le rendu des empreintes et axes. Les polygones devront être découpés à l’emprise et les routes adaptées au terrain. La seule acquisition du JSON ne suffira pas à les intégrer à la scène.
