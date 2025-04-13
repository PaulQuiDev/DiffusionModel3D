# DiffusionModel3D
Ce projet est une représentation 3D interactive du fonctionnement d’un modèle de diffusion, une technologie utilisée pour générer des images à partir d’un bruit aléatoire (comme dans Stable Diffusion ou DALL·E).

Il permet de visualiser étape par étape comment une image se construit :

   - D’abord, on part d’un bruit total,

   - Ensuite, un réseau de neurones (appelé U-Net) apprend à enlever le bruit petit à petit,

   - Jusqu’à obtenir une image finale cohérente.

Les différents blocs dans la scène représentent les couches du modèle (encodeurs, décodeurs, convolutions…), les flèches montrent les flux d’informations, et des annotations expliquent chaque étape de façon simple.

## ✨ Fonctionnalités

- Représentation 3D des composants clés d’un modèle de diffusion : bruit initial, encodeurs, décodeurs, skip-connections, convolutions, etc.
- Navigation libre dans l’espace 3D via la souris (zoom, rotation, déplacement).
- Affichage dynamique des **feature maps**, **flèches de flux**, et **explications au survol**.
- Slider d’images illustrant les étapes de débruitage pour visualiser l'évolution progressive vers une image nette.

## 📦 Technologies utilisées

- [Three.js](https://threejs.org/) — rendu 3D WebGL
- `OrbitControls` — navigation fluide dans l’espace 3D
- JavaScript (ES6)
- HTML / CSS

## 📁 Structure du projet

- `img/stepX.jpeg` : images illustrant les étapes du débruitage
- `addCubeWithImageFace()` : fonction utilisée pour créer des blocs avec une image sur une face + texte
- `addArrow()` : crée une flèche annotée reliant deux blocs
- `highlightSequence2()` : animation de mise en valeur de séquences spécifiques
- `startImageSlider()` : slider automatique d’images sur un cube pour illustrer la génération

## 🖱️ Interaction utilisateur

- **Survol** d’un élément : affiche des explications dans un texte flottant
- **Clic gauche + drag** : rotation de la caméra
- **Scroll** : zoom avant/arrière
- **Déplacement** : navigation libre autour des éléments du modèle

## 🧠 Exemple d’étapes représentées

- Encodeur d’image (RGB -> Feature Map)
- Encodeur de texte (tokenization + embedding)
- Matrice d’embedding (injection de conditionnement texte)
- U-Net avec skip connections
- Reconstruction finale de l’image
- Visualisation du processus de débruitage via un **cube animé**

## 📷 Aperçu

> Une série de blocs (cubes) représente les opérations du modèle. Une animation illustre comment le bruit se transforme en image claire à travers des étapes de traitement neurone par neurone. L'utilisateur peut explorer et comprendre chaque composant du pipeline.

## 🚀 Lancement

1. Clonez le dépôt
2. Ouvrez le fichier HTML dans un navigateur supportant WebGL (Chrome, Firefox, etc.)
3. Interagissez avec les blocs 3D et survolez pour obtenir les détails.

---

> Ce projet est pour **comprendre visuellement le fonctionnement des modèles de génération d'images IA**. 
