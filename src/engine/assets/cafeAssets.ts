import * as THREE from 'three';
import {
  addBox,
  addMesh,
  createChalkboardTexture,
  createTextTexture,
  getEmissiveMaterial,
  getMaterial
} from './materials';

/**
 * Café furniture and kitchen set-dressing. These builders all face +Z unless
 * noted, which makes it easy to arrange the open-front bistro in the scene.
 */

export function createPizzaOven(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = getMaterial('#b8a68d', 0.95, 0.02);
  const darkStoneMat = getMaterial('#8e7e69', 0.95, 0.02);
  const brickMat = getMaterial('#a14b36', 0.92, 0.02);
  const mortarMat = getMaterial('#d4b795', 0.98, 0);
  const woodMat = getMaterial('#7b5432', 0.9, 0.02);
  const fireMat = getEmissiveMaterial('#ff7b25', 2.4, '#64250e');
  const ashMat = getMaterial('#2f2b28', 1, 0);

  // Stone plinth and masonry body
  addBox(group, 2.6, 0.22, 2.35, stoneMat, 0, 0.11, 0, 0.05, { receive: true, cast: true });
  addBox(group, 2.2, 1.05, 2.0, darkStoneMat, 0, 0.72, 0, 0.08, { receive: true, cast: true });

  // Brick courses on the front face
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      const offset = row % 2 === 0 ? 0 : 0.105;
      addBox(
        group,
        0.19,
        0.18,
        0.045,
        col % 3 === 0 ? brickMat : getMaterial('#b05a40', 0.94, 0.01),
        -0.99 + col * 0.21 + offset,
        1.13 - row * 0.2,
        1.015,
        0.025
      );
    }
  }

  // Arched mouth
  addBox(group, 0.92, 0.56, 0.08, ashMat, 0, 0.63, 1.03, 0.04);
  const arch = addMesh(group, new THREE.TorusGeometry(0.46, 0.11, 6, 18, Math.PI), brickMat, 0, 0.89, 1.045);
  arch.scale.set(1, 0.78, 1);
  for (let i = 0; i < 7; i++) {
    const angle = (i / 6) * Math.PI;
    addBox(group, 0.11, 0.18, 0.09, i % 2 ? brickMat : mortarMat, Math.cos(angle) * 0.46, 0.89 + Math.sin(angle) * 0.36, 1.055, 0.02, {
      rotZ: angle - Math.PI / 2
    });
  }

  // Hearth ledge
  addBox(group, 2.45, 0.12, 2.2, stoneMat, 0, 1.25, 0.04, 0.04, { cast: true, receive: true });

  // Dome (hemisphere), with subtle brick bands
  const dome = addMesh(
    group,
    new THREE.SphereGeometry(1.05, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    brickMat,
    0,
    1.28,
    -0.02,
    { scaleY: 0.78, cast: true }
  );
  dome.receiveShadow = true;
  [0.4, 0.72, 1.0].forEach((r, i) => {
    addMesh(group, new THREE.TorusGeometry(r, 0.022, 4, 24), getMaterial('#8d3f2d', 0.9, 0.01), 0, 1.36 + i * 0.21, -0.02, {
      rotX: Math.PI / 2
    });
  });

  // Chimney and terracotta cap
  addMesh(group, new THREE.CylinderGeometry(0.23, 0.29, 1.25, 10), brickMat, 0, 2.45, -0.52, { cast: true });
  addBox(group, 0.72, 0.12, 0.72, stoneMat, 0, 3.06, -0.52, 0.04);
  addMesh(group, new THREE.CylinderGeometry(0.3, 0.22, 0.22, 10), getMaterial('#7e3b2c', 0.9, 0.01), 0, 3.18, -0.52);

  // Fire, logs, and a baking pizza
  addBox(group, 0.7, 0.08, 0.5, getMaterial('#5b3a22', 1, 0), 0, 0.36, 1.0, 0.015);
  for (let i = 0; i < 3; i++) {
    addMesh(group, new THREE.CylinderGeometry(0.045, 0.055, 0.52, 6), woodMat, -0.2 + i * 0.2, 0.43, 0.92, {
      rotZ: Math.PI / 2,
      rotY: 0.2
    });
  }
  addBox(group, 0.5, 0.06, 0.06, fireMat, 0, 0.5, 1.0, 0.01);
  addBox(group, 0.3, 0.16, 0.04, fireMat, 0, 0.57, 1.0, 0.01);
  const pizza = addMesh(group, new THREE.CylinderGeometry(0.3, 0.3, 0.035, 16), getMaterial('#e8c07b', 0.9, 0), 0, 1.27, 0.58);
  addMesh(pizza, new THREE.CylinderGeometry(0.24, 0.24, 0.02, 14), getMaterial('#bb3e2e', 0.9, 0), 0, 0.025, 0);
  [0.1, -0.08].forEach((x, i) => {
    addMesh(pizza, new THREE.SphereGeometry(0.045, 6, 5), getMaterial('#f3e3c3', 0.9, 0), x, 0.025, i ? -0.06 : 0.06);
  });

  // Warm hearth light
  const fireLight = new THREE.PointLight(0xff8a3d, 2.2, 4.4, 2);
  fireLight.position.set(0, 0.8, 1.25);
  group.add(fireLight);
  group.userData.fireLight = fireLight;

  // Wood pile at the side
  for (let i = 0; i < 4; i++) {
    addMesh(group, new THREE.CylinderGeometry(0.06, 0.07, 0.66, 7), woodMat, 1.42, 0.13 + (i % 2) * 0.12, 0.2 + Math.floor(i / 2) * 0.16, {
      rotZ: Math.PI / 2
    });
  }

  // Pizza peel leaning against the oven
  const peel = new THREE.Group();
  addBox(peel, 0.055, 0.9, 0.055, woodMat, 0, 0.45, 0, 0.015);
  addMesh(peel, new THREE.CylinderGeometry(0.24, 0.24, 0.035, 12), woodMat, 0, 0.94, 0);
  peel.position.set(-1.28, 0, 0.75);
  peel.rotation.z = 0.14;
  peel.rotation.x = -0.12;
  group.add(peel);

  // Enamel plaque above the mouth
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.26),
    new THREE.MeshStandardMaterial({ map: createTextTexture('FORNO', { width: 512, height: 160, background: '#543427', foreground: '#f1d9a8', fontSize: 78 }), roughness: 0.7 })
  );
  sign.position.set(0, 1.58, 1.02);
  group.add(sign);

  return group;
}

export function createPrepCounter(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = getMaterial('#895d38', 0.9, 0.02);
  const darkWoodMat = getMaterial('#5d3d24', 0.92, 0.02);
  const stoneMat = getMaterial('#e7dfcd', 0.55, 0.05);
  const steelMat = getMaterial('#b9c1c6', 0.28, 0.78);
  const ironMat = getMaterial('#2e2b27', 0.5, 0.6);
  const greenMat = getMaterial('#4d7c3a', 0.9, 0);
  const tomatoMat = getMaterial('#cf3a32', 0.5, 0.02);
  const cheeseMat = getMaterial('#f2e5b8', 0.8, 0);
  const doughMat = getMaterial('#ead7ad', 0.9, 0);

  addBox(group, 2.8, 0.86, 1.18, woodMat, 0, 0.43, 0, 0.06, { cast: true, receive: true });
  addBox(group, 2.92, 0.12, 1.28, stoneMat, 0, 0.95, 0, 0.035, { cast: true, receive: true });
  addBox(group, 2.86, 0.07, 1.22, darkWoodMat, 0, 0.12, 0, 0.03);

  // Cabinet doors and iron knobs
  [-0.72, 0.72].forEach(x => {
    addBox(group, 1.15, 0.62, 0.04, darkWoodMat, x, 0.48, 0.61, 0.03);
    addBox(group, 0.035, 0.07, 0.045, ironMat, x + (x > 0 ? -0.48 : 0.48), 0.48, 0.64, 0.01);
  });

  // Cutting board and dough
  addBox(group, 0.92, 0.07, 0.58, getMaterial('#c99c62', 0.92, 0), -0.58, 1.05, 0.05, 0.025, { rotY: 0.06 });
  addMesh(group, new THREE.SphereGeometry(0.19, 9, 7), doughMat, -0.65, 1.13, 0.04, { scaleY: 0.5 });
  addMesh(group, new THREE.SphereGeometry(0.13, 8, 6), doughMat, -0.4, 1.12, 0.14, { scaleY: 0.45 });
  addBox(group, 0.38, 0.035, 0.24, steelMat, -0.9, 1.11, -0.23, 0.01, { rotY: -0.25 });
  addBox(group, 0.16, 0.055, 0.07, darkWoodMat, -0.63, 1.12, -0.33, 0.015, { rotY: -0.25 });

  // Tomato bowl
  const bowlMat = getMaterial('#345c73', 0.7, 0.05);
  addMesh(group, new THREE.CylinderGeometry(0.32, 0.2, 0.16, 12), bowlMat, 0.2, 1.08, 0.13);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    addMesh(group, new THREE.SphereGeometry(0.085, 7, 6), tomatoMat, 0.2 + Math.cos(angle) * 0.13, 1.16, 0.13 + Math.sin(angle) * 0.13);
  }

  // Cheese wheel, basil pot, flour sack
  addMesh(group, new THREE.CylinderGeometry(0.22, 0.24, 0.12, 12), cheeseMat, 0.82, 1.08, 0.12);
  addMesh(group, new THREE.CylinderGeometry(0.24, 0.2, 0.08, 10), getMaterial('#b75c3b', 0.9, 0), 0.82, 1.16, 0.12);
  addMesh(group, new THREE.CylinderGeometry(0.16, 0.13, 0.24, 10), getMaterial('#b86b4a', 0.9, 0), -1.1, 1.17, 0.18);
  for (let i = 0; i < 5; i++) {
    addMesh(group, new THREE.SphereGeometry(0.075, 6, 5), greenMat, -1.1 + (Math.random() - 0.5) * 0.16, 1.32 + i * 0.025, 0.18 + (Math.random() - 0.5) * 0.14, {
      scaleX: 1.2,
      scaleY: 0.7
    });
  }
  const sack = addMesh(group, new THREE.CylinderGeometry(0.22, 0.18, 0.45, 9), getMaterial('#d7c7a3', 1, 0), 0.95, 1.3, -0.33);
  sack.rotation.z = 0.08;

  // Hanging rail with copper utensils
  addMesh(group, new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6), ironMat, 0, 2.32, -0.42, { rotZ: Math.PI / 2 });
  const copperMat = getMaterial('#b46b3d', 0.45, 0.55);
  [-1.05, -0.62, 0.35, 0.86].forEach((x, i) => {
    addMesh(group, new THREE.SphereGeometry(0.11, 7, 5), copperMat, x, 2.12, -0.41, { scaleY: 1.4 });
    addMesh(group, new THREE.SphereGeometry(i % 2 ? 0.08 : 0.1, 7, 5), copperMat, x + 0.05, 2.06, -0.41, { scaleX: 1.3, scaleY: 0.6 });
  });

  // Herb pots on the counter edge
  [1.18, 1.35].forEach((x, i) => {
    addMesh(group, new THREE.CylinderGeometry(0.1, 0.08, 0.16, 8), getMaterial('#b96748', 0.9, 0), x, 1.08, -0.4 + i * 0.15);
    for (let j = 0; j < 4; j++) {
      addMesh(group, new THREE.SphereGeometry(0.06, 6, 5), greenMat, x + (Math.random() - 0.5) * 0.1, 1.2 + j * 0.03, -0.4 + i * 0.15 + (Math.random() - 0.5) * 0.08);
    }
  });

  return group;
}

export function createServingCounter(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = getMaterial('#7c5230', 0.9, 0.02);
  const darkWoodMat = getMaterial('#533620', 0.92, 0.02);
  const stoneMat = getMaterial('#eee4cf', 0.5, 0.05);
  const brassMat = getMaterial('#c9a35c', 0.35, 0.7);
  const ironMat = getMaterial('#2e2b27', 0.5, 0.6);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xd7eef5, roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.32 });

  addBox(group, 3.35, 0.94, 1.2, woodMat, 0, 0.47, 0, 0.06, { cast: true, receive: true });
  addBox(group, 3.48, 0.13, 1.3, stoneMat, 0, 1.0, 0, 0.04, { cast: true, receive: true });
  addBox(group, 3.2, 0.08, 1.05, darkWoodMat, 0, 0.92, 0, 0.03);
  addBox(group, 3.28, 0.06, 1.16, brassMat, 0, 0.86, 0, 0.02);

  // Arched front panels
  [-1.05, 0, 1.05].forEach(x => {
    addBox(group, 0.92, 0.56, 0.04, darkWoodMat, x, 0.5, 0.62, 0.05);
    addBox(group, 0.77, 0.4, 0.03, getMaterial('#8f613a', 0.9, 0), x, 0.5, 0.645, 0.02);
    addMesh(group, new THREE.SphereGeometry(0.035, 6, 5), brassMat, x, 0.5, 0.67);
  });

  // Display dome with a pizza
  addMesh(group, new THREE.CylinderGeometry(0.4, 0.43, 0.08, 16), darkWoodMat, -0.95, 1.1, 0.12);
  const dome = addMesh(group, new THREE.SphereGeometry(0.4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassMat, -0.95, 1.14, 0.12);
  dome.scale.y = 0.78;
  const displayPizza = addMesh(group, new THREE.CylinderGeometry(0.31, 0.31, 0.05, 16), getMaterial('#e7c07d', 0.9, 0), -0.95, 1.18, 0.12);
  addMesh(displayPizza, new THREE.CylinderGeometry(0.26, 0.26, 0.02, 16), getMaterial('#ba3d2e', 0.9, 0), 0, 0.03, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    addMesh(displayPizza, new THREE.SphereGeometry(0.04, 6, 5), getMaterial('#f1dfba', 0.9, 0), Math.cos(a) * 0.14, 0.04, Math.sin(a) * 0.14);
  }

  // Brass service bell
  const bell = new THREE.Group();
  addMesh(bell, new THREE.CylinderGeometry(0.15, 0.18, 0.05, 12), brassMat, 0, 0.02, 0);
  addMesh(bell, new THREE.SphereGeometry(0.135, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), brassMat, 0, 0.04, 0, { scaleY: 0.85 });
  addMesh(bell, new THREE.SphereGeometry(0.035, 8, 6), brassMat, 0, 0.18, 0);
  bell.position.set(0.02, 1.08, 0.23);
  group.add(bell);

  // Register
  const register = new THREE.Group();
  addBox(register, 0.52, 0.4, 0.42, getMaterial('#3a3d42', 0.45, 0.25), 0, 0.25, 0, 0.04);
  addBox(register, 0.38, 0.24, 0.24, getMaterial('#202227', 0.3, 0.3), 0, 0.57, -0.03, 0.03);
  addBox(register, 0.3, 0.16, 0.015, new THREE.MeshStandardMaterial({ color: 0x7cd6c5, emissive: 0x2e9d88, emissiveIntensity: 0.7, roughness: 0.25 }), 0, 0.58, 0.1, 0.01);
  for (let i = 0; i < 9; i++) {
    addBox(register, 0.075, 0.035, 0.03, getMaterial('#d4c9ad', 0.8, 0), -0.15 + (i % 3) * 0.15, 0.35 + Math.floor(i / 3) * 0.055, 0.22, 0.008);
  }
  register.position.set(1.15, 1.03, -0.05);
  register.rotation.y = -0.12;
  group.add(register);

  // Tip jar, napkins, cups and menu stand
  addMesh(group, new THREE.CylinderGeometry(0.14, 0.12, 0.26, 10), glassMat, 0.63, 1.2, -0.33);
  [0.1, 0.2, 0.02].forEach((y, i) => addMesh(group, new THREE.CylinderGeometry(0.07, 0.07, 0.02, 10), brassMat, 0.63 + (i % 2) * 0.03, 1.12 + y, -0.33));
  addBox(group, 0.2, 0.18, 0.15, getMaterial('#f2ead8', 0.9, 0), -0.35, 1.16, -0.35, 0.02);
  addMesh(group, new THREE.CylinderGeometry(0.1, 0.13, 0.1, 10), getMaterial('#f7f0e3', 0.8, 0), -0.1, 1.1, -0.35);
  for (let i = 0; i < 4; i++) {
    addMesh(group, new THREE.CylinderGeometry(0.095 - i * 0.006, 0.105 - i * 0.006, 0.005, 12), getMaterial('#fff8ed', 0.8, 0), -0.1, 1.16 + i * 0.012, -0.35);
  }
  const menuTex = createTextTexture('MENU', { width: 384, height: 512, background: '#27372f', foreground: '#f1dfba', fontSize: 80, subtitle: 'pizza · caffè' });
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshStandardMaterial({ map: menuTex, roughness: 0.8 }));
  menu.position.set(-1.38, 1.26, -0.26);
  menu.rotation.x = -0.12;
  group.add(menu);

  // Pendant lamps over the counter
  for (let i = 0; i < 3; i++) {
    addMesh(group, new THREE.CylinderGeometry(0.018, 0.018, 0.7, 6), ironMat, -1.0 + i, 2.75, -0.16);
    addMesh(group, new THREE.ConeGeometry(0.18, 0.16, 10, 1, true), brassMat, -1.0 + i, 2.38, -0.16, { rotX: Math.PI });
    addMesh(group, new THREE.SphereGeometry(0.075, 8, 6), getEmissiveMaterial('#ffd297', 1.6, '#584225'), -1.0 + i, 2.31, -0.16);
  }

  // Lower shelf with pizza boxes and towels
  addBox(group, 2.9, 0.05, 0.72, darkWoodMat, 0, 0.38, 0.14, 0.02);
  for (let i = 0; i < 3; i++) {
    addBox(group, 0.5, 0.11, 0.5, getMaterial('#c7a774', 0.95, 0), -0.9 + i * 0.58, 0.48 + i * 0.02, 0.12, 0.02, { rotY: i * 0.08 });
  }
  addBox(group, 0.32, 0.14, 0.24, getMaterial('#d7cab1', 0.95, 0), 1.0, 0.48, 0.16, 0.02, { rotY: 0.2 });

  return group;
}

export interface EspressoBarBuild {
  group: THREE.Group;
  steamAnchor: THREE.Object3D;
}

export function createEspressoBar(): EspressoBarBuild {
  const group = new THREE.Group();
  const woodMat = getMaterial('#7a4e2f', 0.9, 0.02);
  const darkWoodMat = getMaterial('#4e321f', 0.92, 0.02);
  const stoneMat = getMaterial('#ded4c1', 0.55, 0.05);
  const chromeMat = getMaterial('#c7d0d4', 0.22, 0.85, false, 1, false);
  const ironMat = getMaterial('#292725', 0.5, 0.55);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xd7eef5, roughness: 0.08, metalness: 0.12, transparent: true, opacity: 0.3 });
  const creamMat = getMaterial('#f4ecd9', 0.8, 0);
  const brassMat = getMaterial('#c9a35c', 0.35, 0.7);

  addBox(group, 2.0, 0.9, 0.92, woodMat, 0, 0.45, 0, 0.06, { cast: true, receive: true });
  addBox(group, 2.12, 0.12, 1.02, stoneMat, 0, 0.96, 0, 0.035, { cast: true, receive: true });
  addBox(group, 1.94, 0.06, 0.88, darkWoodMat, 0, 0.83, 0, 0.025);
  addBox(group, 1.6, 0.56, 0.04, darkWoodMat, 0, 0.48, 0.47, 0.03);
  addBox(group, 1.44, 0.4, 0.03, getMaterial('#8b5c36', 0.9, 0), 0, 0.48, 0.495, 0.02);
  addBox(group, 1.3, 0.05, 0.76, darkWoodMat, 0, 0.2, 0, 0.02);

  // Espresso machine
  const machine = new THREE.Group();
  addBox(machine, 0.72, 0.42, 0.48, chromeMat, 0, 0.26, 0, 0.06, { cast: true });
  addBox(machine, 0.55, 0.12, 0.36, getMaterial('#2b2c2f', 0.4, 0.4), 0, 0.5, 0.03, 0.03);
  addMesh(machine, new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12), brassMat, -0.23, 0.58, 0.12, { rotX: Math.PI / 2 });
  addMesh(machine, new THREE.CylinderGeometry(0.085, 0.085, 0.04, 12), brassMat, 0.22, 0.58, 0.12, { rotX: Math.PI / 2 });
  addBox(machine, 0.18, 0.05, 0.05, ironMat, -0.23, 0.42, 0.24, 0.01);
  addBox(machine, 0.18, 0.05, 0.05, ironMat, 0.22, 0.42, 0.24, 0.01);
  addBox(machine, 0.07, 0.26, 0.07, chromeMat, 0.39, 0.3, 0.12, 0.02, { rotZ: 0.16 });
  addMesh(machine, new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12), getMaterial('#efe7d6', 0.04, 0.1), -0.23, 0.14, 0.29, { rotX: Math.PI / 2 });
  addMesh(machine, new THREE.CylinderGeometry(0.055, 0.055, 0.02, 12), getMaterial('#efe7d6', 0.04, 0.1), 0.22, 0.14, 0.29, { rotX: Math.PI / 2 });
  machine.position.set(-0.3, 1.02, 0.02);
  group.add(machine);

  // Coffee grinder
  const grinder = new THREE.Group();
  addBox(grinder, 0.22, 0.3, 0.22, ironMat, 0, 0.15, 0, 0.04);
  addMesh(grinder, new THREE.CylinderGeometry(0.12, 0.16, 0.24, 10), glassMat, 0, 0.42, 0);
  addMesh(grinder, new THREE.CylinderGeometry(0.13, 0.13, 0.05, 10), brassMat, 0, 0.56, 0);
  addMesh(grinder, new THREE.SphereGeometry(0.05, 8, 6), darkWoodMat, 0, 0.63, 0);
  grinder.position.set(0.58, 1.02, -0.05);
  group.add(grinder);

  // Pastry display case
  addBox(group, 0.72, 0.3, 0.5, darkWoodMat, 0.46, 1.15, 0.16, 0.03);
  addMesh(group, new THREE.BoxGeometry(0.68, 0.34, 0.46), glassMat, 0.46, 1.42, 0.16);
  addBox(group, 0.6, 0.035, 0.4, getMaterial('#b98a54', 0.8, 0), 0.46, 1.27, 0.16, 0.01);
  [-0.2, 0, 0.2].forEach((x, i) => {
    addMesh(group, new THREE.TorusGeometry(0.09, 0.035, 5, 8, Math.PI), getMaterial('#c6924d', 0.9, 0), 0.46 + x, 1.32, 0.16, {
      rotZ: i % 2 ? 0.2 : -0.2
    });
  });

  // Cup stack and small plant
  for (let i = 0; i < 4; i++) {
    addMesh(group, new THREE.CylinderGeometry(0.055, 0.045, 0.07, 10), creamMat, -0.78, 1.08 + i * 0.045, 0.26);
  }
  addMesh(group, new THREE.CylinderGeometry(0.1, 0.08, 0.18, 8), getMaterial('#b96a4a', 0.9, 0), 0.84, 1.13, 0.36);
  for (let i = 0; i < 5; i++) {
    addMesh(group, new THREE.SphereGeometry(0.075, 6, 5), getMaterial('#4f7d3b', 0.9, 0), 0.84 + (Math.random() - 0.5) * 0.15, 1.27 + i * 0.025, 0.36 + (Math.random() - 0.5) * 0.12);
  }

  // Suspended chalkboard + little canopy
  const signTex = createTextTexture('CAFFÈ', { width: 384, height: 192, background: '#27372f', foreground: '#f1dfba', fontSize: 76, subtitle: 'espresso bar' });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.8 }));
  sign.position.set(0, 2.02, 0.27);
  sign.rotation.x = -0.08;
  group.add(sign);

  const steamAnchor = new THREE.Object3D();
  steamAnchor.position.set(-0.3, 1.5, 0.26);
  group.add(steamAnchor);

  // Striped awning above the cart
  const awning = createAwning(2.5, 1.25, '#f4ead4', '#b5523b');
  awning.position.set(0, 2.55, 0.12);
  group.add(awning);
  addBox(group, 0.07, 2.55, 0.07, ironMat, -1.15, 1.28, -0.35, 0.02);
  addBox(group, 0.07, 2.55, 0.07, ironMat, 1.15, 1.28, -0.35, 0.02);

  // Flower box attached to the front
  const flowers = createFlowerBox(1.3, '#b5523b');
  flowers.position.set(0, 0.72, 0.5);
  group.add(flowers);

  return { group, steamAnchor };
}

export function createAwning(width: number, depth: number, colorA: string, colorB: string): THREE.Group {
  const group = new THREE.Group();
  const stripes = 10;
  const stripeWidth = width / stripes;
  const matA = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorA), roughness: 0.85, side: THREE.DoubleSide });
  const matB = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorB), roughness: 0.85, side: THREE.DoubleSide });
  for (let i = 0; i < stripes; i++) {
    addMesh(
      group,
      new THREE.BoxGeometry(stripeWidth - 0.006, 0.035, depth),
      i % 2 === 0 ? matA : matB,
      -width / 2 + stripeWidth / 2 + i * stripeWidth,
      0,
      0,
      { rotX: -0.18 }
    );
  }
  // Scalloped valance at the front edge
  for (let i = 0; i < stripes; i++) {
    addMesh(
      group,
      new THREE.SphereGeometry(stripeWidth * 0.5, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      i % 2 === 0 ? matA : matB,
      -width / 2 + stripeWidth / 2 + i * stripeWidth,
      -0.035,
      depth / 2 - 0.03,
      { rotX: Math.PI / 2, scaleY: 0.42, scaleZ: 0.36 }
    );
  }
  return group;
}

export function createPatioUmbrella(primary: string = '#f1e4c8', secondary: string = '#b5523b'): THREE.Group {
  const group = new THREE.Group();
  const poleMat = getMaterial('#6d4a2b', 0.85, 0.05);
  addMesh(group, new THREE.CylinderGeometry(0.045, 0.055, 2.7, 8), poleMat, 0, 1.35, 0);
  addMesh(group, new THREE.CylinderGeometry(0.26, 0.34, 0.08, 12), poleMat, 0, 0.04, 0);

  const matA = new THREE.MeshStandardMaterial({ color: new THREE.Color(primary), roughness: 0.85, side: THREE.DoubleSide });
  const matB = new THREE.MeshStandardMaterial({ color: new THREE.Color(secondary), roughness: 0.85, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    addMesh(
      group,
      new THREE.ConeGeometry(1.65, 0.52, 8, 1, true, i * (Math.PI / 4), Math.PI / 4),
      i % 2 === 0 ? matA : matB,
      0,
      2.55,
      0
    );
  }
  addMesh(group, new THREE.SphereGeometry(0.075, 8, 6), poleMat, 0, 2.86, 0);
  return group;
}

export function createDiningTable(options: { terrace?: boolean; umbrella?: boolean } = {}): THREE.Group {
  const group = new THREE.Group();
  const woodMat = getMaterial('#815632', 0.9, 0.02);
  const darkWoodMat = getMaterial('#4f3420', 0.92, 0.02);
  const ironMat = getMaterial('#35312c', 0.55, 0.5);
  const clothMat = getMaterial(options.terrace ? '#f0e2c8' : '#e8ddc7', 0.96, 0);
  const accentMat = getMaterial('#b5523b', 0.9, 0.02);
  const plateMat = getMaterial('#f6efe2', 0.35, 0.1);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xcfe6e8, roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.4 });
  const leafMat = getMaterial('#4d7a3d', 0.9, 0);

  addMesh(group, new THREE.CylinderGeometry(0.84, 0.88, 0.09, 18), woodMat, 0, 0.77, 0, { cast: true, receive: true });
  addMesh(group, new THREE.CylinderGeometry(0.7, 0.72, 0.035, 18), clothMat, 0, 0.835, 0);
  addMesh(group, new THREE.CylinderGeometry(0.1, 0.14, 0.7, 10), darkWoodMat, 0, 0.38, 0);
  addMesh(group, new THREE.CylinderGeometry(0.4, 0.46, 0.07, 14), darkWoodMat, 0, 0.04, 0);
  addMesh(group, new THREE.CylinderGeometry(0.08, 0.08, 0.05, 10), getMaterial('#c9a35c', 0.4, 0.4), 0, 0.86, 0);

  // Place settings
  [-0.42, 0.42].forEach((z, index) => {
    addMesh(group, new THREE.CylinderGeometry(0.21, 0.21, 0.022, 16), plateMat, 0, 0.872, z);
    addMesh(group, new THREE.CylinderGeometry(0.15, 0.15, 0.012, 16), getMaterial(index === 0 ? '#d7b25d' : '#f2e4c0', 0.8, 0), 0, 0.887, z);
    addBox(group, 0.02, 0.02, 0.22, getMaterial('#c0c5c9', 0.3, 0.7), 0.29, 0.88, z, 0.005, { rotY: Math.PI / 2 });
    addBox(group, 0.02, 0.02, 0.22, getMaterial('#c0c5c9', 0.3, 0.7), -0.29, 0.88, z, 0.005, { rotY: Math.PI / 2 });
    addMesh(group, new THREE.CylinderGeometry(0.055, 0.04, 0.15, 10), glassMat, 0.52, 0.93, z + 0.04);
    if (index === 0) {
      addMesh(group, new THREE.CylinderGeometry(0.035, 0.035, 0.16, 8), accentMat, -0.52, 0.94, z);
      addMesh(group, new THREE.SphereGeometry(0.04, 7, 5), getEmissiveMaterial('#ffd391', 1.8, '#5a3f22'), -0.52, 1.05, z);
    }
  });

  // Flower vase
  addMesh(group, new THREE.CylinderGeometry(0.075, 0.06, 0.18, 9), getMaterial('#8fa8a2', 0.6, 0.05), 0, 0.97, 0);
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    addBox(group, 0.014, 0.17, 0.014, leafMat, Math.cos(angle) * 0.06, 1.08, Math.sin(angle) * 0.06, 0.005, { rotZ: Math.cos(angle) * 0.25 });
    addMesh(group, new THREE.SphereGeometry(0.045, 6, 5), getMaterial(i === 0 ? '#d45a4a' : '#e7b04b', 0.8, 0), Math.cos(angle) * 0.09, 1.16, Math.sin(angle) * 0.09);
  }

  // Two chairs exactly at the seating offsets used by the simulation.
  [-1.08, 1.08].forEach((x, index) => {
    const chair = new THREE.Group();
    addBox(chair, 0.48, 0.075, 0.46, woodMat, 0, 0.49, 0, 0.03, { cast: true });
    addBox(chair, 0.42, 0.055, 0.4, getMaterial('#d7c3a1', 0.95, 0), 0, 0.535, 0, 0.02);
    addBox(chair, 0.46, 0.52, 0.065, woodMat, 0, 0.78, -0.23, 0.03, { rotX: -0.08, cast: true });
    addBox(chair, 0.37, 0.34, 0.035, darkWoodMat, 0, 0.8, -0.265, 0.02, { rotX: -0.08 });
    [-0.18, 0.18].forEach(lx => {
      [-0.17, 0.17].forEach(lz => {
        addBox(chair, 0.045, 0.48, 0.045, ironMat, lx, 0.25, lz, 0.012);
      });
    });
    // East chair faces west, west chair faces east.
    chair.position.set(x, 0, 0);
    chair.rotation.y = index === 0 ? Math.PI / 2 : -Math.PI / 2;
    group.add(chair);
  });

  if (options.terrace || options.umbrella) {
    const umbrella = createPatioUmbrella(options.terrace ? '#f4ead4' : '#f1e4c8', options.terrace ? '#b5523b' : '#2a9d8f');
    group.add(umbrella);
  }

  return group;
}

export function createFlowerBox(width: number = 1.4, boxColor: string = '#a95c42'): THREE.Group {
  const group = new THREE.Group();
  const boxMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(boxColor), roughness: 0.92 });
  const leafMat = getMaterial('#4f7d3b', 0.9, 0);
  addBox(group, width, 0.22, 0.3, boxMat, 0, 0, 0, 0.035);
  addBox(group, width - 0.08, 0.04, 0.24, getMaterial('#6a4329', 0.95, 0), 0, 0.11, 0, 0.01);
  const flowerColors = ['#d84f4a', '#e9a83c', '#f1e4c8', '#a55c93', '#e66d5a'];
  const count = Math.max(5, Math.round(width * 7));
  for (let i = 0; i < count; i++) {
    const x = -width / 2 + 0.1 + Math.random() * (width - 0.2);
    const z = (Math.random() - 0.5) * 0.18;
    addMesh(group, new THREE.SphereGeometry(0.055, 6, 5), leafMat, x, 0.16 + Math.random() * 0.06, z, { scaleY: 0.7 });
    addMesh(
      group,
      new THREE.SphereGeometry(0.045, 6, 5),
      getMaterial(flowerColors[Math.floor(Math.random() * flowerColors.length)], 0.8, 0),
      x + (Math.random() - 0.5) * 0.04,
      0.22 + Math.random() * 0.1,
      z + (Math.random() - 0.5) * 0.04
    );
  }
  return group;
}

export function createChalkboardMenu(title: string, lines: string[]): THREE.Group {
  const group = new THREE.Group();
  const woodMat = getMaterial('#7a5230', 0.9, 0.02);
  const boardMat = new THREE.MeshStandardMaterial({ map: createChalkboardTexture(title, lines), roughness: 0.82 });
  addMesh(group, new THREE.BoxGeometry(0.9, 1.18, 0.06), woodMat, 0, 0.66, 0.04, { rotX: 0.16, cast: true });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 1.03), boardMat);
  board.position.set(0, 0.66, 0.078);
  board.rotation.x = 0.16;
  group.add(board);
  addBox(group, 0.08, 1.3, 0.08, woodMat, -0.45, 0.65, -0.1, 0.02, { rotX: -0.16 });
  addBox(group, 0.08, 1.3, 0.08, woodMat, 0.45, 0.65, -0.1, 0.02, { rotX: -0.16 });
  addBox(group, 0.95, 0.07, 0.08, woodMat, 0, 1.22, 0.06, 0.02);
  return group;
}

/* ------------------------------------------------------------------ */
/* Farm & garden                                                       */
/* ------------------------------------------------------------------ */

const CROP_FRUIT: Record<string, string> = {
  tomato: '#d63b31',
  basil: '#4f8b46',
  bell_pepper: '#d9a426',
  mushroom: '#b58c6d',
  wheat: '#d6b25f'
};

export function createFarmPlot(state: string, cropId: string | null, progress: number, isWatered: boolean): THREE.Group {
  const group = new THREE.Group();
  const timberMat = getMaterial('#6b4a2f', 0.92, 0.02);
  const ironMat = getMaterial('#342d26', 0.55, 0.45);
  const size = 2.0;
  const border = 0.14;

  // Rounded sleepers, with iron corner brackets.
  addBox(group, size, 0.22, border, timberMat, 0, 0.11, -size / 2, 0.04, { cast: true, receive: true });
  addBox(group, size, 0.22, border, timberMat, 0, 0.11, size / 2, 0.04, { cast: true, receive: true });
  addBox(group, border, 0.22, size, timberMat, -size / 2, 0.11, 0, 0.04, { cast: true, receive: true });
  addBox(group, border, 0.22, size, timberMat, size / 2, 0.11, 0, 0.04, { cast: true, receive: true });
  [
    [-0.92, -0.92], [0.92, -0.92], [-0.92, 0.92], [0.92, 0.92]
  ].forEach(([x, z]) => addBox(group, 0.11, 0.13, 0.11, ironMat, x, 0.2, z, 0.02));

  let soilColor = '#6b4c34';
  if (state === 'tilled') soilColor = '#4b2f20';
  if (isWatered) soilColor = '#332116';
  const soilMat = getMaterial(soilColor, isWatered ? 0.45 : 0.96, 0.02);
  addBox(group, size - 0.2, 0.17, size - 0.2, soilMat, 0, 0.1, 0, 0.02, { receive: true });

  if (state === 'empty') {
    // A few stray pebbles and a wooden trowel make empty plots feel lived-in.
    const pebbleMat = getMaterial('#a89779', 0.9, 0);
    for (let i = 0; i < 6; i++) {
      addMesh(group, new THREE.DodecahedronGeometry(0.045 + Math.random() * 0.035, 0), pebbleMat, (Math.random() - 0.5) * 1.4, 0.21, (Math.random() - 0.5) * 1.4, {
        scaleY: 0.55
      });
    }
    return group;
  }

  if (state === 'tilled') {
    const furrowMat = getMaterial('#3c271b', 1, 0);
    for (let z = -0.62; z <= 0.62; z += 0.31) {
      addMesh(group, new THREE.CylinderGeometry(0.075, 0.09, size - 0.45, 6), furrowMat, 0, 0.22, z, { rotZ: Math.PI / 2 });
      addBox(group, size - 0.55, 0.028, 0.05, getMaterial('#2b1a12', 1, 0), 0, 0.235, z - 0.11, 0.01);
    }
    return group;
  }

  const stemMat = getMaterial('#416b35', 0.9, 0);
  const leafMat = getMaterial('#5d8d48', 0.88, 0);
  const fruitMat = getMaterial(CROP_FRUIT[cropId ?? 'tomato'] ?? '#d63b31', 0.55, 0.02);
  const ripe = state === 'ready' || progress >= 0.999;
  const fruitScale = Math.max(0.15, Math.min(1, progress));

  const offsets = [
    { x: -0.48, z: -0.48 },
    { x: 0.48, z: -0.48 },
    { x: -0.48, z: 0.48 },
    { x: 0.48, z: 0.48 }
  ];

  offsets.forEach((offset, index) => {
    const plant = new THREE.Group();
    plant.position.set(offset.x, 0.19, offset.z);
    const wobble = (index - 1.5) * 0.03;

    if (progress < 0.3) {
      addMesh(plant, new THREE.ConeGeometry(0.1, 0.24, 5), stemMat, 0, 0.12, 0);
      addMesh(plant, new THREE.SphereGeometry(0.11, 6, 4), leafMat, 0.02, 0.16, 0, { scaleX: 1.3, scaleY: 0.45 });
    } else if (cropId === 'wheat') {
      for (let i = 0; i < 6; i++) {
        const x = (Math.random() - 0.5) * 0.34;
        const z = (Math.random() - 0.5) * 0.34;
        addMesh(plant, new THREE.CylinderGeometry(0.012, 0.018, 0.7 + Math.random() * 0.3, 4), stemMat, x, 0.38, z);
        addMesh(plant, new THREE.CylinderGeometry(0.035, 0.01, 0.18, 5), fruitMat, x, 0.78, z, { scaleY: fruitScale });
      }
    } else if (cropId === 'mushroom') {
      addMesh(plant, new THREE.CylinderGeometry(0.07, 0.1, 0.22, 8), getMaterial('#e8dcc8', 0.9, 0), 0, 0.13, 0);
      addMesh(plant, new THREE.SphereGeometry(0.18, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), fruitMat, 0, 0.26, 0, {
        scaleY: 0.55 * fruitScale
      });
      for (let i = 0; i < 4; i++) {
        addMesh(plant, new THREE.SphereGeometry(0.025, 5, 4), getMaterial('#f7efdc', 0.8, 0), (Math.random() - 0.5) * 0.24, 0.3, (Math.random() - 0.5) * 0.2);
      }
    } else if (cropId === 'basil') {
      addMesh(plant, new THREE.CylinderGeometry(0.035, 0.05, 0.42, 6), stemMat, 0, 0.22, 0);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        addMesh(plant, new THREE.SphereGeometry(0.12, 6, 4), leafMat, Math.cos(angle) * 0.12, 0.36 + i * 0.035, Math.sin(angle) * 0.12, {
          scaleX: 1.4,
          scaleY: 0.55
        });
      }
    } else if (cropId === 'bell_pepper') {
      addMesh(plant, new THREE.CylinderGeometry(0.04, 0.06, 0.52, 6), stemMat, 0, 0.26, 0);
      addMesh(plant, new THREE.SphereGeometry(0.26, 7, 5), leafMat, 0.02, 0.46, 0, { scaleX: 1.3, scaleY: 0.7 });
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        addMesh(plant, new THREE.SphereGeometry(0.1 * fruitScale + 0.03, 7, 5), fruitMat, Math.cos(angle) * 0.17, 0.42 + i * 0.08, Math.sin(angle) * 0.17, {
          scaleY: 1.2
        });
      }
    } else {
      addMesh(plant, new THREE.CylinderGeometry(0.04, 0.06, 0.62, 6), stemMat, 0, 0.32, 0);
      addMesh(plant, new THREE.SphereGeometry(0.24, 7, 5), leafMat, 0.02, 0.56, 0, { scaleX: 1.25, scaleY: 0.7 });
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        addMesh(plant, new THREE.SphereGeometry(0.095 * fruitScale + 0.02, 8, 6), fruitMat, Math.cos(angle) * 0.17, 0.5 + i * 0.07, Math.sin(angle) * 0.17);
      }
    }

    plant.position.y += wobble;
    group.add(plant);
  });

  if (ripe) {
    const ringMat = getMaterial('#ffd76a', 0.4, 0.1, true, 0.55);
    addMesh(group, new THREE.TorusGeometry(0.82, 0.025, 4, 30), ringMat, 0, 1.12, 0, { rotX: Math.PI / 2 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      addMesh(group, new THREE.OctahedronGeometry(0.06, 0), getEmissiveMaterial('#ffe29a', 1.4, '#8a6b2a'), Math.cos(a) * 0.7, 0.85 + Math.sin(a * 2) * 0.18, Math.sin(a) * 0.7);
    }
  }

  return group;
}

export function createLanternPost(): { group: THREE.Group; light: THREE.PointLight } {
  const group = new THREE.Group();
  const ironMat = getMaterial('#2d2b28', 0.5, 0.55);
  const woodMat = getMaterial('#67482e', 0.9, 0);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xffe0a0, roughness: 0.1, metalness: 0.05, transparent: true, opacity: 0.3 });

  addMesh(group, new THREE.CylinderGeometry(0.2, 0.25, 0.15, 8), ironMat, 0, 0.075, 0);
  addMesh(group, new THREE.CylinderGeometry(0.07, 0.1, 2.7, 8), ironMat, 0, 1.43, 0);
  addMesh(group, new THREE.CylinderGeometry(0.115, 0.115, 0.08, 8), woodMat, 0, 1.1, 0);
  addMesh(group, new THREE.CylinderGeometry(0.115, 0.115, 0.08, 8), woodMat, 0, 2.36, 0);
  addBox(group, 0.5, 0.06, 0.06, ironMat, 0.21, 2.72, 0, 0.01);
  addMesh(group, new THREE.CylinderGeometry(0.02, 0.02, 0.28, 6), ironMat, 0.43, 2.58, 0);
  addBox(group, 0.08, 0.07, 0.08, ironMat, 0.43, 2.44, 0, 0.01);

  const lantern = new THREE.Group();
  addBox(lantern, 0.28, 0.36, 0.28, glassMat, 0, 0, 0, 0.04);
  [-0.16, 0.16].forEach(x => {
    addBox(lantern, 0.045, 0.38, 0.045, ironMat, x, 0, 0.14, 0.008);
    addBox(lantern, 0.045, 0.38, 0.045, ironMat, x, 0, -0.14, 0.008);
  });
  addBox(lantern, 0.3, 0.06, 0.3, ironMat, 0, 0.21, 0, 0.015);
  addMesh(lantern, new THREE.ConeGeometry(0.25, 0.18, 4), ironMat, 0, 0.32, 0, { rotY: Math.PI / 4 });
  addMesh(lantern, new THREE.SphereGeometry(0.075, 8, 6), getEmissiveMaterial('#ffd38a', 2.2, '#6d5125'), 0, 0, 0);
  lantern.position.set(0.43, 2.22, 0);
  group.add(lantern);

  const light = new THREE.PointLight(0xffc978, 1.5, 6.5, 2);
  light.position.set(0.43, 2.22, 0);
  group.add(light);
  group.userData.lampLight = light;

  // A little planter at the base.
  addMesh(group, new THREE.CylinderGeometry(0.25, 0.2, 0.24, 8), getMaterial('#a95c42', 0.9, 0), 0, 0.14, 0);
  for (let i = 0; i < 5; i++) {
    addMesh(group, new THREE.SphereGeometry(0.1, 6, 4), getMaterial('#4f7d3b', 0.9, 0), (Math.random() - 0.5) * 0.24, 0.3 + Math.random() * 0.1, (Math.random() - 0.5) * 0.24, {
      scaleY: 0.8
    });
  }

  return { group, light };
}

export function createSprinkler(): { group: THREE.Group; spinner: THREE.Mesh } {
  const group = new THREE.Group();
  const brassMat = getMaterial('#b88a48', 0.35, 0.65);
  const ironMat = getMaterial('#4b4741', 0.5, 0.5);
  addMesh(group, new THREE.CylinderGeometry(0.06, 0.09, 0.7, 8), brassMat, 0, 0.35, 0);
  addMesh(group, new THREE.CylinderGeometry(0.18, 0.22, 0.08, 10), ironMat, 0, 0.04, 0);
  const spinner = addMesh(group, new THREE.CylinderGeometry(0.3, 0.3, 0.05, 10), brassMat, 0, 0.75, 0);
  [0.2, -0.2].forEach(angle => {
    addMesh(spinner, new THREE.CylinderGeometry(0.03, 0.05, 0.2, 6), brassMat, Math.cos(angle) * 0.34, 0, Math.sin(angle) * 0.34, { rotZ: Math.PI / 2 });
    addMesh(spinner, new THREE.SphereGeometry(0.055, 6, 5), brassMat, Math.cos(angle) * 0.44, 0, Math.sin(angle) * 0.44);
  });
  addMesh(group, new THREE.SphereGeometry(0.08, 8, 6), getMaterial('#7f5a2d', 0.4, 0.6), 0, 0.82, 0);
  return { group, spinner };
}

export function createPlanterPot(): THREE.Group {
  const group = new THREE.Group();
  const potMat = getMaterial('#a95c42', 0.92, 0);
  const soilMat = getMaterial('#463022', 1, 0);
  const leafMat = getMaterial('#557d43', 0.9, 0);
  const rosemaryMat = getMaterial('#6f8f54', 0.9, 0);
  addMesh(group, new THREE.CylinderGeometry(0.38, 0.3, 0.42, 10), potMat, 0, 0.21, 0);
  addMesh(group, new THREE.CylinderGeometry(0.4, 0.38, 0.07, 10), potMat, 0, 0.44, 0);
  addMesh(group, new THREE.CylinderGeometry(0.34, 0.34, 0.03, 10), soilMat, 0, 0.47, 0);
  for (let i = 0; i < 9; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.25;
    addBox(group, 0.025, 0.4 + Math.random() * 0.3, 0.025, i % 2 ? rosemaryMat : leafMat, Math.cos(a) * r, 0.68, Math.sin(a) * r, 0.005, {
      rotZ: (Math.random() - 0.5) * 0.4
    });
    addMesh(group, new THREE.SphereGeometry(0.055, 5, 4), i % 3 === 0 ? getMaterial('#e4b65c', 0.8, 0) : leafMat, Math.cos(a) * r * 1.4, 0.78 + Math.random() * 0.12, Math.sin(a) * r * 1.4, {
      scaleX: 1.2
    });
  }
  return group;
}

/* ------------------------------------------------------------------ */
/* Buildable showpieces                                                */
/* ------------------------------------------------------------------ */

export function createOlivePlanter(): THREE.Group {
  const group = new THREE.Group();
  const potMat = getMaterial('#a95c42', 0.92, 0);
  const rimMat = getMaterial('#874533', 0.92, 0);
  const soilMat = getMaterial('#463022', 1, 0);
  const trunkMat = getMaterial('#766044', 0.95, 0.01);
  const leafMats = [
    getMaterial('#6f8a5e', 0.92, 0),
    getMaterial('#7d9769', 0.92, 0),
    getMaterial('#617a53', 0.92, 0)
  ];

  addMesh(group, new THREE.CylinderGeometry(0.36, 0.28, 0.58, 12), potMat, 0, 0.3, 0, { cast: true, receive: true });
  addMesh(group, new THREE.CylinderGeometry(0.43, 0.37, 0.1, 12), rimMat, 0, 0.61, 0, { cast: true });
  addMesh(group, new THREE.CylinderGeometry(0.35, 0.35, 0.035, 12), soilMat, 0, 0.66, 0);
  addMesh(group, new THREE.CylinderGeometry(0.08, 0.14, 0.82, 7), trunkMat, 0.02, 1.05, 0, { cast: true });

  const branches: Array<[number, number, number, number, number]> = [
    [0.25, 1.4, 0.06, 0.28, -0.18],
    [-0.24, 1.52, -0.05, -0.32, 0.14],
    [0.06, 1.58, 0.22, 0.18, 0.35]
  ];
  branches.forEach(([x, y, z, rotZ, rotX]) => {
    addMesh(group, new THREE.CylinderGeometry(0.035, 0.065, 0.55, 6), trunkMat, x, y, z, { rotZ, rotX, cast: true });
  });

  const clusters: Array<[number, number, number, number]> = [
    [0, 1.95, 0, 0.5],
    [-0.38, 1.84, 0.12, 0.36],
    [0.4, 1.88, 0.08, 0.38],
    [0.08, 1.8, -0.36, 0.34],
    [-0.12, 1.82, 0.4, 0.33],
    [0.28, 1.6, -0.24, 0.29],
    [-0.25, 1.62, -0.28, 0.28],
    [0.06, 2.16, 0.1, 0.3]
  ];
  clusters.forEach(([x, y, z, radius], index) => {
    addMesh(group, new THREE.IcosahedronGeometry(radius, 0), leafMats[index % leafMats.length], x, y, z, {
      scaleY: 0.72,
      rotY: index * 0.63,
      cast: index < 4
    });
  });
  for (let i = 0; i < 7; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.22 + Math.random() * 0.28;
    addMesh(group, new THREE.SphereGeometry(0.045, 6, 5), getMaterial('#353d25', 0.9, 0), Math.cos(angle) * radius, 1.75 + Math.random() * 0.4, Math.sin(angle) * radius);
  }
  return group;
}

export function createFlowerCart(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = getMaterial('#8a5c36', 0.9, 0.02);
  const darkWoodMat = getMaterial('#573a22', 0.92, 0.02);
  const ironMat = getMaterial('#3c3832', 0.55, 0.45);
  const leafMat = getMaterial('#4f7d3b', 0.9, 0);
  const crateMat = getMaterial('#a77644', 0.94, 0);
  const flowerColors = ['#d84f4a', '#e9a83c', '#f1e4c8', '#b0619c', '#e66d5a', '#f0c75e'];

  addBox(group, 1.62, 0.16, 0.86, woodMat, 0, 0.78, 0, 0.035, { cast: true, receive: true });
  addBox(group, 1.72, 0.1, 0.94, darkWoodMat, 0, 0.68, 0, 0.025, { cast: true });
  addBox(group, 1.62, 0.3, 0.06, woodMat, 0, 0.59, 0.43, 0.02);
  addBox(group, 1.62, 0.3, 0.06, woodMat, 0, 0.59, -0.43, 0.02);
  addBox(group, 0.06, 0.3, 0.82, woodMat, 0.8, 0.59, 0, 0.02);
  addBox(group, 0.06, 0.3, 0.82, woodMat, -0.8, 0.59, 0, 0.02);

  [-0.82, 0.82].forEach(x => {
    addMesh(group, new THREE.TorusGeometry(0.34, 0.055, 6, 16), ironMat, x, 0.38, 0.08, {
      rotY: Math.PI / 2,
      cast: true
    });
    addMesh(group, new THREE.CylinderGeometry(0.075, 0.075, 0.12, 10), getMaterial('#b88a48', 0.4, 0.6), x, 0.38, 0.08, {
      rotZ: Math.PI / 2
    });
    for (let i = 0; i < 4; i++) {
      addBox(group, 0.028, 0.56, 0.028, darkWoodMat, x, 0.38, 0.08, 0.006, {
        rotX: (i / 4) * Math.PI,
        rotY: Math.PI / 2
      });
    }
  });

  [-0.55, 0.55].forEach(x => {
    addBox(group, 0.07, 0.07, 1.08, woodMat, x, 0.69, 0.92, 0.02, { rotX: -0.08, cast: true });
  });

  const awning = createAwning(1.9, 1.0, '#f4ead4', '#2a9d8f');
  awning.position.set(0, 2.22, 0);
  group.add(awning);
  [
    [-0.78, -0.38], [0.78, -0.38],
    [-0.78, 0.38], [0.78, 0.38]
  ].forEach(([x, z]) => {
    addBox(group, 0.07, 1.35, 0.07, darkWoodMat, x, 1.52, z, 0.012, { cast: true });
  });
  addBox(group, 1.76, 0.06, 0.06, darkWoodMat, 0, 2.18, -0.43, 0.01);
  addBox(group, 1.76, 0.06, 0.06, darkWoodMat, 0, 2.18, 0.43, 0.01);

  [-0.5, 0, 0.5].forEach((x, crateIndex) => {
    addBox(group, 0.42, 0.23, 0.4, crateMat, x, 0.94, -0.04, 0.02);
    addBox(group, 0.34, 0.035, 0.33, getMaterial('#51361f', 1, 0), x, 1.065, -0.04, 0.01);
    const stemCount = crateIndex === 1 ? 8 : 6;
    for (let i = 0; i < stemCount; i++) {
      const sx = x + (Math.random() - 0.5) * 0.3;
      const sz = -0.04 + (Math.random() - 0.5) * 0.26;
      const height = 0.28 + Math.random() * 0.34;
      addBox(group, 0.018, height, 0.018, leafMat, sx, 1.08 + height / 2, sz, 0.004, {
        rotZ: (Math.random() - 0.5) * 0.2
      });
      addMesh(group, new THREE.SphereGeometry(0.06, 6, 5), getMaterial(flowerColors[(i + crateIndex * 2) % flowerColors.length], 0.82, 0), sx, 1.09 + height, sz, {
        scaleY: 0.8
      });
      addMesh(group, new THREE.SphereGeometry(0.03, 5, 4), getMaterial('#e8c45c', 0.7, 0), sx + 0.035, 1.1 + height, sz + 0.02);
    }
  });

  // A tiny hanging price board makes the cart feel like a real market stall.
  const board = addBox(group, 0.55, 0.36, 0.04, darkWoodMat, 0.48, 1.9, 0.48, 0.02, { rotX: 0.08 });
  board.castShadow = true;
  addBox(group, 0.43, 0.026, 0.012, getMaterial('#f1e4c9', 0.75, 0), 0.48, 1.99, 0.507, 0.004, { rotX: 0.08 });
  addBox(group, 0.3, 0.018, 0.012, getMaterial('#f1e4c9', 0.75, 0), 0.48, 1.91, 0.503, 0.004, { rotX: 0.08 });
  addBox(group, 0.36, 0.018, 0.012, getMaterial('#f1e4c9', 0.75, 0), 0.48, 1.84, 0.499, 0.004, { rotX: 0.08 });

  return group;
}

export function createCourtyardFountain(): { group: THREE.Group; water: THREE.Mesh; jet: THREE.Mesh } {
  const group = new THREE.Group();
  const stoneMat = getMaterial('#cdbc9e', 0.92, 0.02);
  const darkStoneMat = getMaterial('#a38f70', 0.96, 0.01);
  const trimMat = getMaterial('#b8a481', 0.7, 0.12);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x62b2bd,
    roughness: 0.06,
    metalness: 0.18,
    transparent: true,
    opacity: 0.7
  });
  const jetMat = new THREE.MeshStandardMaterial({
    color: 0xd5f3f6,
    transparent: true,
    opacity: 0.38,
    roughness: 0.04
  });

  addMesh(group, new THREE.CylinderGeometry(1.34, 1.42, 0.26, 16), darkStoneMat, 0, 0.13, 0, { cast: true, receive: true });
  addMesh(group, new THREE.CylinderGeometry(1.22, 1.28, 0.44, 16), stoneMat, 0, 0.42, 0, { cast: true, receive: true });
  addMesh(group, new THREE.TorusGeometry(1.24, 0.075, 6, 28), trimMat, 0, 0.66, 0, { rotX: Math.PI / 2 });
  const water = addMesh(group, new THREE.CircleGeometry(1.16, 24), waterMat, 0, 0.6, 0, { rotX: -Math.PI / 2 });
  addMesh(group, new THREE.CylinderGeometry(0.24, 0.32, 0.95, 10), stoneMat, 0, 1.06, 0, { cast: true });
  addMesh(group, new THREE.CylinderGeometry(0.58, 0.36, 0.16, 14), stoneMat, 0, 1.55, 0, { cast: true });
  addMesh(group, new THREE.TorusGeometry(0.57, 0.045, 5, 20), trimMat, 0, 1.64, 0, { rotX: Math.PI / 2 });
  addMesh(group, new THREE.CylinderGeometry(0.1, 0.14, 0.5, 8), stoneMat, 0, 1.86, 0, { cast: true });
  addMesh(group, new THREE.SphereGeometry(0.12, 10, 7), trimMat, 0, 2.14, 0);

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(angle) * 0.64;
    const z = Math.sin(angle) * 0.64;
    addMesh(group, new THREE.SphereGeometry(0.11, 8, 6), darkStoneMat, x, 1.46, z);
    addMesh(group, new THREE.CylinderGeometry(0.015, 0.022, 0.4, 5), jetMat, x, 1.23, z, {
      rotZ: Math.cos(angle) * 0.65,
      rotX: Math.sin(angle) * 0.65
    });
  }

  const jet = addMesh(group, new THREE.ConeGeometry(0.12, 0.62, 8, 1, true), jetMat, 0, 2.36, 0);
  jet.rotation.x = Math.PI;

  const rippleMat = new THREE.MeshBasicMaterial({
    color: 0xd8f6f8,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  [0.45, 0.82].forEach(radius => {
    addMesh(group, new THREE.RingGeometry(radius, radius + 0.035, 32), rippleMat, 0, 0.612, 0, { rotX: -Math.PI / 2 });
  });

  group.userData.water = water;
  group.userData.jet = jet;
  return { group, water, jet };
}
