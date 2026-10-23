import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/**
 * Shared material cache + geometry helpers for the procedural asset library.
 * Keeping these in one module means every prop and villager reuses the same
 * handful of materials, which keeps draw calls and GPU memory sensible.
 */

const materials: Record<string, THREE.MeshStandardMaterial> = {};

export function getMaterial(
  color: number | string,
  roughness: number = 0.8,
  metalness: number = 0.1,
  transparent: boolean = false,
  opacity: number = 1.0,
  flatShading: boolean = true
): THREE.MeshStandardMaterial {
  const key = `${color}_${roughness}_${metalness}_${transparent}_${opacity}_${flatShading}`;
  if (!materials[key]) {
    materials[key] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness,
      transparent,
      opacity,
      flatShading
    });
  }
  return materials[key];
}

export function getEmissiveMaterial(
  color: number | string,
  intensity: number = 1,
  baseColor: number | string = 0x151515
): THREE.MeshStandardMaterial {
  const key = `em_${color}_${intensity}_${baseColor}`;
  if (!materials[key]) {
    materials[key] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      roughness: 0.35,
      metalness: 0.05,
      emissive: new THREE.Color(color),
      emissiveIntensity: intensity
    });
  }
  return materials[key];
}

export function resetMaterials(): void {
  Object.values(materials).forEach(mat => {
    try {
      mat.dispose();
    } catch {
      // ignore
    }
  });
  Object.keys(materials).forEach(key => delete materials[key]);
}

/** Rounded box geometry with a sensible default bevel. */
export function box(w: number, h: number, d: number, radius: number = 0.08, segments: number = 3): RoundedBoxGeometry {
  const r = Math.max(0.005, Math.min(radius, Math.min(w, h, d) * 0.45));
  return new RoundedBoxGeometry(w, h, d, segments, r);
}

export interface MeshOptions {
  cast?: boolean;
  receive?: boolean;
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  name?: string;
}

export function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number = 0,
  y: number = 0,
  z: number = 0,
  options: MeshOptions = {}
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  if (options.rotX) m.rotation.x = options.rotX;
  if (options.rotY) m.rotation.y = options.rotY;
  if (options.rotZ) m.rotation.z = options.rotZ;
  if (options.scaleX !== undefined) m.scale.x = options.scaleX;
  if (options.scaleY !== undefined) m.scale.y = options.scaleY;
  if (options.scaleZ !== undefined) m.scale.z = options.scaleZ;
  m.castShadow = options.cast ?? false;
  m.receiveShadow = options.receive ?? false;
  if (options.name) m.name = options.name;
  parent.add(m);
  return m;
}

export function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number = 0,
  y: number = 0,
  z: number = 0,
  radius: number = 0.06,
  options: MeshOptions = {}
): THREE.Mesh {
  return addMesh(parent, box(w, h, d, radius), material, x, y, z, options);
}

/* ------------------------------------------------------------------ */
/* Canvas textures                                                     */
/* ------------------------------------------------------------------ */

export function createCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export interface SignOptions {
  width?: number;
  height?: number;
  background?: string;
  foreground?: string;
  border?: string;
  fontSize?: number;
  subtitle?: string;
  fontFamily?: string;
  weight?: number;
  letterSpacing?: number;
}

export function createTextTexture(text: string, options: SignOptions = {}): THREE.CanvasTexture {
  const width = options.width ?? 512;
  const height = options.height ?? 128;
  const background = options.background ?? '#243b32';
  const foreground = options.foreground ?? '#f8e7c2';
  const border = options.border ?? '#c9a35c';
  const fontFamily = options.fontFamily ?? 'Georgia, "Times New Roman", serif';
  const weight = options.weight ?? 700;
  const subtitle = options.subtitle;

  return createCanvasTexture(width, height, ctx => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // Subtle vertical grain / vignette
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(255,255,255,0.10)');
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.02)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = border;
    ctx.lineWidth = Math.max(3, width * 0.009);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, width - ctx.lineWidth * 2, height - ctx.lineWidth * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.025, height * 0.08, width * 0.95, height * 0.84);

    let fontSize = options.fontSize ?? Math.round(height * 0.4);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const maxWidth = width * 0.84;
    const fontFor = (size: number) => `${weight} ${size}px ${fontFamily}`;
    ctx.font = fontFor(fontSize);
    while (ctx.measureText(text).width > maxWidth && fontSize > 10) {
      fontSize -= 2;
      ctx.font = fontFor(fontSize);
    }

    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = foreground;
    const titleY = subtitle ? height * 0.43 : height * 0.52;
    ctx.fillText(text, width / 2, titleY);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    if (subtitle) {
      ctx.font = `500 ${Math.round(height * 0.16)}px ${fontFamily}`;
      ctx.fillStyle = 'rgba(248,231,194,0.76)';
      ctx.fillText(subtitle.toUpperCase(), width / 2, height * 0.72);
    }

    // Decorative diamonds
    ctx.fillStyle = border;
    ctx.save();
    ctx.translate(width * 0.09, height * 0.5);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
    ctx.save();
    ctx.translate(width * 0.91, height * 0.5);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  });
}

export function createChalkboardTexture(
  title: string,
  lines: string[],
  options: { width?: number; height?: number; accent?: string } = {}
): THREE.CanvasTexture {
  const width = options.width ?? 384;
  const height = options.height ?? 512;
  return createCanvasTexture(width, height, ctx => {
    ctx.fillStyle = '#24322d';
    ctx.fillRect(0, 0, width, height);

    // Chalk dust
    for (let i = 0; i < 500; i++) {
      const a = Math.random() * 0.05;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
    }

    ctx.strokeStyle = '#c9a35c';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f4e7c5';
    ctx.font = '700 42px Georgia, serif';
    ctx.fillText(title, width / 2, 78);

    ctx.strokeStyle = 'rgba(244,231,197,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, 105);
    ctx.lineTo(width - 30, 105);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '28px Georgia, serif';
    lines.forEach((line, index) => {
      ctx.fillStyle = index % 3 === 0 ? (options.accent ?? '#f4e7c5') : '#e8ddc0';
      ctx.fillText(line, 36, 160 + index * 47);
      if (index % 3 !== 2) {
        ctx.strokeStyle = 'rgba(244,231,197,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(36, 174 + index * 47);
        ctx.lineTo(width - 36, 174 + index * 47);
        ctx.stroke();
      }
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#c9a35c';
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText('grazie · grazie · grazie', width / 2, height - 34);
  });
}

/* ------------------------------------------------------------------ */
/* Procedural ground textures                                          */
/* ------------------------------------------------------------------ */

function speckle(ctx: CanvasRenderingContext2D, width: number, height: number, count: number, colors: string[], alpha = 0.3): void {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.globalAlpha = Math.random() * alpha;
    const size = 0.5 + Math.random() * 2.5;
    ctx.fillRect(Math.random() * width, Math.random() * height, size, size);
  }
  ctx.globalAlpha = 1;
}

export function createGrassTexture(): THREE.CanvasTexture {
  const size = 512;
  return createCanvasTexture(size, size, ctx => {
    ctx.fillStyle = '#5b7a4d';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const palettes = ['#6d8b5b', '#4e6c43', '#7d9666', '#55784d', '#8ca06f'];
      ctx.strokeStyle = palettes[Math.floor(Math.random() * palettes.length)];
      ctx.globalAlpha = 0.35 + Math.random() * 0.4;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 6, y - 2 - Math.random() * 5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    speckle(ctx, size, size, 500, ['#ddcaa3', '#405c39'], 0.22);
  });
}

export function createCobbleTexture(): THREE.CanvasTexture {
  const size = 512;
  return createCanvasTexture(size, size, ctx => {
    ctx.fillStyle = '#a89779';
    ctx.fillRect(0, 0, size, size);
    const cellW = 64;
    const cellH = 46;
    const colors = ['#c9b896', '#bea980', '#d5c4a1', '#b3a07f', '#c1ac88', '#cab794'];
    for (let row = -1; row < size / cellH + 1; row++) {
      for (let col = -1; col < size / cellW + 1; col++) {
        const offset = row % 2 === 0 ? 0 : cellW / 2;
        const x = col * cellW + offset + 3;
        const y = row * cellH + 3;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        const r = 10;
        const w = cellW - 7;
        const h = cellH - 7;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,65,45,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    speckle(ctx, size, size, 800, ['#6b5d45', '#f0e2c7'], 0.18);
  });
}

export function createAsphaltTexture(): THREE.CanvasTexture {
  const size = 512;
  return createCanvasTexture(size, size, ctx => {
    ctx.fillStyle = '#45484d';
    ctx.fillRect(0, 0, size, size);
    speckle(ctx, size, size, 6000, ['#6a6e73', '#303338', '#85898c', '#202226'], 0.55);
    // Tar seams
    ctx.strokeStyle = 'rgba(20,22,25,0.5)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      let x = Math.random() * size;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < size) {
        y += 20 + Math.random() * 30;
        x += (Math.random() - 0.5) * 22;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

export function createPaverTexture(): THREE.CanvasTexture {
  const size = 512;
  return createCanvasTexture(size, size, ctx => {
    ctx.fillStyle = '#b2a58e';
    ctx.fillRect(0, 0, size, size);
    const cell = 64;
    const colors = ['#c8b99f', '#b9aa90', '#d2c3a8', '#b0a189', '#c4b49a'];
    for (let row = 0; row < size / cell; row++) {
      for (let col = 0; col < size / cell; col++) {
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillRect(col * cell + 2, row * cell + 2, cell - 4, cell - 4);
        ctx.strokeStyle = 'rgba(85,72,52,0.2)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(col * cell + 2, row * cell + 2, cell - 4, cell - 4);
      }
    }
    speckle(ctx, size, size, 900, ['#79694f', '#f1e5d0'], 0.2);
  });
}

export function createKitchenTileTexture(): THREE.CanvasTexture {
  const size = 512;
  return createCanvasTexture(size, size, ctx => {
    ctx.fillStyle = '#d8cbb5';
    ctx.fillRect(0, 0, size, size);
    const cell = 64;
    for (let row = 0; row < size / cell; row++) {
      for (let col = 0; col < size / cell; col++) {
        const even = (row + col) % 2 === 0;
        ctx.fillStyle = even ? '#ded2bd' : '#a9553f';
        ctx.fillRect(col * cell + 3, row * cell + 3, cell - 6, cell - 6);
        ctx.strokeStyle = 'rgba(70,50,40,0.18)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(col * cell + 3, row * cell + 3, cell - 6, cell - 6);
      }
    }
    speckle(ctx, size, size, 500, ['#8e7c62', '#fff4df'], 0.15);
  });
}

export function createStuccoTexture(base: string = '#f3e7cf'): THREE.CanvasTexture {
  const size = 256;
  return createCanvasTexture(size, size, ctx => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    speckle(ctx, size, size, 3500, ['#ffffff', '#b7a98f', '#d9cbb2'], 0.18);
    ctx.strokeStyle = 'rgba(120,105,85,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      ctx.lineTo(Math.random() * size, Math.random() * size);
      ctx.stroke();
    }
  });
}

export function createWoodTexture(): THREE.CanvasTexture {
  const size = 256;
  return createCanvasTexture(size, size, ctx => {
    ctx.fillStyle = '#8a5a36';
    ctx.fillRect(0, 0, size, size);
    const plank = 32;
    for (let row = 0; row < size / plank; row++) {
      ctx.fillStyle = row % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
      ctx.fillRect(0, row * plank, size, plank);
      ctx.strokeStyle = 'rgba(40,22,12,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, row * plank);
      ctx.lineTo(size, row * plank);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(55,30,15,0.2)';
    for (let i = 0; i < 60; i++) {
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + 4, size * 0.6, y - 4, size, y + 2);
      ctx.stroke();
    }
  });
}

let glowTexture: THREE.CanvasTexture | null = null;
let contactShadowMaterial: THREE.MeshBasicMaterial | null = null;

/** Soft additive halo for lanterns, bulbs and other warm night lights. */
export function createGlowSprite(
  color: number | string,
  size: number = 1,
  opacity: number = 0.4
): THREE.Sprite {
  if (!glowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.18, 'rgba(255,255,255,0.86)');
      gradient.addColorStop(0.46, 'rgba(255,255,255,0.3)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    glowTexture = new THREE.CanvasTexture(canvas);
    glowTexture.colorSpace = THREE.SRGBColorSpace;
  }

  const material = new THREE.SpriteMaterial({
    map: glowTexture,
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(size, size, 1);
  sprite.renderOrder = 4;
  return sprite;
}

/**
 * Shared soft blob used beneath villagers. Real sun shadows ground the scene in
 * daylight; this subtle contact shadow keeps characters anchored at dusk and
 * under the café awning where the directional light is blocked.
 */
export function getContactShadowMaterial(): THREE.MeshBasicMaterial {
  if (!contactShadowMaterial) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      gradient.addColorStop(0, 'rgba(8,12,8,0.58)');
      gradient.addColorStop(0.52, 'rgba(8,12,8,0.28)');
      gradient.addColorStop(1, 'rgba(8,12,8,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    contactShadowMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.75,
      toneMapped: false
    });
  }
  return contactShadowMaterial;
}

export function createSunburstTexture(inner: string = '#f6e7c8', outer: string = '#c9a35c'): THREE.CanvasTexture {
  const size = 512;
  return createCanvasTexture(size, size, ctx => {
    ctx.fillStyle = inner;
    ctx.fillRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    ctx.fillStyle = outer;
    for (let i = 0; i < 24; i++) {
      ctx.rotate((Math.PI * 2) / 24);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size * 0.6, 18);
      ctx.lineTo(size * 0.6, -18);
      ctx.closePath();
      ctx.globalAlpha = 0.18;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.27, 0, Math.PI * 2);
    ctx.fillStyle = outer;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = inner;
    ctx.fill();
  });
}
