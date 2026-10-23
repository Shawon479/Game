/**
 * Shared world layout constants.
 * The street runs along the south edge of the café, so guests arriving from
 * town cross the cobbled road before reaching the terrace. Keeping these
 * numbers in one place means the simulation, the renderer, and the minimap
 * all agree about where the café, farm, tables, and street furniture live.
 */

export interface LayoutPoint {
  x: number;
  z: number;
}

export interface QueueSpot extends LayoutPoint {
  facing: number;
}

export const WORLD_LAYOUT = {
  bounds: { minX: -27, maxX: 27, minZ: -13.5, maxZ: 20.5 },
  spawn: { x: 0, z: 16.2 },

  road: {
    centerZ: 12,
    halfWidth: 2.5,
    minX: -38,
    maxX: 38,
    eastboundLaneZ: 10.75,
    westboundLaneZ: 13.25
  },

  sidewalk: {
    northCenterZ: 7.75,
    southCenterZ: 16.25,
    halfDepth: 1.75
  },

  cafe: {
    centerX: -1.5,
    backZ: -10.4,
    frontZ: -4.2,
    width: 13,
    wallHeight: 4.2,
    roofPeak: 7.2
  },

  stations: {
    prep: { x: -4.5, z: -5.3 },
    oven: { x: -0.5, z: -6.5 },
    counter: { x: 0, z: -2.55 },
    espresso: { x: 6.25, z: -4.85 }
  },

  /** Guests queue shoulder-to-shoulder in front of the service counter. */
  queue: [
    { x: 0.0, z: -0.9, facing: Math.PI },
    { x: 1.45, z: -0.9, facing: Math.PI },
    { x: 2.9, z: -0.9, facing: Math.PI },
    { x: 4.35, z: -0.9, facing: Math.PI },
    { x: 5.8, z: -0.9, facing: Math.PI },
    { x: 7.25, z: -0.9, facing: Math.PI },
    { x: 8.7, z: -0.9, facing: Math.PI },
    { x: 10.15, z: -0.9, facing: Math.PI }
  ] as QueueSpot[],

  farm: {
    originX: -15,
    originZ: 2.4,
    spacing: 2.4,
    cols: 3,
    rows: 2
  },

  farmFence: {
    minX: -16.7,
    maxX: -8.6,
    minZ: 0.8,
    maxZ: 6.4
  },

  fountain: { x: -4.6, z: 2.7, radius: 1.85 },

  patio: {
    minX: 5.9,
    maxX: 15.2,
    minZ: -5.8,
    maxZ: 4.6
  },

  town: {
    firstZ: 36.5,
    rowDepth: 7
  }

} as const;

export type WorldLayout = typeof WORLD_LAYOUT;
