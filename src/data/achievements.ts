import type { Achievement } from '../types/game';


export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_sprout',
    title: 'Green Thumb Beginnings',
    description: 'Harvest your very first homegrown farm crop.',
    icon: '🌱',
    rewardCoins: 50,
    rewardXp: 30,
    progress: 0,
    goal: 1,
    unlocked: false
  },
  {
    id: 'first_serve',
    title: 'First Customer Served',
    description: 'Cook and serve your first piping hot pizza order.',
    icon: '🍕',
    rewardCoins: 50,
    rewardXp: 30,
    progress: 0,
    goal: 1,
    unlocked: false
  },
  {
    id: 'golden_crust',
    title: 'Pizzaiolo Maestro',
    description: 'Bake 3 Perfect Golden Crust pizzas in the wood-fired oven.',
    icon: '⭐',
    rewardCoins: 120,
    rewardXp: 80,
    progress: 0,
    goal: 3,
    unlocked: false
  },
  {
    id: 'bumper_crop',
    title: 'Bumper Harvest',
    description: 'Harvest a total of 15 crops from your garden plots.',
    icon: '🧺',
    rewardCoins: 180,
    rewardXp: 120,
    progress: 0,
    goal: 15,
    unlocked: false
  },
  {
    id: 'master_builder',
    title: 'Master Architect',
    description: 'Construct 3 buildings or decorations around your estate.',
    icon: '🔨',
    rewardCoins: 150,
    rewardXp: 100,
    progress: 0,
    goal: 3,
    unlocked: false
  },
  {
    id: 'five_stars',
    title: 'Michelin Cozy Star',
    description: 'Maintain a 4.5+ Star reputation across happy customer reviews.',
    icon: '✨',
    rewardCoins: 250,
    rewardXp: 200,
    progress: 0,
    goal: 1,
    unlocked: false
  },
  {
    id: 'rainy_harvest',
    title: 'Singing in the Rain',
    description: 'Harvest a crop while it is raining outside.',
    icon: '🌧️',
    rewardCoins: 100,
    rewardXp: 70,
    progress: 0,
    goal: 1,
    unlocked: false
  },
  {
    id: 'barista',
    title: 'Café Barista',
    description: 'Serve 5 complimentary espressos from the terrace caffè bar.',
    icon: '☕',
    rewardCoins: 90,
    rewardXp: 65,
    progress: 0,
    goal: 5,
    unlocked: false
  }
];
