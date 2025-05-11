import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// Initialisation de la scène
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 60);

// Récupérer le canvas et initialiser le renderer
const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth * 0.8, window.innerHeight); // 80% de l'écran
renderer.setPixelRatio(window.devicePixelRatio);

// Ajout des contrôles de la caméra
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Lumières
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Liste des objets et leurs infos
const objects = [];
const objectInfo = new Map();
const idToObject = new Map(); // pour retrouver un objet par son id

// fonction pour les obj

function addObject(id, geometry, material, position, text, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation); // 👈 applique la rotation
    mesh.name = id;
    mesh.userData.id = id;
    scene.add(mesh);

    objects.push(mesh);
    objectInfo.set(mesh, text);
    idToObject.set(id, mesh);
}


function highlightSequence(idList, duration = 1000, lightnessBoost = 0.1) {
    async function loop() {
        while (true) {
            for (const id of idList) {
                const object = idToObject.get(id);
                if (!object) continue;

                const materials = [];

                if (object instanceof THREE.Mesh) {
                    if (Array.isArray(object.material)) {
                        // Mesh avec plusieurs matériaux (ex: cube avec image)
                        materials.push(...object.material);
                    } else {
                        materials.push(object.material);
                    }
                } else if (object instanceof THREE.Group) {
                    // Groupe (ex: flèches) → on récupère les matériaux de chaque enfant
                    object.traverse(child => {
                        if (child instanceof THREE.Mesh) {
                            if (Array.isArray(child.material)) {
                                materials.push(...child.material);
                            } else {
                                materials.push(child.material);
                            }
                        }
                    });
                }

                const originalHSLs = materials.map(mat => {
                    const hsl = {};
                    mat.color.getHSL(hsl);
                    return hsl;
                });

                // Appliquer le boost de luminosité
                materials.forEach((mat, i) => {
                    const hsl = originalHSLs[i];
                    mat.color.setHSL(hsl.h, hsl.s, Math.min(1.0, hsl.l + lightnessBoost));
                });

                await new Promise(resolve => setTimeout(resolve, duration));

                // Revenir à la couleur originale
                materials.forEach((mat, i) => {
                    const hsl = originalHSLs[i];
                    mat.color.setHSL(hsl.h, hsl.s, hsl.l);
                });
            }
        }
    }

    loop(); // démarrer la boucle
}
function highlightSequence2(idList, duration = 1000, lightnessBoost = 0.1, moveOffset = 0.2) {
    async function loop() {
        while (true) {
            for (const id of idList) {
                const object = idToObject.get(id);
                if (!object) continue;

                const materials = [];

                if (object instanceof THREE.Mesh) {
                    if (Array.isArray(object.material)) {
                        materials.push(...object.material);
                    } else {
                        materials.push(object.material);
                    }
                } else if (object instanceof THREE.Group) {
                    object.traverse(child => {
                        if (child instanceof THREE.Mesh) {
                            if (Array.isArray(child.material)) {
                                materials.push(...child.material);
                            } else {
                                materials.push(child.material);
                            }
                        }
                    });
                }

                const originalHSLs = materials.map(mat => {
                    const hsl = {};
                    mat.color.getHSL(hsl);
                    return hsl;
                });

                const originalPosition = object.position.clone();

                // Boost lumière + décalage
                materials.forEach((mat, i) => {
                    const hsl = originalHSLs[i];
                    mat.color.setHSL(hsl.h, hsl.s, Math.min(1.0, hsl.l + lightnessBoost));
                });

                // Petit décalage vers le haut (ou X)
                object.position.y += moveOffset;

                await new Promise(resolve => setTimeout(resolve, duration));

                // Revenir à l'état initial
                materials.forEach((mat, i) => {
                    const hsl = originalHSLs[i];
                    mat.color.setHSL(hsl.h, hsl.s, hsl.l);
                });

                object.position.copy(originalPosition);
            }
        }
    }

    loop();
}


function addArrow(id, from, to, color = 0xffff00, text = "", radius = 0.05) {
    // Si 'from' ou 'to' sont des objets, on utilise leur position
    const fromPos = from instanceof THREE.Object3D ? from.position.clone() : from.clone();
    const toPos = to instanceof THREE.Object3D ? to.position.clone() : to.clone();

    const direction = new THREE.Vector3().subVectors(toPos, fromPos);
    const length = direction.length();
    const directionNormalized = direction.clone().normalize();

    const arrowGroup = new THREE.Group();
    arrowGroup.name = id;

    // Longueurs
    const shaftHeight = length * 0.6;
    const headHeight = length * 0.4;

    // Corps (cylindre)
    const shaftGeometry = new THREE.CylinderGeometry(radius, radius, shaftHeight, 16);
    const shaftMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    shaft.position.y = shaftHeight / 2;
    arrowGroup.add(shaft);

    // Pointe (cône)
    const coneGeometry = new THREE.ConeGeometry(radius * 2, headHeight, 16);
    const coneMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = shaftHeight + headHeight / 2;
    arrowGroup.add(cone);

    // Orientation
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, directionNormalized);
    arrowGroup.quaternion.copy(quaternion);

    // Position
    arrowGroup.position.copy(fromPos);

    // Ajout à la scène et gestion
    scene.add(arrowGroup);
    objects.push(arrowGroup);
    objectInfo.set(arrowGroup, text);
    // Associer aussi l'info aux enfants du groupe
    objectInfo.set(shaft, text);
    objectInfo.set(cone, text);

    idToObject.set(id, arrowGroup);
}

function addCubeWithImageFace(id, imagePath, position = [0, 0, 0], text = "", faceIndex = 4, baseColor = 0x888888 ,width=1,height=1, depth=1) {
    const loader = new THREE.TextureLoader();

    loader.load(imagePath, (texture) => {
        const materials = [];

        for (let i = 0; i < 6; i++) {
            if (i === faceIndex) {
                const mat = new THREE.MeshBasicMaterial({ map: texture });
                mat.userData.isImageFace = true; // on note que c’est la face image
                materials.push(mat);
            } else {
                materials.push(new THREE.MeshBasicMaterial({ color: baseColor }));
            }
        }

        const geometry = new THREE.BoxGeometry(width, height,  depth);
        const mesh = new THREE.Mesh(geometry, materials);

        mesh.position.set(...position);
        mesh.name = id;
        mesh.userData.id = id;
        mesh.userData.imageFaceIndex = faceIndex; // stocker quelle face est l’image

        scene.add(mesh);
        objects.push(mesh);
        objectInfo.set(mesh, text);
        idToObject.set(id, mesh);

    });
}
function changeCubeImage(id, newImagePath, faceIndex = 4) {
    const cube = idToObject.get(id);

    if (!cube) {
        console.error(`Objet avec l'id "${id}" non trouvé.`);
        return;
    }

    const loader = new THREE.TextureLoader();
    loader.load(newImagePath, (texture) => {
        // Change la texture de la face spécifique
        const material = cube.material[faceIndex];
        if (material && material.userData.isImageFace) {
            material.map = texture;
            material.needsUpdate = true; // Indiquer qu'un nouveau matériau doit être appliqué
        } else {
            console.warn(`Aucune face d'image trouvée à l'index ${faceIndex}.`);
        }
    });
}

// Fonction pour faire défiler les images
function startImageSlider(id, imagesList, faceIndex = 4, interval = 2000) {
    let currentImageIndex = 0;

    // Change l'image à intervalles réguliers
    const sliderInterval = setInterval(() => {
        // Change l'image sur la face du cube
        changeCubeImage(id, imagesList[currentImageIndex], faceIndex);

        // Passer à l'image suivante
        currentImageIndex = (currentImageIndex + 1) % imagesList.length;
    }, interval);

    // Retourner la fonction qui arrête le défilement
    return () => clearInterval(sliderInterval);
}



const imagesList = [
    "img/step1.jpeg",
    "img/step2.jpeg",
    "img/step3.jpeg",
    "img/step4.jpeg",
    "img/step5.jpeg",
    "img/step6.jpeg",
    "img/step8.jpeg",
    "img/step9.jpeg",
    "img/step0.jpeg"
];



const blockSize = 0.6;
const spacingX = 6;
const horizontalSpacing = 2; // entre les blocs d'un même niveau

function addLevelBlocks(prefix, dims, startPos) {
  const y = startPos[1];
  let cumulativeX = startPos[0];
  let lastObjectId = "";

  dims.forEach((d, i) => {
    const width = d / 64;
    const x = cumulativeX + width / 2;

    const objectId = `${prefix}_${i}`;
    addObject(
      objectId,
      new THREE.BoxGeometry(width, 3- width/4, 5- width/2.5), //valeur de taile arbirtaire juste estétique 
      new THREE.MeshBasicMaterial({ color: 0x6495ED, opacity: 0.8, transparent: true }),
      [x, y, 0],
      `Chaque bloc représente une version transformée de l’image, avec plusieurs ‘couches’ (canaux) qui contiennent des infos comme les formes, bords ou textures détectées par le modèle. C’est comme une pile d’images superposées, où chaque couche repère un détail différent de l’image d’origine. la profondeur représente : ${d } \nImage d'entrée en couleurs (RGB) — 3 canaux : Rouge, Vert, Bleu`
    );

    if (i > 0) {
      addArrow(
        `${prefix}_convArrow_${i}`,
        idToObject.get(`${prefix}_${i - 1}`),
        idToObject.get(objectId),
        0x00ff00,
        "On applique des filtres pour détecter des motifs (conv), on stabilise les valeurs pour que l'apprentissage soit plus fluide (batch norm), puis on garde seulement les infos positives pour simplifier le signal (ReLU)",
        0.4
      );
    }

    cumulativeX += width + horizontalSpacing;
    lastObjectId = objectId;
  });

  // Retourne le dernier X (pour alignement), et Y courant
  return {
    lastX: cumulativeX,
    y: y,
    lastObjectId: lastObjectId
  };
}
// example utilisation basique 
/*
addObject("cube1", new THREE.BoxGeometry(1.5,1,1), new THREE.MeshBasicMaterial({ color: 0xff00d0, transparent: true, opacity: 0.7 }), [-4, 3, 0], "texte condition.");
addObject("cone1", new THREE.ConeGeometry(0.5, 1, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.7 }), [-1.5, 3, 0], "encodeur",[0,0,3.14+3.14/2]);
addArrow("arrowBetweenObjects", idToObject.get("cube1") , idToObject.get("cone1"), 0xff2200, "Flèche entre objets");
*/

// Tructure en U ===========
let yStart = 0;
let xPos = -7 * spacingX;
let vary = 1.9

// Chemin descendant
let enc0 = addLevelBlocks("enc0", [3, 32, 64], [xPos+1.5, yStart]);
xPos += spacingX;
let enc1 = addLevelBlocks("enc1", [64, 64, 128], [xPos, enc0.y - vary-2]);
addArrow("arrow0", idToObject.get(enc0.lastObjectId), idToObject.get("enc1_0"), 0xffff00,
  "On réduit la taille de l’image pour en extraire les infos importantes" , 0.3);

xPos += spacingX;
let enc2 = addLevelBlocks("enc2", [128, 128, 256], [xPos, enc1.y - vary-2]);
addArrow("arrow1", idToObject.get(enc1.lastObjectId), idToObject.get("enc2_0"), 0xffff00,
"On continue à compresser l’image en gardant l’essentiel" , 0.3);

xPos += spacingX;
let enc3 = addLevelBlocks("enc3", [256, 256, 512], [xPos+2, enc2.y - vary-1]);
addArrow("arrow2", idToObject.get(enc2.lastObjectId), idToObject.get("enc3_0"), 0xffff00,
  "Dernière compression : on garde un résumé riche de l’image" , 0.3);


// Chemin ascendant
xPos += spacingX;
let dec3 = addLevelBlocks("dec3", [512, 256, 256], [xPos+8, enc3.y + vary+1]);
addArrow("arrow3", idToObject.get(enc3.lastObjectId), idToObject.get("dec3_0"), 0xff0000,
  "On commence à reconstruire l’image avec plus de détails" , 0.3);
    

xPos += spacingX;
let dec2 = addLevelBlocks("dec2", [256, 128, 128], [xPos+18, dec3.y + vary+2]);
addArrow("arrow4", idToObject.get(dec3.lastObjectId), idToObject.get("dec2_0"), 0xff0000,
  "On agrandit encore pour retrouver la forme d’origine" , 0.3);


xPos += spacingX;
let dec1 = addLevelBlocks("dec1", [128, 64, 64, 3], [xPos+22, dec2.y + vary+2]);
addArrow("arrow5", idToObject.get(dec2.lastObjectId), idToObject.get("dec1_0"), 0xff0000,
  "Dernière étape de reconstruction, on retrouve l’image finale" , 0.3);


  addArrow("arrow0", idToObject.get(enc0.lastObjectId), idToObject.get("dec1_0"), 0xff4400,
  "On renvoie les détails de début pour mieux reconstruire" , 0.12);

addArrow("arrow0", idToObject.get(enc1.lastObjectId), idToObject.get("dec2_0"), 0xff4400,
  "On récupère des infos utiles depuis l’étape précédente" , 0.12);

addArrow("arrow0", idToObject.get(enc2.lastObjectId), idToObject.get("dec3_0"), 0xff4400,
  "On combine les infos anciennes avec les nouvelles" , 0.12);

// fin structure en U =====================

// boucle structure loop OOOOOOOOOOOOOOO
xPos += spacingX;
addObject(
  "outLoop",
  new THREE.BoxGeometry(blockSize, blockSize, blockSize),
  new THREE.MeshBasicMaterial({ color: 0x00ffff, opacity: 0.7, transparent: true }),
  [xPos+30, dec1.y, 0],
  "Output"
);
addArrow("arrow6", idToObject.get(dec1.lastObjectId), idToObject.get("outLoop"), 0xff00ff, "Final Conv",0.1);
addArrow("arrowLoop",idToObject.get("outLoop"),new THREE.Vector3(30,-20,0),0xff00ff,"boucle",0.1)
addArrow("arrowLoop1",idToObject.get("outLoop"),new THREE.Vector3(30,-20,0),0xff00ff,"boucle",0.1)
addArrow("arrowLoop2",new THREE.Vector3(30,-20,0),new THREE.Vector3(-45,-20,0),0xff00ff,"boucle",0.1)
addArrow("arrowLoop3",new THREE.Vector3(-45,-20,0),new THREE.Vector3(-45,0,0),0xff00ff,"boucle",0.1)

addObject(
    "InLoop",
    new THREE.BoxGeometry(blockSize, blockSize, blockSize),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, opacity: 0.7, transparent: true }),
    [-45,0 , 0],
    "Output"
  );

addArrow("arrowLoop4",idToObject.get("InLoop"),idToObject.get("enc0_0"),0xff00ff,"boucle",0.1);
// fin boucle OOOOOOOOOOOO

//encodeur ------
addCubeWithImageFace("Bruit_enter","img/step0.jpeg",[-55,0,0],"Imgage d'entrés, burit aléatoire",1,0x888888,1,10,10);
addObject("Encodeur1", new THREE.ConeGeometry(1.5, 2.5, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.7 }), [-50, 0, 0], "Ce module analyse l’image pour en extraire ses formes, textures et couleurs principales. Il transforme l’image en une représentation numérique plus compacte et utile pour la suite du modèle.",[0,0,3.14+3.14/2]);
addArrow("ImgToEncod",new THREE.Vector3(-55,0,0),idToObject.get("Encodeur1"),0xff3255,"boucle",0.3);
addArrow("ImgToEncod",idToObject.get("Encodeur1"),idToObject.get("InLoop"),0xff3255,"boucle",0.2);
//------

//decodeur *******
addObject("Decodeur1", new THREE.ConeGeometry(1.5, 2.5, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.7 }), [35, 0, 0], "encodeur : Le décodeur termine en générant une image avec 3 canaux (rouge, vert, bleu), exactement comme une image normale. C’est à ce moment qu’on passe d’une représentation numérique complexe à une image visible",[0,0,3.14+3.14/2+3.14]); // oui je n'ai pas récouvert les court pour les radiant
addArrow("ImgToEncod",idToObject.get("outLoop"),idToObject.get("Decodeur1"),0xff3255,"Valeur transmise",0.2);
addCubeWithImageFace("Sorti_img","img/step9.jpeg",[45,0,0],"Imgage de sortie",0,0x888888,1,10,10);
addArrow("ImgToEncod",idToObject.get("Decodeur1"),new THREE.Vector3(45,0,0),0xff3255,"Valeur transmise",0.3);
//******

//embeding 55555555
addCubeWithImageFace("embed","img/emb.jpeg",[-65,10,0],"phrase qui vont guider la génération",4,0x888888,30,2,1);
addObject("TextEncodeur", new THREE.ConeGeometry(2, 2.5, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.7 }), [-45, 10, 0], "Cet encodeur transforme une phrase ou un mot en une suite de nombres qui représente son sens. L’IA peut ensuite utiliser cette version chiffrée pour comparer, associer ou répondre.",[0,0,3.14+3.14/2]);
addArrow("ImgToEncod",new THREE.Vector3(-50,10,0),idToObject.get("TextEncodeur"),0xff3255,"Valeur transmise",0.3);
addObject(
    "MatEmbeding",
    new THREE.BoxGeometry(5, 5, 5),
    new THREE.MeshBasicMaterial({ color: 0x88569, opacity: 0.7, transparent: true }),
    [-10,10 , 0],
    "La matrice d’embedding permet de convertir chaque mot (ou token) en une suite de nombres qui capture son sens. Grâce à cette transformation, des mots qui ont un sens proche auront aussi des vecteurs proches. Cela aide l’IA à comprendre le lien entre les mots.\nC’est un genre de dictionnaire intelligent : au lieu de donner une définition avec des mots, il donne une suite de nombres qui décrit le sens du mot. Par exemple, les mots 'chat' et 'chien' auront des nombres similaires car ils sont liés"
  );

  addArrow("embArrow", idToObject.get("TextEncodeur"), idToObject.get("MatEmbeding"), 0xff3255, 
  "Les données d'entrée textuelles passent par l'encodeur de texte et sont transformées en vecteurs via la matrice d'embedding, capturant le sens des mots.", 0.2);

addArrow("embArrow1", idToObject.get("MatEmbeding"), idToObject.get("enc0_2"), 0x8*68549, 
  "Les vecteurs d'embedding sont envoyés vers la première couche d'encodeur (encodeur) pour être traités.", 0.1);

addArrow("embArrow2", idToObject.get("MatEmbeding"), idToObject.get("enc1_1"), 0x8*68549, 
  "Les vecteurs d'embedding sont envoyés à la couche suivante (encodeur) de l'encodeur pour un traitement supplémentaire.", 0.1);

addArrow("embArrow3", idToObject.get("MatEmbeding"), idToObject.get("enc2_1"), 0x8*68549, 
  "Les données issues de la matrice d'embedding sont envoyées à la couche encodeur pour être traitées.", 0.1);

addArrow("embArrow4", idToObject.get("MatEmbeding"), idToObject.get("enc3_1"), 0x8*68549, 
  "Les vecteurs d'embedding continuent leur propagation à travers la couche encodeur de l'encodeur.", 0.1);

addArrow("embArrow5", idToObject.get("MatEmbeding"), idToObject.get("dec3_1"), 0x8*68549, 
  "Les données traitées par l'encodeur sont transmises à la première couche du décodeur (decodeur) pour leur reconstruction.", 0.1);

addArrow("embArrow6", idToObject.get("MatEmbeding"), idToObject.get("dec2_1"), 0x8*68549, 
  "La propagation continue vers la couche suivante du décodeur (decodeur).", 0.1);

addArrow("embArrow7", idToObject.get("MatEmbeding"), idToObject.get("dec1_0"), 0x8*68549, 
  "Enfin, les données passent à travers la dernière couche du décodeur (decodeur) pour la finalisation du processus.", 0.1);



// 55555555

// pré visualisation TTTTTTTTTTTTTTTTTTTTTTTTTt
addCubeWithImageFace("preVisu","img/step0.jpeg",[30,13,0],"visualisation de la représentaion dans 'espace interne",4,0x999999,17,17,1);
addArrow("arrowPrevu",idToObject.get("outLoop"),new THREE.Vector3(30,5,0),0xff00ff,"dans l'espace l'attend",0.3)

// Lancer le slider d’images sur le cube "monCube", face 4 (avant)
const stopSlider = startImageSlider("preVisu", imagesList, 4, 11500);

// Optionnel : arrêter le slider après 15 secondes

//TTTTTTTTTTTTTTTTTTTTTT

const fullPath = [
    "enc0_0", "enc0_1", "enc0_2",
    "enc1_0", "enc1_1", "enc1_2",
    "enc2_0", "enc2_1", "enc2_2",
    "enc3_0", "enc3_1", "enc3_2",
    "dec3_0", "dec3_1", "dec3_2",
    "dec2_0", "dec2_1", "dec2_2",
    "dec1_0", "dec1_1", "dec1_2", "dec1_3",
    "outLoop"
  ];
  
  // Lancer l'effet "highlight + mouvement"
  highlightSequence2(fullPath, 500, 0.2, 0.1);
  

// Détection de la souris
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const infoText = document.getElementById("infoText");



function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();

    // Convertir les coordonnées de la souris en normalisées (-1 à 1)
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Lancer le raycasting sur tous les objets
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        const obj = intersects[0].object;
        infoText.innerText = objectInfo.get(obj) || "Objet inconnu";
    } else {
        infoText.innerText = "Survolez un élément pour voir les détails.";
    }
}
function checkOrientation() {
    const rotateMessage = document.getElementById("rotateMessage");

    const isPortrait = window.innerHeight > window.innerWidth;
    const isSmallScreen = window.innerWidth < 700; // seuil que tu peux ajuster (ex : < 800, < 1000…)

    if (isPortrait && isSmallScreen) {
        rotateMessage.style.display = "flex";
    } else {
        rotateMessage.style.display = "none";
    }
}

window.addEventListener('load', checkOrientation);
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', checkOrientation);


// Ajouter l'écouteur d'événement
window.addEventListener('mousemove', onMouseMove);



// Animation
const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
};

animate();

// Gestion du redimensionnement de l'écran
window.addEventListener('resize', () => {
    camera.aspect = (window.innerWidth * 0.8) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.8, window.innerHeight);
});
