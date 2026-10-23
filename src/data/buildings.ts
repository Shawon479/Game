import type { BuildingDefinition } from '../types/game';


export const BUILDINGS: BuildingDefinition[] = [
  {
    typeId: 'table_rustic',
    name: 'Rustic Bistro Table',
    description: 'A cozy wooden dining table with two comfortable woven chairs. Allows additional customers to sit and dine!',
    category: 'restaurant',
    cost: 75,
    unlockLevel: 1,
    footprint: { width: 2, depth: 2 },
    effect: {
      type: 'seating',
      value: 2,
      description: 'Increases restaurant capacity by +2 customer seats'
    },
    icon: '🪑'
  },
  {
    typeId: 'table_terrace',
    name: 'Pergola Terrace Table',
    description: 'An outdoor checkered table with a cozy striped sun canopy. Attracts high-paying guests!',
    category: 'restaurant',
    cost: 160,
    unlockLevel: 2,
    footprint: { width: 2, depth: 2 },
    effect: {
      type: 'seating',
      value: 2,
      tipBonus: 0.15,
      description: '+2 customer seats and +15% tip bonus'
    },
    icon: '🍷'
  },
  {
    typeId: 'sprinkler_basic',
    name: 'Rotary Brass Sprinkler',
    description: 'Automated water sprinkler that rotates and keeps all farm plots in a 2-tile radius continuously watered.',
    category: 'farm',
    cost: 140,
    unlockLevel: 2,
    footprint: { width: 1, depth: 1 },
    effect: {
      type: 'auto_water',
      radiusTiles: 2,
      description: 'Automatically keeps adjacent 8 farm plots watered'
    },
    icon: '💦'
  },
  {
    typeId: 'lantern_amber',
    name: 'Warm Amber Street Lamp',
    description: 'Cast a golden romantic glow at twilight. Enhances ambiance and increases restaurant rating.',
    category: 'decoration',
    cost: 60,
    unlockLevel: 1,
    footprint: { width: 1, depth: 1 },
    effect: {
      type: 'ambiance_boost',
      value: 10,
      description: 'Increases tip generosity by +10%'
    },
    icon: '🏮'
  },
  {
    typeId: 'planter_rosemary',
    name: 'Terracotta Herb Planter',
    description: 'Fragrant rosemary and lavender flowers in a hand-crafted terracotta urn.',
    category: 'decoration',
    cost: 45,
    unlockLevel: 1,
    footprint: { width: 1, depth: 1 },
    effect: {
      type: 'ambiance_boost',
      value: 8,
      description: 'Adds cozy charm and warmth to your patio'
    },
    icon: '🪴'
  },
  {
    typeId: 'path_cobblestone',
    name: 'Cobblestone Walkway (x3)',
    description: 'Smooth river stones paving the walkway between kitchen and garden.',
    category: 'infrastructure',
    cost: 30,
    unlockLevel: 1,
    footprint: { width: 1, depth: 3 },
    effect: {
      type: 'speed_path',
      value: 1.25,
      description: 'Provides +25% player walking speed when traveling on paths'
    },
    icon: '🧱'
  },
  {
    typeId: 'glass_greenhouse',
    name: 'Glass Solarium Greenhouse',
    description: 'State of the art glass solarium. Eliminates stormy weather penalty and accelerates crop growth by +20%.',
    category: 'farm',
    cost: 350,
    unlockLevel: 3,
    footprint: { width: 3, depth: 3 },
    effect: {
      type: 'greenhouse',
      value: 1.2,
      description: 'All crops grow 20% faster and are sheltered from harsh storms'
    },
    icon: '🏡'
  },
  {
    typeId: 'olive_planter',
    name: 'Ancient Olive Planter',
    description: 'A gnarled olive sapling in a hand-thrown terracotta urn. The silver-green canopy adds a touch of the Tuscan hills to any corner.',
    category: 'decoration',
    cost: 110,
    unlockLevel: 2,
    footprint: { width: 1, depth: 1 },
    effect: {
      type: 'ambiance_boost',
      value: 14,
      description: 'Adds dappled shade and +14% guest tip generosity'
    },
    icon: '🌿'
  },
  {
    typeId: 'flower_cart',
    name: 'Flower Cart',
    description: 'A painted wooden cart spilling over with roses, lavender and sunflowers. Guests love to pause beside it for a photograph.',
    category: 'decoration',
    cost: 180,
    unlockLevel: 2,
    footprint: { width: 2, depth: 2 },
    effect: {
      type: 'ambiance_boost',
      value: 20,
      description: 'A fragrant photo spot that raises tips by +20%'
    },
    icon: '💐'
  },
  {
    typeId: 'courtyard_fountain',
    name: 'Courtyard Fountain',
    description: 'A small octagonal fountain with a bubbling jet and four lion-head spouts. The sound of cool water makes the terrace feel like a private villa.',
    category: 'decoration',
    cost: 320,
    unlockLevel: 3,
    footprint: { width: 3, depth: 3 },
    effect: {
      type: 'ambiance_boost',
      value: 26,
      description: 'A serene centerpiece with +26% guest tip generosity'
    },
    icon: '⛲'
  }
];
