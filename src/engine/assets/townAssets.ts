import * as THREE from 'three';
import {
  addBox,
  addMesh,
  createTextTexture,
  getEmissiveMaterial,
  getMaterial
} from './materials';
import { createAwning, createFlowerBox } from './cafeAssets';

/** Background village architecture seen across the cobbled street. */

const PALETTES = [
  { wall: '#e8ccaa', trim: '#c9a35c', shutter: '#3f6b4f', roof: '#a84d36' },
  { wall: '#d9a77d', trim: '#efe0c8', shutter: '#37605a', roof: '#8f4130' },
  { wall: '#e7dcc9', trim: '#b9804f', shutter: '#6b4932', roof: '#b0563d' },
  { wall: '#c98e72', trim: '#f0dfc5', shutter: '#3d6153', roof: '#93422f' },
  { wall: '#efd7ae', trim: '#9b6a3f', shutter: '#4a6f56', roof: '#a34b34' }
];

function windowUnit(
  parent: THREE.Object3D,
  width: number,
  height: number,
  trimColor: string,
  shutterColor: string,
  glassColor: string = '#27363d'
): THREE.Group {
  const g = new THREE.Group();
  const trim = getMaterial(trimColor, 0.85, 0.02);
  const shutter = getMaterial(shutterColor, 0.9, 0.01);
  const glass = new THREE.MeshStandardMaterial({
    color: new THREE.Color(glassColor),
    roughness: 0.18,
    metalness: 0.3,
    emissive: new THREE.Color('#2d3b3b'),
    emissiveIntensity: 0.12
  });
  addBox(g, width + 0.18, height + 0.18, 0.08, trim, 0, 0, 0, 0.02);
  addBox(g, width, height, 0.06, glass, 0, 0, 0.06, 0.01);
  addBox(g, 0.035, height, 0.07, trim, 0, 0, 0.1, 0.008);
  addBox(g, width, 0.035, 0.07, trim, 0, 0, 0.1, 0.008);
  addBox(g, 0.055, height + 0.1, 0.05, shutter, -width / 2 - 0.14, 0, 0.04, 0.01);
  addBox(g, 0.055, height + 0.1, 0.05, shutter, width / 2 + 0.14, 0, 0.04, 0.01);
  // Louver slats
  for (let i = 0; i < 4; i++) {
    addBox(g, 0.11, 0.025, 0.012, trim, -width / 2 - 0.14, -height / 2 + 0.12 + i * (height / 5), 0.07, 0.004);
    addBox(g, 0.11, 0.025, 0.012, trim, width / 2 + 0.14, -height / 2 + 0.12 + i * (height / 5), 0.07, 0.004);
  }
  g.userData.glass = glass;
  parent.add(g);
  return g;
}

export function createTownHouse(variant: number, signText?: string): THREE.Group {
  const palette = PALETTES[Math.abs(variant) % PALETTES.length];
  const group = new THREE.Group();
  const width = 5.2 + (variant % 2) * 0.7;
  const depth = 4.4;
  const height = 5.0 + (variant % 3) * 0.55;
  const roofHeight = 1.9;
  const wallMat = getMaterial(palette.wall, 0.94, 0.01);
  const trimMat = getMaterial(palette.trim, 0.84, 0.02);
  const stoneMat = getMaterial('#b6a58b', 0.95, 0.01);
  const roofMat = getMaterial(palette.roof, 0.9, 0.01);
  const doorMat = getMaterial('#65432b', 0.9, 0.02);

  addBox(group, width + 0.3, 0.35, depth + 0.3, stoneMat, 0, 0.175, 0, 0.04, { receive: true });
  addBox(group, width, height, depth, wallMat, 0, height / 2 + 0.3, 0, 0.06, { cast: true, receive: true });

  // Corner quoins
  [-1, 1].forEach(side => {
    for (let i = 0; i < 6; i++) {
      addBox(group, 0.35, 0.36, 0.24, trimMat, side * (width / 2 - 0.02), 0.7 + i * 0.65, depth / 2 + 0.01, 0.02);
    }
  });

  // Roof slopes
  const angle = Math.atan2(roofHeight, width / 2);
  const slope = Math.sqrt((width / 2) ** 2 + roofHeight ** 2) + 0.35;
  const leftRoof = addBox(group, slope, 0.2, depth + 0.9, roofMat, -width / 4, height + roofHeight / 2 + 0.3, 0, 0.05, {
    rotZ: angle,
    cast: true
  });
  const rightRoof = addBox(group, slope, 0.2, depth + 0.9, roofMat, width / 4, height + roofHeight / 2 + 0.3, 0, 0.05, {
    rotZ: -angle,
    cast: true
  });
  leftRoof.receiveShadow = true;
  rightRoof.receiveShadow = true;

  // Gable triangle on the street facade
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 - 0.15, 0);
  shape.lineTo(width / 2 + 0.15, 0);
  shape.lineTo(0, roofHeight);
  shape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: false });
  addMesh(group, gableGeo, wallMat, 0, height + 0.3, depth / 2 - 0.2);
  addMesh(group, gableGeo.clone(), wallMat, 0, height + 0.3, -depth / 2 - 0.02);

  // Ridge and chimney
  addMesh(group, new THREE.CylinderGeometry(0.09, 0.09, depth + 0.9, 8), roofMat, 0, height + roofHeight + 0.32, 0, {
    rotX: Math.PI / 2
  });
  addBox(group, 0.45, 1.2, 0.45, stoneMat, width * 0.28, height + roofHeight * 0.7 + 0.3, -0.7, 0.03);
  addBox(group, 0.6, 0.12, 0.6, trimMat, width * 0.28, height + roofHeight * 0.7 + 0.95, -0.7, 0.02);

  // Windows
  const frontZ = depth / 2 + 0.05;
  [-width * 0.26, width * 0.26].forEach(x => {
    const lower = windowUnit(group, 0.8, 1.0, palette.trim, palette.shutter);
    lower.position.set(x, 2.05, frontZ);
    const flower = createFlowerBox(0.95);
    flower.position.set(x, 1.45, frontZ + 0.17);
    group.add(flower);
  });
  [-width * 0.28, 0, width * 0.28].forEach(x => {
    const upper = windowUnit(group, 0.68, 0.88, palette.trim, palette.shutter, '#33434a');
    upper.position.set(x, height - 1.0, frontZ);
    if (variant % 2 === 1) {
      const flower = createFlowerBox(0.8);
      flower.position.set(x, height - 1.55, frontZ + 0.15);
      group.add(flower);
    }
  });

  // Front door recess and steps
  addBox(group, 1.08, 2.15, 0.14, trimMat, 0, 1.36, frontZ, 0.04);
  addBox(group, 0.86, 1.95, 0.1, doorMat, 0, 1.28, frontZ + 0.08, 0.02);
  addBox(group, 0.06, 0.32, 0.06, getMaterial('#c9a35c', 0.35, 0.6), 0.24, 1.2, frontZ + 0.15, 0.01);
  addMesh(group, new THREE.SphereGeometry(0.035, 6, 5), getMaterial('#c9a35c', 0.3, 0.6), 0.26, 1.25, frontZ + 0.17);
  addBox(group, 1.5, 0.14, 0.55, stoneMat, 0, 0.38, frontZ + 0.32, 0.02);
  addBox(group, 1.2, 0.14, 0.45, stoneMat, 0, 0.25, frontZ + 0.46, 0.02);

  // Shop awning and sign
  if (signText) {
    const awning = createAwning(2.9, 1.05, palette.wall === '#e8ccaa' ? '#f4ead4' : '#efe1c5', palette.roof);
    awning.position.set(0, 2.6, frontZ + 0.42);
    group.add(awning);

    const texture = createTextTexture(signText, {
      width: 512,
      height: 144,
      background: '#2f3b34',
      foreground: '#f5e3bd',
      border: palette.trim,
      fontSize: 76
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.62), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }));
    sign.position.set(0, 3.05, frontZ + 0.72);
    group.add(sign);
  }

  // Balcony for the taller houses
  if (variant % 3 === 2) {
    addBox(group, width * 0.62, 0.14, 0.8, stoneMat, 0, height - 2.05, frontZ + 0.35, 0.03);
    for (let i = 0; i < 9; i++) {
      addBox(group, 0.045, 0.55, 0.045, getMaterial('#3a3631', 0.6, 0.4), -width * 0.28 + i * (width * 0.56 / 8), height - 1.72, frontZ + 0.7, 0.008);
    }
    addBox(group, width * 0.62, 0.06, 0.06, getMaterial('#3a3631', 0.6, 0.4), 0, height - 1.44, frontZ + 0.7, 0.012);
    addBox(group, width * 0.62, 0.06, 0.06, getMaterial('#3a3631', 0.6, 0.4), 0, height - 1.8, frontZ + 0.7, 0.012);
  }

  // Small wall lantern with a warm bulb
  addBox(group, 0.09, 0.18, 0.09, getMaterial('#2f2b27', 0.5, 0.5), width * 0.42, 3.0, frontZ + 0.1, 0.01);
  addMesh(group, new THREE.SphereGeometry(0.08, 7, 6), getEmissiveMaterial('#ffd18b', 1.6, '#5f4a2a'), width * 0.42, 2.92, frontZ + 0.12);

  return group;
}

export function createBellTower(): THREE.Group {
  const group = new THREE.Group();
  const stoneMat = getMaterial('#d6c3a1', 0.95, 0.01);
  const trimMat = getMaterial('#b9a17e', 0.9, 0.02);
  const darkMat = getMaterial('#3b3a35', 0.9, 0.01);
  const roofMat = getMaterial('#9b4934', 0.9, 0.01);
  const metalMat = getMaterial('#b18d52', 0.4, 0.6);

  addBox(group, 3.7, 0.4, 3.7, trimMat, 0, 0.2, 0, 0.04);
  addBox(group, 3.2, 9.2, 3.2, stoneMat, 0, 4.8, 0, 0.06, { cast: true });
  addBox(group, 3.6, 0.35, 3.6, trimMat, 0, 9.45, 0, 0.03);

  // Blind arches and slit windows
  [2.2, 4.1, 6.0].forEach(y => {
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(rot => {
      const arch = addBox(group, 0.55, 1.2, 0.1, darkMat, 0, 0, 0, 0.03);
      arch.position.set(Math.sin(rot) * 1.62, y, Math.cos(rot) * 1.62);
      arch.rotation.y = rot;
    });
  });

  // Open belfry
  [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(rot => {
    const opening = addBox(group, 1.3, 2.0, 0.2, darkMat, 0, 10.4, 0, 0.03);
    opening.position.set(Math.sin(rot) * 1.62, 10.4, Math.cos(rot) * 1.62);
    opening.rotation.y = rot;
    const column = addBox(group, 0.22, 2.4, 0.22, trimMat, 0, 10.4, 0, 0.03);
    column.position.set(Math.sin(rot + Math.PI / 4) * 1.7, 10.4, Math.cos(rot + Math.PI / 4) * 1.7);
  });
  addBox(group, 4.0, 0.3, 4.0, trimMat, 0, 11.55, 0, 0.03);
  addMesh(group, new THREE.ConeGeometry(2.6, 2.6, 4), roofMat, 0, 13.0, 0, { rotY: Math.PI / 4, cast: true });
  addMesh(group, new THREE.SphereGeometry(0.22, 10, 8), metalMat, 0, 14.4, 0);
  addBox(group, 0.08, 0.8, 0.08, metalMat, 0, 14.9, 0, 0.01);
  addBox(group, 0.45, 0.08, 0.08, metalMat, 0, 15.05, 0, 0.01);

  // Clock face
  const clockFace = addMesh(group, new THREE.CylinderGeometry(0.62, 0.62, 0.08, 20), getMaterial('#efe3c8', 0.7, 0.02), 0, 8.2, 1.63, {
    rotX: Math.PI / 2
  });
  clockFace.rotation.z = 0;
  addBox(group, 0.05, 0.38, 0.03, darkMat, 0, 8.35, 1.69, 0.01);
  addBox(group, 0.27, 0.05, 0.03, darkMat, 0.12, 8.2, 1.69, 0.01);

  return group;
}
