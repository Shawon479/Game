import * as THREE from 'three';
import {
  addBox,
  addMesh,
  createTextTexture,
  getEmissiveMaterial,
  getMaterial
} from './materials';

/** Street life: cars, fountain, lamps, benches, bicycles and small props. */

export type CarType = 'sedan' | 'hatchback' | 'van';

export interface CarBuild {
  group: THREE.Group;
  wheels: THREE.Group[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
}

function addTube(parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(b, a);
  const length = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 6), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createCar(type: CarType, bodyColor: string, accentColor: string = '#2b2d31', label?: string): CarBuild {
  const group = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const headlights: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];

  const spec = {
    sedan: { length: 4.15, width: 1.78, bodyH: 0.57, cabinL: 2.1, cabinH: 0.58, cabinZ: -0.12, wheelbase: 1.35, wheelR: 0.34 },
    hatchback: { length: 3.55, width: 1.7, bodyH: 0.55, cabinL: 1.95, cabinH: 0.64, cabinZ: -0.28, wheelbase: 1.13, wheelR: 0.33 },
    van: { length: 4.85, width: 1.98, bodyH: 0.95, cabinL: 3.45, cabinH: 1.02, cabinZ: -0.32, wheelbase: 1.58, wheelR: 0.38 }
  }[type];

  const bodyMat = getMaterial(bodyColor, 0.3, 0.56, false, 1, false);
  const accentMat = getMaterial(accentColor, 0.42, 0.4, false, 1, false);
  const glassMat = getMaterial('#182933', 0.16, 0.55, false, 1, false);
  const tireMat = getMaterial('#17191b', 0.95, 0.02);
  const hubMat = getMaterial('#c4cbd0', 0.25, 0.85, false, 1, false);
  const chromeMat = getMaterial('#d9dde0', 0.18, 0.9, false, 1, false);
  const headMat = getEmissiveMaterial('#fff2c0', 1.15, '#c7bb96');
  const tailMat = getEmissiveMaterial('#ff3b2e', 1.1, '#5e1914');
  const plateMat = getMaterial('#f2f0df', 0.65, 0.05);

  const baseY = spec.wheelR + 0.02;
  const bodyCenterY = baseY + spec.bodyH / 2;
  const bodyTop = baseY + spec.bodyH;

  // Main body
  addBox(group, spec.width, spec.bodyH, spec.length, bodyMat, 0, bodyCenterY, 0, 0.18, { cast: true, receive: true });
  // Rocker panel
  addBox(group, spec.width + 0.02, 0.16, spec.length * 0.78, accentMat, 0, baseY + 0.12, 0, 0.04);

  // Hood + trunk profile
  if (type !== 'van') {
    addBox(group, spec.width * 0.92, spec.bodyH * 0.45, spec.length * 0.24, bodyMat, 0, baseY + spec.bodyH * 0.8, spec.length * 0.32, 0.1, {
      cast: true
    });
    addBox(group, spec.width * 0.92, spec.bodyH * 0.36, spec.length * 0.17, bodyMat, 0, baseY + spec.bodyH * 0.76, -spec.length * 0.36, 0.1);
  }

  // Cabin
  const cabinY = bodyTop + spec.cabinH / 2 - 0.03;
  addBox(group, spec.width * 0.86, spec.cabinH, spec.cabinL, bodyMat, 0, cabinY, spec.cabinZ, 0.14, { cast: true });
  addBox(group, spec.width * 0.82, 0.07, spec.cabinL * 0.92, bodyMat, 0, bodyTop + spec.cabinH, spec.cabinZ, 0.04);

  // Windows
  const windowY = cabinY + spec.cabinH * 0.06;
  const windowH = spec.cabinH * 0.48;
  [-1, 1].forEach(side => {
    const x = side * (spec.width * 0.86 / 2 + 0.006);
    if (type === 'van') {
      addBox(group, 0.018, windowH, 0.7, glassMat, x, windowY, spec.cabinZ + spec.cabinL * 0.33, 0.01);
      addBox(group, 0.018, windowH * 0.82, spec.cabinL * 0.68, bodyMat, x, windowY - 0.06, spec.cabinZ - 0.1, 0.01);
    } else {
      addBox(group, 0.018, windowH, spec.cabinL * 0.38, glassMat, x, windowY, spec.cabinZ - spec.cabinL * 0.22, 0.01);
      addBox(group, 0.018, windowH, spec.cabinL * 0.33, glassMat, x, windowY, spec.cabinZ + spec.cabinL * 0.24, 0.01);
      addBox(group, 0.028, windowH, 0.06, accentMat, x, windowY, spec.cabinZ + 0.02, 0.01);
    }
    // door seams and handle
    addBox(group, 0.012, 0.01, spec.length * 0.32, accentMat, x * 1.001, bodyTop + 0.01, spec.cabinZ, 0.003, { rotX: 0.01 });
    addBox(group, 0.03, 0.035, 0.16, chromeMat, x * 1.002, baseY + spec.bodyH * 0.62, spec.cabinZ + 0.35, 0.01);
  });

  // Windshield and rear glass
  addBox(group, spec.width * 0.76, spec.cabinH * 0.52, 0.03, glassMat, 0, windowY + 0.03, spec.cabinZ + spec.cabinL / 2 + 0.005, 0.01, {
    rotX: -0.12
  });
  addBox(group, spec.width * 0.72, spec.cabinH * 0.44, 0.03, glassMat, 0, windowY, spec.cabinZ - spec.cabinL / 2 - 0.005, 0.01, {
    rotX: 0.1
  });

  // Mirrors
  [-1, 1].forEach(side => {
    addBox(group, 0.19, 0.1, 0.08, bodyMat, side * (spec.width / 2 + 0.04), windowY + 0.05, spec.cabinZ + spec.cabinL * 0.4, 0.04);
    addBox(group, 0.05, 0.04, 0.06, accentMat, side * (spec.width / 2 + 0.11), windowY + 0.05, spec.cabinZ + spec.cabinL * 0.4, 0.01);
  });

  // Bumpers and grille
  addBox(group, spec.width * 0.94, 0.14, 0.16, accentMat, 0, baseY + 0.22, spec.length / 2 + 0.02, 0.035);
  addBox(group, spec.width * 0.94, 0.14, 0.16, accentMat, 0, baseY + 0.22, -spec.length / 2 - 0.02, 0.035);
  addBox(group, spec.width * 0.46, 0.16, 0.055, accentMat, 0, baseY + spec.bodyH * 0.48, spec.length / 2 + 0.005, 0.02);
  for (let i = 0; i < 5; i++) {
    addBox(group, spec.width * 0.39, 0.012, 0.02, chromeMat, 0, baseY + spec.bodyH * 0.42 + i * 0.027, spec.length / 2 + 0.035, 0.004);
  }
  addBox(group, 0.48, 0.11, 0.02, plateMat, 0, baseY + 0.27, spec.length / 2 + 0.1, 0.015);
  addBox(group, 0.48, 0.11, 0.02, plateMat, 0, baseY + 0.27, -spec.length / 2 - 0.1, 0.015);

  // Headlights and tail lights
  [-1, 1].forEach(side => {
    const head = addBox(group, 0.27, 0.13, 0.04, headMat, side * spec.width * 0.3, baseY + spec.bodyH * 0.62, spec.length / 2 + 0.03, 0.025);
    headlights.push(head);
    const tail = addBox(group, 0.25, 0.12, 0.04, tailMat, side * spec.width * 0.33, baseY + spec.bodyH * 0.6, -spec.length / 2 - 0.03, 0.025);
    taillights.push(tail);
  });

  // Wheels
  [-1, 1].forEach(xSide => {
    [-1, 1].forEach(zSide => {
      const wheel = new THREE.Group();
      addMesh(wheel, new THREE.CylinderGeometry(spec.wheelR, spec.wheelR, 0.23, 16), tireMat, 0, 0, 0, { rotZ: Math.PI / 2, cast: true });
      addMesh(wheel, new THREE.CylinderGeometry(spec.wheelR * 0.52, spec.wheelR * 0.52, 0.235, 12), hubMat, 0, 0, 0, { rotZ: Math.PI / 2 });
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        addBox(wheel, spec.wheelR * 0.38, 0.025, 0.075, chromeMat, Math.cos(a) * spec.wheelR * 0.28, Math.sin(a) * spec.wheelR * 0.28, 0.12, 0.005, {
          rotZ: a
        });
      }
      wheel.position.set(xSide * (spec.width / 2 + 0.01), spec.wheelR, zSide * spec.wheelbase);
      group.add(wheel);
      wheels.push(wheel);
    });
  });

  // Van roof rails and delivery livery
  if (type === 'van') {
    addBox(group, spec.width * 0.9, 0.06, spec.cabinL * 0.9, accentMat, 0, bodyTop + spec.bodyH * 0.2, spec.cabinZ, 0.02);
    addBox(group, spec.width * 0.9, 0.04, spec.length * 0.5, accentMat, 0, bodyTop + 0.02, -0.2, 0.02);
    addBox(group, 0.05, 0.12, spec.length * 0.55, chromeMat, -spec.width * 0.42, bodyTop + 0.12, -0.2, 0.01);
    addBox(group, 0.05, 0.12, spec.length * 0.55, chromeMat, spec.width * 0.42, bodyTop + 0.12, -0.2, 0.01);
    if (label) {
      const texture = createTextTexture(label, { width: 640, height: 160, background: 'rgba(0,0,0,0)', foreground: '#f5e3bd', border: '#c9a35c', fontSize: 66 });
      const mat = new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.8, side: THREE.DoubleSide });
      [-1, 1].forEach(side => {
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.75), mat);
        plane.position.set(side * (spec.width / 2 + 0.015), baseY + spec.bodyH * 0.58, -0.45);
        plane.rotation.y = side * Math.PI / 2;
        group.add(plane);
      });
    }
  }

  // Antenna
  addMesh(group, new THREE.CylinderGeometry(0.012, 0.02, 0.65, 4), accentMat, -spec.width * 0.28, bodyTop + spec.cabinH + 0.28, spec.cabinZ - spec.cabinL * 0.3, {
    rotZ: 0.08
  });

  return { group, wheels, headlights, taillights };
}

export function createFountain(): { group: THREE.Group; water: THREE.Mesh; jet: THREE.Mesh } {
  const group = new THREE.Group();
  const stoneMat = getMaterial('#cbb99b', 0.94, 0.02);
  const darkStone = getMaterial('#a89779', 0.96, 0.01);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x5fa9b5,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: 0.68
  });
  const jetMat = new THREE.MeshStandardMaterial({ color: 0xc7eff5, transparent: true, opacity: 0.35, roughness: 0.05 });

  addMesh(group, new THREE.CylinderGeometry(2.15, 2.25, 0.3, 20), darkStone, 0, 0.15, 0, { receive: true, cast: true });
  addMesh(group, new THREE.CylinderGeometry(1.98, 2.05, 0.52, 20), stoneMat, 0, 0.42, 0, { receive: true });
  addMesh(group, new THREE.TorusGeometry(2.02, 0.09, 6, 26), stoneMat, 0, 0.66, 0, { rotX: Math.PI / 2 });
  const water = addMesh(group, new THREE.CircleGeometry(1.95, 28), waterMat, 0, 0.55, 0, { rotX: -Math.PI / 2 });
  addMesh(group, new THREE.CylinderGeometry(0.44, 0.52, 1.25, 12), stoneMat, 0, 1.06, 0, { cast: true });
  addMesh(group, new THREE.CylinderGeometry(0.92, 0.56, 0.22, 16), stoneMat, 0, 1.64, 0, { cast: true });
  addMesh(group, new THREE.TorusGeometry(0.9, 0.06, 5, 22), stoneMat, 0, 1.73, 0, { rotX: Math.PI / 2 });
  addMesh(group, new THREE.CylinderGeometry(0.18, 0.26, 1.2, 10), stoneMat, 0, 2.1, 0, { cast: true });
  addMesh(group, new THREE.SphereGeometry(0.22, 10, 7), darkStone, 0, 2.72, 0);
  addMesh(group, new THREE.CylinderGeometry(0.09, 0.12, 0.35, 8), stoneMat, 0, 2.9, 0);
  const jet = addMesh(group, new THREE.ConeGeometry(0.17, 0.75, 8, 1, true), jetMat, 0, 2.92, 0);
  jet.rotation.x = Math.PI;
  // Side spouts and thin streams
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const spout = addMesh(group, new THREE.CylinderGeometry(0.05, 0.08, 0.32, 7), stoneMat, Math.cos(a) * 0.62, 1.72, Math.sin(a) * 0.62, {
      rotZ: Math.PI / 2,
      rotY: -a
    });
    spout.rotation.z = 0.9;
    spout.rotation.y = -a;
    addMesh(group, new THREE.CylinderGeometry(0.02, 0.03, 1.15, 6), jetMat, Math.cos(a) * 0.9, 1.3, Math.sin(a) * 0.9, {
      rotZ: Math.cos(a) * 0.4,
      rotX: Math.sin(a) * 0.4
    });
  }
  group.userData.water = water;
  group.userData.jet = jet;
  return { group, water, jet };
}

export function createStreetLamp(): { group: THREE.Group; light: THREE.PointLight } {
  const group = new THREE.Group();
  const ironMat = getMaterial('#282622', 0.5, 0.55);
  const brassMat = getMaterial('#a97f43', 0.4, 0.6);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xffe4ad, roughness: 0.1, metalness: 0.04, transparent: true, opacity: 0.32 });

  addMesh(group, new THREE.CylinderGeometry(0.28, 0.36, 0.22, 10), ironMat, 0, 0.11, 0);
  addMesh(group, new THREE.CylinderGeometry(0.14, 0.2, 0.5, 10), ironMat, 0, 0.42, 0);
  addMesh(group, new THREE.CylinderGeometry(0.075, 0.1, 3.55, 8), ironMat, 0, 2.4, 0);
  [1.25, 2.1, 3.4].forEach(y => addMesh(group, new THREE.TorusGeometry(0.12, 0.03, 4, 10), brassMat, 0, y, 0, { rotX: Math.PI / 2 }));
  addBox(group, 0.06, 0.06, 0.62, ironMat, 0, 4.14, 0.25, 0.01);
  addMesh(group, new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), ironMat, 0, 3.98, 0.56);

  const cage = new THREE.Group();
  addBox(cage, 0.34, 0.42, 0.34, glassMat, 0, 0, 0, 0.05);
  [-0.17, 0.17].forEach(x => [-0.17, 0.17].forEach(z => addBox(cage, 0.04, 0.46, 0.04, ironMat, x, 0, z, 0.008)));
  addBox(cage, 0.38, 0.06, 0.38, ironMat, 0, 0.23, 0, 0.015);
  addMesh(cage, new THREE.ConeGeometry(0.3, 0.26, 4), ironMat, 0, 0.39, 0, { rotY: Math.PI / 4 });
  addMesh(cage, new THREE.SphereGeometry(0.085, 8, 6), getEmissiveMaterial('#ffd189', 2.1, '#6c5127'), 0, 0, 0);
  cage.position.set(0, 3.83, 0.56);
  group.add(cage);

  const light = new THREE.PointLight(0xffca7f, 1.4, 7, 2);
  light.position.set(0, 3.82, 0.56);
  group.add(light);
  group.userData.lampLight = light;
  return { group, light };
}

export function createBench(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = getMaterial('#7d5634', 0.92, 0.02);
  const ironMat = getMaterial('#34312b', 0.55, 0.45);
  for (let i = 0; i < 3; i++) {
    addBox(group, 2.05, 0.07, 0.16, woodMat, 0, 0.48, -0.24 + i * 0.22, 0.02, { cast: true });
  }
  addBox(group, 2.1, 0.06, 0.1, woodMat, 0, 0.78, -0.32, 0.01);
  addBox(group, 2.1, 0.07, 0.13, woodMat, 0, 0.94, -0.35, 0.01, { rotX: -0.12 });
  [-0.85, 0.85].forEach(x => {
    addBox(group, 0.07, 0.5, 0.07, ironMat, x, 0.25, 0.15, 0.01);
    addBox(group, 0.07, 0.5, 0.07, ironMat, x, 0.25, -0.2, 0.01);
    addBox(group, 0.07, 0.7, 0.07, ironMat, x, 0.62, -0.34, 0.01, { rotX: -0.1 });
    addBox(group, 0.1, 0.08, 1.6, ironMat, x, 0.08, -0.2, 0.01);
    addBox(group, 0.09, 0.09, 0.7, ironMat, x, 0.46, 0.04, 0.01);
  });
  return group;
}

export function createTrashBin(): THREE.Group {
  const group = new THREE.Group();
  const metal = getMaterial('#3d4a42', 0.55, 0.4);
  const dark = getMaterial('#262a27', 0.65, 0.3);
  addMesh(group, new THREE.CylinderGeometry(0.28, 0.25, 0.8, 10), metal, 0, 0.4, 0);
  addMesh(group, new THREE.TorusGeometry(0.29, 0.035, 5, 12), dark, 0, 0.78, 0, { rotX: Math.PI / 2 });
  addMesh(group, new THREE.CylinderGeometry(0.29, 0.3, 0.08, 10), dark, 0, 0.84, 0);
  for (let i = 0; i < 7; i++) {
    addBox(group, 0.035, 0.65, 0.02, dark, Math.cos((i / 7) * Math.PI * 2) * 0.27, 0.4, Math.sin((i / 7) * Math.PI * 2) * 0.27, 0.005, {
      rotY: -(i / 7) * Math.PI * 2
    });
  }
  addMesh(group, new THREE.CylinderGeometry(0.3, 0.3, 0.03, 10), dark, 0, 0.88, 0);
  return group;
}

export function createHydrant(): THREE.Group {
  const group = new THREE.Group();
  const redMat = getMaterial('#b5402f', 0.6, 0.15);
  const brassMat = getMaterial('#b68c4b', 0.4, 0.55);
  addMesh(group, new THREE.CylinderGeometry(0.2, 0.24, 0.18, 8), redMat, 0, 0.09, 0);
  addMesh(group, new THREE.CylinderGeometry(0.13, 0.16, 0.55, 8), redMat, 0, 0.42, 0);
  addMesh(group, new THREE.SphereGeometry(0.16, 9, 7), redMat, 0, 0.73, 0);
  addMesh(group, new THREE.CylinderGeometry(0.07, 0.07, 0.42, 7), redMat, 0, 0.58, 0, { rotZ: Math.PI / 2 });
  [-0.24, 0.24].forEach(x => addMesh(group, new THREE.CylinderGeometry(0.08, 0.08, 0.1, 7), brassMat, x, 0.58, 0, { rotZ: Math.PI / 2 }));
  addMesh(group, new THREE.CylinderGeometry(0.05, 0.06, 0.13, 7), brassMat, 0, 0.87, 0);
  return group;
}

export function createMailbox(): THREE.Group {
  const group = new THREE.Group();
  const ironMat = getMaterial('#2d332f', 0.55, 0.4);
  const blueMat = getMaterial('#315c70', 0.55, 0.3);
  addMesh(group, new THREE.CylinderGeometry(0.055, 0.07, 1.1, 6), ironMat, 0, 0.55, 0);
  addBox(group, 0.5, 0.38, 0.35, blueMat, 0, 1.22, 0, 0.06);
  addBox(group, 0.52, 0.06, 0.37, getMaterial('#243e4b', 0.5, 0.4), 0, 1.42, 0, 0.02);
  addBox(group, 0.24, 0.025, 0.02, getMaterial('#202425', 0.7, 0.2), 0, 1.32, 0.18, 0.005);
  addBox(group, 0.12, 0.18, 0.03, blueMat, 0.17, 1.5, 0.03, 0.01);
  return group;
}

export function createBollard(): THREE.Group {
  const group = new THREE.Group();
  const mat = getMaterial('#383b38', 0.55, 0.45);
  addMesh(group, new THREE.CylinderGeometry(0.11, 0.14, 0.75, 8), mat, 0, 0.37, 0);
  addMesh(group, new THREE.SphereGeometry(0.11, 8, 6), mat, 0, 0.76, 0);
  addMesh(group, new THREE.TorusGeometry(0.1, 0.022, 4, 8), getMaterial('#b19052', 0.4, 0.6), 0, 0.62, 0, { rotX: Math.PI / 2 });
  return group;
}

export function createBusStop(): THREE.Group {
  const group = new THREE.Group();
  const ironMat = getMaterial('#373b3b', 0.5, 0.5);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xb8d3d6, roughness: 0.08, metalness: 0.12, transparent: true, opacity: 0.26 });
  const roofMat = getMaterial('#9d4935', 0.86, 0.02);
  const woodMat = getMaterial('#7c5634', 0.9, 0.02);
  const signMat = getMaterial('#e8dfc8', 0.8, 0.02);

  [-1.35, 1.35].forEach(x => {
    addBox(group, 0.08, 2.5, 0.08, ironMat, x, 1.25, 0.55, 0.01);
    addBox(group, 0.08, 2.5, 0.08, ironMat, x, 1.25, -0.55, 0.01);
  });
  addBox(group, 3.0, 0.12, 1.35, roofMat, 0, 2.58, 0, 0.02);
  addBox(group, 3.0, 0.05, 1.4, ironMat, 0, 2.48, 0, 0.01);
  addBox(group, 2.8, 1.55, 0.04, glassMat, 0, 1.55, -0.53, 0.01);
  addBox(group, 2.8, 0.08, 0.06, ironMat, 0, 2.35, -0.53, 0.01);
  addBox(group, 2.3, 0.09, 0.44, woodMat, 0, 0.55, -0.35, 0.02);
  [-0.9, 0, 0.9].forEach(x => addBox(group, 0.06, 0.4, 0.06, ironMat, x, 0.35, -0.35, 0.01));

  addBox(group, 0.1, 2.8, 0.1, ironMat, 2.0, 1.4, 0.2, 0.01);
  addBox(group, 0.75, 1.1, 0.12, signMat, 2.0, 2.75, 0.2, 0.03);
  const signTexture = createTextTexture('PIAZZA', { width: 384, height: 512, background: '#eee4cd', foreground: '#3d5b4e', fontSize: 68, subtitle: 'fermata' });
  const signPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.86), new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.8 }));
  signPlane.position.set(2.0, 2.78, 0.27);
  group.add(signPlane);
  // Timetable glass
  addBox(group, 0.6, 0.72, 0.05, glassMat, 2.0, 1.72, 0.22, 0.01);
  return group;
}

export function createBicycle(): THREE.Group {
  const group = new THREE.Group();
  const frameMat = getMaterial('#3d6d78', 0.45, 0.45);
  const tireMat = getMaterial('#202326', 0.9, 0.02);
  const chromeMat = getMaterial('#c0c7c9', 0.18, 0.85);
  const wickerMat = getMaterial('#b1854e', 0.92, 0);

  [-0.62, 0.62].forEach(z => {
    addMesh(group, new THREE.TorusGeometry(0.34, 0.025, 5, 18), tireMat, 0, 0.37, z, { rotY: Math.PI / 2, cast: true });
    addMesh(group, new THREE.TorusGeometry(0.29, 0.012, 4, 16), chromeMat, 0, 0.37, z, { rotY: Math.PI / 2 });
    addMesh(group, new THREE.SphereGeometry(0.045, 6, 5), chromeMat, 0, 0.37, z);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      addMesh(group, new THREE.CylinderGeometry(0.005, 0.005, 0.58, 4), chromeMat, 0, 0.37 + Math.sin(a) * 0.29 / 2, z + Math.cos(a) * 0.29 / 2, {
        rotX: a + Math.PI / 2
      });
    }
  });
  addTube(group, new THREE.Vector3(0, 0.37, -0.62), new THREE.Vector3(0, 0.86, -0.2), 0.022, frameMat);
  addTube(group, new THREE.Vector3(0, 0.86, -0.2), new THREE.Vector3(0, 0.55, 0.18), 0.022, frameMat);
  addTube(group, new THREE.Vector3(0, 0.37, 0.62), new THREE.Vector3(0, 0.55, 0.18), 0.022, frameMat);
  addTube(group, new THREE.Vector3(0, 0.37, 0.62), new THREE.Vector3(0, 0.86, -0.2), 0.022, frameMat);
  addTube(group, new THREE.Vector3(0, 0.55, 0.18), new THREE.Vector3(0, 0.8, 0.48), 0.02, frameMat);
  addTube(group, new THREE.Vector3(0, 0.86, -0.2), new THREE.Vector3(0, 0.97, -0.24), 0.02, chromeMat);
  addBox(group, 0.16, 0.05, 0.3, chromeMat, 0, 0.99, -0.26, 0.01);
  addTube(group, new THREE.Vector3(0, 0.8, 0.48), new THREE.Vector3(0, 0.94, 0.5), 0.02, chromeMat);
  addBox(group, 0.46, 0.035, 0.04, chromeMat, 0, 0.96, 0.5, 0.01);
  addBox(group, 0.28, 0.22, 0.3, wickerMat, 0, 0.85, 0.52, 0.03);
  for (let i = 0; i < 5; i++) {
    addMesh(group, new THREE.SphereGeometry(0.045, 6, 5), getMaterial(i % 2 ? '#d9b25c' : '#c9483d', 0.8, 0), (Math.random() - 0.5) * 0.2, 0.98 + Math.random() * 0.08, 0.5 + (Math.random() - 0.5) * 0.2);
  }
  group.rotation.z = 0.05;
  return group;
}

export function createCrate(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = getMaterial('#8b6139', 0.92, 0.01);
  const darkMat = getMaterial('#5c3d23', 0.94, 0);
  addBox(group, 0.68, 0.55, 0.68, woodMat, 0, 0.275, 0, 0.025);
  [-0.3, 0.3].forEach(y => {
    addBox(group, 0.72, 0.06, 0.72, darkMat, 0, 0.3 + y, 0, 0.015);
  });
  addBox(group, 0.05, 0.6, 0.7, darkMat, -0.33, 0.3, 0, 0.01);
  addBox(group, 0.05, 0.6, 0.7, darkMat, 0.33, 0.3, 0, 0.01);
  return group;
}

export function createBarrel(): THREE.Group {
  const group = new THREE.Group();
  const woodMat = getMaterial('#7b5432', 0.92, 0.02);
  const ironMat = getMaterial('#37322b', 0.55, 0.45);
  addMesh(group, new THREE.CylinderGeometry(0.34, 0.3, 0.82, 12), woodMat, 0, 0.41, 0);
  [-0.27, 0, 0.27].forEach(y => addMesh(group, new THREE.TorusGeometry(0.34 - Math.abs(y) * 0.08, 0.025, 4, 14), ironMat, 0, 0.41 + y, 0, { rotX: Math.PI / 2 }));
  addMesh(group, new THREE.CylinderGeometry(0.28, 0.28, 0.03, 12), getMaterial('#8d633a', 0.9, 0), 0, 0.78, 0);
  addMesh(group, new THREE.CylinderGeometry(0.045, 0.045, 0.06, 8), ironMat, 0, 0.81, 0);
  return group;
}

export function createBird(): THREE.Group {
  const group = new THREE.Group();
  const featherMat = getMaterial('#707a82', 0.85, 0.02);
  const darkMat = getMaterial('#3d454c', 0.85, 0.04);
  const beakMat = getMaterial('#d39a43', 0.8, 0.02);
  const body = addMesh(group, new THREE.SphereGeometry(0.13, 9, 7), featherMat, 0, 0.16, 0, { scaleZ: 1.5, scaleY: 0.95 });
  addMesh(group, new THREE.SphereGeometry(0.075, 8, 6), darkMat, 0, 0.29, 0.13);
  addMesh(group, new THREE.ConeGeometry(0.025, 0.09, 5), beakMat, 0, 0.28, 0.23, { rotX: Math.PI / 2 });
  addBox(group, 0.18, 0.035, 0.24, darkMat, 0, 0.15, -0.22, 0.01, { rotX: 0.12 });
  [-0.05, 0.05].forEach(x => addMesh(group, new THREE.CylinderGeometry(0.01, 0.01, 0.08, 4), beakMat, x, 0.06, 0.02));
  [-0.055, 0.055].forEach(x => addMesh(group, new THREE.SphereGeometry(0.013, 5, 4), getMaterial('#1d1f20', 0.5, 0), x, 0.31, 0.195));
  addBox(group, 0.08, 0.05, 0.12, darkMat, -0.08, 0.22, -0.02, 0.01, { rotZ: 0.16 });
  addBox(group, 0.08, 0.05, 0.12, darkMat, 0.08, 0.22, -0.02, 0.01, { rotZ: -0.16 });
  body.castShadow = true;
  return group;
}

export function createCloud(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xf8f3e7, roughness: 1, transparent: true, opacity: 0.88, flatShading: true });
  const puffs: Array<[number, number, number, number]> = [
    [0, 0, 0, 1.0], [-1.2, -0.15, 0.2, 0.72], [1.3, -0.1, -0.15, 0.8],
    [0.45, 0.35, 0.15, 0.68], [-0.55, 0.4, -0.2, 0.62], [1.9, -0.2, 0.2, 0.5],
    [-1.9, -0.25, -0.2, 0.48]
  ];
  puffs.forEach(([x, y, z, r]) => {
    const puff = addMesh(group, new THREE.IcosahedronGeometry(r, 1), mat, x, y, z, { scaleY: 0.65 });
    puff.castShadow = false;
    puff.receiveShadow = false;
  });
  return group;
}
