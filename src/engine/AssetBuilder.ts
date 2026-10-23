import * as THREE from 'three';
import type { CustomerAppearance } from '../types/game';
import { getMaterial, resetMaterials } from './assets/materials';
import {
  createChef as buildChef,
  createCustomer as buildCustomer,
  createStaffMember as buildStaff,
  type PersonBuild
} from './assets/humanoids';
import {
  createAwning,
  createChalkboardMenu,
  createCourtyardFountain,
  createDiningTable,
  createEspressoBar,
  createFarmPlot,
  createFlowerBox,
  createFlowerCart,
  createLanternPost,
  createOlivePlanter,
  createPatioUmbrella,
  createPizzaOven,
  createPlanterPot,
  createPrepCounter,
  createServingCounter,
  createSprinkler,
  type EspressoBarBuild
} from './assets/cafeAssets';
import {
  createCypressTree,
  createDistantHill,
  createFlowerPatch,
  createLavenderBush,
  createOliveTree,
  createPalmTree,
  createRock,
  createShrub,
  createWoodenFencePost
} from './assets/natureAssets';
import { createBellTower, createTownHouse } from './assets/townAssets';
import {
  createBarrel,
  createBench,
  createBicycle,
  createBird,
  createBollard,
  createBusStop,
  createCar,
  createCloud,
  createCrate,
  createFountain,
  createHydrant,
  createMailbox,
  createStreetLamp,
  createTrashBin,
  type CarBuild,
  type CarType
} from './assets/worldAssets';

export type { PersonBuild, EspressoBarBuild, CarBuild, CarType };

/**
 * Facade for the procedural asset library. The individual builders live in
 * `engine/assets/*` so the code stays navigable, but scene code can keep using
 * the familiar AssetBuilder namespace.
 */
export class AssetBuilder {
  public static getMaterial = getMaterial;
  public static resetMaterials = resetMaterials;

  // Characters
  public static createChef(): PersonBuild {
    return buildChef();
  }

  public static createCustomer(appearance: CustomerAppearance): PersonBuild {
    return buildCustomer(appearance);
  }

  public static createStaffMember(role: string, shirtColor: string, hairColor: string): PersonBuild {
    return buildStaff(role, shirtColor, hairColor);
  }

  // Café & kitchen
  public static createPizzaOven(): THREE.Group {
    return createPizzaOven();
  }

  public static createPrepCounter(): THREE.Group {
    return createPrepCounter();
  }

  public static createServingCounter(): THREE.Group {
    return createServingCounter();
  }

  public static createEspressoBar(): EspressoBarBuild {
    return createEspressoBar();
  }

  public static createDiningTable(options: { terrace?: boolean; umbrella?: boolean } = {}): THREE.Group {
    return createDiningTable(options);
  }

  public static createAwning(width: number, depth: number, colorA: string, colorB: string): THREE.Group {
    return createAwning(width, depth, colorA, colorB);
  }

  public static createPatioUmbrella(primary?: string, secondary?: string): THREE.Group {
    return createPatioUmbrella(primary, secondary);
  }

  public static createFlowerBox(width?: number, boxColor?: string): THREE.Group {
    return createFlowerBox(width, boxColor);
  }

  public static createChalkboardMenu(title: string, lines: string[]): THREE.Group {
    return createChalkboardMenu(title, lines);
  }

  public static createPlanterPot(): THREE.Group {
    return createPlanterPot();
  }

  public static createOlivePlanter(): THREE.Group {
    return createOlivePlanter();
  }

  public static createFlowerCart(): THREE.Group {
    return createFlowerCart();
  }

  public static createCourtyardFountain(): { group: THREE.Group; water: THREE.Mesh; jet: THREE.Mesh } {
    return createCourtyardFountain();
  }

  // Farm
  public static createFarmPlot(state: string, cropId: string | null, progress: number, isWatered: boolean): THREE.Group {
    return createFarmPlot(state, cropId, progress, isWatered);
  }

  public static createLanternPost(): { group: THREE.Group; light: THREE.PointLight } {
    return createLanternPost();
  }

  public static createSprinkler(): { group: THREE.Group; spinner: THREE.Mesh } {
    return createSprinkler();
  }

  // Nature
  public static createCypressTree(): THREE.Group {
    return createCypressTree();
  }

  public static createOliveTree(): THREE.Group {
    return createOliveTree();
  }

  public static createShrub(): THREE.Group {
    return createShrub();
  }

  public static createFlowerPatch(): THREE.Group {
    return createFlowerPatch();
  }

  public static createLavenderBush(): THREE.Group {
    return createLavenderBush();
  }

  public static createRock(): THREE.Group {
    return createRock();
  }

  public static createPalmTree(): THREE.Group {
    return createPalmTree();
  }

  public static createWoodenFencePost(): THREE.Group {
    return createWoodenFencePost();
  }

  public static createDistantHill(radius: number, height: number, color: string): THREE.Mesh {
    return createDistantHill(radius, height, color);
  }

  public static createCloud(): THREE.Group {
    return createCloud();
  }

  // Town & street
  public static createTownHouse(variant: number, signText?: string): THREE.Group {
    return createTownHouse(variant, signText);
  }

  public static createBellTower(): THREE.Group {
    return createBellTower();
  }

  public static createCar(type: CarType, bodyColor: string, accentColor?: string, label?: string): CarBuild {
    return createCar(type, bodyColor, accentColor, label);
  }

  public static createFountain(): { group: THREE.Group; water: THREE.Mesh; jet: THREE.Mesh } {
    return createFountain();
  }

  public static createStreetLamp(): { group: THREE.Group; light: THREE.PointLight } {
    return createStreetLamp();
  }

  public static createBench(): THREE.Group {
    return createBench();
  }

  public static createTrashBin(): THREE.Group {
    return createTrashBin();
  }

  public static createHydrant(): THREE.Group {
    return createHydrant();
  }

  public static createMailbox(): THREE.Group {
    return createMailbox();
  }

  public static createBollard(): THREE.Group {
    return createBollard();
  }

  public static createBusStop(): THREE.Group {
    return createBusStop();
  }

  public static createBicycle(): THREE.Group {
    return createBicycle();
  }

  public static createCrate(): THREE.Group {
    return createCrate();
  }

  public static createBarrel(): THREE.Group {
    return createBarrel();
  }

  public static createBird(): THREE.Group {
    return createBird();
  }
}
