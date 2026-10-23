import * as THREE from 'three';
import type { CustomerAccessory, CustomerAppearance, HairStyle } from '../../types/game';
import { addBox, addMesh, box, getContactShadowMaterial, getMaterial } from './materials';

/**
 * Rounded, expressive villagers. The legs and arms are pivot meshes whose
 * geometry hangs below the origin, so rotating the mesh swings the limb the
 * same way a hip or shoulder joint would.
 */

export interface PersonBuild {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  head: THREE.Mesh;
  torso: THREE.Mesh;
}

export interface PersonOptions extends CustomerAppearance {
  isChef?: boolean;
  isStaff?: boolean;
  role?: string;
  apronColor?: string;
  hat?: string;
  name?: string;
}

const SKIN_TONES = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#d9a066'];
const HAIR_COLORS = ['#2b1b12', '#3e2723', '#111111', '#6b4423', '#d4a373', '#a0522d', '#8d5524'];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function addEye(parent: THREE.Object3D, x: number, y: number, z: number): void {
  const whiteMat = getMaterial('#fff9f0', 0.5, 0.0, false, 1, false);
  const pupilMat = getMaterial('#2b2118', 0.35, 0.05, false, 1, false);
  const white = addMesh(parent, new THREE.SphereGeometry(0.034, 8, 6), whiteMat, x, y, z);
  white.scale.set(1, 0.78, 0.55);
  addMesh(parent, new THREE.SphereGeometry(0.016, 8, 6), pupilMat, x, y, z + 0.022);
}

function addSmile(parent: THREE.Object3D, y: number, z: number, color = '#8c4a3c'): void {
  const mouthMat = getMaterial(color, 0.8, 0, false, 1, false);
  const smile = addMesh(parent, new THREE.TorusGeometry(0.045, 0.009, 5, 10, Math.PI), mouthMat, 0, y, z, {
    rotZ: Math.PI
  });
  smile.scale.set(1, 0.65, 1);
}

function addHair(parent: THREE.Object3D, style: HairStyle, hairMat: THREE.MeshStandardMaterial): void {
  const cap = () => addBox(parent, 0.39, 0.15, 0.36, hairMat, 0, 2.0, -0.005, 0.065);
  const back = (h: number, y: number, d = 0.11) =>
    addBox(parent, 0.36, h, d, hairMat, 0, y, -0.185, 0.055);

  switch (style) {
    case 'bald':
      // A little side fringe keeps bald guests from looking unfinished.
      addBox(parent, 0.05, 0.12, 0.2, hairMat, -0.19, 1.86, -0.055, 0.02);
      addBox(parent, 0.05, 0.12, 0.2, hairMat, 0.19, 1.86, -0.055, 0.02);
      break;
    case 'short':
      cap();
      back(0.16, 1.92, 0.08);
      break;
    case 'bob':
      cap();
      back(0.28, 1.86);
      addBox(parent, 0.075, 0.27, 0.26, hairMat, -0.195, 1.84, -0.02, 0.03);
      addBox(parent, 0.075, 0.27, 0.26, hairMat, 0.195, 1.84, -0.02, 0.03);
      break;
    case 'long':
      cap();
      back(0.52, 1.7, 0.13);
      addBox(parent, 0.08, 0.48, 0.13, hairMat, -0.2, 1.74, -0.02, 0.03);
      addBox(parent, 0.08, 0.48, 0.13, hairMat, 0.2, 1.74, -0.02, 0.03);
      break;
    case 'bun':
      cap();
      back(0.16, 1.94, 0.08);
      addMesh(parent, new THREE.SphereGeometry(0.115, 10, 8), hairMat, 0, 2.0, -0.235);
      break;
    case 'curly': {
      const curls: Array<[number, number, number, number]> = [
        [0, 2.03, 0, 0.12], [-0.15, 2.0, 0, 0.1], [0.15, 2.0, 0, 0.1],
        [-0.18, 1.92, -0.09, 0.095], [0.18, 1.92, -0.09, 0.095], [0, 1.98, -0.17, 0.12],
        [-0.07, 2.06, 0.13, 0.085], [0.08, 2.04, 0.14, 0.08]
      ];
      curls.forEach(([x, y, z, r]) => addMesh(parent, new THREE.SphereGeometry(r, 8, 6), hairMat, x, y, z));
      break;
    }
    case 'ponytail':
      cap();
      back(0.15, 1.94, 0.08);
      addBox(parent, 0.1, 0.12, 0.1, hairMat, 0, 1.93, -0.24, 0.04);
      addBox(parent, 0.12, 0.38, 0.12, hairMat, 0, 1.75, -0.26, 0.045, { rotX: 0.15 });
      break;
  }

  // A couple of whimsical flyaway strands.
  if (style !== 'bald' && Math.random() < 0.5) {
    addBox(parent, 0.025, 0.12, 0.025, hairMat, -0.1, 2.1, -0.04, 0.01, { rotZ: 0.3 });
  }
}

function addHat(parent: THREE.Object3D, style: string, color: string): void {
  if (style === 'chef') {
    const white = getMaterial('#f8f3e7', 0.75, 0.02, false, 1, false);
    addMesh(parent, new THREE.CylinderGeometry(0.22, 0.2, 0.12, 14), white, 0, 2.12, 0);
    addMesh(parent, new THREE.SphereGeometry(0.22, 12, 9), white, 0, 2.26, 0, { scaleY: 0.82 });
    addMesh(parent, new THREE.SphereGeometry(0.12, 10, 8), white, -0.13, 2.31, 0.02);
    addMesh(parent, new THREE.SphereGeometry(0.12, 10, 8), white, 0.13, 2.31, 0.02);
    addMesh(parent, new THREE.SphereGeometry(0.11, 10, 8), white, 0, 2.36, -0.04);
    return;
  }

  if (style === 'cap') {
    const capMat = getMaterial(color, 0.75, 0.05, false, 1, false);
    addMesh(parent, new THREE.SphereGeometry(0.21, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat, 0, 1.98, 0, {
      scaleY: 0.7
    });
    addBox(parent, 0.32, 0.035, 0.19, capMat, 0, 1.995, 0.23, 0.025);
    return;
  }

  if (style === 'sunhat') {
    const straw = getMaterial('#d8b06a', 0.9, 0.02, false, 1, false);
    const ribbon = getMaterial('#b5523b', 0.75, 0.02, false, 1, false);
    addMesh(parent, new THREE.CylinderGeometry(0.42, 0.42, 0.035, 18), straw, 0, 2.02, 0.01, { scaleZ: 1.08 });
    addMesh(parent, new THREE.CylinderGeometry(0.2, 0.23, 0.16, 14), straw, 0, 2.12, 0);
    addMesh(parent, new THREE.CylinderGeometry(0.235, 0.235, 0.045, 14), ribbon, 0, 2.06, 0);
    return;
  }

  if (style === 'bandana') {
    addMesh(parent, new THREE.SphereGeometry(0.21, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), getMaterial(color, 0.9, 0, false, 1, false), 0, 1.99, 0, { scaleY: 0.55 });
  }
}

export function buildPerson(options: PersonOptions): PersonBuild {
  const group = new THREE.Group();
  const heightScale = options.heightScale ?? 1;
  const buildType = options.build ?? 'regular';
  const scaleX = buildType === 'slim' ? 0.91 : buildType === 'broad' ? 1.13 : 1;

  const skinMat = getMaterial(options.skinColor || pick(SKIN_TONES), 0.82, 0.01, false, 1, false);
  const shirtMat = getMaterial(options.shirtColor || '#e76f51', 0.9, 0.01, false, 1, false);
  const pantsMat = getMaterial(options.pantsColor || '#3d405b', 0.92, 0.01, false, 1, false);
  const hairMat = getMaterial(options.hairColor || pick(HAIR_COLORS), 0.88, 0.01, false, 1, false);
  const shoeMat = getMaterial(options.shoesColor || '#2c211b', 0.95, 0.02, false, 1, false);
  const outerMat = options.outerColor ? getMaterial(options.outerColor, 0.9, 0.01, false, 1, false) : shirtMat;
  const apronMat = getMaterial(options.apronColor || '#e9dfca', 0.94, 0.01, false, 1, false);

  group.scale.set(1, heightScale, 1);

  // --- Legs -------------------------------------------------------------
  const legGeo = box(0.19 * scaleX, 0.74, 0.22, 0.055);
  legGeo.translate(0, -0.37, 0);
  const leftLeg = addMesh(group, legGeo, pantsMat, -0.125 * scaleX, 0.82, 0, { cast: true });
  const rightLeg = addMesh(group, legGeo.clone(), pantsMat, 0.125 * scaleX, 0.82, 0, { cast: true });

  [leftLeg, rightLeg].forEach(leg => {
    const shoe = addBox(leg, 0.21, 0.13, 0.32, shoeMat, 0, -0.705, 0.07, 0.045);
    addBox(shoe, 0.22, 0.035, 0.34, getMaterial('#171412', 0.9, 0.02, false, 1, false), 0, -0.055, 0.005, 0.01);
  });

  // --- Hips & torso -----------------------------------------------------
  addBox(group, 0.46 * scaleX, 0.22, 0.3, pantsMat, 0, 0.86, 0, 0.08, { cast: true });
  addBox(group, 0.49 * scaleX, 0.07, 0.31, getMaterial('#3a2a1b', 0.8, 0.05, false, 1, false), 0, 0.97, 0, 0.012);

  const torso = addBox(
    group,
    0.52 * scaleX,
    0.68,
    0.32,
    outerMat,
    0,
    1.27,
    0,
    0.11,
    { cast: true }
  );

  // Shirt/chest peeking out of an open jacket.
  if (options.outerColor) {
    addBox(group, 0.22 * scaleX, 0.4, 0.035, shirtMat, 0, 1.27, 0.166, 0.01);
    addBox(group, 0.09, 0.09, 0.04, getMaterial('#f8f3e7', 0.8, 0, false, 1, false), 0, 1.51, 0.17, 0.02, {
      rotZ: Math.PI / 4
    });
  }

  if (options.isChef || options.isStaff) {
    addBox(group, 0.4 * scaleX, 0.62, 0.035, apronMat, 0, 1.12, 0.18, 0.02);
    addBox(group, 0.05, 0.55, 0.03, apronMat, -0.17 * scaleX, 1.35, 0.185, 0.01, { rotZ: 0.22 });
    addBox(group, 0.05, 0.55, 0.03, apronMat, 0.17 * scaleX, 1.35, 0.185, 0.01, { rotZ: -0.22 });
    addBox(group, 0.31 * scaleX, 0.22, 0.03, getMaterial('#c9a35c', 0.5, 0.25, false, 1, false), 0, 1.09, 0.199, 0.01);
  }

  // Little buttons and collar.
  for (let i = 0; i < 3; i++) {
    addMesh(group, new THREE.SphereGeometry(0.014, 6, 5), getMaterial('#d7c7a3', 0.55, 0.15, false, 1, false), 0.09, 1.42 - i * 0.13, 0.173);
  }
  addBox(group, 0.2, 0.07, 0.15, shirtMat, 0, 1.59, 0.01, 0.03);

  // --- Neck & head ------------------------------------------------------
  addMesh(group, new THREE.CylinderGeometry(0.095, 0.11, 0.14, 10), skinMat, 0, 1.66, 0);
  const head = addMesh(group, box(0.36, 0.42, 0.34, 0.12), skinMat, 0, 1.84, 0, { cast: true });

  // Cheekbones / jaw are softened with two tiny spheres.
  addMesh(group, new THREE.SphereGeometry(0.09, 8, 6), skinMat, -0.15, 1.8, 0.03, { scaleX: 0.7, scaleY: 0.9 });
  addMesh(group, new THREE.SphereGeometry(0.09, 8, 6), skinMat, 0.15, 1.8, 0.03, { scaleX: 0.7, scaleY: 0.9 });

  addMesh(head, new THREE.SphereGeometry(0.065, 8, 6), skinMat, -0.185, 0, 0, { scaleX: 0.5 });
  addMesh(head, new THREE.SphereGeometry(0.065, 8, 6), skinMat, 0.185, 0, 0, { scaleX: 0.5 });

  const faceZ = 0.172;
  addEye(head, -0.085, 0.035, faceZ);
  addEye(head, 0.085, 0.035, faceZ);

  const browMat = getMaterial(options.hairColor || '#3e2723', 0.9, 0, false, 1, false);
  addBox(head, 0.09, 0.018, 0.02, browMat, -0.085, 0.105, 0.178, 0.006, { rotZ: -0.08 });
  addBox(head, 0.09, 0.018, 0.02, browMat, 0.085, 0.105, 0.178, 0.006, { rotZ: 0.08 });

  addMesh(head, new THREE.ConeGeometry(0.034, 0.095, 8), getMaterial(options.skinColor ? options.skinColor : pick(SKIN_TONES), 0.82, 0.01, false, 1, false), 0, -0.005, 0.19, {
    rotX: Math.PI / 2
  });
  addSmile(head, -0.095, 0.17, '#9c5145');
  addMesh(head, new THREE.SphereGeometry(0.018, 6, 5), getMaterial('#e8a08c', 0.8, 0, false, 1, false), -0.13, -0.05, 0.175, {
    scaleX: 1.3, scaleY: 0.6
  });
  addMesh(head, new THREE.SphereGeometry(0.018, 6, 5), getMaterial('#e8a08c', 0.8, 0, false, 1, false), 0.13, -0.05, 0.175, {
    scaleX: 1.3, scaleY: 0.6
  });

  const hairStyle: HairStyle = options.hairStyle ?? 'short';
  addHair(group, hairStyle, hairMat);

  // --- Accessories ------------------------------------------------------
  const accessory: CustomerAccessory = options.accessory ?? 'none';
  if (accessory === 'glasses') {
    const frameMat = getMaterial('#20242a', 0.45, 0.3, false, 1, false);
    [-0.085, 0.085].forEach(x => {
      addMesh(head, new THREE.TorusGeometry(0.052, 0.008, 5, 10), frameMat, x, 0.035, 0.195);
      addMesh(head, new THREE.CylinderGeometry(0.007, 0.007, 0.08, 5), frameMat, x + (x < 0 ? -0.055 : 0.055), 0.035, 0.18, {
        rotZ: Math.PI / 2
      });
    });
    addBox(head, 0.045, 0.008, 0.008, frameMat, 0, 0.035, 0.2, 0.002);
  }

  if (accessory === 'bag') {
    const bagMat = getMaterial('#8a5a36', 0.9, 0.02, false, 1, false);
    addBox(group, 0.23, 0.26, 0.12, bagMat, 0.32 * scaleX, 1.02, 0.03, 0.04);
    addBox(group, 0.24, 0.035, 0.13, bagMat, 0.32 * scaleX, 1.15, 0.03, 0.01);
    addBox(group, 0.035, 0.52, 0.025, bagMat, 0.2 * scaleX, 1.32, 0.06, 0.008, { rotZ: -0.42 });
    addMesh(group, new THREE.SphereGeometry(0.018, 6, 5), getMaterial('#c9a35c', 0.4, 0.4, false, 1, false), 0.33, 1.08, 0.1);
  }

  if (accessory === 'scarf') {
    const scarfMat = getMaterial('#b5523b', 0.95, 0.01, false, 1, false);
    addMesh(group, new THREE.TorusGeometry(0.135, 0.038, 6, 12), scarfMat, 0, 1.62, 0.02, { rotX: Math.PI / 2 });
    addBox(group, 0.12, 0.3, 0.05, scarfMat, 0.09, 1.44, 0.15, 0.02, { rotZ: 0.1 });
  }

  if (accessory === 'cap') {
    addHat(group, 'cap', options.outerColor ?? options.shirtColor ?? '#5f0f40');
  } else if (accessory === 'sunhat') {
    addHat(group, 'sunhat', '#d8b06a');
  } else if (options.hat === 'chef') {
    addHat(group, 'chef', '#ffffff');
  }

  if (accessory === 'earrings') {
    const goldMat = getMaterial('#d4a53a', 0.3, 0.7, false, 1, false);
    addMesh(group, new THREE.SphereGeometry(0.032, 8, 6), goldMat, -0.19, 1.8, 0.03);
    addMesh(group, new THREE.SphereGeometry(0.032, 8, 6), goldMat, 0.19, 1.8, 0.03);
  }

  // --- Arms -------------------------------------------------------------
  const armMat = options.outerColor ? outerMat : shirtMat;
  const armGeo = box(0.145, 0.6, 0.17, 0.055);
  armGeo.translate(0, -0.3, 0);
  const leftArm = addMesh(group, armGeo, armMat, -0.3 * scaleX, 1.51, 0, { cast: true });
  const rightArm = addMesh(group, armGeo.clone(), armMat, 0.3 * scaleX, 1.51, 0, { cast: true });
  [leftArm, rightArm].forEach(arm => {
    const cuff = addBox(arm, 0.15, 0.08, 0.18, options.outerColor ? shirtMat : armMat, 0, -0.56, 0, 0.02);
    cuff.castShadow = false;
    addMesh(arm, new THREE.SphereGeometry(0.075, 8, 6), skinMat, 0, -0.63, 0.015, { scaleY: 1.1 });
  });

  // Chef's neckerchief + buttons + moustache
  if (options.isChef) {
    const redMat = getMaterial('#b23a3a', 0.8, 0.02, false, 1, false);
    addBox(group, 0.22, 0.12, 0.04, redMat, 0, 1.58, 0.17, 0.02, { rotZ: Math.PI / 4 });
    addBox(head, 0.11, 0.028, 0.03, hairMat, -0.055, -0.085, 0.19, 0.008, { rotZ: -0.16 });
    addBox(head, 0.11, 0.028, 0.03, hairMat, 0.055, -0.085, 0.19, 0.008, { rotZ: 0.16 });
  }

  if (options.isStaff && options.role === 'server') {
    const bowMat = getMaterial('#20242a', 0.6, 0.1, false, 1, false);
    addBox(group, 0.12, 0.055, 0.04, bowMat, 0, 1.55, 0.18, 0.01);
    addBox(group, 0.07, 0.1, 0.04, bowMat, -0.07, 1.55, 0.18, 0.01, { rotZ: 0.3 });
    addBox(group, 0.07, 0.1, 0.04, bowMat, 0.07, 1.55, 0.18, 0.01, { rotZ: -0.3 });
  }

  if (options.isStaff && options.role === 'farmhand') {
    addHat(group, 'sunhat', '#d8b06a');
  } else if (options.isStaff && options.role === 'prep_cook') {
    addHat(group, 'bandana', '#b5523b');
  } else if (options.isStaff && options.role === 'oven_tender') {
    addHat(group, 'bandana', '#2a9d8f');
  }

  // A soft contact shadow keeps every villager visually planted, especially
  // after sunset when the strong directional shadows fade away.
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.05),
    getContactShadowMaterial()
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.018;
  contactShadow.renderOrder = 1;
  group.add(contactShadow);

  return { group, leftLeg, rightLeg, leftArm, rightArm, head, torso };
}

export function createChef(): PersonBuild {
  const chef = buildPerson({
    skinColor: '#e0ac69',
    shirtColor: '#f7f1e4',
    pantsColor: '#2e4057',
    hairColor: '#3b2314',
    hairStyle: 'short',
    apronColor: '#b5523b',
    outerColor: undefined,
    shoesColor: '#2a1f1a',
    isChef: true,
    hat: 'chef',
    build: 'broad',
    heightScale: 1.02,
    accessory: 'none'
  });

  // Pizza peel resting on the right arm — it swings as the chef walks.
  const woodMat = getMaterial('#9c6b3f', 0.9, 0.02, false, 1, false);
  addBox(chef.rightArm, 0.05, 0.52, 0.05, woodMat, 0, -0.56, 0.12, 0.02, { rotX: 0.18 });
  addBox(chef.rightArm, 0.28, 0.03, 0.4, woodMat, 0, -0.8, 0.28, 0.02, { rotX: 0.18 });

  return chef;
}

export function createCustomer(appearance: CustomerAppearance): PersonBuild {
  return buildPerson({
    ...appearance,
    isStaff: false,
    isChef: false
  });
}

export function createStaffMember(role: string, shirtColor: string, hairColor: string): PersonBuild {
  const skin = pick(SKIN_TONES);
  const staff = buildPerson({
    skinColor: skin,
    shirtColor,
    pantsColor: '#263548',
    hairColor,
    hairStyle: pick<HairStyle>(['short', 'bob', 'bun', 'curly', 'ponytail']),
    apronColor: role === 'prep_cook' ? '#e5d8bd' : '#d8c6a4',
    build: pick<'slim' | 'regular' | 'broad'>(['slim', 'regular', 'broad']),
    heightScale: 0.97 + Math.random() * 0.08,
    shoesColor: '#2c211b',
    isStaff: true,
    role,
    accessory: 'none'
  });

  if (role === 'server') {
    addBox(staff.group, 0.34, 0.42, 0.06, getMaterial('#d8c6a4', 0.95, 0, false, 1, false), 0.28, 0.72, 0.02, 0.02, {
      rotZ: 0.08
    });
  }

  return staff;
}
