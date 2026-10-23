import * as THREE from 'three';
import { AssetBuilder } from './AssetBuilder';
import { gameStore } from './GameStore';
import { audioManager } from './AudioManager';
import type { ProximityTarget, Customer, StaffMember } from '../types/game';
import { WORLD_LAYOUT } from '../data/worldLayout';
import { RECIPES } from '../data/recipes';
import { CROPS } from '../data/crops';
import { BUILDINGS } from '../data/buildings';
import {
  addBox,
  addMesh,
  createAsphaltTexture,
  createCobbleTexture,
  createGrassTexture,
  createKitchenTileTexture,
  createPaverTexture,
  createGlowSprite,
  createStuccoTexture,
  createTextTexture,
  getEmissiveMaterial,
  getMaterial
} from './assets/materials';

interface Obstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface BuildingVisualBuild {
  group: THREE.Group;
  light?: THREE.PointLight;
  spinner?: THREE.Mesh;
  water?: THREE.Mesh;
  jet?: THREE.Mesh;
}

interface LampGlow {
  sprite: THREE.Sprite;
  baseOpacity: number;
}

interface CustomerVisual {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  labelSprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  facing: number;
  walkPhase: number;
  labelKey: string;
}

interface StaffVisual {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  phase: number;
}

interface TrafficCar {
  group: THREE.Group;
  wheels: THREE.Group[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  direction: number;
  speed: number;
  laneZ: number;
}

interface AmbientWalker {
  group: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  z: number;
  dir: number;
  speed: number;
  phase: number;
}

interface SkyKeyframe {
  t: number;
  top: string;
  bottom: string;
  horizon: string;
}

const SKY_KEYFRAMES: SkyKeyframe[] = [
  { t: 0.0, top: '#050b1e', bottom: '#1b2740', horizon: '#27304c' },
  { t: 0.2, top: '#1d2d4d', bottom: '#7b5b67', horizon: '#c17b61' },
  { t: 0.27, top: '#5886b2', bottom: '#e3a279', horizon: '#f3c08c' },
  { t: 0.38, top: '#5b9fd9', bottom: '#d9e4df', horizon: '#f3dec1' },
  { t: 0.58, top: '#4a91d4', bottom: '#cfe4e9', horizon: '#f0e5c8' },
  { t: 0.72, top: '#5b77a6', bottom: '#efb07d', horizon: '#f2a268' },
  { t: 0.8, top: '#31436d', bottom: '#a26870', horizon: '#c47b65' },
  { t: 0.88, top: '#111b35', bottom: '#3d3f58', horizon: '#665263' },
  { t: 1.0, top: '#050b1e', bottom: '#1b2740', horizon: '#27304c' }
];

function colorBetween(a: THREE.Color, b: THREE.Color, t: number, out: THREE.Color): THREE.Color {
  return out.copy(a).lerp(b, t);
}

function smoothAngle(current: number, target: number, delta: number, speed: number = 11): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * Math.min(1, delta * speed);
}

export class WorldScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private lastFrameTime: number = performance.now();

  // Lights & atmosphere
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private lampLights: THREE.PointLight[] = [];
  private windowGlowMaterials: THREE.MeshStandardMaterial[] = [];
  private skyMaterial!: THREE.ShaderMaterial;
  private sunMesh!: THREE.Mesh;
  private sunHalo!: THREE.Mesh;
  private moonMesh!: THREE.Mesh;
  private stars!: THREE.Points;
  private baseSunIntensity: number = 2.25;
  private starMaterial!: THREE.PointsMaterial;

  // Player
  public playerGroup!: THREE.Group;
  private playerLeftLeg!: THREE.Mesh;
  private playerRightLeg!: THREE.Mesh;
  private playerLeftArm!: THREE.Mesh;
  private playerRightArm!: THREE.Mesh;
  public playerPos: THREE.Vector3 = new THREE.Vector3(WORLD_LAYOUT.spawn.x, 0, WORLD_LAYOUT.spawn.z);
  private playerFacingAngle: number = Math.PI;
  private walkCycle: number = 0;

  // Camera
  private cameraDistance: number = 13.2;
  private cameraMinDistance: number = 5.5;
  private cameraMaxDistance: number = 18.5;
  private cameraAzimuth: number = 0;
  private cameraElevation: number = 0.5;
  private isOrbiting: boolean = false;
  private prevMouseX: number = 0;
  private prevMouseY: number = 0;

  // World visuals
  private farmPlotMeshes: Map<number, THREE.Group> = new Map();
  private customerMeshes: Map<string, CustomerVisual> = new Map();
  private staffMeshes: Map<string, StaffVisual> = new Map();
  private buildingMeshes: Map<string, THREE.Group> = new Map();
  private buildingObstacles: Obstacle[] = [];
  private buildingObstacleKey: string = '';
  private sprinklerSpinners: THREE.Mesh[] = [];
  private buildingWaters: THREE.Mesh[] = [];
  private buildingJets: THREE.Mesh[] = [];
  private lampGlows: LampGlow[] = [];
  private clouds: THREE.Group[] = [];
  private birds: THREE.Group[] = [];
  private ambientWalkers: AmbientWalker[] = [];
  private trafficCars: TrafficCar[] = [];

  // Weather & particles
  private rainParticles: THREE.Points | null = null;
  private rainGeometry: THREE.BufferGeometry | null = null;
  private smokePuffs: THREE.Mesh[] = [];
  private espressoPuffs: THREE.Mesh[] = [];
  private fireflies: THREE.Points | null = null;
  private firefliesGeometry: THREE.BufferGeometry | null = null;
  private fireflyBasePositions: Float32Array | null = null;
  private fountainJet: THREE.Mesh | null = null;
  private fountainWater: THREE.Mesh | null = null;
  private nightFactor: number = 0;
  private stormFlash: number = 0;

  // Build mode preview
  private placementGhost: THREE.Group | null = null;
  private placementGhostType: string | null = null;
  private placementGhostMaterials: THREE.MeshStandardMaterial[] = [];
  private placementFootprint: THREE.Group | null = null;
  private placementFootprintPlane: THREE.Mesh | null = null;
  private placementOutline: THREE.LineLoop | null = null;
  private placementGrid: THREE.GridHelper | null = null;
  private placementValidity: boolean | null = null;

  // Interaction
  public prepStationPos = new THREE.Vector3(WORLD_LAYOUT.stations.prep.x, 0, WORLD_LAYOUT.stations.prep.z);
  public ovenStationPos = new THREE.Vector3(WORLD_LAYOUT.stations.oven.x, 0, WORLD_LAYOUT.stations.oven.z);
  public counterStationPos = new THREE.Vector3(WORLD_LAYOUT.stations.counter.x, 0, WORLD_LAYOUT.stations.counter.z);
  public cafeStationPos = new THREE.Vector3(WORLD_LAYOUT.stations.espresso.x, 0, WORLD_LAYOUT.stations.espresso.z);
  private interactionRing!: THREE.Mesh;

  // Input
  private keysPressed: Record<string, boolean> = {};
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  private clickMoveTarget: THREE.Vector3 | null = null;
  private clickMarker!: THREE.Mesh;

  private obstacles: Obstacle[] = [];
  private animationFrameId: number | null = null;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xbdd5d8, 0.0085);

    const width = container.clientWidth || window.innerWidth || 1280;
    const height = container.clientHeight || window.innerHeight || 720;
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 180);
    this.camera.position.set(
      this.playerPos.x + this.cameraDistance * Math.sin(this.cameraAzimuth) * Math.cos(this.cameraElevation),
      this.playerPos.y + this.cameraDistance * Math.sin(this.cameraElevation),
      this.playerPos.z + this.cameraDistance * Math.cos(this.cameraAzimuth) * Math.cos(this.cameraElevation)
    );
    this.camera.lookAt(new THREE.Vector3(this.playerPos.x, 1.3, this.playerPos.z));

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.setupLights();
    this.createSky();
    this.buildGroundAndRoad();
    this.buildCafe();
    this.buildPatio();
    this.buildFarmEnclosure();
    this.buildTownAndScenery();
    this.buildTraffic();
    this.buildAmbientLife();
    this.buildWeatherParticles();
    this.buildInteractionMarkers();
    this.buildPlacementGrid();

    const chef = AssetBuilder.createChef();
    this.playerGroup = chef.group;
    this.playerLeftLeg = chef.leftLeg;
    this.playerRightLeg = chef.rightLeg;
    this.playerLeftArm = chef.leftArm;
    this.playerRightArm = chef.rightArm;
    this.playerGroup.position.copy(this.playerPos);
    this.playerGroup.rotation.y = this.playerFacingAngle;
    this.scene.add(this.playerGroup);

    this.bindEvents();
    if (import.meta.env.DEV) {
      (window as unknown as { __worldScene?: WorldScene }).__worldScene = this;
    }
    this.animate();
  }

  private setupLights(): void {
    this.ambientLight = new THREE.AmbientLight(0xffead1, 0.52);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xcfe8ff, 0x5b4b36, 0.55);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff1dd, this.baseSunIntensity);
    this.dirLight.position.set(26, 34, 18);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 110;
    const shadow = 34;
    this.dirLight.shadow.camera.left = -shadow;
    this.dirLight.shadow.camera.right = shadow;
    this.dirLight.shadow.camera.top = shadow;
    this.dirLight.shadow.camera.bottom = -shadow;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
  }

  private createSky(): void {
    const uniforms = {
      topColor: { value: new THREE.Color('#4f96d4') },
      bottomColor: { value: new THREE.Color('#e2ddc5') },
      horizonColor: { value: new THREE.Color('#f3d3a0') },
      offset: { value: 12 },
      exponent: { value: 0.72 }
    };

    this.skyMaterial = new THREE.ShaderMaterial({
      uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          float up = max(pow(max(h, 0.0), exponent), 0.0);
          vec3 sky = mix(bottomColor, topColor, up);
          float horizon = pow(1.0 - clamp(abs(h), 0.0, 1.0), 9.0);
          sky = mix(sky, horizonColor, horizon * 0.55);
          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });

    const dome = new THREE.Mesh(new THREE.SphereGeometry(110, 32, 18), this.skyMaterial);
    dome.renderOrder = -10;
    this.scene.add(dome);

    // Stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.95);
      const r = 96 + Math.random() * 8;
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.cos(phi) * r + 8;
      positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xfdf6df,
      size: 0.34,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      fog: false
    });
    this.stars = new THREE.Points(starGeometry, this.starMaterial);
    this.stars.visible = false;
    this.scene.add(this.stars);

    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff4c9, fog: false });
    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(3.1, 18, 12), sunMat);
    this.scene.add(this.sunMesh);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xffe4a6, transparent: true, opacity: 0.16, fog: false, depthWrite: false });
    this.sunHalo = new THREE.Mesh(new THREE.SphereGeometry(5.3, 18, 12), haloMat);
    this.scene.add(this.sunHalo);

    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe9eef7, fog: false });
    this.moonMesh = new THREE.Mesh(new THREE.SphereGeometry(2.3, 16, 12), moonMat);
    this.scene.add(this.moonMesh);
  }

  private texturedMaterial(texture: THREE.Texture, repeatX: number, repeatY: number, roughness: number = 0.92): THREE.MeshStandardMaterial {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = 4;
    return new THREE.MeshStandardMaterial({ map: texture, roughness, metalness: 0.01 });
  }

  private buildGroundAndRoad(): void {
    // Meadow
    const grassMat = this.texturedMaterial(createGrassTexture(), 38, 32, 1);
    const ground = addMesh(this.scene, new THREE.PlaneGeometry(150, 130), grassMat, 0, 0, 4, { rotX: -Math.PI / 2, receive: true });

    // Warm sun-baked meadow patches around the plaza
    const patchMat = new THREE.MeshStandardMaterial({ color: 0x7b8f5d, roughness: 1, transparent: true, opacity: 0.32 });
    for (let i = 0; i < 12; i++) {
      addMesh(this.scene, new THREE.CircleGeometry(2.5 + Math.random() * 4, 12), patchMat, (Math.random() - 0.5) * 55, 0.012, (Math.random() - 0.5) * 48, {
        rotX: -Math.PI / 2
      });
    }

    // Stone promenade from the café to the crosswalk
    const paverMat = this.texturedMaterial(createPaverTexture(), 4, 14, 0.9);
    addBox(this.scene, 4.8, 0.1, 15.5, paverMat, 0, 0.05, 2.1, 0.02, { receive: true });

    // Café/piazza stone apron
    const cobbleMat = this.texturedMaterial(createCobbleTexture(), 10, 8, 0.9);
    addBox(this.scene, 21, 0.08, 16.5, cobbleMat, -1.2, 0.035, -1.0, 0.02, { receive: true });

    // Patio pavers
    const patioMat = this.texturedMaterial(createPaverTexture(), 5, 6, 0.9);
    addBox(this.scene, 9.4, 0.085, 10.4, patioMat, 10.6, 0.045, -0.6, 0.02, { receive: true });

    // Road
    const asphaltMat = this.texturedMaterial(createAsphaltTexture(), 20, 2, 0.96);
    addBox(this.scene, 78, 0.12, 5, asphaltMat, 0, 0.06, WORLD_LAYOUT.road.centerZ, 0.01, { receive: true });

    // Sidewalks
    const sidewalkTex = this.texturedMaterial(createPaverTexture(), 30, 2, 0.9);
    addBox(this.scene, 78, 0.14, 3.5, sidewalkTex, 0, 0.07, WORLD_LAYOUT.sidewalk.northCenterZ, 0.02, { receive: true });
    addBox(this.scene, 78, 0.14, 3.5, sidewalkTex, 0, 0.07, WORLD_LAYOUT.sidewalk.southCenterZ, 0.02, { receive: true });

    // Curbs
    const curbMat = getMaterial('#cfc3ad', 0.9, 0.02);
    addBox(this.scene, 78, 0.24, 0.22, curbMat, 0, 0.12, 9.42, 0.03, { receive: true });
    addBox(this.scene, 78, 0.24, 0.22, curbMat, 0, 0.12, 14.58, 0.03, { receive: true });

    // Crosswalk
    const paintMat = getMaterial('#e8e1c8', 0.85, 0.02);
    for (let i = 0; i < 8; i++) {
      addBox(this.scene, 3.1, 0.022, 0.48, paintMat, 0, 0.136, 9.9 + i * 0.59, 0.01);
    }
    addBox(this.scene, 0.55, 0.022, 4.8, paintMat, -1.9, 0.136, 12, 0.01);
    addBox(this.scene, 0.55, 0.022, 4.8, paintMat, 1.9, 0.136, 12, 0.01);

    // Lane markings
    const lineMat = getMaterial('#d9d1b5', 0.92, 0.01);
    for (let x = -36; x <= 36; x += 4.2) {
      addBox(this.scene, 2.0, 0.02, 0.11, lineMat, x, 0.132, 12, 0.01);
    }
    addBox(this.scene, 76, 0.02, 0.08, lineMat, 0, 0.132, 9.7, 0.01);
    addBox(this.scene, 76, 0.02, 0.08, lineMat, 0, 0.132, 14.3, 0.01);

    // Parking bay ticks along the curb
    for (let x = -30; x <= 30; x += 5.5) {
      addBox(this.scene, 0.08, 0.018, 1.15, lineMat, x, 0.132, 10.05, 0.008);
      addBox(this.scene, 0.08, 0.018, 1.15, lineMat, x, 0.132, 13.95, 0.008);
    }

    // Manhole covers and storm drains
    const metalMat = getMaterial('#5d5a52', 0.45, 0.55);
    [[-8.5, 10.8], [7.2, 13.2], [22, 11.2]].forEach(([x, z]) => {
      addMesh(this.scene, new THREE.CylinderGeometry(0.44, 0.44, 0.035, 16), metalMat, x, 0.135, z);
      addMesh(this.scene, new THREE.TorusGeometry(0.42, 0.02, 4, 16), getMaterial('#393733', 0.5, 0.5), x, 0.14, z, { rotX: Math.PI / 2 });
    });
    [-20, -4, 12, 28].forEach(x => {
      addBox(this.scene, 0.8, 0.02, 0.22, getMaterial('#36342f', 0.55, 0.4), x, 0.145, 9.52, 0.02);
      addBox(this.scene, 0.8, 0.02, 0.22, getMaterial('#36342f', 0.55, 0.4), x, 0.145, 14.48, 0.02);
    });

    // Low stone boundary wall along the far sidewalk with planting gaps
    const wallMat = getMaterial('#c1af92', 0.95, 0.01);
    [-28, -19, -10, 8, 17, 26].forEach(x => {
      addBox(this.scene, 7.2, 0.65, 0.55, wallMat, x, 0.33, 19.1, 0.05, { receive: true, cast: true });
      addBox(this.scene, 7.4, 0.11, 0.72, getMaterial('#a9977a', 0.95, 0.01), x, 0.7, 19.1, 0.02);
    });

    ground.receiveShadow = true;
  }

  private buildCafe(): void {
    const c = WORLD_LAYOUT.cafe;
    const left = c.centerX - c.width / 2;
    const right = c.centerX + c.width / 2;
    const stuccoTex = createStuccoTexture('#f2e4ca');
    const stuccoMat = this.texturedMaterial(stuccoTex, 3, 2, 0.95);
    const trimMat = getMaterial('#c9a35c', 0.75, 0.1);
    const StoneMat = getMaterial('#c7b697', 0.95, 0.02);
    const darkWoodMat = getMaterial('#52371f', 0.9, 0.02);
    const roofMat = getMaterial('#a6543b', 0.9, 0.01);
    const floorTex = createKitchenTileTexture();
    const floorMat = this.texturedMaterial(floorTex, 5, 3, 0.75);

    // Raised stone foundation and tiled kitchen floor
    addBox(this.scene, c.width + 0.7, 0.2, 6.6, StoneMat, c.centerX, 0.1, -7.3, 0.05, { receive: true, cast: true });
    addBox(this.scene, c.width - 0.2, 0.04, 6.2, floorMat, c.centerX, 0.215, -7.25, 0.01, { receive: true });

    // Walls
    addBox(this.scene, c.width, c.wallHeight, 0.55, stuccoMat, c.centerX, c.wallHeight / 2 + 0.2, c.backZ + 0.18, 0.04, { cast: true, receive: true });
    addBox(this.scene, 0.55, 3.95, 6.3, stuccoMat, left + 0.28, 1.98, -7.3, 0.04, { cast: true, receive: true });
    addBox(this.scene, 0.55, 3.95, 6.3, stuccoMat, right - 0.28, 1.98, -7.3, 0.04, { cast: true, receive: true });

    // Stone wainscoting and corner quoins
    addBox(this.scene, c.width + 0.25, 0.5, 0.62, StoneMat, c.centerX, 0.45, c.backZ + 0.16, 0.03, { receive: true });
    [left, right].forEach(x => {
      addBox(this.scene, 0.64, 0.5, 6.4, StoneMat, x, 0.45, -7.3, 0.03);
      for (let i = 0; i < 5; i++) {
        addBox(this.scene, 0.66, 0.42, 0.28, trimMat, x, 1.0 + i * 0.62, c.frontZ - 0.2, 0.02);
      }
    });

    // Gable front above the open kitchen
    const gableHeight = 1.85;
    const shape = new THREE.Shape();
    shape.moveTo(-c.width / 2 - 0.2, 0);
    shape.lineTo(c.width / 2 + 0.2, 0);
    shape.lineTo(0, gableHeight);
    shape.closePath();
    const gable = addMesh(this.scene, new THREE.ExtrudeGeometry(shape, { depth: 0.32, bevelEnabled: false }), stuccoMat, c.centerX, 4.15, c.frontZ - 0.33);
    gable.castShadow = true;

    // Roof slopes
    const roofAngle = Math.atan2(gableHeight, c.width / 2);
    const roofSlope = Math.sqrt((c.width / 2) ** 2 + gableHeight ** 2) + 0.45;
    addBox(this.scene, roofSlope, 0.24, 6.9, roofMat, c.centerX - c.width / 4, 4.15 + gableHeight / 2, -7.3, 0.06, {
      rotZ: roofAngle,
      cast: true
    });
    addBox(this.scene, roofSlope, 0.24, 6.9, roofMat, c.centerX + c.width / 4, 4.15 + gableHeight / 2, -7.3, 0.06, {
      rotZ: -roofAngle,
      cast: true
    });
    addMesh(this.scene, new THREE.CylinderGeometry(0.11, 0.11, 7.0, 8), getMaterial('#8d3f2d', 0.9, 0.01), c.centerX, 4.15 + gableHeight + 0.08, -7.3, {
      rotX: Math.PI / 2
    });

    // Main sign on the gable
    const signTexture = createTextTexture('SLICE & SPROUT', {
      width: 1024,
      height: 240,
      background: '#263a30',
      foreground: '#f6e7c2',
      border: '#d2ad68',
      fontSize: 116,
      subtitle: 'pizzeria · fattoria · caffè'
    });
    addBox(this.scene, 6.2, 1.42, 0.12, darkWoodMat, c.centerX, 4.92, c.frontZ - 0.02, 0.04, { cast: true });
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(5.95, 1.2),
      new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.72, metalness: 0.04 })
    );
    sign.position.set(c.centerX, 4.92, c.frontZ + 0.05);
    this.scene.add(sign);

    // Open-front timber frame and awning
    const beamMat = getMaterial('#6e4a2a', 0.9, 0.02);
    addBox(this.scene, c.width + 0.3, 0.28, 0.3, beamMat, c.centerX, 3.72, c.frontZ, 0.04, { cast: true });
    [-5.8, 1.6].forEach(x => addBox(this.scene, 0.28, 3.65, 0.28, beamMat, x, 1.83, c.frontZ, 0.03, { cast: true }));

    const awning = AssetBuilder.createAwning(8.2, 2.9, '#f4ead4', '#b5523b');
    awning.position.set(-1.4, 3.15, -2.65);
    this.scene.add(awning);
    [-5.4, 2.6].forEach(x => {
      addBox(this.scene, 0.12, 3.0, 0.12, darkWoodMat, x, 1.5, -1.28, 0.02, { cast: true });
      addMesh(this.scene, new THREE.SphereGeometry(0.13, 8, 6), trimMat, x, 3.05, -1.28);
    });

    // Hanging bulbs beneath the awning
    const bulbMat = getEmissiveMaterial('#ffdca0', 0.55, '#ffe6b8');
    for (let i = 0; i < 6; i++) {
      const x = -4.9 + i * 1.45;
      addMesh(this.scene, new THREE.CylinderGeometry(0.012, 0.012, 0.4, 4), getMaterial('#2d2924', 0.7, 0.2), x, 2.85, -2.1);
      addMesh(this.scene, new THREE.SphereGeometry(0.08, 7, 5), bulbMat, x, 2.61, -2.1);
      this.addLampGlowAt(x, 2.58, -2.05, 0xffc978, 0.72, 0.4);
    }

    // Counter and kitchen stations
    const counter = AssetBuilder.createServingCounter();
    counter.position.set(WORLD_LAYOUT.stations.counter.x, 0.22, WORLD_LAYOUT.stations.counter.z);
    this.scene.add(counter);
    this.addObstacle(-1.85, 1.85, WORLD_LAYOUT.stations.counter.z - 0.75, WORLD_LAYOUT.stations.counter.z + 0.75);

    const prep = AssetBuilder.createPrepCounter();
    prep.position.set(WORLD_LAYOUT.stations.prep.x, 0.22, WORLD_LAYOUT.stations.prep.z);
    this.scene.add(prep);
    this.addObstacle(WORLD_LAYOUT.stations.prep.x - 1.55, WORLD_LAYOUT.stations.prep.x + 1.55, WORLD_LAYOUT.stations.prep.z - 0.72, WORLD_LAYOUT.stations.prep.z + 0.72);

    const oven = AssetBuilder.createPizzaOven();
    oven.position.set(WORLD_LAYOUT.stations.oven.x, 0.22, WORLD_LAYOUT.stations.oven.z);
    this.scene.add(oven);
    this.addObstacle(WORLD_LAYOUT.stations.oven.x - 1.38, WORLD_LAYOUT.stations.oven.x + 1.38, WORLD_LAYOUT.stations.oven.z - 1.3, WORLD_LAYOUT.stations.oven.z + 1.3);
    const ovenFire = oven.userData.fireLight as THREE.PointLight | undefined;
    if (ovenFire) this.lampLights.push(ovenFire);

    const espresso = AssetBuilder.createEspressoBar();
    espresso.group.position.set(WORLD_LAYOUT.stations.espresso.x, 0.08, WORLD_LAYOUT.stations.espresso.z);
    this.scene.add(espresso.group);
    this.addObstacle(WORLD_LAYOUT.stations.espresso.x - 1.25, WORLD_LAYOUT.stations.espresso.x + 1.25, WORLD_LAYOUT.stations.espresso.z - 0.8, WORLD_LAYOUT.stations.espresso.z + 0.8);

    // Espresso steam puffs
    const steamMat = new THREE.MeshStandardMaterial({ color: 0xf7f2e8, transparent: true, opacity: 0.4, roughness: 1, depthWrite: false });
    for (let i = 0; i < 5; i++) {
      const puff = addMesh(espresso.steamAnchor, new THREE.SphereGeometry(0.09 + (i % 3) * 0.025, 7, 5), steamMat, 0, 0, 0, {
        scaleY: 1.3
      });
      puff.userData.phase = i / 5;
      this.espressoPuffs.push(puff);
    }

    // Oven chimney smoke
    const smokeMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c6, transparent: true, opacity: 0.24, roughness: 1, depthWrite: false });
    for (let i = 0; i < 8; i++) {
      const puff = addMesh(this.scene, new THREE.SphereGeometry(0.3 + Math.random() * 0.16, 7, 5), smokeMat, WORLD_LAYOUT.stations.oven.x, 3.6 + i * 0.22, WORLD_LAYOUT.stations.oven.z - 0.52, {
        scaleY: 1.15
      });
      puff.userData.phase = i / 8;
      this.smokePuffs.push(puff);
    }

    // Back wall shelves, jars, copper pans and menu
    addBox(this.scene, 8.3, 0.12, 0.42, darkWoodMat, -1.5, 2.6, c.backZ + 0.48, 0.02, { cast: true });
    addBox(this.scene, 8.3, 0.1, 0.36, darkWoodMat, -1.5, 3.35, c.backZ + 0.46, 0.02);
    const jarColors = ['#d9b36a', '#b04a3c', '#66834d', '#e6d5a9', '#8e5d3c'];
    for (let i = 0; i < 12; i++) {
      const x = -5.0 + i * 0.64;
      const jar = addMesh(this.scene, new THREE.CylinderGeometry(0.14, 0.12, 0.28 + (i % 3) * 0.06, 8), getMaterial(jarColors[i % jarColors.length], 0.45, 0.05, true, 0.8), x, 2.82, c.backZ + 0.47);
      jar.castShadow = false;
      addMesh(this.scene, new THREE.CylinderGeometry(0.15, 0.15, 0.045, 8), trimMat, x, 3.0, c.backZ + 0.47);
    }
    for (let i = 0; i < 6; i++) {
      const x = -5.4 + i * 1.0;
      addMesh(this.scene, new THREE.CylinderGeometry(0.19, 0.19, 0.06, 12), getMaterial('#b46b3d', 0.4, 0.6), x, 3.56, c.backZ + 0.52, { rotX: Math.PI / 2 });
      addBox(this.scene, 0.05, 0.28, 0.05, getMaterial('#5b3a22', 0.8, 0.1), x, 3.85, c.backZ + 0.52, 0.01);
    }
    const menuTexture = createTextTexture('CUCINA', {
      width: 640,
      height: 320,
      background: '#27372f',
      foreground: '#f1dfba',
      border: '#b58e4e',
      fontSize: 94,
      subtitle: 'wood fired · farm fresh'
    });
    const wallMenu = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.05), new THREE.MeshStandardMaterial({ map: menuTexture, roughness: 0.8 }));
    wallMenu.position.set(-4.6, 2.05, c.backZ + 0.51);
    wallMenu.rotation.y = 0;
    this.scene.add(wallMenu);

    // Wine rack
    addBox(this.scene, 1.25, 2.0, 0.38, darkWoodMat, 3.7, 1.3, c.backZ + 0.52, 0.03, { cast: true });
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const bottle = addMesh(this.scene, new THREE.CylinderGeometry(0.07, 0.09, 0.5, 8), getMaterial(col === 1 ? '#722f2c' : '#3e5b3b', 0.35, 0.1, true, 0.88), 3.25 + col * 0.42, 0.62 + row * 0.52, c.backZ + 0.72, {
          rotX: Math.PI / 2
        });
        bottle.castShadow = false;
        addMesh(this.scene, new THREE.CylinderGeometry(0.045, 0.045, 0.13, 6), getMaterial('#c9a35c', 0.4, 0.6), 3.25 + col * 0.42, 0.62 + row * 0.52, c.backZ + 0.99, { rotX: Math.PI / 2 });
      }
    }

    // Warm windows in the rear wall
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xffdd9c,
      emissive: 0xffb45b,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9
    });
    this.windowGlowMaterials.push(glowMat);
    [-4.2, 1.0, 3.4].forEach(x => {
      addBox(this.scene, 1.15, 1.5, 0.1, darkWoodMat, x, 3.0, c.backZ + 0.5, 0.03);
      addBox(this.scene, 0.92, 1.28, 0.05, glowMat, x, 3.0, c.backZ + 0.56, 0.01);
      addBox(this.scene, 0.05, 1.3, 0.06, darkWoodMat, x, 3.0, c.backZ + 0.59, 0.01);
      addBox(this.scene, 0.94, 0.05, 0.06, darkWoodMat, x, 3.0, c.backZ + 0.59, 0.01);
    });

    // East wall windows facing the patio
    [-7.9, -6.1].forEach(z => {
      addBox(this.scene, 0.1, 1.5, 1.15, darkWoodMat, right - 0.0, 2.85, z, 0.03);
      addBox(this.scene, 0.05, 1.26, 0.9, glowMat, right + 0.06, 2.85, z, 0.01);
      addBox(this.scene, 0.06, 1.28, 0.05, darkWoodMat, right + 0.09, 2.85, z, 0.01);
      const flower = AssetBuilder.createFlowerBox(1.05);
      flower.position.set(right + 0.34, 1.86, z);
      flower.rotation.y = Math.PI / 2;
      this.scene.add(flower);
    });

    // Pendant lamps and a soft interior light
    for (let i = 0; i < 3; i++) {
      const x = -3.0 + i * 3.0;
      addMesh(this.scene, new THREE.CylinderGeometry(0.018, 0.018, 0.65, 4), getMaterial('#2a2621', 0.6, 0.3), x, 3.32, -3.85);
      addMesh(this.scene, new THREE.ConeGeometry(0.27, 0.24, 10, 1, true), trimMat, x, 2.92, -3.85, { rotX: Math.PI });
      addMesh(this.scene, new THREE.SphereGeometry(0.1, 8, 6), getMaterial('#ffd99c', 0.35, 0.02), x, 2.84, -3.85);
    }
    const cafeLight = new THREE.PointLight(0xffc981, 1.2, 10, 2);
    cafeLight.position.set(-0.5, 2.65, -3.6);
    this.scene.add(cafeLight);
    this.lampLights.push(cafeLight);

    // Logs beside the oven, crates and barrels outside
    const crate = AssetBuilder.createCrate();
    crate.position.set(-7.4, 0, -3.5);
    crate.scale.set(0.9, 0.9, 0.9);
    this.scene.add(crate);
    const crate2 = AssetBuilder.createCrate();
    crate2.position.set(-7.3, 0.45, -3.7);
    crate2.scale.set(0.7, 0.7, 0.7);
    crate2.rotation.y = 0.3;
    this.scene.add(crate2);
    const barrel = AssetBuilder.createBarrel();
    barrel.position.set(-8.4, 0, -8.3);
    this.scene.add(barrel);
    const barrel2 = AssetBuilder.createBarrel();
    barrel2.position.set(-8.5, 0, -9.2);
    barrel2.scale.set(0.85, 0.85, 0.85);
    this.scene.add(barrel2);

    const bike = AssetBuilder.createBicycle();
    bike.position.set(5.55, 0, -2.4);
    bike.rotation.y = Math.PI / 2;
    bike.rotation.z = 0;
    this.scene.add(bike);

    const menuBoard = AssetBuilder.createChalkboardMenu('MENU', [
      'Margherita  · 16',
      'Pepperoni   · 22',
      'Basilico    · 18',
      'Espresso    · 4',
      'Limone      · 6'
    ]);
    menuBoard.position.set(-7.0, 0, -2.75);
    menuBoard.rotation.y = 0.18;
    this.scene.add(menuBoard);

    const planterA = AssetBuilder.createPlanterPot();
    planterA.position.set(-7.0, 0, -4.0);
    planterA.scale.set(0.9, 0.9, 0.9);
    this.scene.add(planterA);
    const planterB = AssetBuilder.createPlanterPot();
    planterB.position.set(3.8, 0, -3.2);
    this.scene.add(planterB);

    // Obstacles for the structural shell.
    this.addObstacle(left - 0.3, right + 0.3, c.backZ - 0.4, c.backZ + 0.55);
    this.addObstacle(left - 0.3, left + 0.6, c.backZ, c.frontZ);
    this.addObstacle(right - 0.6, right + 0.3, c.backZ, c.frontZ);
  }

  private buildPatio(): void {
    const patio = WORLD_LAYOUT.patio;
    const woodMat = getMaterial('#6c4b2d', 0.9, 0.02);
    const stoneMat = getMaterial('#d2c2a6', 0.92, 0.02);
    const ironMat = getMaterial('#2e2b27', 0.5, 0.52);
    const bulbMat = getEmissiveMaterial('#ffdaa0', 0.6, '#ffe7bb');

    // Low balustrade along the far edge
    for (let z = patio.minZ + 0.4; z <= patio.maxZ - 0.4; z += 1.4) {
      addBox(this.scene, 0.38, 0.78, 0.38, stoneMat, patio.maxX + 0.15, 0.39, z, 0.03, { cast: true });
      addBox(this.scene, 0.54, 0.12, 0.54, stoneMat, patio.maxX + 0.15, 0.83, z, 0.02);
    }
    addBox(this.scene, 0.32, 0.2, patio.maxZ - patio.minZ - 0.6, stoneMat, patio.maxX + 0.15, 0.7, (patio.minZ + patio.maxZ) / 2, 0.03);
    this.addObstacle(patio.maxX - 0.2, patio.maxX + 0.4, patio.minZ, patio.maxZ);

    // Pergola posts and string lights
    const corners: Array<[number, number]> = [
      [patio.minX + 0.15, patio.minZ + 0.15],
      [patio.maxX - 0.15, patio.minZ + 0.15],
      [patio.minX + 0.15, patio.maxZ - 0.15],
      [patio.maxX - 0.15, patio.maxZ - 0.15]
    ];
    corners.forEach(([x, z]) => {
      addBox(this.scene, 0.15, 3.2, 0.15, woodMat, x, 1.6, z, 0.02, { cast: true });
      addMesh(this.scene, new THREE.ConeGeometry(0.16, 0.2, 6), getMaterial('#c9a35c', 0.5, 0.4), x, 3.28, z);
    });

    const addStringLights = (x1: number, z1: number, x2: number, z2: number) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.hypot(dx, dz);
      const count = Math.max(4, Math.round(length / 0.85));
      const wirePoints: THREE.Vector3[] = [];
      for (let i = 0; i <= count; i++) {
        const t = i / count;
        const x = x1 + dx * t;
        const z = z1 + dz * t;
        const sag = Math.sin(t * Math.PI) * 0.24;
        const wireY = 3.08 - sag;
        wirePoints.push(new THREE.Vector3(x, wireY, z));
        addMesh(this.scene, new THREE.CylinderGeometry(0.012, 0.018, 0.09, 5), ironMat, x, wireY - 0.045, z);
        addMesh(this.scene, new THREE.SphereGeometry(0.06, 8, 6), bulbMat, x, wireY - 0.15, z);
        if (i % 2 === 0) {
          this.addLampGlowAt(x, wireY - 0.17, z, 0xffcf82, 0.5, 0.3);
        }
      }
      const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
      const wire = new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: 0x2e2b27 }));
      this.scene.add(wire);
    };

    addStringLights(patio.minX + 0.15, patio.minZ + 0.15, patio.maxX - 0.15, patio.minZ + 0.15);
    addStringLights(patio.minX + 0.15, patio.maxZ - 0.15, patio.maxX - 0.15, patio.maxZ - 0.15);
    addStringLights(patio.minX + 0.15, patio.minZ + 0.15, patio.minX + 0.15, patio.maxZ - 0.15);
    const patioLight = new THREE.PointLight(0xffc982, 1.0, 10, 2);
    patioLight.position.set((patio.minX + patio.maxX) / 2, 3.0, (patio.minZ + patio.maxZ) / 2);
    this.scene.add(patioLight);
    this.lampLights.push(patioLight);

    // Olive trees in oversized terracotta pots
    [[patio.minX + 0.65, patio.maxZ - 0.7], [patio.maxX - 0.7, patio.maxZ - 0.7]].forEach(([x, z]) => {
      addMesh(this.scene, new THREE.CylinderGeometry(0.46, 0.36, 0.72, 10), getMaterial('#a85d43', 0.9, 0.01), x, 0.36, z, { cast: true });
      addMesh(this.scene, new THREE.CylinderGeometry(0.5, 0.46, 0.09, 10), getMaterial('#8d4d38', 0.9, 0.01), x, 0.74, z);
      const tree = AssetBuilder.createOliveTree();
      tree.position.set(x, 0.72, z);
      tree.scale.set(0.72, 0.72, 0.72);
      this.scene.add(tree);
      this.addObstacle(x - 0.5, x + 0.5, z - 0.5, z + 0.5);
    });

    // Planters and a chalkboard by the patio entrance
    [patio.minX + 0.4, patio.maxX - 0.45].forEach((x, index) => {
      const planter = AssetBuilder.createPlanterPot();
      planter.position.set(x, 0, patio.minZ + 0.75 + index * 7.2);
      this.scene.add(planter);
    });
    const board = AssetBuilder.createChalkboardMenu('TERRAZZA', ['Pizza al forno', 'Vino della casa', 'Espresso · 4', 'Tiramisù · 7']);
    board.position.set(patio.minX + 0.8, 0, patio.minZ + 0.8);
    board.rotation.y = -0.4;
    this.scene.add(board);
  }

  private buildFarmEnclosure(): void {
    const f = WORLD_LAYOUT.farmFence;
    const postMat = getMaterial('#71502f', 0.94, 0.02);
    const railMat = getMaterial('#8a633c', 0.92, 0.02);
    const strawMat = getMaterial('#d2ae62', 0.95, 0);
    const clothMat = getMaterial('#8f4f3c', 0.95, 0);

    const posts: Array<[number, number]> = [];
    for (let x = f.minX; x <= f.maxX + 0.01; x += 1.35) {
      posts.push([x, f.minZ]);
      posts.push([x, f.maxZ]);
    }
    for (let z = f.minZ; z <= f.maxZ + 0.01; z += 1.35) {
      posts.push([f.minX, z]);
      if (z < 2.7 || z > 4.4) posts.push([f.maxX, z]);
    }
    posts.forEach(([x, z]) => {
      const post = AssetBuilder.createWoodenFencePost();
      post.position.set(x, 0, z);
      this.scene.add(post);
    });

    // Horizontal rails (leave the east gate open)
    const addRail = (x: number, z: number, length: number, alongX: boolean, y: number) => {
      addBox(
        this.scene,
        alongX ? length : 0.1,
        0.1,
        alongX ? 0.1 : length,
        railMat,
        x,
        y,
        z,
        0.02,
        { cast: true }
      );
    };
    [0.48, 0.86].forEach(y => {
      addRail((f.minX + f.maxX) / 2, f.minZ, f.maxX - f.minX, true, y);
      addRail((f.minX + f.maxX) / 2, f.maxZ, f.maxX - f.minX, true, y);
      addRail(f.minX, (f.minZ + f.maxZ) / 2, f.maxZ - f.minZ, false, y);
      addRail(f.maxX, (f.minZ + 2.7) / 2, 2.7 - f.minZ, false, y);
      addRail(f.maxX, (4.4 + f.maxZ) / 2, f.maxZ - 4.4, false, y);
    });

    // Gate leaves, swung open toward the plaza
    [2.7, 4.4].forEach((z, index) => {
      const gate = new THREE.Group();
      addBox(gate, 0.08, 1.1, 1.55, railMat, 0, 0.58, 0.775, 0.02);
      for (let i = 0; i < 3; i++) addBox(gate, 0.06, 0.08, 1.4, postMat, 0, 0.2 + i * 0.38, 0.775, 0.01);
      gate.position.set(f.maxX, 0, z);
      gate.rotation.y = index === 0 ? -1.1 : 1.1;
      this.scene.add(gate);
    });

    // Fence collision (east side has the gate gap)
    this.addObstacle(f.minX - 0.15, f.maxX + 0.15, f.minZ - 0.15, f.minZ + 0.15);
    this.addObstacle(f.minX - 0.15, f.maxX + 0.15, f.maxZ - 0.15, f.maxZ + 0.15);
    this.addObstacle(f.minX - 0.15, f.minX + 0.15, f.minZ, f.maxZ);
    this.addObstacle(f.maxX - 0.15, f.maxX + 0.15, f.minZ, 2.7);
    this.addObstacle(f.maxX - 0.15, f.maxX + 0.15, 4.4, f.maxZ);

    // Scarecrow beside the beds
    const scarecrow = new THREE.Group();
    addMesh(scarecrow, new THREE.CylinderGeometry(0.055, 0.07, 2.3, 6), postMat, 0, 1.15, 0, { cast: true });
    addBox(scarecrow, 1.55, 0.08, 0.08, postMat, 0, 1.62, 0, 0.01);
    addBox(scarecrow, 0.52, 0.72, 0.22, clothMat, 0, 1.5, 0, 0.09);
    for (let i = 0; i < 4; i++) addBox(scarecrow, 0.33, 0.04, 0.23, getMaterial(i % 2 ? '#a95c42' : '#c47a52', 0.95, 0), 0, 1.25 + i * 0.18, 0.02, 0.005);
    addMesh(scarecrow, new THREE.SphereGeometry(0.22, 9, 7), strawMat, 0, 2.06, 0);
    addMesh(scarecrow, new THREE.CylinderGeometry(0.42, 0.42, 0.035, 10), strawMat, 0, 2.2, 0);
    addMesh(scarecrow, new THREE.CylinderGeometry(0.19, 0.22, 0.18, 8), strawMat, 0, 2.28, 0);
    addMesh(scarecrow, new THREE.SphereGeometry(0.04, 5, 4), getMaterial('#2b2118', 0.6, 0), -0.075, 2.1, 0.19);
    addMesh(scarecrow, new THREE.SphereGeometry(0.04, 5, 4), getMaterial('#2b2118', 0.6, 0), 0.075, 2.1, 0.19);
    addBox(scarecrow, 0.12, 0.025, 0.02, getMaterial('#5a3a2a', 0.8, 0), 0, 1.98, 0.21, 0.005);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      addMesh(scarecrow, new THREE.CylinderGeometry(0.008, 0.012, 0.25, 3), strawMat, Math.cos(angle) * 0.18, 2.15, Math.sin(angle) * 0.18, {
        rotZ: Math.cos(angle) * 0.6,
        rotX: Math.sin(angle) * 0.6
      });
    }
    scarecrow.position.set(-17.15, 0, 3.4);
    scarecrow.rotation.y = 0.5;
    this.scene.add(scarecrow);

    // Water butt and stacked crates by the gate
    const barrel = AssetBuilder.createBarrel();
    barrel.position.set(-9.05, 0, 5.6);
    barrel.scale.set(0.9, 0.9, 0.9);
    this.scene.add(barrel);
    const crate = AssetBuilder.createCrate();
    crate.position.set(-9.35, 0, 1.25);
    crate.rotation.y = 0.3;
    this.scene.add(crate);

    // Stepping stones leading to the beds
    const pathMat = getMaterial('#b8a98f', 0.95, 0.01);
    for (let i = 0; i < 6; i++) {
      addBox(this.scene, 0.9, 0.035, 0.65, pathMat, -8.1 + i * 1.15, 0.12, 3.55 + Math.sin(i * 1.2) * 0.25, 0.04, {
        rotY: 0.12 * i
      });
    }
  }

  private addObstacle(minX: number, maxX: number, minZ: number, maxZ: number): void {
    this.obstacles.push({ minX, maxX, minZ, maxZ });
  }

  private isBlocked(x: number, z: number, radius: number = 0.34): boolean {
    if (
      x - radius < WORLD_LAYOUT.bounds.minX ||
      x + radius > WORLD_LAYOUT.bounds.maxX ||
      z - radius < WORLD_LAYOUT.bounds.minZ ||
      z + radius > WORLD_LAYOUT.bounds.maxZ
    ) {
      return true;
    }
    for (const obstacle of this.obstacles) {
      if (
        x + radius > obstacle.minX &&
        x - radius < obstacle.maxX &&
        z + radius > obstacle.minZ &&
        z - radius < obstacle.maxZ
      ) {
        return true;
      }
    }
    for (const obstacle of this.buildingObstacles) {
      if (
        x + radius > obstacle.minX &&
        x - radius < obstacle.maxX &&
        z + radius > obstacle.minZ &&
        z - radius < obstacle.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  private buildTownAndScenery(): void {
    const fountain = AssetBuilder.createFountain();
    fountain.group.position.set(WORLD_LAYOUT.fountain.x, 0, WORLD_LAYOUT.fountain.z);
    this.scene.add(fountain.group);
    this.fountainJet = fountain.jet;
    this.fountainWater = fountain.water;
    this.addObstacle(
      WORLD_LAYOUT.fountain.x - WORLD_LAYOUT.fountain.radius,
      WORLD_LAYOUT.fountain.x + WORLD_LAYOUT.fountain.radius,
      WORLD_LAYOUT.fountain.z - WORLD_LAYOUT.fountain.radius,
      WORLD_LAYOUT.fountain.z + WORLD_LAYOUT.fountain.radius
    );

    // Street lamps
    const lampPositions: Array<[number, number]> = [
      [-25, 9.15],
      [-12, 9.15],
      [12.2, 9.15],
      [25.5, 9.15],
      [-18.5, 15.05],
      [6.8, 15.05],
      [22.5, 15.05]
    ];
    lampPositions.forEach(([x, z]) => {
      const lamp = AssetBuilder.createStreetLamp();
      lamp.group.position.set(x, 0.14, z);
      const glow = createGlowSprite(0xffc978, 1.15, 0.48);
      glow.position.set(0, 3.83, 0.56);
      lamp.group.add(glow);
      this.lampGlows.push({ sprite: glow, baseOpacity: 0.48 });
      this.scene.add(lamp.group);
      this.lampLights.push(lamp.light);
    });

    // Benches, bins, hydrant, mailbox and bollards
    const bench = AssetBuilder.createBench();
    bench.position.set(-17.2, 0.14, 8.0);
    this.scene.add(bench);
    this.addObstacle(-18.3, -16.1, 7.7, 8.5);
    const bench2 = AssetBuilder.createBench();
    bench2.position.set(9.2, 0.14, 17.25);
    bench2.rotation.y = Math.PI;
    this.scene.add(bench2);
    this.addObstacle(8.1, 10.3, 16.95, 17.75);

    [[-8.8, 8.25], [17.4, 8.3], [4.5, 17.4]].forEach(([x, z]) => {
      const bin = AssetBuilder.createTrashBin();
      bin.position.set(x, 0.14, z);
      this.scene.add(bin);
    });
    const hydrant = AssetBuilder.createHydrant();
    hydrant.position.set(-1.8, 0.14, 8.7);
    this.scene.add(hydrant);
    const mailbox = AssetBuilder.createMailbox();
    mailbox.position.set(16.5, 0.14, 8.7);
    mailbox.rotation.y = -0.2;
    this.scene.add(mailbox);
    const busStop = AssetBuilder.createBusStop();
    busStop.position.set(-22.6, 0.14, 8.25);
    this.scene.add(busStop);
    this.addObstacle(-24.3, -20.7, 7.6, 8.9);

    [-2.7, -1.65, 1.65, 2.7].forEach(x => {
      const bollard = AssetBuilder.createBollard();
      bollard.position.set(x, 0.14, 9.25);
      this.scene.add(bollard);
    });

    const bike = AssetBuilder.createBicycle();
    bike.position.set(6.2, 0.14, 8.1);
    bike.rotation.y = 0.2;
    this.scene.add(bike);

    // Potted cypress trees marking the promenade
    const cypressSpots: Array<[number, number, number]> = [
      [-29.5, 8.5, 0.9],
      [-14.8, 8.55, 0.8],
      [18.6, 8.55, 0.85],
      [27.5, 8.55, 0.95],
      [-23.5, 18.95, 0.8],
      [-10.5, 19.05, 0.9],
      [13.8, 18.95, 0.85],
      [25.2, 19.0, 0.9]
    ];
    cypressSpots.forEach(([x, z, scale]) => {
      addMesh(this.scene, new THREE.CylinderGeometry(0.45, 0.36, 0.65, 9), getMaterial('#a85d43', 0.9, 0.01), x, 0.32, z, { cast: true });
      addMesh(this.scene, new THREE.CylinderGeometry(0.48, 0.45, 0.07, 9), getMaterial('#8d4d38', 0.9, 0.01), x, 0.65, z);
      const tree = AssetBuilder.createCypressTree();
      tree.position.set(x, 0.64, z);
      tree.scale.setScalar(scale);
      this.scene.add(tree);
    });

    // Meadow trees and farm-edge greenery
    const oliveSpots: Array<[number, number, number]> = [
      [-20.5, -3.0, 1.15],
      [-23.5, 2.2, 1.0],
      [-19.0, 5.9, 0.9],
      [18.5, -8.0, 1.1],
      [20.0, -2.8, 1.0],
      [18.0, 4.8, 0.95],
      [-25.0, 22.8, 1.2],
      [-19.0, 25.3, 1.0],
      [15.0, 25.0, 1.1],
      [23.5, 23.2, 1.05]
    ];
    oliveSpots.forEach(([x, z, scale]) => {
      const tree = AssetBuilder.createOliveTree();
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      tree.rotation.y = Math.random() * Math.PI * 2;
      this.scene.add(tree);
    });

    const cypressSpots2: Array<[number, number, number]> = [
      [-26.5, -6.5, 1.2],
      [-24.0, -11.0, 1.35],
      [-17.5, -12.5, 1.15],
      [17.0, -12.0, 1.25],
      [24.5, -7.0, 1.4],
      [27.0, 1.5, 1.1],
      [-27.8, 13.5, 1.05],
      [28.0, 12.0, 1.2],
      [-28.5, 27.5, 1.35],
      [28.2, 28.8, 1.4]
    ];
    cypressSpots2.forEach(([x, z, scale]) => {
      const tree = AssetBuilder.createCypressTree();
      tree.position.set(x, 0, z);
      tree.scale.setScalar(scale);
      this.scene.add(tree);
    });

    // Lavender field beyond the south wall
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 7; col++) {
        const bush = AssetBuilder.createLavenderBush();
        bush.position.set(-15 + col * 1.65, 0.04, 23.0 + row * 1.9);
        bush.scale.setScalar(0.85 + Math.random() * 0.25);
        this.scene.add(bush);
      }
    }

    // Shrubs, flowers, rocks and garden clutter
    for (let i = 0; i < 22; i++) {
      const x = (Math.random() - 0.5) * 52;
      const z = -12 + Math.random() * 36;
      if (Math.abs(x - WORLD_LAYOUT.cafe.centerX) < 9 && z > -11 && z < 7) continue;
      if (x > 5 && x < 16 && z > -6 && z < 5) continue;
      if (x > -17 && x < -8 && z > 0 && z < 7) continue;
      if (z > 6 && z < 19) continue;
      const shrub = AssetBuilder.createShrub();
      shrub.position.set(x, 0, z);
      shrub.scale.setScalar(0.7 + Math.random() * 0.6);
      this.scene.add(shrub);
    }
    for (let i = 0; i < 18; i++) {
      const x = (Math.random() - 0.5) * 48;
      const z = Math.random() > 0.5 ? -11 + Math.random() * 2 : 20 + Math.random() * 7;
      const flower = AssetBuilder.createFlowerPatch();
      flower.position.set(x, 0, z);
      this.scene.add(flower);
    }
    for (let i = 0; i < 9; i++) {
      const rock = AssetBuilder.createRock();
      rock.position.set((Math.random() - 0.5) * 50, 0, -11 + Math.random() * 40);
      rock.scale.setScalar(0.6 + Math.random() * 0.8);
      this.scene.add(rock);
    }

    // Low stone wall along the northern side of the café meadow
    for (let i = 0; i < 7; i++) {
      const x = -26 + i * 7.2;
      if (x > -6.5 && x < 4.5) continue;
      addBox(this.scene, 5.5, 0.55, 0.5, getMaterial('#c0ae90', 0.95, 0.01), x, 0.28, 6.55, 0.04, { receive: true, cast: true });
    }

    // Town houses across the fields
    const houseData: Array<[number, string | undefined]> = [
      [-18.5, 'TRATTORIA'],
      [-6.4, 'GELATERIA'],
      [5.8, 'FIORI'],
      [18.0, undefined]
    ];
    houseData.forEach(([x, sign], index) => {
      const house = AssetBuilder.createTownHouse(index, sign);
      house.position.set(x, 0, WORLD_LAYOUT.town.firstZ);
      house.rotation.y = Math.PI;
      this.scene.add(house);
    });
    const tower = AssetBuilder.createBellTower();
    tower.position.set(25.5, 0, 45.5);
    tower.rotation.y = -0.12;
    this.scene.add(tower);

    // Distant hills
    const hillData: Array<[number, number, number, number, string]> = [
      [-42, -48, 30, 11, '#8fa17d'],
      [34, -55, 36, 14, '#95a683'],
      [0, -70, 48, 17, '#a3b191'],
      [-60, 15, 34, 12, '#93a17f'],
      [64, 10, 40, 14, '#9caa86']
    ];
    hillData.forEach(([x, z, radius, height, color]) => {
      const hill = AssetBuilder.createDistantHill(radius, height, color);
      hill.position.set(x, 0, z);
      this.scene.add(hill);
    });

    // Street signage
    const signGroup = new THREE.Group();
    addMesh(signGroup, new THREE.CylinderGeometry(0.055, 0.075, 2.7, 6), getMaterial('#3c3a35', 0.55, 0.4), 0, 1.35, 0);
    const boardOne = new THREE.Mesh(
      new THREE.PlaneGeometry(1.25, 0.3),
      new THREE.MeshStandardMaterial({
        map: createTextTexture('PIAZZA DEL FORNO', { width: 512, height: 128, background: '#2f6b58', foreground: '#f5eedb', border: '#f5eedb', fontSize: 44 }),
        roughness: 0.75
      })
    );
    boardOne.position.set(0, 2.2, 0.02);
    signGroup.add(boardOne);
    const boardTwo = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.27),
      new THREE.MeshStandardMaterial({
        map: createTextTexture('VIA DELLE OLIVE', { width: 512, height: 128, background: '#f1e4c9', foreground: '#3d5b4e', border: '#3d5b4e', fontSize: 42 }),
        roughness: 0.75
      })
    );
    boardTwo.position.set(0, 1.87, 0.03);
    signGroup.add(boardTwo);
    signGroup.position.set(3.4, 0.14, 8.75);
    signGroup.rotation.y = 0.08;
    this.scene.add(signGroup);

    // Crosswalk warning diamond
    addMesh(this.scene, new THREE.CylinderGeometry(0.055, 0.07, 2.4, 6), getMaterial('#46423a', 0.55, 0.4), -2.8, 1.2, 9.15);
    const diamond = addBox(this.scene, 0.58, 0.58, 0.05, getMaterial('#e5b43f', 0.8, 0.02), -2.8, 2.25, 9.15, 0.03, { rotZ: Math.PI / 4 });
    diamond.castShadow = false;
    addBox(this.scene, 0.28, 0.16, 0.055, getMaterial('#302c26', 0.7, 0.1), -2.8, 2.22, 9.18, 0.01);
    addBox(this.scene, 0.24, 0.06, 0.055, getMaterial('#302c26', 0.7, 0.1), -2.8, 2.05, 9.18, 0.01);

    // Parked cars
    const parked: Array<{ type: 'sedan' | 'hatchback' | 'van'; color: string; accent: string; x: number; z: number; rot: number; label?: string }> = [
      { type: 'van', color: '#e7d9bb', accent: '#9f4a37', x: 8.7, z: 10.02, rot: Math.PI / 2, label: 'SLICE & SPROUT' },
      { type: 'sedan', color: '#8d3540', accent: '#2a2c30', x: -13.2, z: 10.02, rot: Math.PI / 2 },
      { type: 'hatchback', color: '#4d7b72', accent: '#2b2d31', x: -23.0, z: 13.98, rot: -Math.PI / 2 },
      { type: 'sedan', color: '#d8bd8f', accent: '#4a4b4d', x: 17.0, z: 13.98, rot: -Math.PI / 2 }
    ];
    parked.forEach(spec => {
      const car = AssetBuilder.createCar(spec.type, spec.color, spec.accent, spec.label);
      car.group.position.set(spec.x, 0.13, spec.z);
      car.group.rotation.y = spec.rot;
      car.headlights.forEach(light => (light.visible = false));
      this.scene.add(car.group);
      const halfLength = spec.type === 'van' ? 2.55 : spec.type === 'sedan' ? 2.2 : 1.95;
      this.addObstacle(spec.x - halfLength, spec.x + halfLength, spec.z - 1.15, spec.z + 1.15);
    });
  }

  private buildTraffic(): void {
    const cars: Array<{ type: 'sedan' | 'hatchback' | 'van'; color: string; accent: string; direction: number; x: number; speed: number }> = [
      { type: 'sedan', color: '#b64232', accent: '#2c2d30', direction: 1, x: -19, speed: 5.6 },
      { type: 'hatchback', color: '#e3d2ae', accent: '#3f5a50', direction: 1, x: 9, speed: 6.7 },
      { type: 'van', color: '#47708a', accent: '#d8c39f', direction: -1, x: 20, speed: 4.9 },
      { type: 'sedan', color: '#5a5f66', accent: '#b6a582', direction: -1, x: -9, speed: 6.1 }
    ];
    cars.forEach(spec => {
      const car = AssetBuilder.createCar(spec.type, spec.color, spec.accent);
      const laneZ = spec.direction > 0 ? WORLD_LAYOUT.road.eastboundLaneZ : WORLD_LAYOUT.road.westboundLaneZ;
      car.group.position.set(spec.x, 0.13, laneZ);
      car.group.rotation.y = spec.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.scene.add(car.group);
      this.trafficCars.push({
        group: car.group,
        wheels: car.wheels,
        headlights: car.headlights,
        taillights: car.taillights,
        direction: spec.direction,
        speed: spec.speed,
        laneZ
      });
    });
  }

  private buildAmbientLife(): void {
    const walkerAppearances: Array<{
      shirtColor: string;
      pantsColor: string;
      hairColor: string;
      skinColor: string;
      accessory?: 'bag' | 'glasses' | 'scarf' | 'cap' | 'sunhat' | 'earrings' | 'none';
      hairStyle?: 'short' | 'bob' | 'long' | 'bun' | 'curly' | 'bald' | 'ponytail';
      outerColor?: string;
      build?: 'slim' | 'regular' | 'broad';
    }> = [
      { shirtColor: '#d8b25c', pantsColor: '#3c4a5a', hairColor: '#3b2a1d', skinColor: '#e0ac69', accessory: 'bag', hairStyle: 'bob', outerColor: '#7c5c42' },
      { shirtColor: '#8a4f5f', pantsColor: '#2f3b44', hairColor: '#1e1712', skinColor: '#8d5524', accessory: 'glasses', hairStyle: 'curly', build: 'broad' },
      { shirtColor: '#4f7080', pantsColor: '#4d483c', hairColor: '#6b4423', skinColor: '#f1c27d', accessory: 'sunhat', hairStyle: 'long' },
      { shirtColor: '#c46d4b', pantsColor: '#39423b', hairColor: '#2b1b12', skinColor: '#ffdbac', accessory: 'none', hairStyle: 'short' }
    ];
    walkerAppearances.forEach((appearance, index) => {
      const person = AssetBuilder.createCustomer({ ...appearance, heightScale: 0.96 + Math.random() * 0.08 });
      const z = index < 2 ? 7.15 + index * 0.8 : 16.8 - (index - 2) * 0.75;
      const dir = index % 2 === 0 ? 1 : -1;
      person.group.position.set(-20 + index * 11, 0.14, z);
      person.group.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      this.scene.add(person.group);
      this.ambientWalkers.push({
        group: person.group,
        leftLeg: person.leftLeg,
        rightLeg: person.rightLeg,
        leftArm: person.leftArm,
        rightArm: person.rightArm,
        z,
        dir,
        speed: 0.75 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      });
    });

    // Pigeons pecking around the fountain and crosswalk
    const birdSpots: Array<[number, number, number]> = [
      [-3.2, 4.3, 0],
      [-6.2, 0.9, 0.6],
      [-2.2, 1.2, -0.4],
      [1.8, 6.8, 1.1],
      [2.2, 7.4, 2.4],
      [10.5, 6.9, 0.3]
    ];
    birdSpots.forEach(([x, z, rot], index) => {
      const bird = AssetBuilder.createBird();
      bird.position.set(x, 0.14, z);
      bird.rotation.y = rot;
      bird.userData.baseY = 0.14;
      bird.userData.phase = index * 0.9 + Math.random();
      this.scene.add(bird);
      this.birds.push(bird);
    });

    // Clouds drifting high above the valley
    for (let i = 0; i < 8; i++) {
      const cloud = AssetBuilder.createCloud();
      cloud.position.set((Math.random() - 0.5) * 95, 19 + Math.random() * 11, -30 + Math.random() * 75);
      cloud.scale.setScalar(1.2 + Math.random() * 1.3);
      cloud.rotation.y = Math.random() * Math.PI;
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }

    // Fireflies over the farm and patio at night
    const count = 90;
    this.firefliesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    this.fireflyBasePositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const zone = i % 2 === 0;
      const x = zone ? -17 + Math.random() * 9 : 5 + Math.random() * 12;
      const y = 0.6 + Math.random() * 2.8;
      const z = zone ? 0 + Math.random() * 7 : -6 + Math.random() * 11;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      this.fireflyBasePositions[i * 3] = x;
      this.fireflyBasePositions[i * 3 + 1] = y;
      this.fireflyBasePositions[i * 3 + 2] = z;
    }
    this.firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const fireflyMat = new THREE.PointsMaterial({
      color: 0xffd166,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.fireflies = new THREE.Points(this.firefliesGeometry, fireflyMat);
    this.fireflies.visible = false;
    this.scene.add(this.fireflies);
  }

  private buildWeatherParticles(): void {
    const count = 1700;
    this.rainGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 52;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 52;
    }
    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0xb9d8e6,
      size: 0.09,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    this.rainParticles = new THREE.Points(this.rainGeometry, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  private buildInteractionMarkers(): void {
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffe0a0,
      emissive: 0xffb04a,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.55,
      roughness: 0.4
    });
    this.interactionRing = addMesh(this.scene, new THREE.TorusGeometry(0.9, 0.045, 6, 28), ringMat, 0, 0.14, 0, {
      rotX: Math.PI / 2
    });
    this.interactionRing.visible = false;

    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
    this.clickMarker = addMesh(this.scene, new THREE.RingGeometry(0.36, 0.48, 24), markerMat, 0, 0.13, 0, { rotX: -Math.PI / 2 });
    this.clickMarker.visible = false;
  }

  private buildPlacementGrid(): void {
    const grid = new THREE.GridHelper(56, 112, 0x9ce8bd, 0x4f7865);
    const material = grid.material as THREE.LineBasicMaterial;
    material.transparent = true;
    material.opacity = 0.12;
    material.depthWrite = false;
    grid.position.y = 0.065;
    grid.visible = false;
    grid.renderOrder = 1;
    this.scene.add(grid);
    this.placementGrid = grid;
  }

  private addLampGlowAt(
    x: number,
    y: number,
    z: number,
    color: number,
    size: number,
    opacity: number
  ): THREE.Sprite {
    const sprite = createGlowSprite(color, size, opacity);
    sprite.position.set(x, y, z);
    this.scene.add(sprite);
    this.lampGlows.push({ sprite, baseOpacity: opacity });
    return sprite;
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.renderer.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  private onResize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    this.keysPressed[event.code] = true;

    if (event.repeat) return;

    if (event.code === 'Escape') {
      if (gameStore.placement) {
        gameStore.cancelPlacement();
      } else if (gameStore.activeModal) {
        gameStore.closeModal();
      }
      this.clickMoveTarget = null;
      this.clickMarker.visible = false;
      return;
    }

    if (gameStore.placement) {
      if (event.code === 'KeyR') {
        gameStore.rotatePlacement();
      } else if (event.code === 'Enter' || event.code === 'Space') {
        gameStore.confirmPlacement();
      }
      return;
    }

    if (gameStore.activeModal) return;

    switch (event.code) {
      case 'KeyE':
      case 'Space':
        this.triggerProximityAction();
        break;
      case 'KeyB':
        audioManager.playClick();
        gameStore.openModal('build');
        break;
      case 'KeyK':
        audioManager.playClick();
        gameStore.openModal('recipes');
        break;
      case 'KeyR':
        audioManager.playClick();
        gameStore.openModal('research');
        break;
      case 'KeyL':
        audioManager.playClick();
        gameStore.openModal('leaderboard');
        break;
      case 'KeyP':
        audioManager.playClick();
        gameStore.openModal('piazza');
        break;
      case 'KeyM':
        audioManager.playClick();
        gameStore.openModal('map');
        break;
      case 'KeyI':
        audioManager.playClick();
        gameStore.openModal('inventory');
        break;
      case 'KeyC':
        audioManager.playClick();
        gameStore.openModal('challenges');
        break;
      case 'KeyU':
        audioManager.playClick();
        gameStore.openModal('staff');
        break;
      default:
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keysPressed[event.code] = false;
  };

  private onPointerDown = (event: PointerEvent): void => {
    if (event.button === 2 || event.button === 1 || (event.button === 0 && event.shiftKey)) {
      this.isOrbiting = true;
      this.prevMouseX = event.clientX;
      this.prevMouseY = event.clientY;
      event.preventDefault();
      return;
    }
    if (event.button === 0 && !gameStore.activeModal) {
      if (gameStore.placement) {
        this.updatePlacementFromPointer(event);
        gameStore.confirmPlacement();
        event.preventDefault();
        return;
      }
      this.handleRaycastClick(event);
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (
      gameStore.placement &&
      !this.isOrbiting &&
      event.target === this.renderer.domElement
    ) {
      this.updatePlacementFromPointer(event);
    }
    if (!this.isOrbiting) return;
    const deltaX = event.clientX - this.prevMouseX;
    const deltaY = event.clientY - this.prevMouseY;
    this.prevMouseX = event.clientX;
    this.prevMouseY = event.clientY;
    this.cameraAzimuth -= deltaX * 0.006;
    this.cameraElevation = THREE.MathUtils.clamp(this.cameraElevation + deltaY * 0.004, 0.2, 1.08);
  };

  private onPointerUp = (): void => {
    this.isOrbiting = false;
  };

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.cameraDistance = THREE.MathUtils.clamp(
      this.cameraDistance + event.deltaY * 0.012,
      this.cameraMinDistance,
      this.cameraMaxDistance
    );
  };

  private getGroundPoint(event: PointerEvent): THREE.Vector3 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, point) ? point : null;
  }

  private updatePlacementFromPointer(event: PointerEvent): void {
    if (!gameStore.placement) return;
    const point = this.getGroundPoint(event);
    if (!point) return;
    const x = THREE.MathUtils.clamp(
      point.x,
      WORLD_LAYOUT.bounds.minX - 1.5,
      WORLD_LAYOUT.bounds.maxX + 1.5
    );
    const z = THREE.MathUtils.clamp(
      point.z,
      WORLD_LAYOUT.bounds.minZ - 1.5,
      WORLD_LAYOUT.bounds.maxZ + 1.5
    );
    gameStore.updatePlacementPosition(x, z);
  }

  private handleRaycastClick(event: PointerEvent): void {
    const point = this.getGroundPoint(event);
    if (!point) return;
    const x = THREE.MathUtils.clamp(point.x, WORLD_LAYOUT.bounds.minX + 0.5, WORLD_LAYOUT.bounds.maxX - 0.5);
    const z = THREE.MathUtils.clamp(point.z, WORLD_LAYOUT.bounds.minZ + 0.5, WORLD_LAYOUT.bounds.maxZ - 0.5);
    if (!this.isBlocked(x, z)) {
      this.clickMoveTarget = new THREE.Vector3(x, 0, z);
      this.clickMarker.position.set(x, 0.14, z);
      this.clickMarker.visible = true;
      const material = this.clickMarker.material as THREE.MeshBasicMaterial;
      material.opacity = 0.8;
    }
  }

  private updatePlayer(delta: number): void {
    const modalOpen = gameStore.activeModal !== null || gameStore.placement !== null;
    let inputX = 0;
    let inputZ = 0;

    if (!modalOpen) {
      if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) inputX -= 1;
      if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) inputX += 1;
      if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) inputZ -= 1;
      if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) inputZ += 1;

      inputX += this.joystickVector.x;
      inputZ -= this.joystickVector.y;
    }

    let targetMoving = false;
    let targetAngle = this.playerFacingAngle;

    if (Math.abs(inputX) > 0.04 || Math.abs(inputZ) > 0.04) {
      const length = Math.hypot(inputX, inputZ);
      inputX /= Math.max(1, length);
      inputZ /= Math.max(1, length);
      this.clickMoveTarget = null;
      this.clickMarker.visible = false;
      targetMoving = true;
      targetAngle = Math.atan2(inputX, inputZ);
    } else if (this.clickMoveTarget && !modalOpen) {
      const dx = this.clickMoveTarget.x - this.playerPos.x;
      const dz = this.clickMoveTarget.z - this.playerPos.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.18) {
        this.clickMoveTarget = null;
        this.clickMarker.visible = false;
      } else {
        inputX = dx / distance;
        inputZ = dz / distance;
        targetMoving = true;
        targetAngle = Math.atan2(inputX, inputZ);
      }
    }

    let moving = false;
    if (targetMoving) {
      const pathMultiplier = gameStore.getPathSpeedMultiplier(this.playerPos.x, this.playerPos.z);
      const speed = 5.2 * pathMultiplier;
      const stepX = inputX * speed * delta;
      const stepZ = inputZ * speed * delta;

      const nextX = this.playerPos.x + stepX;
      if (!this.isBlocked(nextX, this.playerPos.z)) {
        this.playerPos.x = nextX;
        moving = true;
      } else if (this.clickMoveTarget) {
        this.clickMoveTarget = null;
        this.clickMarker.visible = false;
      }

      const nextZ = this.playerPos.z + stepZ;
      if (!this.isBlocked(this.playerPos.x, nextZ)) {
        this.playerPos.z = nextZ;
        moving = true;
      } else if (this.clickMoveTarget) {
        this.clickMoveTarget = null;
        this.clickMarker.visible = false;
      }
    }

    if (targetMoving) {
      this.playerFacingAngle = smoothAngle(this.playerFacingAngle, targetAngle, delta, 12);
    }

    this.playerGroup.position.set(this.playerPos.x, 0, this.playerPos.z);
    this.playerGroup.rotation.y = this.playerFacingAngle;

    if (moving) {
      this.walkCycle += delta * 9.5;
    } else {
      this.walkCycle += delta * 2.0;
    }

    const swing = Math.sin(this.walkCycle);
    const amplitude = moving ? 0.58 : 0.025;
    this.playerLeftLeg.rotation.x = swing * amplitude;
    this.playerRightLeg.rotation.x = -swing * amplitude;
    this.playerLeftArm.rotation.x = -swing * amplitude * 0.78;
    this.playerRightArm.rotation.x = swing * amplitude * 0.78;
    this.playerGroup.position.y = moving ? Math.abs(Math.sin(this.walkCycle)) * 0.035 : 0;

    if (this.clickMarker.visible) {
      const material = this.clickMarker.material as THREE.MeshBasicMaterial;
      material.opacity = 0.55 + Math.sin(performance.now() * 0.006) * 0.22;
      this.clickMarker.scale.setScalar(1 + Math.sin(performance.now() * 0.006) * 0.12);
    }
  }

  private updateCamera(delta: number): void {
    const lookHeight = 1.42;
    const target = new THREE.Vector3(this.playerPos.x, lookHeight, this.playerPos.z);
    const cosElevation = Math.cos(this.cameraElevation);
    const desired = new THREE.Vector3(
      target.x + Math.sin(this.cameraAzimuth) * this.cameraDistance * cosElevation,
      target.y + Math.sin(this.cameraElevation) * this.cameraDistance,
      target.z + Math.cos(this.cameraAzimuth) * this.cameraDistance * cosElevation
    );
    desired.y = Math.max(1.0, desired.y);
    const smoothing = 1 - Math.exp(-delta * 7.5);
    this.camera.position.lerp(desired, smoothing);
    this.camera.lookAt(target.x, 1.1, target.z);
  }

  private updateDayNightCycle(): void {
    const time = (gameStore.timeOfDaySeconds / 720) % 1;
    let from = SKY_KEYFRAMES[0];
    let to = SKY_KEYFRAMES[1];
    for (let i = 1; i < SKY_KEYFRAMES.length; i++) {
      if (time <= SKY_KEYFRAMES[i].t) {
        from = SKY_KEYFRAMES[i - 1];
        to = SKY_KEYFRAMES[i];
        break;
      }
    }
    const span = Math.max(0.0001, to.t - from.t);
    const blend = THREE.MathUtils.clamp((time - from.t) / span, 0, 1);

    const top = colorBetween(new THREE.Color(from.top), new THREE.Color(to.top), blend, new THREE.Color());
    const bottom = colorBetween(new THREE.Color(from.bottom), new THREE.Color(to.bottom), blend, new THREE.Color());
    const horizon = colorBetween(new THREE.Color(from.horizon), new THREE.Color(to.horizon), blend, new THREE.Color());

    const weather = gameStore.weather;
    const overcast = weather === 'storm' ? 0.55 : weather === 'rain' ? 0.4 : weather === 'cloudy' ? 0.18 : 0;
    if (overcast > 0) {
      top.lerp(new THREE.Color('#69777c'), overcast);
      bottom.lerp(new THREE.Color('#a9aea4'), overcast);
      horizon.lerp(new THREE.Color('#b6b4a5'), overcast);
    }

    this.skyMaterial.uniforms.topColor.value.copy(top);
    this.skyMaterial.uniforms.bottomColor.value.copy(bottom);
    this.skyMaterial.uniforms.horizonColor.value.copy(horizon);

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(bottom).lerp(top, 0.18);
      this.scene.fog.density =
        0.0082 + (weather === 'storm' ? 0.0075 : weather === 'rain' ? 0.0035 : weather === 'cloudy' ? 0.0012 : 0);
    }

    const sunAngle = (time - 0.25) * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const daylight = THREE.MathUtils.smoothstep(sunHeight, -0.08, 0.2);
    this.nightFactor = 1 - daylight;

    const sunX = Math.cos(sunAngle) * 72;
    const sunY = sunHeight * 62;
    this.sunMesh.position.set(sunX, sunY, -52);
    this.sunHalo.position.copy(this.sunMesh.position);
    this.sunMesh.visible = sunHeight > -0.12;
    this.sunHalo.visible = this.sunMesh.visible;
    (this.sunHalo.material as THREE.MeshBasicMaterial).opacity = 0.1 + daylight * 0.14;

    const moonX = -Math.cos(sunAngle) * 74;
    const moonY = -sunHeight * 58;
    this.moonMesh.position.set(moonX, moonY, 38);
    this.moonMesh.visible = this.nightFactor > 0.2;

    this.starMaterial.opacity = THREE.MathUtils.clamp((this.nightFactor - 0.2) / 0.8, 0, 1) * 0.9;
    this.stars.visible = this.starMaterial.opacity > 0.03;

    // Follow the player with the shadow volume so the world stays lit consistently.
    const useMoon = daylight < 0.16;
    const lightX = useMoon ? moonX : sunX;
    const lightHeight = useMoon ? Math.max(10, moonY) : Math.max(10, sunY);
    this.dirLight.position.set(this.playerPos.x + lightX * 0.55, lightHeight, this.playerPos.z - 18);
    this.dirLight.target.position.set(this.playerPos.x, 0, this.playerPos.z);
    const warmLight = new THREE.Color('#ffb078');
    const daylightColor = new THREE.Color('#fff2db');
    const lowerSun = 1 - THREE.MathUtils.smoothstep(sunHeight, 0.02, 0.48);
    this.dirLight.color.copy(daylightColor).lerp(warmLight, lowerSun * 0.78);
    this.dirLight.intensity = 0.11 + daylight * 2.3;
    this.ambientLight.intensity = 0.16 + daylight * 0.42;
    this.hemiLight.intensity = 0.16 + daylight * 0.48;
    this.hemiLight.color.copy(top).lerp(new THREE.Color('#cfe8ff'), 0.45);
    this.renderer.toneMappingExposure = 1.02 + daylight * 0.06;

    for (const light of this.lampLights) {
      light.intensity = 0.3 + this.nightFactor * 1.55;
    }
    for (const glow of this.windowGlowMaterials) {
      glow.emissiveIntensity = 0.12 + this.nightFactor * 1.2;
    }
    for (let i = 0; i < this.lampGlows.length; i++) {
      const glow = this.lampGlows[i];
      const flicker = 1 + Math.sin(performance.now() * 0.004 + i * 1.7) * 0.045;
      const material = glow.sprite.material as THREE.SpriteMaterial;
      material.opacity = glow.baseOpacity * this.nightFactor * flicker;
      glow.sprite.visible = this.nightFactor > 0.025;
    }
  }

  private updateWeather(delta: number): void {
    const weather = gameStore.weather;
    const showRain = weather === 'rain' || weather === 'storm';
    if (this.rainParticles) {
      this.rainParticles.visible = showRain;
      this.rainParticles.position.set(this.playerPos.x, 0, this.playerPos.z);
      if (showRain && this.rainGeometry) {
        const positions = this.rainGeometry.getAttribute('position') as THREE.BufferAttribute;
        const fallSpeed = weather === 'storm' ? 25 : 17;
        for (let i = 0; i < positions.count; i++) {
          let y = positions.getY(i) - fallSpeed * delta;
          let x = positions.getX(i) - delta * (weather === 'storm' ? 7 : 3);
          if (y < 0) {
            y = 28 + Math.random() * 4;
            x = (Math.random() - 0.5) * 52;
            positions.setZ(i, (Math.random() - 0.5) * 52);
          }
          if (x < -26) x += 52;
          positions.setX(i, x);
          positions.setY(i, y);
        }
        positions.needsUpdate = true;
      }
    }

    if (weather === 'storm') {
      this.stormFlash = Math.max(0, this.stormFlash - delta);
      if (Math.random() < delta * 0.11) {
        this.stormFlash = 0.18;
        audioManager.playThunder();
      }
    } else {
      this.stormFlash = Math.max(0, this.stormFlash - delta);
    }
  }

  private updateTraffic(delta: number): void {
    const headlightsOn = this.nightFactor > 0.38;
    for (const car of this.trafficCars) {
      const x = car.group.position.x + car.direction * car.speed * delta;
      car.group.position.x = x > 45 ? -45 : x < -45 ? 45 : x;
      for (const wheel of car.wheels) {
        wheel.rotation.x -= car.direction * (car.speed / 0.34) * delta;
      }
      for (const light of car.headlights) light.visible = headlightsOn;
      for (const light of car.taillights) light.visible = this.nightFactor > 0.12;
    }
  }

  private updateAmbient(delta: number, elapsed: number): void {
    // Walking villagers
    for (const walker of this.ambientWalkers) {
      walker.group.position.x += walker.dir * walker.speed * delta;
      if (walker.group.position.x > 26) {
        walker.group.position.x = -26;
      } else if (walker.group.position.x < -26) {
        walker.group.position.x = 26;
      }
      walker.phase += delta * 5.2;
      walker.group.rotation.y = walker.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      const swing = Math.sin(walker.phase);
      walker.leftLeg.rotation.x = swing * 0.5;
      walker.rightLeg.rotation.x = -swing * 0.5;
      walker.leftArm.rotation.x = -swing * 0.38;
      walker.rightArm.rotation.x = swing * 0.38;
      walker.group.position.y = 0.14 + Math.abs(Math.sin(walker.phase)) * 0.025;
    }

    // Pigeons hop and peck
    for (const bird of this.birds) {
      const phase = (bird.userData.phase as number) ?? 0;
      bird.position.y = ((bird.userData.baseY as number) ?? 0.14) + Math.abs(Math.sin(elapsed * 2.4 + phase)) * 0.035;
      bird.rotation.y += Math.sin(elapsed * 1.4 + phase) * delta * 0.15;
    }

    // Clouds drift east
    for (const cloud of this.clouds) {
      cloud.position.x += delta * 0.7;
      cloud.position.y += Math.sin(elapsed * 0.2 + cloud.position.z) * delta * 0.04;
      if (cloud.position.x > 65) cloud.position.x = -65;
    }

    // Fountain jet and shimmering water
    if (this.fountainJet) {
      this.fountainJet.scale.y = 0.9 + Math.sin(elapsed * 3.1) * 0.12;
      this.fountainJet.scale.x = 0.9 + Math.sin(elapsed * 2.4) * 0.08;
    }
    if (this.fountainWater) {
      const material = this.fountainWater.material as THREE.MeshStandardMaterial;
      material.opacity = 0.6 + Math.sin(elapsed * 1.7) * 0.055;
      this.fountainWater.scale.setScalar(1 + Math.sin(elapsed * 0.9) * 0.006);
    }
    for (let i = 0; i < this.buildingWaters.length; i++) {
      const water = this.buildingWaters[i];
      const material = water.material as THREE.MeshStandardMaterial;
      material.opacity = 0.64 + Math.sin(elapsed * 1.8 + i) * 0.06;
      water.scale.setScalar(1 + Math.sin(elapsed * 1.1 + i * 1.4) * 0.008);
    }
    for (let i = 0; i < this.buildingJets.length; i++) {
      const jet = this.buildingJets[i];
      jet.scale.y = 0.9 + Math.sin(elapsed * 3.4 + i) * 0.13;
      jet.scale.x = 0.92 + Math.sin(elapsed * 2.6 + i) * 0.06;
    }

    // Oven smoke rises from the stone chimney
    for (const puff of this.smokePuffs) {
      const phase = (puff.userData.phase as number) ?? 0;
      const t = (elapsed * 0.16 + phase) % 1;
      puff.position.set(
        WORLD_LAYOUT.stations.oven.x + Math.sin(t * 6.2 + phase * 8) * 0.24,
        3.55 + t * 3.4,
        WORLD_LAYOUT.stations.oven.z - 0.52 + Math.cos(t * 4.5 + phase * 5) * 0.2
      );
      const scale = 0.55 + t * 1.65;
      puff.scale.set(scale, scale * 1.2, scale);
    }

    // Espresso steam
    for (let i = 0; i < this.espressoPuffs.length; i++) {
      const puff = this.espressoPuffs[i];
      const t = (elapsed * 0.45 + i / this.espressoPuffs.length) % 1;
      puff.position.set(Math.sin(t * 7 + i) * 0.06, t * 0.62, Math.cos(t * 5 + i) * 0.04);
      const scale = 0.5 + t * 1.25;
      puff.scale.set(scale, scale * 1.25, scale);
    }

    // Fireflies drift around the farm
    if (this.fireflies && this.fireflies.geometry) {
      this.fireflies.visible = this.nightFactor > 0.38 && gameStore.weather !== 'storm';
      if (this.fireflies.visible && this.fireflyBasePositions) {
        const positions = this.fireflies.geometry.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < positions.count; i++) {
          const phase = i * 0.63;
          positions.setXYZ(
            i,
            this.fireflyBasePositions[i * 3] + Math.sin(elapsed * 0.6 + phase) * 0.7,
            this.fireflyBasePositions[i * 3 + 1] + Math.sin(elapsed * 0.9 + phase * 1.3) * 0.3,
            this.fireflyBasePositions[i * 3 + 2] + Math.cos(elapsed * 0.5 + phase) * 0.7
          );
        }
        positions.needsUpdate = true;
        (this.fireflies.material as THREE.PointsMaterial).opacity = 0.45 + Math.sin(elapsed * 2.2) * 0.15;
      }
    }

    // Interaction ring pulse
    if (this.interactionRing.visible) {
      this.interactionRing.rotation.z += delta * 1.2;
      const pulse = 1 + Math.sin(elapsed * 4.5) * 0.055;
      this.interactionRing.scale.setScalar(pulse);
    }
  }

  private animate = (): void => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const delta = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;
    const elapsed = now / 1000;

    gameStore.tickSimulation(delta);
    this.updateDayNightCycle();
    this.updateWeather(delta);
    if (this.stormFlash > 0) {
      this.dirLight.intensity += 4.8 * (this.stormFlash / 0.18);
    }
    this.updatePlayer(delta);
    this.updateCamera(delta);
    this.syncBuildings();
    this.syncBuildPlacement();
    this.syncFarmPlots();
    this.syncCustomers(delta);
    this.syncStaff(delta);
    this.updateProximity();
    this.updateTraffic(delta);
    this.updateAmbient(delta, elapsed);
    this.renderer.render(this.scene, this.camera);
  };

  private createGreenhouseVisual(): THREE.Group {
    const group = new THREE.Group();
    const frameMat = getMaterial('#d7d2c2', 0.4, 0.35);
    const baseMat = getMaterial('#b5a58a', 0.95, 0.01);
    const soilMat = getMaterial('#4a3020', 1, 0);
    const leafMat = getMaterial('#4f7f3f', 0.9, 0);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xd2e8e5,
      roughness: 0.06,
      metalness: 0.12,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    addBox(group, 3.15, 0.18, 3.15, baseMat, 0, 0.09, 0, 0.03, { receive: true });
    [-1.42, 1.42].forEach(x => {
      [-1.42, 1.42].forEach(z => addBox(group, 0.08, 2.25, 0.08, frameMat, x, 1.22, z, 0.01, { cast: true }));
    });
    addBox(group, 2.9, 0.07, 0.07, frameMat, 0, 2.32, -1.42, 0.01);
    addBox(group, 2.9, 0.07, 0.07, frameMat, 0, 2.32, 1.42, 0.01);
    addBox(group, 0.07, 0.07, 2.9, frameMat, -1.42, 2.32, 0, 0.01);
    addBox(group, 0.07, 0.07, 2.9, frameMat, 1.42, 2.32, 0, 0.01);

    addBox(group, 2.78, 2.0, 0.035, glassMat, 0, 1.26, -1.41, 0.01);
    addBox(group, 2.78, 2.0, 0.035, glassMat, 0, 1.26, 1.41, 0.01);
    addBox(group, 0.035, 2.0, 2.78, glassMat, -1.41, 1.26, 0, 0.01);
    addBox(group, 0.035, 2.0, 2.78, glassMat, 1.41, 1.26, 0, 0.01);
    addBox(group, 0.04, 1.82, 0.7, frameMat, 0.18, 1.15, 1.43, 0.01);
    addBox(group, 0.5, 1.82, 0.04, glassMat, -0.4, 1.15, 1.43, 0.01);

    const roof = addMesh(group, new THREE.ConeGeometry(2.18, 0.9, 4), glassMat, 0, 2.78, 0, { rotY: Math.PI / 4 });
    roof.castShadow = false;
    addBox(group, 0.07, 0.07, 2.95, frameMat, 0, 2.36, 0, 0.01);
    addBox(group, 2.95, 0.07, 0.07, frameMat, 0, 2.36, 0, 0.01);
    addMesh(group, new THREE.SphereGeometry(0.09, 7, 5), getMaterial('#c9a35c', 0.4, 0.5), 0, 3.26, 0);

    // Raised beds and a little potting bench inside
    [-0.68, 0.68].forEach(x => {
      addBox(group, 0.85, 0.35, 2.05, getMaterial('#79603f', 0.95, 0), x, 0.38, 0, 0.03);
      addBox(group, 0.74, 0.04, 1.94, soilMat, x, 0.56, 0, 0.01);
      for (let i = 0; i < 6; i++) {
        addMesh(group, new THREE.SphereGeometry(0.11, 6, 4), leafMat, x + (Math.random() - 0.5) * 0.4, 0.63 + Math.random() * 0.12, -0.75 + i * 0.3, { scaleY: 0.8 });
      }
    });
    addBox(group, 1.1, 0.55, 0.4, getMaterial('#86623d', 0.95, 0), 0, 0.36, -1.02, 0.02);
    addMesh(group, new THREE.CylinderGeometry(0.12, 0.1, 0.18, 8), getMaterial('#b06b4c', 0.9, 0), 0.2, 0.72, -1.02);
    return group;
  }

  private createPathVisual(): THREE.Group {
    const group = new THREE.Group();
    const stoneMat = getMaterial('#b9a98f', 0.95, 0.01);
    const shadeMat = getMaterial('#a8967c', 0.97, 0.01);
    const mossMat = getMaterial('#6c7f4b', 1, 0);

    // A 1x3 cobbled walkway made from two staggered columns of river-stone
    // slabs. The old cross-shaped paving read more like a UI marker than a path.
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const x = (col === 0 ? -0.24 : 0.24) + (row % 2 === 0 ? 0.015 : -0.015);
        const z = row - 1;
        addBox(
          group,
          0.44,
          0.052,
          0.9,
          (row + col) % 2 === 0 ? stoneMat : shadeMat,
          x,
          0.02 + (row === 1 ? 0.004 : 0),
          z,
          0.05,
          { rotY: (row * 2 + col) % 2 === 0 ? 0.035 : -0.028, receive: true }
        );
      }
    }

    // Little moss tufts softening the joints.
    const tufts: Array<[number, number, number]> = [
      [-0.43, 0.045, -0.72],
      [0.43, 0.045, 0.2],
      [-0.4, 0.045, 0.75],
      [0.12, 0.045, 1.28]
    ];
    tufts.forEach(([x, y, z]) => {
      addMesh(group, new THREE.SphereGeometry(0.08, 7, 5), mossMat, x, y, z, { scaleY: 0.45 });
    });
    return group;
  }

  private createBuildingVisual(typeId: string): BuildingVisualBuild | null {
    if (typeId === 'table_rustic') {
      return { group: AssetBuilder.createDiningTable() };
    }
    if (typeId === 'table_terrace') {
      return { group: AssetBuilder.createDiningTable({ terrace: true, umbrella: true }) };
    }
    if (typeId === 'sprinkler_basic') {
      const sprinkler = AssetBuilder.createSprinkler();
      return { group: sprinkler.group, spinner: sprinkler.spinner };
    }
    if (typeId === 'lantern_amber') {
      const lantern = AssetBuilder.createLanternPost();
      return { group: lantern.group, light: lantern.light };
    }
    if (typeId === 'planter_rosemary') {
      return { group: AssetBuilder.createPlanterPot() };
    }
    if (typeId === 'olive_planter') {
      return { group: AssetBuilder.createOlivePlanter() };
    }
    if (typeId === 'flower_cart') {
      return { group: AssetBuilder.createFlowerCart() };
    }
    if (typeId === 'courtyard_fountain') {
      const fountain = AssetBuilder.createCourtyardFountain();
      return { group: fountain.group, water: fountain.water, jet: fountain.jet };
    }
    if (typeId === 'path_cobblestone') {
      return { group: this.createPathVisual() };
    }
    if (typeId === 'glass_greenhouse') {
      return { group: this.createGreenhouseVisual() };
    }
    return null;
  }

  private rebuildBuildingObstacles(): void {
    const key = gameStore.buildings
      .map(b => `${b.buildingId}:${b.typeId}:${b.x.toFixed(2)}:${b.z.toFixed(2)}:${(b.rotation || 0).toFixed(3)}`)
      .join('|');
    if (key === this.buildingObstacleKey) return;
    this.buildingObstacleKey = key;
    this.buildingObstacles = [];

    const blocking = new Set([
      'table_rustic', 'table_terrace', 'planter_rosemary', 'glass_greenhouse',
      'olive_planter', 'flower_cart', 'courtyard_fountain'
    ]);
    const margins: Record<string, number> = {
      table_rustic: 0.25,
      table_terrace: 0.25,
      glass_greenhouse: 0.1,
      planter_rosemary: 0.1,
      olive_planter: 0.12,
      flower_cart: 0.22,
      courtyard_fountain: 0.2
    };

    for (const building of gameStore.buildings) {
      if (!blocking.has(building.typeId)) continue;
      const def = BUILDINGS.find(b => b.typeId === building.typeId);
      if (!def) continue;
      const rotation = building.rotation || 0;
      const cos = Math.abs(Math.cos(rotation));
      const sin = Math.abs(Math.sin(rotation));
      const margin = margins[building.typeId] ?? 0.15;
      const halfW = (def.footprint.width * cos + def.footprint.depth * sin) / 2 + margin;
      const halfD = (def.footprint.width * sin + def.footprint.depth * cos) / 2 + margin;
      this.buildingObstacles.push({
        minX: building.x - halfW,
        maxX: building.x + halfW,
        minZ: building.z - halfD,
        maxZ: building.z + halfD
      });
    }
  }

  private syncBuildings(): void {
    const activeIds = new Set<string>();
    for (const building of gameStore.buildings) {
      activeIds.add(building.buildingId);
      let group = this.buildingMeshes.get(building.buildingId);
      if (!group) {
        const built = this.createBuildingVisual(building.typeId);
        if (!built) continue;
        const visual = built.group;
        visual.userData.buildingId = building.buildingId;
        visual.userData.typeId = building.typeId;
        if (built.light) {
          visual.userData.lampLight = built.light;
          this.lampLights.push(built.light);
        }
        if (built.spinner) {
          visual.userData.spinner = built.spinner;
          this.sprinklerSpinners.push(built.spinner);
        }
        if (built.water) {
          visual.userData.water = built.water;
          this.buildingWaters.push(built.water);
        }
        if (built.jet) {
          visual.userData.jet = built.jet;
          this.buildingJets.push(built.jet);
        }
        if (building.typeId === 'lantern_amber') {
          const glow = createGlowSprite(0xffc978, 1.05, 0.42);
          glow.position.set(0.43, 2.22, 0);
          visual.add(glow);
          visual.userData.lampGlow = glow;
          this.lampGlows.push({ sprite: glow, baseOpacity: 0.42 });
        }

        visual.position.set(building.x, building.typeId === 'path_cobblestone' ? 0.09 : 0.12, building.z);
        visual.rotation.y = building.rotation || 0;
        this.scene.add(visual);
        this.buildingMeshes.set(building.buildingId, visual);
        group = visual;
      } else {
        group.position.x = building.x;
        group.position.z = building.z;
        group.rotation.y = building.rotation || 0;
      }
    }

    for (const [id, group] of Array.from(this.buildingMeshes.entries())) {
      if (activeIds.has(id)) continue;
      const light = group.userData.lampLight as THREE.PointLight | undefined;
      if (light) {
        this.lampLights = this.lampLights.filter(l => l !== light);
      }
      const spinner = group.userData.spinner as THREE.Mesh | undefined;
      if (spinner) {
        this.sprinklerSpinners = this.sprinklerSpinners.filter(s => s !== spinner);
      }
      const water = group.userData.water as THREE.Mesh | undefined;
      if (water) {
        this.buildingWaters = this.buildingWaters.filter(w => w !== water);
      }
      const jet = group.userData.jet as THREE.Mesh | undefined;
      if (jet) {
        this.buildingJets = this.buildingJets.filter(j => j !== jet);
      }
      const glow = group.userData.lampGlow as THREE.Sprite | undefined;
      if (glow) {
        this.lampGlows = this.lampGlows.filter(g => g.sprite !== glow);
        (glow.material as THREE.SpriteMaterial).dispose();
      }
      this.scene.remove(group);
      this.disposeObject(group);
      this.buildingMeshes.delete(id);
    }

    for (const spinner of this.sprinklerSpinners) {
      spinner.rotation.y = performance.now() * 0.0024;
    }
    this.rebuildBuildingObstacles();
  }

  private prepareGhostVisual(group: THREE.Group): void {
    this.placementGhostMaterials = [];
    const lights: THREE.Object3D[] = [];
    group.traverse(child => {
      if ((child as THREE.Light).isLight) {
        lights.push(child);
        return;
      }
      if ((child as THREE.Sprite).isSprite) {
        child.visible = false;
        return;
      }
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.renderOrder = 3;

      const tint = (material: THREE.Material): THREE.Material => {
        const copy = material.clone();
        copy.transparent = true;
        copy.opacity = Math.min(0.62, copy.opacity ?? 1);
        copy.depthWrite = false;
        const standard = copy as THREE.MeshStandardMaterial;
        if (standard.isMeshStandardMaterial) {
          standard.emissive = new THREE.Color(0x5ce89b);
          standard.emissiveIntensity = 0.42;
          standard.roughness = Math.max(0.4, standard.roughness);
          this.placementGhostMaterials.push(standard);
        }
        return copy;
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(tint);
      } else {
        mesh.material = tint(mesh.material);
      }
    });
    lights.forEach(light => light.parent?.remove(light));
  }

  private disposePlacementFootprint(): void {
    if (!this.placementFootprint) return;
    if (this.placementFootprintPlane) {
      this.placementFootprintPlane.geometry.dispose();
      (this.placementFootprintPlane.material as THREE.Material).dispose();
    }
    if (this.placementOutline) {
      this.placementOutline.geometry.dispose();
      (this.placementOutline.material as THREE.Material).dispose();
    }
    this.scene.remove(this.placementFootprint);
    this.placementFootprint = null;
    this.placementFootprintPlane = null;
    this.placementOutline = null;
  }

  private disposePlacementGhost(): void {
    if (this.placementGhost) {
      this.scene.remove(this.placementGhost);
      this.disposeObject(this.placementGhost);
      this.placementGhost = null;
    }
    this.placementGhostMaterials.forEach(material => material.dispose());
    this.placementGhostMaterials = [];
    this.placementGhostType = null;
    this.placementValidity = null;
    this.disposePlacementFootprint();
  }

  private createPlacementFootprint(typeId: string): void {
    const def = BUILDINGS.find(b => b.typeId === typeId);
    if (!def) return;
    const width = def.footprint.width + 0.28;
    const depth = def.footprint.depth + 0.28;
    const group = new THREE.Group();

    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x70e2a0,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0.07;
    plane.renderOrder = 2;
    group.add(plane);

    const outlineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-width / 2, 0, -depth / 2),
      new THREE.Vector3(width / 2, 0, -depth / 2),
      new THREE.Vector3(width / 2, 0, depth / 2),
      new THREE.Vector3(-width / 2, 0, depth / 2)
    ]);
    const outlineMaterial = new THREE.LineBasicMaterial({
      color: 0x9dffc1,
      transparent: true,
      opacity: 0.95
    });
    const outline = new THREE.LineLoop(outlineGeometry, outlineMaterial);
    outline.position.y = 0.09;
    outline.renderOrder = 3;
    group.add(outline);

    this.scene.add(group);
    this.placementFootprint = group;
    this.placementFootprintPlane = plane;
    this.placementOutline = outline;
  }

  private syncBuildPlacement(): void {
    const placement = gameStore.placement;
    if (!placement) {
      if (this.placementGhost || this.placementFootprint) {
        this.disposePlacementGhost();
      }
      if (this.placementGrid) this.placementGrid.visible = false;
      return;
    }

    if (this.placementGrid) this.placementGrid.visible = true;

    if (this.placementGhostType !== placement.typeId) {
      this.disposePlacementGhost();
      const built = this.createBuildingVisual(placement.typeId);
      if (!built) return;
      this.prepareGhostVisual(built.group);
      this.placementGhost = built.group;
      this.placementGhostType = placement.typeId;
      this.scene.add(built.group);
      this.createPlacementFootprint(placement.typeId);
      this.placementValidity = null;
    }

    if (!this.placementGhost) return;
    this.placementGhost.position.set(placement.x, 0.15, placement.z);
    this.placementGhost.rotation.y = placement.rotation;

    if (!this.placementFootprint) this.createPlacementFootprint(placement.typeId);
    if (this.placementFootprint) {
      this.placementFootprint.position.set(placement.x, 0, placement.z);
      this.placementFootprint.rotation.y = placement.rotation;
    }

    if (this.placementValidity !== placement.valid) {
      this.placementValidity = placement.valid;
      const color = placement.valid ? 0x72e6a3 : 0xf0645a;
      if (this.placementFootprintPlane) {
        (this.placementFootprintPlane.material as THREE.MeshBasicMaterial).color.setHex(color);
        (this.placementFootprintPlane.material as THREE.MeshBasicMaterial).opacity = placement.valid ? 0.26 : 0.32;
      }
      if (this.placementOutline) {
        (this.placementOutline.material as THREE.LineBasicMaterial).color.setHex(color);
      }
      for (const material of this.placementGhostMaterials) {
        material.emissive.setHex(color);
      }
    }

    if (this.clickMarker.visible) {
      this.clickMarker.visible = false;
      this.clickMoveTarget = null;
    }
  }

  private syncFarmPlots(): void {
    const active = new Set<number>();
    for (const plot of gameStore.farmPlots) {
      active.add(plot.plotId);
      const key = `${plot.state}|${plot.cropId ?? 'none'}|${plot.isWatered ? 1 : 0}|${Math.round(plot.growthProgress * 12)}`;
      let visual = this.farmPlotMeshes.get(plot.plotId);
      if (visual && visual.userData.key !== key) {
        this.scene.remove(visual);
        this.disposeObject(visual);
        this.farmPlotMeshes.delete(plot.plotId);
        visual = undefined;
      }
      if (!visual) {
        visual = AssetBuilder.createFarmPlot(plot.state, plot.cropId, plot.growthProgress, plot.isWatered);
        visual.userData.key = key;
        visual.position.set(plot.worldX, 0.04, plot.worldZ);
        this.scene.add(visual);
        this.farmPlotMeshes.set(plot.plotId, visual);
      } else {
        visual.position.set(plot.worldX, 0.04, plot.worldZ);
      }
    }
    for (const [id, visual] of Array.from(this.farmPlotMeshes.entries())) {
      if (active.has(id)) continue;
      this.scene.remove(visual);
      this.disposeObject(visual);
      this.farmPlotMeshes.delete(id);
    }
  }

  private createCustomerLabel(): { sprite: THREE.Sprite; canvas: HTMLCanvasElement; texture: THREE.CanvasTexture } {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 150;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 2.58, 0);
    sprite.scale.set(1.46, 0.684, 1);
    sprite.renderOrder = 20;
    return { sprite, canvas, texture };
  }

  private drawCustomerLabel(visual: CustomerVisual, customer: Customer): void {
    const ctx = visual.canvas.getContext('2d');
    if (!ctx) return;
    const width = visual.canvas.width;
    const height = visual.canvas.height;
    ctx.clearRect(0, 0, width, height);

    const x = 10;
    const y = 8;
    const w = width - 20;
    const h = height - 16;
    const r = 22;
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
    ctx.closePath();
    ctx.fillStyle = 'rgba(27, 35, 31, 0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(210, 173, 104, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();

    const recipe = customer.order ? RECIPES.find(recipeItem => recipeItem.id === customer.order?.recipeId) : null;
    const icon = recipe?.icon ?? '🍽️';
    ctx.font = '28px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f5e3bd';
    ctx.fillText(icon, 26, 42);

    ctx.font = '700 19px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillStyle = '#f8eed7';
    const maxNameWidth = 236;
    let name = customer.name;
    while (ctx.measureText(name).width > maxNameWidth && name.length > 4) {
      name = `${name.slice(0, -2)}…`;
    }
    ctx.fillText(name, 62, 40);

    const stateLabels: Record<string, string> = {
      spawning: 'Arriving from town',
      walking_in: 'Crossing the piazza',
      queuing: 'Waiting in line',
      ordering: 'Choosing a pizza',
      waiting: 'Waiting for food',
      walking_to_table: 'Walking to a table',
      seated: 'At the table',
      eating: 'Enjoying the meal',
      leaving_happy: 'Leaving happy',
      leaving_angry: 'Leaving disappointed'
    };
    const status = recipe ? recipe.name : stateLabels[customer.state] ?? customer.state;
    ctx.font = '500 14px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(232, 221, 192, 0.75)';
    let statusText = status;
    while (ctx.measureText(statusText).width > 236 && statusText.length > 4) {
      statusText = `${statusText.slice(0, -2)}…`;
    }
    ctx.fillText(statusText, 26, 65);

    if (customer.reactionEmoji) {
      ctx.font = '22px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(customer.reactionEmoji, width - 26, 65);
      ctx.textAlign = 'left';
    }

    const ratio = THREE.MathUtils.clamp(customer.patience / Math.max(1, customer.maxPatience), 0, 1);
    const barX = 26;
    const barY = 86;
    const barW = width - 52;
    const barH = 9;
    ctx.fillStyle = 'rgba(255,255,255,0.13)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 5);
    ctx.fill();
    const color = ratio > 0.55 ? '#8fcf7f' : ratio > 0.26 ? '#e8b954' : '#e0614e';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * ratio, barH, 5);
    ctx.fill();

    ctx.font = '600 12px "Trebuchet MS", "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(245, 227, 189, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(ratio * 100)}% patience`, width - 28, 111);
    ctx.textAlign = 'left';
    ctx.fillText(`Order #${(customer.order?.orderId ?? '').slice(-3)}`, 26, 111);
    visual.texture.needsUpdate = true;
  }

  private syncCustomers(delta: number): void {
    const activeIds = new Set<string>();
    for (const customer of gameStore.customers) {
      activeIds.add(customer.id);
      let visual = this.customerMeshes.get(customer.id);
      if (!visual) {
        const person = AssetBuilder.createCustomer(customer.appearance);
        const label = this.createCustomerLabel();
        person.group.add(label.sprite);
        this.scene.add(person.group);
        visual = {
          group: person.group,
          leftLeg: person.leftLeg,
          rightLeg: person.rightLeg,
          leftArm: person.leftArm,
          rightArm: person.rightArm,
          labelSprite: label.sprite,
          canvas: label.canvas,
          texture: label.texture,
          facing: customer.targetFacing ?? 0,
          walkPhase: Math.random() * Math.PI * 2,
          labelKey: ''
        };
        this.customerMeshes.set(customer.id, visual);
      }

      const seated = customer.state === 'seated' || customer.state === 'eating';
      const walking =
        customer.state === 'walking_in' ||
        customer.state === 'walking_to_table' ||
        customer.state === 'leaving_happy' ||
        customer.state === 'leaving_angry';
      let targetFacing = customer.targetFacing;
      if (targetFacing === undefined) {
        const dx = customer.targetPosition.x - customer.position.x;
        const dz = customer.targetPosition.z - customer.position.z;
        if (Math.hypot(dx, dz) > 0.08) targetFacing = Math.atan2(dx, dz);
      }
      if (targetFacing !== undefined) {
        visual.facing = smoothAngle(visual.facing, targetFacing, delta, walking ? 10 : 6);
      }

      const elapsed = performance.now() * 0.001;
      visual.group.position.set(
        customer.position.x,
        (seated ? -0.27 : 0.02) + (walking ? Math.abs(Math.sin(visual.walkPhase)) * 0.03 : Math.sin(elapsed * 1.7 + visual.walkPhase) * 0.006),
        customer.position.z
      );
      visual.group.rotation.y = visual.facing;

      if (walking) {
        visual.walkPhase += delta * 8.7;
        const swing = Math.sin(visual.walkPhase);
        visual.leftLeg.rotation.x = swing * 0.56;
        visual.rightLeg.rotation.x = -swing * 0.56;
        visual.leftArm.rotation.x = -swing * 0.42;
        visual.rightArm.rotation.x = swing * 0.42;
      } else if (seated) {
        visual.leftLeg.rotation.x = -1.2;
        visual.rightLeg.rotation.x = -1.2;
        const dining = customer.state === 'eating' ? Math.sin(elapsed * 3.2 + visual.walkPhase) * 0.12 : 0;
        visual.leftArm.rotation.x = -0.62;
        visual.rightArm.rotation.x = -0.62 - dining;
        visual.leftLeg.rotation.z = 0.02;
        visual.rightLeg.rotation.z = -0.02;
      } else {
        visual.walkPhase += delta * 1.5;
        visual.leftLeg.rotation.x = 0;
        visual.rightLeg.rotation.x = 0;
        visual.leftArm.rotation.x = Math.sin(elapsed * 1.6 + visual.walkPhase) * 0.045;
        visual.rightArm.rotation.x = -Math.sin(elapsed * 1.6 + visual.walkPhase) * 0.045;
        visual.leftLeg.rotation.z = 0;
        visual.rightLeg.rotation.z = 0;
      }

      const labelVisible =
        customer.state !== 'seated' &&
        customer.state !== 'eating' &&
        customer.state !== 'leaving_happy' &&
        customer.state !== 'leaving_angry';
      visual.labelSprite.visible = labelVisible;
      if (labelVisible) {
        // Keep the shoulder-to-shoulder queue readable: waiting guests get a
        // slimmer billboard so neighbouring order cards don't cover each other.
        const compactLabel = customer.state === 'queuing' || customer.state === 'walking_in';
        const labelWidth = compactLabel ? 1.22 : 1.46;
        visual.labelSprite.scale.set(labelWidth, labelWidth * 0.4685, 1);
        const patienceBucket = Math.ceil((customer.patience / Math.max(1, customer.maxPatience)) * 10);
        const key = `${customer.state}|${customer.order?.recipeId ?? ''}|${patienceBucket}|${customer.reactionEmoji ?? ''}`;
        if (key !== visual.labelKey) {
          visual.labelKey = key;
          this.drawCustomerLabel(visual, customer);
        }
      }
    }

    for (const [id, visual] of Array.from(this.customerMeshes.entries())) {
      if (activeIds.has(id)) continue;
      this.scene.remove(visual.group);
      visual.texture.dispose();
      (visual.labelSprite.material as THREE.SpriteMaterial).dispose();
      this.disposeObject(visual.group);
      this.customerMeshes.delete(id);
    }
  }

  private staffHome(staff: StaffMember, offset: number): { x: number; z: number; facing: number; y: number } {
    switch (staff.role) {
      case 'prep_cook':
        return { x: -5.55 + offset * 1.1, z: -6.65, facing: 0, y: 0.22 };
      case 'oven_tender':
        return { x: -1.45 + offset * 1.1, z: -8.35, facing: 0, y: 0.22 };
      case 'server':
        return { x: 2.35 + offset * 1.15, z: -1.45, facing: 0, y: 0.12 };
      case 'farmhand':
      default:
        return { x: -9.25 - offset * 0.65, z: 4.9, facing: -Math.PI / 2, y: 0.06 };
    }
  }

  private syncStaff(delta: number): void {
    const activeIds = new Set<string>();
    const roleCounts = new Map<string, number>();
    for (const staff of gameStore.staff) {
      activeIds.add(staff.id);
      const offset = roleCounts.get(staff.role) ?? 0;
      roleCounts.set(staff.role, offset + 1);
      let visual = this.staffMeshes.get(staff.id);
      if (!visual) {
        const person = AssetBuilder.createStaffMember(staff.role, staff.appearance.shirtColor, staff.appearance.hairColor);
        this.scene.add(person.group);
        visual = {
          group: person.group,
          leftLeg: person.leftLeg,
          rightLeg: person.rightLeg,
          leftArm: person.leftArm,
          rightArm: person.rightArm,
          phase: Math.random() * Math.PI * 2
        };
        this.staffMeshes.set(staff.id, visual);
      }
      const home = this.staffHome(staff, offset);
      visual.group.position.set(home.x, home.y, home.z);
      visual.group.rotation.y = home.facing;
      visual.phase += delta * 1.9;
      const sway = Math.sin(visual.phase);
      visual.leftArm.rotation.x = sway * 0.08;
      visual.rightArm.rotation.x = -sway * 0.08;
      visual.leftLeg.rotation.x = 0;
      visual.rightLeg.rotation.x = 0;
      visual.group.position.y = home.y + Math.sin(visual.phase * 1.3) * 0.008;
    }
    for (const [id, visual] of Array.from(this.staffMeshes.entries())) {
      if (activeIds.has(id)) continue;
      this.scene.remove(visual.group);
      this.disposeObject(visual.group);
      this.staffMeshes.delete(id);
    }
  }

  private updateProximity(): void {
    gameStore.playerPos.x = this.playerPos.x;
    gameStore.playerPos.z = this.playerPos.z;

    if (gameStore.placement) {
      gameStore.setProximityTarget(null);
      this.interactionRing.visible = false;
      return;
    }

    const candidates: ProximityTarget[] = [];
    const consider = (target: ProximityTarget) => {
      if (target.distance < 2.7) candidates.push(target);
    };

    const prepDistance = this.playerPos.distanceTo(this.prepStationPos);
    consider({
      id: 'prep',
      type: 'station_prep',
      label: 'Prep Counter',
      sublabel: 'Stretch dough & add toppings',
      distance: prepDistance,
      position: { x: WORLD_LAYOUT.stations.prep.x, y: 1, z: WORLD_LAYOUT.stations.prep.z }
    });

    const ovenDistance = this.playerPos.distanceTo(this.ovenStationPos);
    consider({
      id: 'oven',
      type: 'station_oven',
      label: 'Wood-Fired Forno',
      sublabel: gameStore.ovenPizza ? 'A pizza is baking...' : 'Bake your prepped pizza',
      distance: ovenDistance,
      position: { x: WORLD_LAYOUT.stations.oven.x, y: 1, z: WORLD_LAYOUT.stations.oven.z }
    });

    const counterDistance = this.playerPos.distanceTo(this.counterStationPos);
    consider({
      id: 'counter',
      type: 'station_counter',
      label: 'Service Counter',
      sublabel: gameStore.dishesOnCounter.length > 0 ? `${gameStore.dishesOnCounter.length} dish(es) ready to serve` : 'Serve guests their orders',
      distance: counterDistance,
      position: { x: WORLD_LAYOUT.stations.counter.x, y: 1, z: WORLD_LAYOUT.stations.counter.z }
    });

    const cafeDistance = this.playerPos.distanceTo(this.cafeStationPos);
    const coffeeReady = gameStore.espressoCooldown <= 0;
    consider({
      id: 'cafe',
      type: 'station_cafe',
      label: 'Caffè Espresso Bar',
      sublabel: coffeeReady ? `Serve a warming espresso · 🪙 ${gameStore.ESPRESSO_COST}` : `Machine heating · ready in ${Math.ceil(gameStore.espressoCooldown)}s`,
      distance: cafeDistance,
      position: { x: WORLD_LAYOUT.stations.espresso.x, y: 1, z: WORLD_LAYOUT.stations.espresso.z }
    });

    for (const plot of gameStore.farmPlots) {
      const distance = Math.hypot(this.playerPos.x - plot.worldX, this.playerPos.z - plot.worldZ);
      if (distance > 2.25) continue;
      const crop = plot.cropId ? CROPS[plot.cropId] : null;
      let label = 'Garden Plot';
      let sublabel = 'Plant a seed and tend the soil';
      if (plot.state === 'tilled') {
        label = 'Tilled Soil';
        sublabel = 'Ready for seeds';
      } else if (plot.state === 'growing') {
        label = crop ? crop.name : 'Growing Crop';
        sublabel = plot.isWatered
          ? `Growing · ${Math.round(plot.growthProgress * 100)}%`
          : 'Needs water to keep growing';
      } else if (plot.state === 'ready') {
        label = crop ? `${crop.name} Ready` : 'Crop Ready';
        sublabel = 'Harvest your fresh produce';
      }
      consider({
        id: `plot_${plot.plotId}`,
        type: 'farm_plot',
        label,
        sublabel,
        distance,
        plotId: plot.plotId,
        position: { x: plot.worldX, y: 0.8, z: plot.worldZ }
      });
    }

    candidates.sort((a, b) => a.distance - b.distance);
    const closest: ProximityTarget | null = candidates[0] ?? null;
    gameStore.setProximityTarget(closest);
    if (closest) {
      this.interactionRing.visible = true;
      this.interactionRing.position.set(closest.position.x, 0.16, closest.position.z);
    } else {
      this.interactionRing.visible = false;
    }
  }

  public triggerProximityAction(): void {
    if (gameStore.placement) return;
    const target = gameStore.proximityTarget;
    if (!target) return;

    if (target.type === 'station_prep') {
      gameStore.openModal('prep');
    } else if (target.type === 'station_oven') {
      gameStore.openModal('oven');
    } else if (target.type === 'station_counter') {
      gameStore.openModal('counter');
    } else if (target.type === 'station_cafe') {
      gameStore.brewEspresso();
    } else if (target.type === 'farm_plot' && target.plotId !== undefined) {
      gameStore.openModal('farm', target.plotId);
    } else if (target.type === 'building') {
      gameStore.openModal('build');
    }
  }

  private disposeObject(root: THREE.Object3D): void {
    const geometries = new Set<THREE.BufferGeometry>();
    root.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.geometry) geometries.add(mesh.geometry);
    });
    geometries.forEach(geometry => geometry.dispose());
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('wheel', this.onWheel);
    this.renderer.domElement.removeEventListener('contextmenu', this.onContextMenu);

    this.disposePlacementGhost();
    if (this.placementGrid) {
      this.scene.remove(this.placementGrid);
      this.placementGrid.geometry.dispose();
      (this.placementGrid.material as THREE.Material).dispose();
      this.placementGrid = null;
    }

    for (const visual of this.customerMeshes.values()) {
      visual.texture.dispose();
      (visual.labelSprite.material as THREE.SpriteMaterial).dispose();
    }
    this.customerMeshes.clear();
    this.staffMeshes.clear();
    this.buildingMeshes.clear();
    this.farmPlotMeshes.clear();

    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.scene.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material) {
          if (Array.isArray(mesh.material)) mesh.material.forEach(material => materials.add(material));
          else materials.add(mesh.material);
        }
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => {
      const standard = material as THREE.MeshStandardMaterial;
      if (standard.map) standard.map.dispose();
      if (standard.emissiveMap) standard.emissiveMap.dispose();
      if (standard.normalMap) standard.normalMap.dispose();
      material.dispose();
    });

    AssetBuilder.resetMaterials();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
