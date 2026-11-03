# Extension géographique — préparation, non activée

L’application et `maquette-quebec.html` affichent encore la maquette artistique. Les outils de ce document préparent son remplacement par des données réelles ; ils ne constituent pas encore une scène géographique livrée.

## Zone proposée

Une emprise de 8 000 × 6 000 mètres (48 km²), centrée à 46,815° N, 71,225° O. Elle couvre le centre de Québec et une partie de Lévis. Les coordonnées WGS84 sont projetées dans un repère tangent local : X vers l’est, Z vers le sud, une unité pour un mètre. La courbure terrestre produit une distorsion horizontale inférieure à 1 ppm dans cette emprise. L’altitude en mètres est indépendante et ne doit pas être exagérée lors du rendu.

## Sources nécessaires

- `overpass-api.de` : empreintes de bâtiments, axes des rues, parcs et eaux OpenStreetMap. Attribution obligatoire « © les contributeurs OpenStreetMap », licence ODbL. Les géométries non fermées sont écartées avec un avertissement ; les trous des multipolygones sont conservés.
- `elevation-tiles-prod.s3.amazonaws.com` : raster Terrarium de Mapzen/AWS Open Data. Les tuiles PNG sont décodées avec vérification CRC puis interpolées sur une grille de 50 m. Cet espacement ne constitue pas une garantie de précision des données sources. Le relief obtenu est interpolé, pas un relevé cadastral. L’attribution des sources est enregistrée dans le fichier de terrain.

L’accès HTTPS à Overpass a été refusé par le proxy de l’environnement (CONNECT HTTP 403). Les deux domaines ont été ajoutés au brouillon de configuration, mais ne sont pas encore actifs dans la politique observée. Aucune donnée géographique réelle n’a été téléchargée et aucune carte fictive n’a été présentée comme une nouvelle restitution à l’échelle.

## Acquisition et validation

Depuis la racine du dépôt, après activation des accès :

```sh
npm ci
npm run test:geo
npm run data:city
npm run data:terrain
```

Les importeurs respectent le proxy HTTPS et la confiance TLS de l’environnement. Ils acceptent aussi des fichiers déjà téléchargés :

```sh
node scripts/import-city.mjs /chemin/overpass.json
node scripts/import-terrain.mjs /chemin/terrarium-tiles
```

Les sorties sont `data/quebec-city.json` et `data/quebec-terrain.json`. Ne pas publier ces fichiers comme une restitution vérifiée avant inspection de leur couverture, des avertissements et du rendu. Les multipolygones peuvent dépasser l’emprise de requête ; le futur rendu devra les découper au rectangle métrique.

Les hauteurs ont une provenance explicite : `osm-height` (hauteur renseignée), `levels-estimate` (nombre d’étages × 3 m), ou `default-estimate` (valeur conventionnelle par type de bâtiment). Les largeurs de rues sans valeur OSM sont inconnues. Une empreinte réelle et un relief raster ne garantissent pas des façades, toitures ou hauteurs exactes.

## Travail restant

Télécharger et inspecter les deux sources, intégrer leur rendu à la scène existante, ajuster navigation et barre d’échelle dynamique, conserver les attributions et les limites de précision visibles, puis reconstruire et tester la version autonome hors ligne. La maquette actuelle reste disponible pendant cette préparation.
