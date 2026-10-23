export type WeatherType = 'clear' | 'cloudy' | 'rain' | 'storm';

export interface IngredientRequirement {
  itemId: string;
  qty: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  popularity: number;
  prepTimeSeconds: number;
  ingredients: IngredientRequirement[];
  cookStation: 'oven' | 'prep';
  idealBakeSeconds: number;
  unlockLevel: number;
  icon: string;
  toppings: string[];
}

export interface Crop {
  id: string;
  name: string;
  seedCost: number;
  baseGrowthSeconds: number;
  yieldMin: number;
  yieldMax: number;
  weatherModifiers: Record<WeatherType, number>;
  sellValue: number;
  usedInRecipes: string[];
  icon: string;
  color: string;
  stages: number;
}

export type PlotState = 'empty' | 'tilled' | 'planted' | 'growing' | 'ready';

export interface FarmPlot {
  plotId: number;
  gridX: number;
  gridZ: number;
  worldX: number;
  worldZ: number;
  state: PlotState;
  cropId: string | null;
  plantedAt: number | null;
  growthProgress: number; // 0.0 to 1.0
  isWatered: boolean;
  wateredAt: number | null;
}

export type BuildingCategory = 'restaurant' | 'farm' | 'decoration' | 'infrastructure';

export interface BuildingDefinition {
  typeId: string;
  name: string;
  description: string;
  category: BuildingCategory;
  cost: number;
  unlockLevel: number;
  footprint: { width: number; depth: number };
  effect: {
    type: 'seating' | 'auto_water' | 'ambiance_boost' | 'speed_path' | 'greenhouse' | 'decor';
    value?: number;
    tipBonus?: number;
    radiusTiles?: number;
    description: string;
  };
  icon: string;
}


export interface PlacedBuilding {
  buildingId: string;
  typeId: string;
  x: number;
  z: number;
  rotation: number;
}

export interface BuildPlacement {
  mode: 'build' | 'move';
  typeId: string;
  /** Set while relocating an existing structure. */
  buildingId?: string;
  x: number;
  z: number;
  rotation: number;
  valid: boolean;
  reason: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  recipeId: string;
  modifiers: string[];
  patienceSeconds: number;
  maxPatienceSeconds: number;
  createdAt: number;
  status: 'waiting' | 'cooking' | 'ready' | 'served' | 'expired';
}

export type CustomerState = 
  | 'spawning'
  | 'walking_in'
  | 'queuing'
  | 'seated'
  | 'ordering'
  | 'waiting'
  | 'walking_to_table'
  | 'eating'
  | 'leaving_happy'
  | 'leaving_angry';

export type HairStyle = 'short' | 'bob' | 'long' | 'bun' | 'curly' | 'bald' | 'ponytail';
export type CustomerAccessory = 'none' | 'glasses' | 'bag' | 'scarf' | 'cap' | 'sunhat' | 'earrings';

export interface CustomerAppearance {
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  skinColor: string;
  hat?: string;
  hairStyle?: HairStyle;
  accessory?: CustomerAccessory;
  /** Slightly different silhouettes make the crowd feel like real villagers. */
  build?: 'slim' | 'regular' | 'broad';
  heightScale?: number;
  outerColor?: string;
  shoesColor?: string;
}

export interface Customer {
  id: string;
  name: string;
  state: CustomerState;
  appearance: CustomerAppearance;
  targetTableId: number | null; // index into the live seating-spot list
  position: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  targetFacing?: number;
  /** Optional waypoint route (street -> promenade -> counter, etc.). */
  path?: Array<{ x: number; z: number }>;
  order: Order | null;
  patience: number;
  maxPatience: number;
  reactionEmoji?: string;
  eatingTimer?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  rewardXp: number;
  progress: number;
  goal: number;
  unlocked: boolean;
}

export interface TransactionRecord {
  id: string;
  timestamp: number;
  type: 'sale' | 'tip' | 'purchase' | 'crop_sale' | 'wage' | 'seed';
  amount: number;
  description: string;
}

export interface PreparedDish {
  id: string;
  recipeId: string;
  quality: 'perfect' | 'good' | 'undercooked' | 'burnt';
  qualityMultiplier: number;
  preparedAt: number;
}

export interface SaveGame {
  version: number;
  coins: number;
  level: number;
  xp: number;
  day: number;
  timeOfDaySeconds: number; // 0 to 720 (12 minutes real-time)
  weather: WeatherType;
  reputationStars: number;
  tutorialComplete: boolean;
  tutorialStep: number;
  unlockedRecipes: string[];
  farmPlots: FarmPlot[];
  buildings: PlacedBuilding[];
  inventory: Record<string, number>;
  dishesOnCounter: PreparedDish[];
  achievements: string[];
  staff?: StaffMember[];
  dailyChallenges?: DailyChallenge[];
  restaurantTier?: number;
  cafeName?: string;
  dailySpecialRecipeId?: string | null;
  dailySpecialChosenDay?: number;
  stats: {
    dishesServed: number;
    cropsHarvested: number;
    coinsEarned: number;
    burntDishes: number;
    perfectBakes: number;
    daysPlayed: number;
    customersLost?: number;
    espressoBrews?: number;
  };
}

export type StaffRole = 'prep_cook' | 'oven_tender' | 'server' | 'farmhand';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  skillLevel: number; // 1-5
  dailyWage: number;
  hiredAt: number;
  appearance: {
    shirtColor: string;
    hairColor: string;
  };
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'serve_dishes' | 'harvest_crops' | 'earn_coins' | 'perfect_bakes' | 'build';
  target: number;
  progress: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
  day: number;
}

export interface DaySummary {
  day: number;
  dishesServed: number;
  cropsHarvested: number;
  coinsEarned: number;
  coinsSpent: number;
  perfectBakes: number;
  burntDishes: number;
  customersLost: number;
  bestDish: string | null;
  weatherToday: WeatherType;
  reputationChange: number;
  challengesCompleted: number;
}

export interface ProximityTarget {
  id: string;
  type: 'station_prep' | 'station_oven' | 'station_counter' | 'station_cafe' | 'farm_plot' | 'shop' | 'building';
  label: string;
  sublabel?: string;
  distance: number;
  plotId?: number;
  position: { x: number; y: number; z: number };
}

export type SpecialEventType = 
  | 'pizza_festival'     // All dish prices x1.5 for duration
  | 'vip_visit'          // A VIP critic arrives, perfect service = big rep gain
  | 'health_inspector'   // Inspector penalizes burnt dishes
  | 'harvest_festival'   // Crops grow 2x faster
  | 'rainy_day_special'; // All customers tip extra during rain

export interface SpecialEvent {
  id: string;
  type: SpecialEventType;
  title: string;
  description: string;
  icon: string;
  durationSeconds: number;
  remainingSeconds: number;
  active: boolean;
  bonusMultiplier: number;
}

export interface HighScore {
  day: number;
  coinsEarned: number;
  dishesServed: number;
  reputationStars: number;
  restaurantTier: number;
  timestamp: number;
}

export interface ResearchProject {
  id: string;
  recipeId: string;        // Recipe this research unlocks
  recipeName: string;
  icon: string;
  costCoins: number;
  costXp: number;
  description: string;
  unlocked: boolean;
  available: boolean;      // Only shown when player has sufficient level
  requiresLevel: number;
}
