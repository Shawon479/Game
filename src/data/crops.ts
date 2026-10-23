import type { Crop } from '../types/game';


export const CROPS: Record<string, Crop> = {
  tomato: {
    id: 'tomato',
    name: 'San Marzano Tomato',
    seedCost: 4,
    baseGrowthSeconds: 22,
    yieldMin: 2,
    yieldMax: 4,
    weatherModifiers: {
      clear: 1.15,
      cloudy: 1.0,
      rain: 1.25,
      storm: 0.9
    },
    sellValue: 4,
    usedInRecipes: ['veggie_pizza'],
    icon: '🍅',
    color: '#e63946',
    stages: 4
  },
  basil: {
    id: 'basil',
    name: 'Sweet Genovese Basil',
    seedCost: 3,
    baseGrowthSeconds: 16,
    yieldMin: 3,
    yieldMax: 5,
    weatherModifiers: {
      clear: 1.2,
      cloudy: 1.0,
      rain: 1.15,
      storm: 0.85
    },
    sellValue: 3,
    usedInRecipes: ['margherita_pizza', 'veggie_pizza', 'truffle_mushroom_pizza'],
    icon: '🌿',
    color: '#2a9d8f',
    stages: 4
  },
  bell_pepper: {
    id: 'bell_pepper',
    name: 'Sweet Bell Pepper',
    seedCost: 6,
    baseGrowthSeconds: 28,
    yieldMin: 2,
    yieldMax: 4,
    weatherModifiers: {
      clear: 1.25,
      cloudy: 1.0,
      rain: 1.1,
      storm: 0.8
    },
    sellValue: 6,
    usedInRecipes: ['veggie_pizza', 'spicy_diablo_pizza'],
    icon: '🫑',
    color: '#e76f51',
    stages: 4
  },
  mushroom: {
    id: 'mushroom',
    name: 'Forest Cremini Mushroom',
    seedCost: 7,
    baseGrowthSeconds: 24,
    yieldMin: 2,
    yieldMax: 4,
    weatherModifiers: {
      clear: 0.9,
      cloudy: 1.1,
      rain: 1.45, // loves rainy moist weather!
      storm: 1.3
    },
    sellValue: 7,
    usedInRecipes: ['truffle_mushroom_pizza'],
    icon: '🍄',
    color: '#9c6644',
    stages: 4
  },
  wheat: {
    id: 'wheat',
    name: 'Golden Durum Wheat',
    seedCost: 3,
    baseGrowthSeconds: 18,
    yieldMin: 3,
    yieldMax: 6,
    weatherModifiers: {
      clear: 1.3,
      cloudy: 1.0,
      rain: 1.0,
      storm: 0.7
    },
    sellValue: 3,
    usedInRecipes: ['margherita_pizza', 'pepperoni_pizza', 'veggie_pizza'],
    icon: '🌾',
    color: '#e9c46a',
    stages: 4
  }
};
