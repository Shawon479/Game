import * as THREE from 'three';
import { addBox, addMesh, getMaterial } from './materials';

/** Tuscan countryside greenery: olives, cypress, lavender, flowers and rocks. */

export function createCypressTree(): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = getMaterial('#5a4029', 0.95, 0.02);
  const darkMat = getMaterial('#37543a', 0.95, 0);
  const midMat = getMaterial('#46674a', 0.95, 0);
  const lightMat = getMaterial('#557951', 0.95, 0);

  addMesh(group, new THREE.CylinderGeometry(0.1, 0.16, 1.1, 7), trunkMat, 0, 0.55, 0, { cast: true });
  const layers: Array<[number, number, number, number, THREE.MeshStandardMaterial]> = [
    [1.1, 1.7, 0.52, 0, darkMat],
    [1.8, 1.65, 0.47, 0.05, midMat],
    [2.5, 1.55, 0.41, -0.04, midMat],
    [3.2, 1.35, 0.34, 0.03, lightMat],
    [3.85, 1.1, 0.27, -0.02, lightMat],
    [4.4, 0.75, 0.18, 0, lightMat]
  ];
  layers.forEach(([y, h, r, x, mat], index) => {
    const cone = addMesh(group, new THREE.ConeGeometry(r, h, 8), mat, x, y, 0, {
      rotY: index * 0.35,
      cast: index < 3
    });
    if (index % 2 === 1) cone.position.z = (Math.random() - 0.5) * 0.08;
  });
  addMesh(group, new THREE.ConeGeometry(0.2, 0.5, 6), lightMat, 0, 4.8, 0);
  return group;
}

export function createOliveTree(): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = getMaterial('#766044', 0.95, 0.01);
  const leafMats = [
    getMaterial('#6f8a5e', 0.92, 0, false, 1, true),
    getMaterial('#7d9769', 0.92, 0, false, 1, true),
    getMaterial('#617a53', 0.92, 0, false, 1, true)
  ];

  addMesh(group, new THREE.CylinderGeometry(0.18, 0.28, 1.55, 8), trunkMat, 0, 0.78, 0, { cast: true });
  const branches: Array<[number, number, number, number, number]> = [
    [0.45, 1.75, 0.2, 0.37, 0.15],
    [-0.4, 1.8, 0.1, -0.35, 0.1],
    [0.05, 1.95, -0.35, 0.08, -0.3],
    [0.15, 1.55, 0.45, 0.2, 0.4]
  ];
  branches.forEach(([x, y, z, tiltX, tiltZ]) => {
    addMesh(group, new THREE.CylinderGeometry(0.06, 0.11, 0.75, 6), trunkMat, x * 0.5, y, z * 0.5, {
      rotX: tiltX,
      rotZ: tiltZ,
      cast: true
    });
  });

  const clusters: Array<[number, number, number, number]> = [
    [0, 2.55, 0, 0.95], [-0.7, 2.35, 0.18, 0.72], [0.8, 2.4, 0.12, 0.8],
    [0.15, 2.25, -0.75, 0.68], [-0.1, 2.3, 0.78, 0.65], [0.55, 2.15, -0.5, 0.6],
    [-0.6, 2.12, -0.45, 0.6], [0.05, 2.8, 0.35, 0.55]
  ];
  clusters.forEach(([x, y, z, r], index) => {
    addMesh(group, new THREE.IcosahedronGeometry(r, 0), leafMats[index % leafMats.length], x, y, z, {
      scaleY: 0.72,
      rotY: index * 0.7,
      cast: index < 4
    });
  });
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.45 + Math.random() * 0.5;
    addMesh(group, new THREE.SphereGeometry(0.055, 6, 5), getMaterial('#353d25', 0.9, 0), Math.cos(angle) * radius, 2.1 + Math.random() * 0.6, Math.sin(angle) * radius);
  }
  return group;
}

export function createShrub(): THREE.Group {
  const group = new THREE.Group();
  const mats = [getMaterial('#4f7145', 0.95, 0), getMaterial('#5e8250', 0.95, 0), getMaterial('#41613a', 0.95, 0)];
  for (let i = 0; i < 5; i++) {
    addMesh(group, new THREE.IcosahedronGeometry(0.25 + Math.random() * 0.2, 0), mats[i % mats.length], (Math.random() - 0.5) * 0.55, 0.22 + Math.random() * 0.2, (Math.random() - 0.5) * 0.45, {
      scaleY: 0.75
    });
  }
  return group;
}

export function createFlowerPatch(): THREE.Group {
  const group = new THREE.Group();
  addMesh(group, new THREE.IcosahedronGeometry(0.34, 0), getMaterial('#4d7044', 0.95, 0), 0, 0.2, 0, { scaleY: 0.55 });
  const colors = ['#d6534a', '#e9b04b', '#f3e3c3', '#b2679c', '#e47d62'];
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.42;
    addMesh(group, new THREE.SphereGeometry(0.035, 5, 4), getMaterial(colors[Math.floor(Math.random() * colors.length)], 0.75, 0), Math.cos(a) * r, 0.32 + Math.random() * 0.22, Math.sin(a) * r);
  }
  return group;
}

export function createLavenderBush(): THREE.Group {
  const group = new THREE.Group();
  const stemMat = getMaterial('#6f7f57', 0.9, 0);
  const bloomMat = getMaterial('#8a6fa8', 0.85, 0);
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.34;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = 0.45 + Math.random() * 0.4;
    addMesh(group, new THREE.CylinderGeometry(0.012, 0.018, h, 4), stemMat, x, h / 2, z, { rotZ: (Math.random() - 0.5) * 0.2 });
    addMesh(group, new THREE.CapsuleGeometry(0.025, 0.12, 3, 5), bloomMat, x, h, z);
  }
  return group;
}

export function createRock(): THREE.Group {
  const group = new THREE.Group();
  const mat = getMaterial('#9b978c', 0.95, 0.01);
  addMesh(group, new THREE.DodecahedronGeometry(0.45, 0), mat, 0, 0.25, 0, { scaleY: 0.55, scaleX: 1.25, rotY: Math.random() });
  addMesh(group, new THREE.DodecahedronGeometry(0.24, 0), mat, 0.38, 0.13, 0.12, { scaleY: 0.6, rotY: Math.random() });
  return group;
}

export function createPalmTree(): THREE.Group {
  const group = new THREE.Group();
  const trunkMat = getMaterial('#8b6b4c', 0.95, 0);
  const leafMat = getMaterial('#4f7b4a', 0.9, 0);
  addMesh(group, new THREE.CylinderGeometry(0.12, 0.2, 2.8, 7), trunkMat, 0, 1.4, 0, { rotZ: 0.08, cast: true });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const frond = addMesh(group, new THREE.BoxGeometry(0.13, 0.04, 1.4), leafMat, Math.cos(a) * 0.62, 3.1, Math.sin(a) * 0.62, {
      rotY: -a + Math.PI / 2,
      rotZ: -0.18
    });
    frond.scale.z = 1;
  }
  return group;
}

export function createDistantHill(radius: number, height: number, color: string): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 1, flatShading: true });
  const hill = new THREE.Mesh(geo, mat);
  hill.scale.y = height / radius;
  hill.receiveShadow = false;
  hill.castShadow = false;
  return hill;
}

export function createWoodenFencePost(): THREE.Group {
  const group = new THREE.Group();
  const mat = getMaterial('#74512f', 0.95, 0.01);
  const ironMat = getMaterial('#3a332c', 0.6, 0.4);
  addMesh(group, new THREE.CylinderGeometry(0.085, 0.11, 1.15, 6), mat, 0, 0.58, 0, { cast: true });
  addMesh(group, new THREE.ConeGeometry(0.11, 0.14, 6), mat, 0, 1.2, 0);
  addBox(group, 0.11, 0.08, 0.11, ironMat, 0, 1.02, 0, 0.01);
  return group;
}
