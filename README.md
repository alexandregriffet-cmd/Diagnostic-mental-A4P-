# Correctif Hub A4P → CMP direct

Remplace les fichiers du dépôt `Diagnostic-mental-A4P-` par ceux de ce pack.

## Fichiers à remplacer
- `index.html`
- `cmp/index.html`
- `js/config.js`

## Effet
- Depuis la carte CMP du hub, le bouton principal ouvre **directement** le vrai CMP actif :
  `https://alexandregriffet-cmd.github.io/CMP-A4P-ACADEMIE-DE-PERFORMANCES-/`
- La page `cmp/index.html` reste une passerelle propre avec le même lien direct.
- Le bouton retour du module CMP revient au hub : `../index.html`
