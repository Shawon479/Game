import type { Recipe } from '../types/game';


export const RECIPES: Recipe[] = [
  {
    id: 'margherita_pizza',
    name: 'Margherita Classica',
    description: 'Crisp hand-tossed crust, San Marzano tomato sauce, fresh creamy mozzarella, and fragrant garden basil leaves.',
    basePrice: 16.0,
    popularity: 0.9,
    prepTimeSeconds: 15,
    ingredients: [
      { itemId: 'dough', qty: 1 },
      { itemId: 'tomato_sauce', qty: 1 },
      { itemId: 'mozzarella', qty: 1 },
      { itemId: 'basil', qty: 1 }
    ],
    cookStation: 'oven',
    idealBakeSeconds: 10,
    unlockLevel: 1,
    icon: '🍕',
    toppings: ['tomato_sauce', 'mozzarella', 'basil']
  },
  {
    id: 'pepperoni_pizza',
    name: 'Pepperoni Rustica',
    description: 'Rich tomato base smothered with melted mozzarella and seasoned pepperoni slices baked to a sizzling crisp.',
    basePrice: 22.0,
    popularity: 0.85,
    prepTimeSeconds: 18,
    ingredients: [
      { itemId: 'dough', qty: 1 },
      { itemId: 'tomato_sauce', qty: 1 },
      { itemId: 'mozzarella', qty: 1 },
      { itemId: 'pepperoni', qty: 1 }
    ],
    cookStation: 'oven',
    idealBakeSeconds: 12,
    unlockLevel: 1,
    icon: '🍕',
    toppings: ['tomato_sauce', 'mozzarella', 'pepperoni']
  },
  {
    id: 'veggie_pizza',
    name: 'Garden Harvest Pizza',
    description: 'Loaded with freshly picked farm-grown sweet bell peppers, juicy diced tomatoes, and garden herbs.',
    basePrice: 24.0,
    popularity: 0.75,
    prepTimeSeconds: 20,
    ingredients: [
      { itemId: 'dough', qty: 1 },
      { itemId: 'tomato_sauce', qty: 1 },
      { itemId: 'mozzarella', qty: 1 },
      { itemId: 'tomato', qty: 1 },
      { itemId: 'bell_pepper', qty: 1 },
      { itemId: 'basil', qty: 1 }
    ],
    cookStation: 'oven',
    idealBakeSeconds: 12,
    unlockLevel: 2,
    icon: '🥦',
    toppings: ['tomato_sauce', 'mozzarella', 'tomato', 'bell_pepper', 'basil']
  },
  {
    id: 'truffle_mushroom_pizza',
    name: 'Forest Mushroom Bianca',
    description: 'White pizza base with savory sliced forest mushrooms, garlic-infused olive oil, and melted mozzarella.',
    basePrice: 28.0,
    popularity: 0.7,
    prepTimeSeconds: 22,
    ingredients: [
      { itemId: 'dough', qty: 1 },
      { itemId: 'mozzarella', qty: 2 },
      { itemId: 'mushroom', qty: 2 },
      { itemId: 'basil', qty: 1 }
    ],
    cookStation: 'oven',
    idealBakeSeconds: 11,
    unlockLevel: 3,
    icon: '🍄',
    toppings: ['mozzarella', 'mushroom', 'basil']
  },
  {
    id: 'spicy_diablo_pizza',
    name: 'Spicy Diablo Fire',
    description: 'A fiery combination of spicy pepperoni, grilled hot bell peppers, melted mozzarella, and fresh basil.',
    basePrice: 32.0,
    popularity: 0.65,
    prepTimeSeconds: 20,
    ingredients: [
      { itemId: 'dough', qty: 1 },
      { itemId: 'tomato_sauce', qty: 1 },
      { itemId: 'mozzarella', qty: 1 },
      { itemId: 'pepperoni', qty: 1 },
      { itemId: 'bell_pepper', qty: 1 }
    ],
    cookStation: 'oven',
    idealBakeSeconds: 13,
    unlockLevel: 4,
    icon: '🔥',
    toppings: ['tomato_sauce', 'mozzarella', 'pepperoni', 'bell_pepper']
  }
];

export const INGREDIENT_ITEMS: Record<string, { name: string; icon: string; category: 'pantry' | 'produce'; buyPrice: number; sellPrice: number; description: string }> = {
  dough: {
    name: 'Artisan Dough Ball',
    icon: '🍞',
    category: 'pantry',
    buyPrice: 3.0,
    sellPrice: 1.5,
    description: 'Slow-fermented Neapolitan pizza dough ball.'
  },
  tomato_sauce: {
    name: 'San Marzano Sauce',
    icon: '🥫',
    category: 'pantry',
    buyPrice: 2.5,
    sellPrice: 1.0,
    description: 'Crushed sweet plum tomatoes with sea salt.'
  },
  mozzarella: {
    name: 'Fior di Latte Mozzarella',
    icon: '🧀',
    category: 'pantry',
    buyPrice: 3.5,
    sellPrice: 1.5,
    description: 'Fresh pulled mozzarella cheese.'
  },
  pepperoni: {
    name: 'Spiced Pepperoni',
    icon: '🥩',
    category: 'pantry',
    buyPrice: 4.0,
    sellPrice: 2.0,
    description: 'Dry-cured Italian style pepperoni slices.'
  },
  tomato: {
    name: 'Ripe Garden Tomato',
    icon: '🍅',
    category: 'produce',
    buyPrice: 4.0,
    sellPrice: 3.0,
    description: 'Juicy heirloom tomato grown on the farm.'
  },
  basil: {
    name: 'Sweet Genovese Basil',
    icon: '🌿',
    category: 'produce',
    buyPrice: 3.0,
    sellPrice: 2.5,
    description: 'Aromatic sweet green basil leaves.'
  },
  bell_pepper: {
    name: 'Sweet Bell Pepper',
    icon: '🫑',
    category: 'produce',
    buyPrice: 5.0,
    sellPrice: 4.0,
    description: 'Crisp farm-grown bell pepper.'
  },
  mushroom: {
    name: 'Wild Forest Mushroom',
    icon: '🍄',
    category: 'produce',
    buyPrice: 6.0,
    sellPrice: 4.5,
    description: 'Earthy mushroom cultivated in moist soil.'
  },
  wheat: {
    name: 'Golden Wheat Sheaf',
    icon: '🌾',
    category: 'produce',
    buyPrice: 3.0,
    sellPrice: 2.5,
    description: 'Farm-grown wheat, can be milled into dough.'
  }
};
