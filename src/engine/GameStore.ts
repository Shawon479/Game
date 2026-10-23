import type { 
  SaveGame, FarmPlot, PlacedBuilding, PreparedDish, Customer, CustomerAppearance,
  TransactionRecord, WeatherType, ProximityTarget,
  StaffMember, StaffRole, DailyChallenge, DaySummary,
  SpecialEvent, HighScore, ResearchProject, BuildingDefinition, BuildPlacement
} from '../types/game';

import { RECIPES } from '../data/recipes';
import { CROPS } from '../data/crops';
import { BUILDINGS } from '../data/buildings';
import { INITIAL_ACHIEVEMENTS } from '../data/achievements';
import { WORLD_LAYOUT } from '../data/worldLayout';
import { audioManager } from './AudioManager';

type Listener = () => void;

const SAVE_KEY_PREFIX = 'slice_and_sprout_save_v1_';

function stripControlCharacters(value: string): string {
  let safe = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    safe += code < 32 || code === 127 ? ' ' : value[i];
  }
  return safe;
}

export class GameStore {
  private listeners: Set<Listener> = new Set();

  // Core State
  public coins: number = 150;
  public level: number = 1;
  public xp: number = 0;
  public day: number = 1;
  public timeOfDaySeconds: number = 240; // Starts in the morning (~8:00 AM)
  public weather: WeatherType = 'clear';
  public reputationStars: number = 3.5;
  public tutorialComplete: boolean = false;
  public tutorialStep: number = 0; // 0: welcome, 1: till, 2: plant, 3: water, 4: harvest, 5: prep, 6: bake, 7: serve
  public unlockedRecipes: string[] = ['margherita_pizza', 'pepperoni_pizza'];
  public farmPlots: FarmPlot[] = [];
  public buildings: PlacedBuilding[] = [];
  public inventory: Record<string, number> = {
    dough: 6,
    tomato_sauce: 6,
    mozzarella: 8,
    pepperoni: 4,
    basil: 4,
    tomato: 3,
    bell_pepper: 2,
    mushroom: 2,
    // Seeds for planting
    seed_tomato: 4,
    seed_basil: 4,
    seed_bell_pepper: 2,
    seed_mushroom: 2,
    seed_wheat: 4
  };
  public dishesOnCounter: PreparedDish[] = [];
  public ovenPizza: {
    recipeId: string;
    elapsedSeconds: number;
    idealSeconds: number;
    isBaking: boolean;
  } | null = null;

  public customers: Customer[] = [];
  public nextCustomerSpawnTime: number = 5; // seconds until next customer
  public maxCustomers: number = 4;
  public restaurantTier: number = 1; // 1: Rustic Bistro, 2: Trattoria di Toscana, 3: Grand Tuscan Villa
  public cafeName: string = 'Slice & Sprout';

  // Combo system — consecutive serves within a short window
  public serveCombo: number = 0;
  private comboTimer: number = 0;
  private readonly COMBO_WINDOW = 12; // seconds to keep combo alive

  // Café espresso bar — quick patience rescue for the queue
  public espressoCooldown: number = 0;
  public readonly ESPRESSO_COOLDOWN = 20;
  public readonly ESPRESSO_COST = 4;

  // UI refresh throttle — prevents a full React re-render every simulation frame
  private uiRefreshTimer: number = 0;

  // Special events
  public specialEvents: SpecialEvent[] = [];
  private nextEventTimer: number = 90; // seconds until potential event spawn

  // Leaderboard (stored locally)
  public highScores: HighScore[] = [];

  // Recipe research
  public researchProjects: ResearchProject[] = [];

  // Chef's Daily Special — one recipe gets a price boost and extra demand.
  public dailySpecialRecipeId: string | null = null;
  public dailySpecialChosenDay: number = 0;
  public readonly DAILY_SPECIAL_PRICE_BONUS = 0.3;

  // In-world build placement (not persisted; a reload cancels building mode).
  public placement: BuildPlacement | null = null;

  // Staff
  public staff: StaffMember[] = [];

  // Daily challenges
  public dailyChallenges: DailyChallenge[] = [];

  // End-of-day tracking
  public daySummary: DaySummary | null = null;
  public dayStartStats = { dishesServed: 0, cropsHarvested: 0, coinsEarned: 0, perfectBakes: 0, burntDishes: 0, customersLost: 0 };
  public dayCoinsSpent: number = 0;
  public dayCustomersLost: number = 0;
  public dayBestDish: string | null = null;
  public dayRepStart: number = 3.5;

  // Autosave and staff tick timers
  private autosaveTimer: number = 0;
  private staffTickAccumulator: number = 0;

  public achievements = INITIAL_ACHIEVEMENTS;
  public transactions: TransactionRecord[] = [];
  public stats = {
    dishesServed: 0,
    cropsHarvested: 0,
    coinsEarned: 150,
    burntDishes: 0,
    perfectBakes: 0,
    daysPlayed: 1,
    customersLost: 0,
    espressoBrews: 0
  };

  // UI state
  public activeModal: 'prep' | 'oven' | 'counter' | 'farm' | 'build' | 'recipes' | 'shop' | 'settings' | 'achievements' | 'map' | 'inventory' | 'staff' | 'day_summary' | 'challenges' | 'research' | 'leaderboard' | 'piazza' | null = null;
  public selectedPlotId: number | null = null;
  public proximityTarget: ProximityTarget | null = null;
  public playerPos: { x: number; z: number } = { x: 0, z: 0 };
  public toast: { id: string; title: string; body: string; type: 'info' | 'success' | 'warning' } | null = null;
  public isPaused: boolean = false;

  constructor() {
    this.initDefaultFarmPlots();
    this.initDefaultBuildings();
    this.loadAutosave();
    this.generateDailyChallenges();
    this.initResearchProjects();
    this.loadHighScores();
    this.ensureDailySpecial();
    this.snapshotDayStart();
  }

  private initDefaultFarmPlots() {
    this.farmPlots = [];
    const { originX, originZ, spacing, cols, rows } = WORLD_LAYOUT.farm;

    let id = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.farmPlots.push({
          plotId: id++,
          gridX: col,
          gridZ: row,
          worldX: originX + col * spacing,
          worldZ: originZ + row * spacing,
          state: 'empty',
          cropId: null,
          plantedAt: null,
          growthProgress: 0,
          isWatered: false,
          wateredAt: null
        });
      }
    }
  }

  public createDefaultBuildings(): PlacedBuilding[] {
    return [
      { buildingId: 'default_table_1', typeId: 'table_terrace', x: 8.6, z: -2.6, rotation: 0 },
      { buildingId: 'default_table_2', typeId: 'table_rustic', x: 11.9, z: -4.1, rotation: 0.35 },
      { buildingId: 'default_table_3', typeId: 'table_terrace', x: 9.0, z: 2.1, rotation: -0.25 },
      { buildingId: 'default_table_4', typeId: 'table_rustic', x: 12.7, z: 1.0, rotation: 0.15 },
      { buildingId: 'default_planter_1', typeId: 'planter_rosemary', x: 5.9, z: -1.6, rotation: 0 },
      { buildingId: 'default_lantern_1', typeId: 'lantern_amber', x: -7.8, z: -2.7, rotation: 0 }
    ];
  }

  private initDefaultBuildings() {
    this.buildings = this.createDefaultBuildings();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // --- REPUTATION & ECONOMY ---

  public addCoins(amount: number, type: TransactionRecord['type'], description: string) {
    this.coins = Math.max(0, Math.round((this.coins + amount) * 100) / 100);
    this.stats.coinsEarned += Math.max(0, amount);
    this.logTransaction(type, amount, description);
    audioManager.playCoin();
    this.updateChallenges('earn_coins', amount);
    this.checkAchievements();
    this.notify();
  }

  public spendCoins(amount: number, type: TransactionRecord['type'], description: string): boolean {
    if (this.coins < amount) {
      this.showToast('Insufficient Coins', `You need 🪙 ${amount} coins for this!`, 'warning');
      return false;
    }
    this.coins = Math.max(0, Math.round((this.coins - amount) * 100) / 100);
    this.dayCoinsSpent += amount;
    this.logTransaction(type, -amount, description);
    this.notify();
    return true;
  }

  private logTransaction(type: TransactionRecord['type'], amount: number, description: string) {
    const record: TransactionRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      type,
      amount,
      description
    };
    this.transactions.unshift(record);
    if (this.transactions.length > 50) this.transactions.pop();
  }

  public addXp(amount: number) {
    this.xp += amount;
    const xpNeeded = this.level * 100;
    if (this.xp >= xpNeeded) {
      this.level++;
      this.xp -= xpNeeded;
      audioManager.playLevelUp();
      this.showToast('Level Up! 🌟', `Congratulations! You reached Level ${this.level}! New recipes and buildings unlocked.`, 'success');
      this.checkUnlocks();
    }
    this.notify();
  }

  private checkUnlocks() {
    RECIPES.forEach(recipe => {
      if (recipe.unlockLevel <= this.level && !this.unlockedRecipes.includes(recipe.id)) {
        this.unlockedRecipes.push(recipe.id);
        this.showToast('New Recipe Unlocked! 📜', `You can now cook "${recipe.name}"!`, 'info');
      }
    });
  }

  public updateReputation(delta: number) {
    this.reputationStars = Math.max(1.0, Math.min(5.0, Math.round((this.reputationStars + delta) * 10) / 10));
    this.checkAchievements();
    this.notify();
  }

  // --- DAY / NIGHT & WEATHER CYCLE ---

  public tickSimulation(deltaSeconds: number) {
    if (this.isPaused) return;

    // Autosave every 120 seconds
    this.autosaveTimer += deltaSeconds;
    if (this.autosaveTimer >= 120) {
      this.autosaveTimer = 0;
      this.saveToStorage('autosave');
    }

    // Time of day advances (720 seconds = 12 real minutes per game day)
    this.timeOfDaySeconds += deltaSeconds;
    if (this.timeOfDaySeconds >= 720) {
      this.timeOfDaySeconds = 0;
      this.endOfDay();
      this.day++;
      this.stats.daysPlayed++;
      this.rollWeather();
      this.generateDailyChallenges();
      this.rollDailySpecial(true);
      this.snapshotDayStart();
      this.saveToStorage('autosave');
    }

    // Combo decay timer
    if (this.serveCombo > 0) {
      this.comboTimer -= deltaSeconds;
      if (this.comboTimer <= 0) {
        this.serveCombo = 0;
        this.comboTimer = 0;
      }
    }

    if (this.espressoCooldown > 0) {
      this.espressoCooldown = Math.max(0, this.espressoCooldown - deltaSeconds);
    }

    // Special events tick
    this.tickSpecialEvents(deltaSeconds);

    // Staff auto-work simulation
    this.tickStaff(deltaSeconds);

    // Crop growth simulation
    this.tickCrops(deltaSeconds);

    // Oven baking simulation
    this.tickOven(deltaSeconds);

    // Customer simulation & spawning
    this.tickCustomers(deltaSeconds);

    // Batch UI updates to ~5 fps instead of re-rendering React every frame.
    this.uiRefreshTimer += deltaSeconds;
    if (this.uiRefreshTimer >= 0.2) {
      this.uiRefreshTimer = 0;
      this.notify();
    }
  }

  private rollWeather() {
    const r = Math.random();
    let newWeather: WeatherType = 'clear';
    if (r < 0.5) newWeather = 'clear';
    else if (r < 0.75) newWeather = 'cloudy';
    else if (r < 0.92) newWeather = 'rain';
    else newWeather = 'storm';

    this.weather = newWeather;
    audioManager.updateWeatherAmbience(newWeather);
  }

  public setWeather(w: WeatherType) {
    this.weather = w;
    audioManager.updateWeatherAmbience(w);
    this.notify();
  }

  // --- FARMING OPERATIONS ---

  private tickCrops(deltaSeconds: number) {
    const isRaining = this.weather === 'rain' || this.weather === 'storm';

    // Check sprinklers
    const sprinklerPositions = this.buildings
      .filter(b => b.typeId === 'sprinkler_basic')
      .map(b => ({ x: b.x, z: b.z }));

    this.farmPlots.forEach(plot => {
      // Auto-water if raining or near sprinkler
      if (isRaining) {
        plot.isWatered = true;
      } else if (!plot.isWatered && sprinklerPositions.length > 0) {
        const nearSprinkler = sprinklerPositions.some(
          s => Math.hypot(s.x - plot.worldX, s.z - plot.worldZ) < 5.0
        );
        if (nearSprinkler) {
          plot.isWatered = true;
        }
      }

      if (plot.state === 'growing' && plot.cropId) {
        const crop = CROPS[plot.cropId];
        if (!crop) return;

        let rate = 1.0;
        if (plot.isWatered) rate *= 1.4; // 40% speed boost from water!

        const weatherMod = crop.weatherModifiers[this.weather] || 1.0;
        rate *= weatherMod;

        // Harvest festival event doubles growth speed
        const harvestFest = this.specialEvents.find(e => e.active && e.type === 'harvest_festival');
        if (harvestFest) rate *= harvestFest.bonusMultiplier;

        // Greenhouse bonus if placed
        const hasGreenhouse = this.buildings.some(b => b.typeId === 'glass_greenhouse');
        if (hasGreenhouse) rate *= 1.2;

        const growthStep = (deltaSeconds / crop.baseGrowthSeconds) * rate;
        plot.growthProgress = Math.min(1.0, plot.growthProgress + growthStep);

        if (plot.growthProgress >= 1.0) {
          plot.state = 'ready';
        }
      }
    });
  }

  public tillPlot(plotId: number): boolean {
    const plot = this.farmPlots.find(p => p.plotId === plotId);
    if (!plot || plot.state !== 'empty') return false;

    plot.state = 'tilled';
    audioManager.playTill();
    if (this.tutorialStep === 1) {
      this.advanceTutorial();
    }
    this.notify();
    return true;
  }

  public plantCrop(plotId: number, cropId: string): boolean {
    const plot = this.farmPlots.find(p => p.plotId === plotId);
    if (!plot || plot.state !== 'tilled') return false;

    const seedKey = `seed_${cropId}`;
    const seedCount = this.inventory[seedKey] || 0;
    if (seedCount <= 0) {
      this.showToast('No Seeds', `You don't have any ${cropId} seeds! Buy some from the Market Shop.`, 'warning');
      return false;
    }

    this.inventory[seedKey] = seedCount - 1;
    plot.state = 'growing';
    plot.cropId = cropId;
    plot.plantedAt = Date.now();
    plot.growthProgress = 0.05;
    audioManager.playPlant();

    if (this.tutorialStep === 2) {
      this.advanceTutorial();
    }
    this.notify();
    return true;
  }

  public waterPlot(plotId: number): boolean {
    const plot = this.farmPlots.find(p => p.plotId === plotId);
    if (!plot || (plot.state !== 'growing' && plot.state !== 'tilled')) return false;

    plot.isWatered = true;
    plot.wateredAt = Date.now();
    audioManager.playWater();

    if (this.tutorialStep === 3) {
      this.advanceTutorial();
    }
    this.notify();
    return true;
  }

  public harvestPlot(plotId: number): boolean {
    const plot = this.farmPlots.find(p => p.plotId === plotId);
    if (!plot || plot.state !== 'ready' || !plot.cropId) return false;

    const crop = CROPS[plot.cropId];
    if (!crop) return false;

    const yieldAmount = Math.floor(Math.random() * (crop.yieldMax - crop.yieldMin + 1)) + crop.yieldMin;
    this.inventory[crop.id] = (this.inventory[crop.id] || 0) + yieldAmount;

    // Give seeds back with 50% chance for sustainable farming
    if (Math.random() < 0.6) {
      const seedKey = `seed_${crop.id}`;
      this.inventory[seedKey] = (this.inventory[seedKey] || 0) + 1;
    }

    plot.state = 'empty';
    plot.cropId = null;
    plot.growthProgress = 0;
    plot.isWatered = false;

    this.stats.cropsHarvested += yieldAmount;
    this.addXp(15);
    audioManager.playHarvest();
    this.updateChallenges('harvest_crops', yieldAmount);
    this.showToast('Harvest Complete! 🧺', `Gathered +${yieldAmount} fresh ${crop.name}! Added to pantry.`, 'success');

    if (this.tutorialStep === 4) {
      this.advanceTutorial();
    }
    this.checkAchievements();
    this.notify();
    return true;
  }

  // --- KITCHEN OPERATIONS ---

  public canCraftRecipe(recipeId: string): boolean {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;

    return recipe.ingredients.every(req => {
      return (this.inventory[req.itemId] || 0) >= req.qty;
    });
  }

  public prepPizza(recipeId: string): boolean {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;

    if (!this.canCraftRecipe(recipeId)) {
      this.showToast('Missing Ingredients', `You don't have enough fresh ingredients to prep ${recipe.name}!`, 'warning');
      return false;
    }

    // Deduct ingredients
    recipe.ingredients.forEach(req => {
      this.inventory[req.itemId] = (this.inventory[req.itemId] || 0) - req.qty;
    });

    audioManager.playChop();
    this.showToast('Pizza Prepped! 🍕', `${recipe.name} assembled on the pizza peel! Next stop: the wood-fired oven.`, 'info');

    // Automatically load into oven if available
    this.ovenPizza = {
      recipeId,
      elapsedSeconds: 0,
      idealSeconds: recipe.idealBakeSeconds,
      isBaking: true
    };
    audioManager.playSizzle();

    if (this.tutorialStep === 5) {
      this.advanceTutorial();
    }
    this.notify();
    return true;
  }

  private tickOven(deltaSeconds: number) {
    if (!this.ovenPizza || !this.ovenPizza.isBaking) return;
    const speed = this.restaurantTier >= 2 ? 1.25 : 1.0;
    this.ovenPizza.elapsedSeconds += deltaSeconds * speed;

    // Ding when reaching golden crust window!
    const ratio = this.ovenPizza.elapsedSeconds / this.ovenPizza.idealSeconds;
    if (ratio >= 0.95 && ratio <= 1.05 && Math.random() < 0.15) {
      audioManager.playOvenDing();
    }
  }

  public pullPizzaFromOven(): PreparedDish | null {
    if (!this.ovenPizza) return null;

    const { recipeId, elapsedSeconds, idealSeconds } = this.ovenPizza;
    const recipe = RECIPES.find(r => r.id === recipeId);
    const diff = Math.abs(elapsedSeconds - idealSeconds);
    const ratio = diff / idealSeconds;

    let quality: PreparedDish['quality'] = 'good';
    let qualityMultiplier = 1.0;

    if (ratio <= 0.12) {
      quality = 'perfect';
      qualityMultiplier = 1.5; // +50% bonus for perfect golden crust!
      this.stats.perfectBakes++;
      this.updateChallenges('perfect_bakes', 1);
      audioManager.playOvenDing();
      this.showToast('Perfect Golden Crust! ⭐⭐⭐', `Masterful baking of ${recipe?.name || 'pizza'}! Dish has +50% value and tip potential.`, 'success');
    } else if (elapsedSeconds < idealSeconds * 0.75) {

      quality = 'undercooked';
      qualityMultiplier = 0.65;
      this.showToast('A bit undercooked ⏱️', 'The cheese did not fully melt, but still edible.', 'warning');
    } else if (elapsedSeconds > idealSeconds * 1.4) {
      quality = 'burnt';
      qualityMultiplier = 0.4;
      this.stats.burntDishes++;
      // Health inspector doubles the reputation penalty for burnt dishes
      const inspectorActive = this.specialEvents.find(e => e.active && e.type === 'health_inspector');
      if (inspectorActive) {
        this.updateReputation(-0.4);
        audioManager.playError();
        this.showToast('Inspector Penalty! 📋', 'The health inspector docked extra reputation for the burnt dish!', 'warning');
      }
      this.showToast('Charred Crust! 🔥', 'The pizza spent a bit too long in the embers.', 'warning');
    } else {
      quality = 'good';
      qualityMultiplier = 1.0;
      audioManager.playOvenDing();
      this.showToast('Delicious Golden Bake! ⭐⭐', 'Crisp crust and bubbly cheese!', 'success');
    }

    const dish: PreparedDish = {
      id: Math.random().toString(36).substring(2, 9),
      recipeId,
      quality,
      qualityMultiplier,
      preparedAt: Date.now()
    };

    this.dishesOnCounter.push(dish);
    this.ovenPizza = null;

    if (this.tutorialStep === 6) {
      this.advanceTutorial();
    }
    this.checkAchievements();
    this.notify();
    return dish;
  }

  // --- CUSTOMER SERVICE & NPC BEHAVIOR ---

  public getDiningTables(): PlacedBuilding[] {
    return this.buildings.filter(b => b.typeId === 'table_rustic' || b.typeId === 'table_terrace');
  }

  /**
   * Every table has two chairs. Seat positions are derived from the placed
   * table rotation, so guests sit exactly where the chairs are rendered.
   */
  public getSeatingSpots(): Array<{
    id: number;
    buildingId: string;
    tableX: number;
    tableZ: number;
    x: number;
    z: number;
    facing: number;
    outdoor: boolean;
  }> {
    const spots: Array<{
      id: number;
      buildingId: string;
      tableX: number;
      tableZ: number;
      x: number;
      z: number;
      facing: number;
      outdoor: boolean;
    }> = [];

    this.getDiningTables().forEach(table => {
      const rot = table.rotation || 0;
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      [-1, 1].forEach(side => {
        const localX = side * 1.08;
        const worldX = table.x + localX * cos;
        const worldZ = table.z - localX * sin;
        // Direction from the chair back toward the table centre.
        const facing = Math.atan2(-side * cos, side * sin);
        spots.push({
          id: spots.length,
          buildingId: table.buildingId,
          tableX: table.x,
          tableZ: table.z,
          x: worldX,
          z: worldZ,
          facing,
          outdoor: true
        });
      });
    });

    return spots;
  }

  private getAmbianceTipBonus(): number {
    let ambiance = 0;
    let explicit = 0;
    this.buildings.forEach(b => {
      const def = BUILDINGS.find(d => d.typeId === b.typeId);
      if (!def) return;
      if (def.effect.type === 'ambiance_boost') {
        ambiance += ((def.effect.value ?? 8) / 100) * 0.55;
      }
      if (def.effect.tipBonus) explicit += def.effect.tipBonus;
    });
    return Math.min(0.45, ambiance) + Math.min(0.35, explicit);
  }

  /** Cobblestone paths placed by the player grant their advertised +25% speed. */
  public getPathSpeedMultiplier(x: number, z: number): number {
    const onPath = this.buildings.some(b => {
      if (b.typeId !== 'path_cobblestone') return false;
      return Math.abs(b.x - x) < 0.75 && Math.abs(b.z - z) < 1.75;
    });
    return onPath ? 1.25 : 1;
  }

  private createGuestAppearance(): CustomerAppearance {
    const skinTones = ['#ffe0bd', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#d9a066'];
    const shirtColors = [
      '#e63946', '#457b9d', '#2a9d8f', '#e76f51', '#f4a261',
      '#6b705c', '#b56576', '#5f0f40', '#3d5a80', '#ee9b00', '#9b5de5', '#00bbf9'
    ];
    const pantsColors = ['#264653', '#1d3557', '#3d405b', '#4a4e69', '#6b4f35', '#2b2d42', '#7f5539'];
    const hairColors = ['#2b1b12', '#3e2723', '#111111', '#6b4423', '#d4a373', '#a0522d', '#e9c46a', '#8d5524'];
    const outerColors = ['#fdf0d5', '#f2e9e4', '#e5e5e5', '#dda15e', '#bc6c25', '#a3b18a', '#6b705c'];
    const hairStyles: CustomerAppearance['hairStyle'][] = ['short', 'bob', 'long', 'bun', 'curly', 'bald', 'ponytail'];
    const accessories: CustomerAppearance['accessory'][] = [
      'none', 'none', 'none', 'glasses', 'bag', 'scarf', 'cap', 'sunhat', 'earrings'
    ];
    const builds: Array<CustomerAppearance['build']> = ['slim', 'regular', 'broad'];

    return {
      skinColor: skinTones[Math.floor(Math.random() * skinTones.length)],
      shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
      pantsColor: pantsColors[Math.floor(Math.random() * pantsColors.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      outerColor: Math.random() < 0.45 ? outerColors[Math.floor(Math.random() * outerColors.length)] : undefined,
      shoesColor: Math.random() < 0.35 ? '#4a3728' : '#222222',
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      build: builds[Math.floor(Math.random() * builds.length)],
      heightScale: 0.93 + Math.random() * 0.14
    };
  }

  private tickCustomers(deltaSeconds: number) {
    // Spawning logic
    this.nextCustomerSpawnTime -= deltaSeconds;
    if (this.nextCustomerSpawnTime <= 0 && this.customers.length < this.maxCustomers) {
      this.spawnCustomer();
      // Faster spawn rate with higher reputation!
      const minSpawn = Math.max(7, 25 - this.reputationStars * 3);
      this.nextCustomerSpawnTime = minSpawn + Math.random() * 8;
    }

    const queue = this.customers
      .filter(c => c.state === 'walking_in' || c.state === 'queuing' || c.state === 'ordering' || c.state === 'waiting')
      .sort((a, b) => (a.order?.createdAt ?? 0) - (b.order?.createdAt ?? 0));

    // Keep the line moving as guests are served.
    queue.forEach((c, index) => {
      if (c.state === 'walking_in' && c.path && c.path.length > 0) return;
      const spot = WORLD_LAYOUT.queue[Math.min(index, WORLD_LAYOUT.queue.length - 1)];
      c.targetPosition = { x: spot.x, y: 0, z: spot.z };
      c.targetFacing = spot.facing;
    });

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];

      // Patience ticks down while waiting in line or at the counter.
      if (c.state === 'ordering' || c.state === 'waiting' || c.state === 'queuing') {
        const drain = c.state === 'queuing' ? 0.55 : 1;
        c.patience -= deltaSeconds * drain;
        if (c.patience <= 0) {
          c.patience = 0;
          c.state = 'leaving_angry';
          c.reactionEmoji = '💢';
          if (c.order) c.order.status = 'expired';
          c.targetTableId = null;
          c.path = [{ x: 0, z: 5.6 }, { x: 0, z: 17.4 }];
          c.targetPosition = { x: c.path[0].x, y: 0, z: c.path[0].z };
          c.targetFacing = Math.PI;
          this.stats.customersLost = (this.stats.customersLost || 0) + 1;
          this.dayCustomersLost++;
          this.updateReputation(-0.25);
          audioManager.playError();
          this.showToast('Customer Left Unhappy! 😞', `${c.name} ran out of patience and left without dining.`, 'warning');
        }
      }

      // Optional waypoint route overrides the final target.
      if (c.path && c.path.length > 0) {
        const next = c.path[0];
        c.targetPosition = { x: next.x, y: 0, z: next.z };
      }

      const dx = c.targetPosition.x - c.position.x;
      const dz = c.targetPosition.z - c.position.z;
      const dist = Math.hypot(dx, dz);
      const insideBuilding = c.state !== 'leaving_happy' && c.state !== 'leaving_angry';

      if (dist > 0.14) {
        const speed = (c.state === 'walking_to_table' ? 2.15 : 2.55) * deltaSeconds;
        const step = Math.min(speed, dist);
        c.position.x += (dx / dist) * step;
        c.position.z += (dz / dist) * step;

        // Gentle facing interpolation avoids guests snapping around corners.
        if (!insideBuilding || c.state === 'walking_in' || c.state === 'walking_to_table') {
          c.targetFacing = Math.atan2(dx, dz);
        }
      } else {
        // Reached this waypoint — advance along the route.
        if (c.path && c.path.length > 0) {
          c.path.shift();
          if (c.path.length > 0) {
            c.targetPosition = { x: c.path[0].x, y: 0, z: c.path[0].z };
            c.targetFacing = Math.atan2(c.path[0].x - c.position.x, c.path[0].z - c.position.z);
          }
        } else if (c.state === 'walking_in') {
          c.state = 'queuing';
        } else if (c.state === 'walking_to_table') {
          c.state = 'seated';
          c.targetFacing = c.targetFacing ?? Math.PI;
          c.eatingTimer = 7.5;
          c.reactionEmoji = '🍽️';
        } else if (c.state === 'seated' || c.state === 'eating') {
          c.eatingTimer = (c.eatingTimer ?? 7.5) - deltaSeconds;
          if (c.eatingTimer <= 0) {
            c.state = 'leaving_happy';
            c.reactionEmoji = '❤️';
            c.targetTableId = null;
            c.path = [{ x: 0.5, z: 5.6 }, { x: 0, z: 17.4 }];
            c.targetPosition = { x: c.path[0].x, y: 0, z: c.path[0].z };
          }
        } else if (c.state === 'leaving_happy' || c.state === 'leaving_angry') {
          if (c.position.z > 16.6) {
            this.customers.splice(i, 1);
            continue;
          }
        }
      }

      // The first guest in line steps up and places their order.
      if (c.state === 'queuing' || c.state === 'ordering') {
        if (queue.length > 0 && queue[0].id === c.id && dist < 0.4) {
          c.state = 'ordering';
        } else if (queue.length > 0 && queue[0].id !== c.id) {
          c.state = 'queuing';
        }
      }
    }
  }

  private spawnCustomer() {
    const names = [
      'Marco', 'Lucia', 'Giovanni', 'Sofia', 'Matteo', 'Giulia', 'Enzo', 'Chiara',
      'Alessandro', 'Valentina', 'Beatrice', 'Lorenzo', 'Isabella', 'Dante', 'Francesca',
      'Pietro', 'Elena', 'Rafael', 'Marta', 'Tommaso', 'Nico', 'Aurora'
    ];
    const name = names[Math.floor(Math.random() * names.length)];

    // Pick a random unlocked recipe. The Chef's Daily Special pulls in extra
    // orders (3x weighting) so the menu feature is felt during service.
    const recipePool = this.unlockedRecipes.length > 0 ? this.unlockedRecipes : ['margherita_pizza'];
    const weightedPool = recipePool.flatMap(id =>
      id === this.dailySpecialRecipeId ? [id, id, id] : [id]
    );
    const recipeId = weightedPool[Math.floor(Math.random() * weightedPool.length)] ?? recipePool[0];

    const spawnOffsetX = (Math.random() - 0.5) * 3.5;
    const customer: Customer = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      state: 'walking_in',
      appearance: this.createGuestAppearance(),
      targetTableId: null,
      position: { x: spawnOffsetX, y: 0, z: 16.6 },
      targetPosition: { x: 0, y: 0, z: 7.4 },
      targetFacing: Math.PI,
      path: [
        { x: spawnOffsetX * 0.25, z: 7.4 },
        { x: 0, z: 3.2 }
      ],
      patience: 68,
      maxPatience: 68,
      order: {
        orderId: Math.random().toString(36).substring(2, 9),
        customerId: '',
        customerName: name,
        recipeId,
        modifiers: [],
        patienceSeconds: 68,
        maxPatienceSeconds: 68,
        createdAt: Date.now(),
        status: 'waiting'
      }
    };
    customer.order!.customerId = customer.id;
    this.customers.push(customer);
  }

  public serveDishToCustomer(customerId: string, dishId: string): boolean {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer || !customer.order) return false;

    const dishIndex = this.dishesOnCounter.findIndex(d => d.id === dishId);
    if (dishIndex === -1) return false;

    const dish = this.dishesOnCounter[dishIndex];
    if (dish.recipeId !== customer.order.recipeId) {
      this.showToast('Wrong Recipe! ❌', `${customer.name} ordered a different dish!`, 'warning');
      return false;
    }

    const recipe = RECIPES.find(r => r.id === dish.recipeId);
    if (!recipe) return false;

    // Remove dish from counter
    this.dishesOnCounter.splice(dishIndex, 1);

    // Calculate earnings with restaurant tier bonus + active special events
    const tierMultiplier = this.restaurantTier === 3 ? 1.35 : (this.restaurantTier === 2 ? 1.15 : 1.0);
    const festivalEvent = this.specialEvents.find(e => e.active && e.type === 'pizza_festival');
    const festivalMultiplier = festivalEvent ? festivalEvent.bonusMultiplier : 1.0;
    const isDailySpecial = recipe.id === this.dailySpecialRecipeId;
    const dailySpecialMultiplier = isDailySpecial ? 1 + this.DAILY_SPECIAL_PRICE_BONUS : 1.0;
    const basePay = recipe.basePrice * tierMultiplier * dish.qualityMultiplier * festivalMultiplier * dailySpecialMultiplier;

    // Tips based on remaining patience, café ambiance, tier, and events.
    const patienceRatio = Math.max(0, customer.patience / customer.maxPatience);
    const rainyEvent = this.specialEvents.find(e => e.active && e.type === 'rainy_day_special');
    const rainTipBonus = rainyEvent ? rainyEvent.bonusMultiplier : 1.0;
    const tierTipBonus = this.restaurantTier === 3 ? 0.35 : (this.restaurantTier === 2 ? 0.15 : 0);
    const ambianceBonus = this.getAmbianceTipBonus();
    const tipRate = (0.22 + tierTipBonus + ambianceBonus) * patienceRatio * rainTipBonus;
    const tipAmount = Math.round(basePay * tipRate * 10) / 10;

    // Combo multiplier — reward fast consecutive serves
    this.serveCombo++;
    this.comboTimer = this.COMBO_WINDOW;
    const comboBonus = this.serveCombo >= 3 ? Math.min(1.0 + (this.serveCombo - 2) * 0.12, 1.6) : 1.0;
    if (this.serveCombo >= 3) {
      audioManager.playComboJingle(this.serveCombo);
      this.showToast(
        `🔥 ${this.serveCombo}x Combo!`,
        `Rapid service bonus! +${Math.round((comboBonus - 1) * 100)}% extra earnings!`,
        'success'
      );
    }
    const totalEarnings = Math.round((basePay + tipAmount) * comboBonus * 10) / 10;

    this.addCoins(totalEarnings, 'sale', `Served ${recipe.name} to ${customer.name}`);
    this.addXp(25);
    this.stats.dishesServed++;
    this.dayBestDish = recipe.name;
    this.updateChallenges('serve_dishes', 1);

    // Seat the guest at an actual chair around one of the dining tables.
    const seats = this.getSeatingSpots();
    const occupiedSeats = new Set(
      this.customers
        .filter(c => c.id !== customer.id && c.targetTableId !== null)
        .map(c => c.targetTableId)
    );
    const freeSeat = seats.find(s => !occupiedSeats.has(s.id));

    if (freeSeat) {
      customer.targetTableId = freeSeat.id;
      customer.state = 'walking_to_table';
      customer.targetPosition = { x: freeSeat.x, y: 0, z: freeSeat.z };
      customer.targetFacing = freeSeat.facing;
      customer.path = [
        { x: 3.6, z: 0.9 },
        { x: freeSeat.x, z: freeSeat.z }
      ];
      customer.eatingTimer = 7.5;
    } else {
      // No free chair — a happy takeaway guest heads back to the street.
      customer.targetTableId = null;
      customer.state = 'leaving_happy';
      customer.reactionEmoji = '🥡';
      customer.path = [{ x: 0.5, z: 5.6 }, { x: 0, z: 17.4 }];
      customer.targetPosition = { x: customer.path[0].x, y: 0, z: customer.path[0].z };
    }

    customer.reactionEmoji = dish.quality === 'burnt' ? '😐' : '❤️';
    if (customer.order) customer.order.status = 'served';
    audioManager.playServe();

    this.updateReputation(dish.quality === 'perfect' ? 0.2 : (dish.quality === 'burnt' ? -0.1 : 0.1));
    const specialNote = isDailySpecial ? ` Chef's Special bonus +${Math.round(this.DAILY_SPECIAL_PRICE_BONUS * 100)}%!` : '';
    this.showToast(
      'Order Served! 🎉',
      `Earned 🪙 ${totalEarnings} coins (incl. 🪙 ${tipAmount} tip).${specialNote}`,
      'success'
    );

    if (this.tutorialStep === 7) {
      this.tutorialComplete = true;
      this.showToast('Tutorial Complete! 🎓', 'You have mastered the art of Slice & Sprout! Build, farm, and expand!', 'success');
    }

    this.checkAchievements();
    this.notify();
    return true;
  }

  /**
   * Café espresso bar: a small coin sink that rescues the most impatient guest.
   * This is the café's little "cozy rescue" mechanic, separate from pizza service.
   */
  public brewEspresso(): boolean {
    if (this.espressoCooldown > 0) {
      this.showToast('Espresso Machine Heating ☕', `Ready again in ${Math.ceil(this.espressoCooldown)} seconds.`, 'info');
      return false;
    }

    const waiting = this.customers
      .filter(c => (c.state === 'ordering' || c.state === 'waiting' || c.state === 'queuing') && c.patience > 0)
      .sort((a, b) => (a.patience / a.maxPatience) - (b.patience / b.maxPatience));

    if (waiting.length === 0) {
      this.showToast('No Guests Waiting ☕', 'The espresso bar is ready — ring the bell or wait for guests to arrive.', 'info');
      return false;
    }

    if (!this.spendCoins(this.ESPRESSO_COST, 'purchase', 'Espresso bar: fresh beans & milk')) {
      return false;
    }

    const guest = waiting[0];
    guest.patience = Math.min(guest.maxPatience, guest.patience + 28);
    guest.reactionEmoji = '☕';
    this.espressoCooldown = this.ESPRESSO_COOLDOWN;
    this.stats.espressoBrews = (this.stats.espressoBrews || 0) + 1;
    audioManager.playSizzle();
    this.addXp(6);
    this.checkAchievements();
    this.showToast(
      'Espresso Served! ☕',
      `${guest.name} perks up with a warm espresso. +28 patience — crisis averted!`,
      'success'
    );
    this.notify();
    return true;
  }

  // --- TYCOON BUILDINGS ---

  /**
   * Pick a sensible free spot for a new building. The old UI dropped every
   * purchase at hard-coded coordinates, which meant tables piled on top of the
   * café and farm equipment landed in the road. Candidates are grouped by
   * category, then validated against the café, fountain, farm beds, street and
   * every existing structure.
   */
  public findFreeBuildSpot(typeId: string, rotation: number = 0): { x: number; z: number; rotation: number } | null {
    const def = BUILDINGS.find(b => b.typeId === typeId);
    if (!def) return null;

    const candidates: Array<[number, number]> = [];
    if (typeId === 'table_rustic' || typeId === 'table_terrace') {
      candidates.push(
        [14.2, -1.4],
        [7.0, -1.3],
        [13.8, 3.7],
        [6.9, 3.9],
        [-11.4, -1.8],
        [-19.0, -7.0],
        [7.8, -7.1],
        [13.4, -7.0],
        [21.0, -4.4],
        [21.8, 2.4],
        [18.5, -0.8],
        [-19.2, -1.8],
        [-10.6, 4.2]
      );
    } else if (typeId === 'glass_greenhouse') {
      candidates.push([-19.7, 3.1], [-20.0, -7.4], [20.4, 0.4], [8.1, -7.8], [-11.8, -7.1], [24.0, 4.0]);
    } else if (typeId === 'sprinkler_basic') {
      candidates.push([-13.8, 3.6], [-17.9, 3.4], [-7.7, 4.8], [17.6, 0.8], [7.8, -6.8]);
    } else if (typeId === 'path_cobblestone') {
      candidates.push(
        [0.0, 4.2],
        [3.4, 4.2],
        [-3.4, 4.2],
        [6.8, 4.1],
        [10.2, 4.2],
        [13.6, 4.1],
        [-7.0, 4.9],
        [17.2, 4.2],
        [-8.8, -1.4],
        [18.1, -1.4],
        [-18.8, 4.3],
        [11.5, -7.0]
      );
    } else if (def.category === 'farm') {
      candidates.push([-19.5, 3.2], [-18.8, -2.6], [17.8, 1.8], [18.8, -5.4]);
    } else if (def.category === 'decoration') {
      candidates.push(
        [5.5, -1.6],
        [17.0, 3.8],
        [17.0, -5.2],
        [-9.6, -3.2],
        [-10.2, 4.7],
        [3.9, 4.9],
        [-1.0, 4.8],
        [-7.0, 5.0],
        [18.9, -1.3],
        [18.7, 3.1],
        [-18.6, 5.0],
        [-19.7, -1.0],
        [22.0, 0.2],
        [-23.0, -2.0]
      );
    } else {
      candidates.push(
        [-12.0, -1.6],
        [8.0, -7.2],
        [15.8, -6.8],
        [-19.0, -4.7],
        [18.7, -3.6],
        [21.5, 1.8],
        [-10.4, 4.7]
      );
    }

    for (const [x, z] of candidates) {
      if (this.validateBuildingDefinition(def, x, z, rotation).valid) {
        return { x, z, rotation };
      }
    }
    return null;
  }

  /**
   * Public validation used by the in-world placement ghost and the builder UI.
   * Every failure includes a human-readable reason for the placement HUD.
   */
  public validateBuildingPlacement(
    typeId: string,
    x: number,
    z: number,
    rotation: number = 0,
    ignoreBuildingId?: string
  ): { valid: boolean; reason: string } {
    const def = BUILDINGS.find(b => b.typeId === typeId);
    if (!def) return { valid: false, reason: 'Unknown building type.' };
    return this.validateBuildingDefinition(def, x, z, rotation, ignoreBuildingId);
  }

  private validateBuildingDefinition(
    def: BuildingDefinition,
    x: number,
    z: number,
    rotation: number,
    ignoreBuildingId?: string
  ): { valid: boolean; reason: string } {
    const cos = Math.abs(Math.cos(rotation));
    const sin = Math.abs(Math.sin(rotation));
    const halfW = (def.footprint.width * cos + def.footprint.depth * sin) / 2 + 0.22;
    const halfD = (def.footprint.width * sin + def.footprint.depth * cos) / 2 + 0.22;
    const minX = x - halfW;
    const maxX = x + halfW;
    const minZ = z - halfD;
    const maxZ = z + halfD;

    // Keep player-facing walkways, the road and the far town clear.
    if (minX < WORLD_LAYOUT.bounds.minX + 0.8 || maxX > WORLD_LAYOUT.bounds.maxX - 0.8) {
      return { valid: false, reason: 'That spot is outside the estate boundary.' };
    }
    if (minZ < WORLD_LAYOUT.bounds.minZ + 0.8 || maxZ > WORLD_LAYOUT.bounds.maxZ - 0.8) {
      return { valid: false, reason: 'That spot is outside the estate boundary.' };
    }
    if (maxZ > 6.05 && minZ < 18.4) {
      return { valid: false, reason: 'The piazza and street walkway must stay clear.' };
    }

    // Café shell, espresso bar and service lane.
    if (maxX > -8.5 && minX < 5.45 && maxZ > -10.75 && minZ < -3.75) {
      return { valid: false, reason: 'The café kitchen and service lane must stay clear.' };
    }
    if (maxX > -2.2 && minX < 10.8 && maxZ > -1.8 && minZ < 0.3) {
      return { valid: false, reason: 'The espresso bar service lane is reserved.' };
    }

    // The patio's east balustrade and its fixed trees, pots and chalkboard are
    // scenery, not placeable plots.
    const patio = WORLD_LAYOUT.patio;
    if (
      maxX > patio.maxX - 0.1 && minX < patio.maxX + 0.6 &&
      maxZ > patio.minZ && minZ < patio.maxZ
    ) {
      return { valid: false, reason: 'The patio balustrade is fixed scenery.' };
    }
    const patioStatics: Array<[number, number, number]> = [
      [patio.minX + 0.65, patio.maxZ - 0.7, 0.58],
      [patio.maxX - 0.7, patio.maxZ - 0.7, 0.58],
      [patio.minX + 0.4, patio.minZ + 0.75, 0.55],
      [patio.maxX - 0.45, patio.minZ + 0.75 + 7.2, 0.55],
      [patio.minX + 0.8, patio.minZ + 0.8, 0.45]
    ];
    for (const [staticX, staticZ, radius] of patioStatics) {
      const closestX = Math.max(minX, Math.min(staticX, maxX));
      const closestZ = Math.max(minZ, Math.min(staticZ, maxZ));
      if (Math.hypot(staticX - closestX, staticZ - closestZ) < radius) {
        return { valid: false, reason: 'A fixed patio decoration is in the way.' };
      }
    }

    // Fountain basin.
    const fountain = WORLD_LAYOUT.fountain;
    if (Math.hypot(x - fountain.x, z - fountain.z) < fountain.radius + Math.max(halfW, halfD) + 0.45) {
      return { valid: false, reason: 'Too close to the piazza fountain.' };
    }

    // Farm beds are reserved for crops, except the central sprinkler stand.
    if (def.typeId !== 'sprinkler_basic') {
      for (const plot of this.farmPlots) {
        if (Math.abs(x - plot.worldX) < halfW + 1.08 && Math.abs(z - plot.worldZ) < halfD + 1.08) {
          return { valid: false, reason: 'The farm beds are reserved for crops.' };
        }
      }
      const fence = WORLD_LAYOUT.farmFence;
      if (maxX > fence.minX - 0.25 && minX < fence.maxX + 0.25 && maxZ > fence.minZ - 0.25 && minZ < fence.maxZ + 0.25) {
        return { valid: false, reason: 'The farm fence line must stay clear.' };
      }
    }

    for (const building of this.buildings) {
      if (building.buildingId === ignoreBuildingId) continue;
      const other = BUILDINGS.find(b => b.typeId === building.typeId);
      if (!other) continue;
      const otherCos = Math.abs(Math.cos(building.rotation || 0));
      const otherSin = Math.abs(Math.sin(building.rotation || 0));
      const otherHalfW = (other.footprint.width * otherCos + other.footprint.depth * otherSin) / 2;
      const otherHalfD = (other.footprint.width * otherSin + other.footprint.depth * otherCos) / 2;
      const gap = def.category === 'restaurant' ? 0.55 : 0.35;
      if (
        Math.abs(x - building.x) < halfW + otherHalfW + gap &&
        Math.abs(z - building.z) < halfD + otherHalfD + gap
      ) {
        return { valid: false, reason: `Too close to the ${other.name}.` };
      }
    }
    return { valid: true, reason: 'Clear site — ready to build.' };
  }

  private findNearbyPlacement(def: BuildingDefinition): { x: number; z: number; rotation: number } | null {
    const offsets: Array<[number, number]> = [
      [0, -3.4], [3.4, 0], [-3.4, 0], [0, 3.4],
      [3.6, -3.6], [-3.6, -3.6], [3.6, 3.6], [-3.6, 3.6]
    ];
    for (const [dx, dz] of offsets) {
      const x = Math.round((this.playerPos.x + dx) * 2) / 2;
      const z = Math.round((this.playerPos.z + dz) * 2) / 2;
      if (this.validateBuildingDefinition(def, x, z, 0).valid) {
        return { x, z, rotation: 0 };
      }
    }
    return null;
  }

  public beginPlacement(typeId: string, existingBuildingId?: string): boolean {
    const def = BUILDINGS.find(b => b.typeId === typeId);
    if (!def) return false;

    const existing = existingBuildingId
      ? this.buildings.find(b => b.buildingId === existingBuildingId)
      : null;

    if (existingBuildingId && !existing) {
      this.showToast('Structure Not Found', 'That building could not be located.', 'warning');
      return false;
    }

    if (!existing) {
      if (this.level < def.unlockLevel) {
        this.showToast('Building Locked', `${def.name} unlocks at level ${def.unlockLevel}.`, 'warning');
        return false;
      }
      if (this.coins < def.cost) {
        this.showToast('Insufficient Coins', `${def.name} costs 🪙 ${def.cost}.`, 'warning');
        return false;
      }
    }

    let x: number;
    let z: number;
    let rotation: number;
    if (existing) {
      x = existing.x;
      z = existing.z;
      rotation = existing.rotation || 0;
    } else {
      const nearby = this.findNearbyPlacement(def);
      const fallback = nearby ?? this.findFreeBuildSpot(typeId, 0);
      x = fallback?.x ?? Math.round(this.playerPos.x * 2) / 2;
      z = fallback?.z ?? Math.round((this.playerPos.z - 3) * 2) / 2;
      rotation = fallback?.rotation ?? 0;
    }

    x = Math.round(x * 2) / 2;
    z = Math.round(z * 2) / 2;

    const validation = this.validateBuildingDefinition(def, x, z, rotation, existingBuildingId);
    this.placement = {
      mode: existing ? 'move' : 'build',
      typeId,
      buildingId: existingBuildingId,
      x,
      z,
      rotation,
      valid: validation.valid,
      reason: validation.reason
    };
    this.activeModal = null;
    this.selectedPlotId = null;
    this.proximityTarget = null;
    audioManager.playClick();
    this.notify();
    return true;
  }

  public beginMovePlacement(buildingId: string): boolean {
    const building = this.buildings.find(b => b.buildingId === buildingId);
    if (!building) return false;
    return this.beginPlacement(building.typeId, buildingId);
  }

  public updatePlacementPosition(x: number, z: number): void {
    if (!this.placement) return;
    const snappedX = Math.round(x * 2) / 2;
    const snappedZ = Math.round(z * 2) / 2;
    if (Math.abs(this.placement.x - snappedX) < 0.001 && Math.abs(this.placement.z - snappedZ) < 0.001) {
      return;
    }
    const validation = this.validateBuildingPlacement(
      this.placement.typeId,
      snappedX,
      snappedZ,
      this.placement.rotation,
      this.placement.buildingId
    );
    this.placement = {
      ...this.placement,
      x: snappedX,
      z: snappedZ,
      valid: validation.valid,
      reason: validation.reason
    };
    this.notify();
  }

  public rotatePlacement(): void {
    if (!this.placement) return;
    const rotation = (this.placement.rotation + Math.PI / 2) % (Math.PI * 2);
    const validation = this.validateBuildingPlacement(
      this.placement.typeId,
      this.placement.x,
      this.placement.z,
      rotation,
      this.placement.buildingId
    );
    this.placement = {
      ...this.placement,
      rotation,
      valid: validation.valid,
      reason: validation.reason
    };
    audioManager.playClick();
    this.notify();
  }

  public confirmPlacement(): boolean {
    const placement = this.placement;
    if (!placement) return false;
    if (!placement.valid) {
      this.showToast('Cannot Place Here', placement.reason, 'warning');
      return false;
    }

    let success = false;
    if (placement.mode === 'move' && placement.buildingId) {
      success = this.relocateBuilding(
        placement.buildingId,
        placement.x,
        placement.z,
        placement.rotation
      );
    } else {
      success = this.placeBuilding(
        placement.typeId,
        placement.x,
        placement.z,
        placement.rotation
      );
    }

    if (success) {
      this.placement = null;
      this.notify();
    }
    return success;
  }

  public cancelPlacement(playSound: boolean = true): void {
    if (!this.placement) return;
    this.placement = null;
    if (playSound) audioManager.playClick();
    this.notify();
  }

  public autoPlaceBuilding(typeId: string): boolean {
    const def = BUILDINGS.find(b => b.typeId === typeId);
    if (!def) return false;
    if (this.level < def.unlockLevel) {
      this.showToast('Building Locked', `${def.name} unlocks at level ${def.unlockLevel}.`, 'warning');
      return false;
    }
    if (this.coins < def.cost) {
      this.showToast('Insufficient Coins', `${def.name} costs 🪙 ${def.cost}.`, 'warning');
      return false;
    }
    const spot = this.findFreeBuildSpot(typeId, 0);
    if (!spot) {
      this.showToast('No Space Found', 'Try moving a structure or placing this one manually.', 'warning');
      return false;
    }
    return this.placeBuilding(typeId, spot.x, spot.z, spot.rotation);
  }

  public getBuildingRefund(buildingId: string): number {
    const building = this.buildings.find(b => b.buildingId === buildingId);
    if (!building) return 0;
    const def = BUILDINGS.find(b => b.typeId === building.typeId);
    return def ? Math.floor(def.cost * 0.5) : 0;
  }

  public sellBuilding(buildingId: string): boolean {
    const index = this.buildings.findIndex(b => b.buildingId === buildingId);
    if (index === -1) return false;
    const building = this.buildings[index];
    const def = BUILDINGS.find(b => b.typeId === building.typeId);
    if (!def) return false;

    const refund = Math.floor(def.cost * 0.5);
    this.buildings.splice(index, 1);
    if (this.placement?.buildingId === buildingId) {
      this.placement = null;
    }
    if (refund > 0) {
      this.addCoins(refund, 'sale', `Sold ${def.name}`);
    }
    audioManager.playCoin();
    this.showToast('Structure Sold 🪙', `${def.name} dismantled for 🪙 ${refund} coins.`, 'success');
    this.checkAchievements();
    this.saveToStorage('autosave');
    this.notify();
    return true;
  }

  public relocateBuilding(buildingId: string, x: number, z: number, rotation: number): boolean {
    const building = this.buildings.find(b => b.buildingId === buildingId);
    if (!building) return false;
    const validation = this.validateBuildingPlacement(building.typeId, x, z, rotation, buildingId);
    if (!validation.valid) {
      this.showToast('Cannot Move There', validation.reason, 'warning');
      return false;
    }
    building.x = x;
    building.z = z;
    building.rotation = rotation;
    audioManager.playClick();
    this.showToast('Structure Relocated 🔨', 'The new position is now part of your café grounds.', 'success');
    this.saveToStorage('autosave');
    this.notify();
    return true;
  }

  public placeBuilding(typeId: string, x: number, z: number, rotation: number = 0): boolean {
    const def = BUILDINGS.find(b => b.typeId === typeId);
    if (!def) return false;

    if (this.level < def.unlockLevel) {
      this.showToast('Building Locked', `${def.name} unlocks at level ${def.unlockLevel}.`, 'warning');
      return false;
    }

    const validation = this.validateBuildingPlacement(typeId, x, z, rotation);
    if (!validation.valid) {
      this.showToast('Cannot Build There', validation.reason, 'warning');
      return false;
    }

    if (!this.spendCoins(def.cost, 'purchase', `Constructed ${def.name}`)) {
      return false;
    }

    const newBuilding: PlacedBuilding = {
      buildingId: Math.random().toString(36).substring(2, 9),
      typeId,
      x,
      z,
      rotation
    };

    this.buildings.push(newBuilding);
    this.addXp(40);
    audioManager.playTill();
    this.updateChallenges('build', 1);
    this.showToast('Building Placed! 🔨', `${def.name} successfully constructed!`, 'success');
    this.checkAchievements();
    this.saveToStorage('autosave');
    this.notify();
    return true;
  }

  // --- CHEF'S DAILY SPECIAL ---

  private ensureDailySpecial(): void {
    if (
      !this.dailySpecialRecipeId ||
      !this.unlockedRecipes.includes(this.dailySpecialRecipeId)
    ) {
      this.rollDailySpecial(false);
    }
  }

  private rollDailySpecial(announce: boolean): void {
    const pool = this.unlockedRecipes.length > 0
      ? this.unlockedRecipes
      : ['margherita_pizza'];
    const next = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
    this.dailySpecialRecipeId = next;
    this.dailySpecialChosenDay = 0;
    if (announce) {
      const recipe = RECIPES.find(r => r.id === next);
      this.showToast(
        "Chef's Special Today ⭐",
        `${recipe?.name ?? 'A new dish'} is on the menu with +${Math.round(this.DAILY_SPECIAL_PRICE_BONUS * 100)}% sale price and extra orders!`,
        'info'
      );
    }
  }

  public setDailySpecial(recipeId: string): boolean {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    if (!this.unlockedRecipes.includes(recipeId)) {
      this.showToast('Recipe Locked', 'Research this recipe before featuring it as a special.', 'warning');
      return false;
    }
    if (this.dailySpecialChosenDay === this.day) {
      this.showToast('Special Already Chosen', 'You can feature one Chef\'s Special per day.', 'info');
      return false;
    }
    this.dailySpecialRecipeId = recipeId;
    this.dailySpecialChosenDay = this.day;
    audioManager.playUpgradePing();
    this.showToast(
      "Today's Special Selected ⭐",
      `${recipe.name} now sells for +${Math.round(this.DAILY_SPECIAL_PRICE_BONUS * 100)}% and appears 3× more often in orders.`,
      'success'
    );
    this.saveToStorage('autosave');
    this.notify();
    return true;
  }

  // --- MARKET / INGREDIENT RESTOCK ---

  public buyItem(itemId: string, qty: number, unitCost: number): boolean {
    const totalCost = unitCost * qty;
    if (!this.spendCoins(totalCost, 'purchase', `Bought ${qty}x ${itemId}`)) {
      return false;
    }

    this.inventory[itemId] = (this.inventory[itemId] || 0) + qty;
    audioManager.playCoin();
    this.showToast('Purchase Successful', `Added ${qty}x ${itemId} to pantry!`, 'success');
    this.notify();
    return true;
  }

  // --- ACHIEVEMENTS CHECK ---

  private checkAchievements() {
    this.achievements.forEach(ach => {
      if (ach.unlocked) return;

      let current = 0;
      if (ach.id === 'first_sprout') current = this.stats.cropsHarvested;
      else if (ach.id === 'first_serve') current = this.stats.dishesServed;
      else if (ach.id === 'golden_crust') current = this.stats.perfectBakes;
      else if (ach.id === 'bumper_crop') current = this.stats.cropsHarvested;
      else if (ach.id === 'master_builder') current = this.buildings.filter(b => !b.buildingId.startsWith('default_')).length;
      else if (ach.id === 'five_stars') current = this.reputationStars >= 4.5 ? 1 : 0;
      else if (ach.id === 'rainy_harvest') current = (this.weather === 'rain' && this.stats.cropsHarvested > 0) ? 1 : 0;
      else if (ach.id === 'barista') current = this.stats.espressoBrews || 0;

      ach.progress = Math.min(ach.goal, Math.max(0, current));
      if (ach.progress >= ach.goal) {
        ach.unlocked = true;
        this.addCoins(ach.rewardCoins, 'tip', `Achievement: ${ach.title}`);
        this.addXp(ach.rewardXp);
        this.showToast(`Achievement Unlocked! 🏆`, `${ach.title}: ${ach.description} (+${ach.rewardCoins} coins, +${ach.rewardXp} XP)`, 'success');
      }
    });
  }

  // --- TUTORIAL PROGRESSION ---

  public advanceTutorial() {
    this.tutorialStep++;
    if (this.tutorialStep > 7) {
      this.tutorialComplete = true;
    }
    this.notify();
  }

  public skipTutorial() {
    this.tutorialComplete = true;
    this.tutorialStep = 8;
    this.notify();
  }

  // --- UI HELPERS ---

  public setProximityTarget(target: ProximityTarget | null) {
    const current = this.proximityTarget;
    const unchanged = (!current && !target) ||
      (current && target &&
        current.id === target.id &&
        current.label === target.label &&
        current.sublabel === target.sublabel);
    if (unchanged) return;
    this.proximityTarget = target;
    this.notify();
  }

  public setCafeName(rawName: string): boolean {
    const name = stripControlCharacters(rawName)
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 28);
    if (!name) {
      this.showToast('Name Required', 'Give your café a name for its postcard.', 'warning');
      return false;
    }
    if (name === this.cafeName) return true;
    this.cafeName = name;
    this.showToast('Café Renamed ✨', `Your piazza postcard now reads "${name}".`, 'success');
    this.saveToStorage('autosave');
    this.notify();
    return true;
  }

  public openModal(modal: GameStore['activeModal'], plotId: number | null = null) {
    // Opening any UI leaves build mode cleanly instead of trapping the ghost
    // behind a modal backdrop.
    if (this.placement) this.placement = null;
    this.activeModal = modal;
    this.selectedPlotId = plotId;
    audioManager.playClick();
    this.notify();
  }

  public closeModal() {
    const closingDaySummary = this.activeModal === 'day_summary';
    this.activeModal = null;
    this.selectedPlotId = null;
    if (closingDaySummary) {
      this.daySummary = null;
      this.isPaused = false;
    }
    audioManager.playClick();
    this.notify();
  }

  public showToast(title: string, body: string, type: 'info' | 'success' | 'warning' = 'info') {
    const toastId = Math.random().toString(36).substring(2, 9);
    this.toast = {
      id: toastId,
      title,
      body,
      type
    };
    this.notify();
    setTimeout(() => {
      if (this.toast?.id === toastId) {
        this.toast = null;
        this.notify();
      }
    }, 4500);
  }

  // --- STAFF MANAGEMENT ---

  public tickStaff(deltaSeconds: number) {
    if (this.staff.length === 0) return;

    this.staffTickAccumulator += deltaSeconds;
    if (this.staffTickAccumulator < 5) return;
    this.staffTickAccumulator = 0;

    for (const member of this.staff) {
      if (member.role === 'prep_cook') {
        if ((this.inventory['wheat'] || 0) >= 2) {
          this.inventory['wheat'] -= 2;
          this.inventory['dough'] = (this.inventory['dough'] || 0) + 2;
        } else if ((this.inventory['tomato'] || 0) >= 2) {
          this.inventory['tomato'] -= 2;
          this.inventory['tomato_sauce'] = (this.inventory['tomato_sauce'] || 0) + 2;
        }
      } else if (member.role === 'oven_tender') {
        if (this.ovenPizza && this.ovenPizza.isBaking && this.ovenPizza.elapsedSeconds >= this.ovenPizza.idealSeconds) {
          this.pullPizzaFromOven();
          this.showToast('Oven Tender 👨‍🍳', `${member.name} pulled the pizza at golden perfection!`, 'info');
        }
      } else if (member.role === 'farmhand') {
        const dryPlot = this.farmPlots.find(p => p.state === 'growing' && !p.isWatered);
        if (dryPlot) {
          dryPlot.isWatered = true;
        } else {
          const readyPlot = this.farmPlots.find(p => p.state === 'ready');
          if (readyPlot) {
            this.harvestPlot(readyPlot.plotId);
          }
        }
      } else if (member.role === 'server') {
        if (this.dishesOnCounter.length > 0 && this.customers.length > 0) {
          const waitingCustomer = this.customers.find(c => (c.state === 'ordering' || c.state === 'waiting') && c.order);
          if (waitingCustomer && waitingCustomer.order) {
            const matchingDish = this.dishesOnCounter.find(d => d.recipeId === waitingCustomer.order!.recipeId);
            if (matchingDish) {
              this.serveDishToCustomer(waitingCustomer.id, matchingDish.id);
            }
          }
        }
      }
    }
  }

  public hireStaff(role: StaffRole, name?: string): boolean {
    const roleWages: Record<StaffRole, number> = {
      prep_cook: 12,
      oven_tender: 15,
      server: 10,
      farmhand: 8
    };

    const hireCost = 45;
    if (!this.spendCoins(hireCost, 'purchase', `Hired ${role.replace('_', ' ')}`)) {
      return false;
    }

    const defaultNames: Record<StaffRole, string[]> = {
      prep_cook: ['Chef Marco', 'Luigi', 'Gia', 'Antonio'],
      oven_tender: ['Pietro', 'Sofia', 'Dante', 'Vincenzo'],
      server: ['Bella', 'Matteo', 'Chiara', 'Lorenzo'],
      farmhand: ['Silvia', 'Gino', 'Lucia', 'Carlo']
    };

    const roleNameList = defaultNames[role] || ['Staff Member'];
    const chosenName = name || roleNameList[Math.floor(Math.random() * roleNameList.length)];

    const shirtColors = ['#e63946', '#2a9d8f', '#457b9d', '#e76f51', '#f4a261', '#8338ec'];
    const hairColors = ['#3d2314', '#e9c46a', '#1d3557', '#e76f51', '#6c757d'];

    const newStaff: StaffMember = {
      id: Math.random().toString(36).substring(2, 9),
      name: chosenName,
      role,
      skillLevel: 1,
      dailyWage: roleWages[role],
      hiredAt: this.day,
      appearance: {
        shirtColor: shirtColors[Math.floor(Math.random() * shirtColors.length)],
        hairColor: hairColors[Math.floor(Math.random() * hairColors.length)]
      }
    };

    this.staff.push(newStaff);
    this.addXp(30);
    audioManager.playStaffHired();
    this.showToast('Staff Hired! 🤝', `Hired ${newStaff.name} as ${role.replace('_', ' ')}! Wage: 🪙 ${newStaff.dailyWage}/day.`, 'success');
    this.notify();
    return true;
  }

  public fireStaff(staffId: string) {
    const idx = this.staff.findIndex(s => s.id === staffId);
    if (idx >= 0) {
      const removed = this.staff.splice(idx, 1)[0];
      this.showToast('Staff Released', `${removed.name} has left the team.`, 'info');
      this.notify();
    }
  }

  // --- RESTAURANT TIER UPGRADES ---

  public upgradeRestaurantTier(): boolean {
    if (this.restaurantTier >= 3) {
      this.showToast('Max Tier Reached', 'Your pizzeria is already a Grand Tuscan Villa!', 'info');
      return false;
    }

    const nextTier = this.restaurantTier + 1;
    const costs: Record<number, number> = { 2: 220, 3: 480 };
    const cost = costs[nextTier] || 250;

    if (!this.spendCoins(cost, 'purchase', `Upgraded Restaurant to Tier ${nextTier}`)) {
      return false;
    }

    this.restaurantTier = nextTier;
    this.maxCustomers = 4 + (this.restaurantTier - 1) * 2;
    this.addXp(60);
    audioManager.playLevelUp();

    const tierNames: Record<number, string> = {
      2: 'Trattoria di Toscana',
      3: 'Grand Villa Pizzeria'
    };

    this.showToast(
      `Restaurant Upgraded! 🏛️`, 
      `Welcome to "${tierNames[nextTier]}"! Capacity now ${this.maxCustomers} guests, faster wood-fired baking & higher tips!`, 
      'success'
    );
    this.notify();
    return true;
  }

  // --- SPECIAL EVENTS ---

  private tickSpecialEvents(deltaSeconds: number) {
    // Countdown active events
    for (const event of this.specialEvents) {
      if (event.active) {
        event.remainingSeconds -= deltaSeconds;
        if (event.remainingSeconds <= 0) {
          event.active = false;
          event.remainingSeconds = 0;
          audioManager.playBellDing();
          this.showToast(`Event Ended: ${event.title}`, 'The special event has concluded!', 'info');
        }
      }
    }
    // Remove expired events
    this.specialEvents = this.specialEvents.filter(e => e.remainingSeconds > 0 || e.active);

    // Randomly trigger new events based on timer
    this.nextEventTimer -= deltaSeconds;
    if (this.nextEventTimer <= 0) {
      this.nextEventTimer = 80 + Math.random() * 120; // 1.3–3.3 minutes between events
      if (Math.random() < 0.35) { // 35% chance to spawn an event
        this.triggerRandomSpecialEvent();
      }
    }
  }

  public triggerRandomSpecialEvent() {
    const eventTemplates: Omit<SpecialEvent, 'id' | 'remainingSeconds' | 'active'>[] = [
      {
        type: 'pizza_festival',
        title: '🍕 Pizza Festival!',
        description: 'A local festival drives crowds to your pizzeria. All dishes sell for 50% more!',
        icon: '🍕',
        durationSeconds: 90,
        bonusMultiplier: 1.5
      },
      {
        type: 'vip_visit',
        title: '⭐ VIP Food Critic!',
        description: 'A renowned food critic has arrived! Serve them a perfect dish for massive reputation!',
        icon: '⭐',
        durationSeconds: 60,
        bonusMultiplier: 2.0
      },
      {
        type: 'health_inspector',
        title: '📋 Health Inspector Visit',
        description: 'The health inspector is watching! Any burnt dishes will cost reputation points.',
        icon: '📋',
        durationSeconds: 75,
        bonusMultiplier: 1.0
      },
      {
        type: 'harvest_festival',
        title: '🌾 Harvest Festival!',
        description: 'Seasonal boost! Crops grow twice as fast for the next period.',
        icon: '🌾',
        durationSeconds: 100,
        bonusMultiplier: 2.0
      },
      {
        type: 'rainy_day_special',
        title: '☔ Rainy Day Special!',
        description: 'Cozy dining weather brings generous tippers! All tips doubled.',
        icon: '☔',
        durationSeconds: 80,
        bonusMultiplier: 1.75
      }
    ];

    const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
    const event: SpecialEvent = {
      ...template,
      id: Math.random().toString(36).substring(2, 9),
      remainingSeconds: template.durationSeconds,
      active: true
    };

    this.specialEvents.push(event);
    audioManager.playFanfare();
    this.showToast(
      event.title,
      event.description,
      'success'
    );
    this.notify();
  }

  public getActiveEvents(): SpecialEvent[] {
    return this.specialEvents.filter(e => e.active);
  }

  // --- RECIPE RESEARCH ---

  public initResearchProjects() {
    this.researchProjects = [
      {
        id: 'research_quattro',
        recipeId: 'quattro_formaggi',
        recipeName: 'Quattro Formaggi',
        icon: '🧀',
        costCoins: 80,
        costXp: 0,
        description: 'Study the ancient art of four-cheese harmony. Unlock Quattro Formaggi pizza.',
        unlocked: false,
        available: true,
        requiresLevel: 2
      },
      {
        id: 'research_tartufo',
        recipeId: 'tartufo_pizza',
        recipeName: 'Pizza al Tartufo',
        icon: '🍄',
        costCoins: 150,
        costXp: 0,
        description: 'Master the rare truffle pizza of Umbrian tradition.',
        unlocked: false,
        available: true,
        requiresLevel: 4
      },
      {
        id: 'research_focaccia',
        recipeId: 'focaccia_al_rosmarino',
        recipeName: 'Focaccia al Rosmarino',
        icon: '🫓',
        costCoins: 60,
        costXp: 0,
        description: 'Bake the classic Ligurian flatbread with fresh rosemary.',
        unlocked: false,
        available: true,
        requiresLevel: 2
      },
      {
        id: 'research_diavola',
        recipeId: 'pizza_diavola',
        recipeName: 'Pizza Diavola',
        icon: '🌶️',
        costCoins: 120,
        costXp: 0,
        description: 'Unlock the spicy devil\'s pizza — salami piccante and chili oil.',
        unlocked: false,
        available: true,
        requiresLevel: 3
      }
    ];
  }

  public conductResearch(projectId: string): boolean {
    const project = this.researchProjects.find(p => p.id === projectId);
    if (!project || project.unlocked) return false;
    if (this.level < project.requiresLevel) {
      this.showToast('Research Locked', `Reach Level ${project.requiresLevel} to research ${project.recipeName}.`, 'warning');
      return false;
    }
    if (!this.spendCoins(project.costCoins, 'purchase', `Research: ${project.recipeName}`)) return false;

    project.unlocked = true;
    if (!this.unlockedRecipes.includes(project.recipeId)) {
      this.unlockedRecipes.push(project.recipeId);
    }
    audioManager.playUpgradePing();
    this.addXp(50);
    this.showToast(
      `Research Complete! 📜`,
      `Unlocked recipe: ${project.recipeName}! Now available in the prep station.`,
      'success'
    );
    this.notify();
    return true;
  }

  // --- LEADERBOARD / HIGH SCORES ---

  private loadHighScores() {
    try {
      const raw = localStorage.getItem('slice_sprout_highscores_v1');
      if (raw) this.highScores = JSON.parse(raw);
    } catch {
      this.highScores = [];
    }
  }

  public submitHighScore() {
    const score: HighScore = {
      day: this.day,
      coinsEarned: this.stats.coinsEarned,
      dishesServed: this.stats.dishesServed,
      reputationStars: this.reputationStars,
      restaurantTier: this.restaurantTier,
      timestamp: Date.now()
    };
    this.highScores.push(score);
    this.highScores.sort((a, b) => b.coinsEarned - a.coinsEarned);
    this.highScores = this.highScores.slice(0, 10); // Top 10
    try {
      localStorage.setItem('slice_sprout_highscores_v1', JSON.stringify(this.highScores));
    } catch {
      // ignore
    }
  }

  // --- MARKET / SELLING CROPS ---

  public sellCrop(cropId: string, qty: number): boolean {
    const current = this.inventory[cropId] || 0;
    if (current < qty || qty <= 0) {
      this.showToast('Not Enough Crops', `You don't have ${qty}x ${cropId} in your pantry to sell!`, 'warning');
      return false;
    }

    const cropDef = CROPS[cropId];
    const unitPrice = cropDef ? cropDef.sellValue : 4;
    const totalEarned = Math.round(unitPrice * qty * 10) / 10;

    this.inventory[cropId] -= qty;
    if (this.inventory[cropId] === 0) {
      delete this.inventory[cropId];
    }

    this.addCoins(totalEarned, 'sale', `Sold ${qty}x ${cropDef?.name || cropId}`);
    audioManager.playCoin();
    this.showToast('Crops Sold! 💰', `Sold ${qty}x ${cropDef?.name || cropId} for 🪙 ${totalEarned} coins!`, 'success');
    this.notify();
    return true;
  }

  // --- DAILY CHALLENGES ---

  public generateDailyChallenges() {
    const pool: Omit<DailyChallenge, 'id' | 'day' | 'progress' | 'completed'>[] = [
      {
        title: 'Rush Hour Service',
        description: 'Serve 3 hungry customers at the restaurant counter',
        icon: '🍕',
        type: 'serve_dishes',
        target: 3,
        rewardCoins: 40,
        rewardXp: 30
      },
      {
        title: 'Green Thumb',
        description: 'Harvest 4 fresh crops from your garden plots',
        icon: '🌱',
        type: 'harvest_crops',
        target: 4,
        rewardCoins: 35,
        rewardXp: 25
      },
      {
        title: 'Master of Crust',
        description: 'Bake 2 pizzas to golden perfection',
        icon: '🔥',
        type: 'perfect_bakes',
        target: 2,
        rewardCoins: 50,
        rewardXp: 40
      },
      {
        title: 'Daily Earnings',
        description: 'Earn 75 coins from customer orders and crop sales',
        icon: '🪙',
        type: 'earn_coins',
        target: 75,
        rewardCoins: 30,
        rewardXp: 20
      },
      {
        title: 'Town Architect',
        description: 'Place 1 new building or decorative element in your pizzeria grounds',
        icon: '🔨',
        type: 'build',
        target: 1,
        rewardCoins: 45,
        rewardXp: 35
      }
    ];

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    this.dailyChallenges = shuffled.slice(0, 3).map((item, idx) => ({
      ...item,
      id: `challenge_day${this.day}_${idx}`,
      day: this.day,
      progress: 0,
      completed: false
    }));
  }

  public updateChallenges(type: DailyChallenge['type'], count: number) {
    let anyCompleted = false;
    this.dailyChallenges.forEach(c => {
      if (!c.completed && c.type === type) {
        c.progress = Math.min(c.target, c.progress + count);
        if (c.progress >= c.target) {
          c.completed = true;
          anyCompleted = true;
          this.addCoins(c.rewardCoins, 'tip', `Daily Challenge: ${c.title}`);
          this.addXp(c.rewardXp);
          this.showToast('Challenge Completed! ⭐', `${c.title} (+🪙 ${c.rewardCoins}, +${c.rewardXp} XP)`, 'success');
        }
      }
    });
    if (anyCompleted) this.notify();
  }

  public claimChallengeReward(id: string) {
    const ch = this.dailyChallenges.find(c => c.id === id);
    if (ch && ch.progress >= ch.target && !ch.completed) {
      ch.completed = true;
      this.addCoins(ch.rewardCoins, 'tip', `Daily Challenge: ${ch.title}`);
      this.addXp(ch.rewardXp);
      this.showToast('Reward Claimed! ⭐', `${ch.title} (+🪙 ${ch.rewardCoins}, +${ch.rewardXp} XP)`, 'success');
      this.notify();
    }
  }

  // --- END OF DAY REPORT & LIFECYCLE ---

  public snapshotDayStart() {
    this.dayStartStats = {
      dishesServed: this.stats.dishesServed,
      cropsHarvested: this.stats.cropsHarvested,
      coinsEarned: this.stats.coinsEarned,
      perfectBakes: this.stats.perfectBakes,
      burntDishes: this.stats.burntDishes,
      customersLost: this.stats.customersLost || 0
    };
    this.dayRepStart = this.reputationStars;
    this.dayCoinsSpent = 0;
    this.dayCustomersLost = 0;
    this.dayBestDish = null;
  }

  public endOfDay() {
    const summary: DaySummary = {
      day: this.day,
      dishesServed: Math.max(0, this.stats.dishesServed - this.dayStartStats.dishesServed),
      cropsHarvested: Math.max(0, this.stats.cropsHarvested - this.dayStartStats.cropsHarvested),
      coinsEarned: Math.max(0, this.stats.coinsEarned - this.dayStartStats.coinsEarned),
      coinsSpent: this.dayCoinsSpent,
      perfectBakes: Math.max(0, this.stats.perfectBakes - this.dayStartStats.perfectBakes),
      burntDishes: Math.max(0, this.stats.burntDishes - this.dayStartStats.burntDishes),
      customersLost: Math.max(0, (this.stats.customersLost || 0) - this.dayStartStats.customersLost),
      bestDish: this.dayBestDish || 'Margherita Pizza',
      weatherToday: this.weather,
      reputationChange: Math.round((this.reputationStars - this.dayRepStart) * 10) / 10,
      challengesCompleted: this.dailyChallenges.filter(c => c.completed).length
    };

    const totalWages = this.staff.reduce((sum, s) => sum + s.dailyWage, 0);
    if (totalWages > 0) {
      this.spendCoins(totalWages, 'wage', `Staff daily wages (${this.staff.length} staff)`);
      summary.coinsSpent += totalWages;
    }

    this.daySummary = summary;
    // The end-of-day report is a genuine pause: without this the simulation
    // kept ticking into the next morning while the player read the recap.
    this.isPaused = true;
    this.openModal('day_summary');
    audioManager.playLevelUp();
  }

  public dismissDaySummary() {
    this.daySummary = null;
    this.closeModal();
  }

  // --- PERSISTENCE ---

  public saveToStorage(slot: string = 'autosave') {
    const saveData: SaveGame = {
      version: 2,
      coins: this.coins,
      level: this.level,
      xp: this.xp,
      day: this.day,
      timeOfDaySeconds: this.timeOfDaySeconds,
      weather: this.weather,
      reputationStars: this.reputationStars,
      tutorialComplete: this.tutorialComplete,
      tutorialStep: this.tutorialStep,
      unlockedRecipes: this.unlockedRecipes,
      farmPlots: this.farmPlots,
      buildings: this.buildings,
      inventory: this.inventory,
      dishesOnCounter: this.dishesOnCounter,
      achievements: this.achievements.filter(a => a.unlocked).map(a => a.id),
      staff: this.staff,
      dailyChallenges: this.dailyChallenges,
      restaurantTier: this.restaurantTier,
      cafeName: this.cafeName,
      dailySpecialRecipeId: this.dailySpecialRecipeId,
      dailySpecialChosenDay: this.dailySpecialChosenDay,
      stats: this.stats
    };

    try {
      localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, JSON.stringify(saveData));
      if (slot !== 'autosave') {
        this.showToast('Game Saved! 💾', `Progress saved to Slot "${slot}".`, 'success');
      }
    } catch (e) {
      console.warn('Failed to save game state to storage:', e);
    }
  }

  public loadFromStorage(slot: string = 'autosave'): boolean {
    try {
      const raw = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`);
      if (!raw) return false;

      const data: SaveGame = JSON.parse(raw);
      this.coins = data.coins ?? 150;
      this.level = data.level ?? 1;
      this.xp = data.xp ?? 0;
      this.day = data.day ?? 1;
      this.timeOfDaySeconds = data.timeOfDaySeconds ?? 240;
      this.weather = data.weather ?? 'clear';
      this.reputationStars = data.reputationStars ?? 3.5;
      this.tutorialComplete = data.tutorialComplete ?? false;
      this.tutorialStep = data.tutorialStep ?? 0;
      this.unlockedRecipes = data.unlockedRecipes ?? ['margherita_pizza', 'pepperoni_pizza'];

      // Farm grid positions are owned by the world layout, so saves always
      // agree with the rendered fence, paths, and minimap.
      if (data.farmPlots && data.farmPlots.length > 0) {
        const { originX, originZ, spacing } = WORLD_LAYOUT.farm;
        this.farmPlots = data.farmPlots.map(p => ({
          ...p,
          worldX: originX + p.gridX * spacing,
          worldZ: originZ + p.gridZ * spacing
        }));
      }

      if (data.buildings && data.buildings.length > 0) {
        const legacyLayout = (data.version ?? 1) < 2;
        if (legacyLayout) {
          // Keep player-made buildings, but replace the old default tables
          // and planters with the new café terrace layout.
          const customBuildings = data.buildings.filter(b => !b.buildingId.startsWith('default_'));
          this.buildings = [...this.createDefaultBuildings(), ...customBuildings];
        } else {
          this.buildings = data.buildings;
        }
      }

      if (data.inventory) this.inventory = data.inventory;
      if (data.dishesOnCounter) this.dishesOnCounter = data.dishesOnCounter;
      if (data.staff) this.staff = data.staff;
      if (data.dailyChallenges) this.dailyChallenges = data.dailyChallenges;
      if (data.restaurantTier) {
        this.restaurantTier = data.restaurantTier;
        this.maxCustomers = 4 + (this.restaurantTier - 1) * 2;
      }
      this.cafeName = stripControlCharacters(data.cafeName ?? '')
        .replace(/[<>]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 28) || 'Slice & Sprout';
      this.dailySpecialRecipeId = data.dailySpecialRecipeId ?? null;
      this.dailySpecialChosenDay = data.dailySpecialChosenDay ?? 0;
      this.placement = null;
      this.ensureDailySpecial();
      if (data.stats) {
        this.stats = {
          ...this.stats,
          ...data.stats,
          customersLost: data.stats.customersLost ?? 0,
          espressoBrews: data.stats.espressoBrews ?? 0
        };
      }

      if (data.achievements) {
        this.achievements.forEach(a => {
          if (data.achievements.includes(a.id)) a.unlocked = true;
        });
      }

      this.showToast('Game Loaded! 📂', `Welcome back to Slice & Sprout!`, 'info');
      this.notify();
      return true;
    } catch (e) {
      console.warn('Failed to parse save game:', e);
      return false;
    }
  }

  private loadAutosave() {
    this.loadFromStorage('autosave');
  }

  public resetGame() {
    localStorage.removeItem(`${SAVE_KEY_PREFIX}autosave`);
    window.location.reload();
  }
}

export const gameStore = new GameStore();

if (import.meta.env.DEV) {
  (window as unknown as { __gameStore?: GameStore }).__gameStore = gameStore;
}
