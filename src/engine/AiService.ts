/**
 * Optional online "Piazza Critic" service.
 *
 * The request is only made after an explicit player action. If the public
 * Gemini relay is unavailable, slow, or returns unusable text, the game quietly
 * falls back to a hand-written local edition so no feature depends on the
 * network. Reviews are cached per café/day/special in localStorage.
 */

export interface PiazzaSnapshot {
  cafeName: string;
  day: number;
  level: number;
  reputation: number;
  restaurantTier: number;
  coins: number;
  dailySpecial: string;
  staffCount: number;
  buildingCount: number;
  dishesServed: number;
  weather: string;
}

export interface PiazzaPost {
  text: string;
  source: 'ai' | 'local';
  day: number;
  createdAt: number;
}

interface CachedPiazzaPost {
  key: string;
  post: PiazzaPost;
}

const ENDPOINT = 'https://prexzyapis.com/ai/gemini';
const CACHE_KEY = 'slice_and_sprout_piazza_post_v1';
const CACHE_VERSION = 1;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_POST_LENGTH = 460;

function stripControlCharacters(value: string): string {
  let safe = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    safe += code < 32 || code === 127 ? ' ' : value[i];
  }
  return safe;
}

const WEATHER_PHRASES: Record<string, string> = {
  clear: 'under a bright Tuscan sky',
  cloudy: 'beneath soft grey clouds',
  rain: 'while rain taps the awning',
  storm: 'as thunder rolls over the hills'
};

const TIER_NAMES = ['Rustic Bistro', 'Trattoria di Toscana', 'Grand Villa Pizzeria'];

function seedFrom(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

export function cacheKeyFor(snapshot: PiazzaSnapshot): string {
  return `${CACHE_VERSION}:${snapshot.day}:${snapshot.cafeName.toLowerCase()}:${snapshot.dailySpecial}`;
}

export function buildPiazzaPrompt(snapshot: PiazzaSnapshot): string {
  const tier = TIER_NAMES[Math.max(0, Math.min(2, snapshot.restaurantTier - 1))];
  return [
    'You are Nonna Rosa, the warm and witty café critic for a small Tuscan piazza newspaper.',
    'Write a short daily review of the café below.',
    'Use exactly two short sentences, at most 55 words.',
    'Be charming, specific, and lightly playful.',
    'Mention the café name and either the daily special or one concrete detail from the notes.',
    'Do not use markdown, emoji, quotation marks around the whole review, hashtags, or URLs.',
    'Do not invent awards, celebrity visits, or claim you dined there in person.',
    `Café: ${snapshot.cafeName}.`,
    `Day ${snapshot.day}; level ${snapshot.level}; reputation ${snapshot.reputation.toFixed(1)}/5.`,
    `Restaurant style: ${tier}.`,
    `Daily special: ${snapshot.dailySpecial}.`,
    `Staff: ${snapshot.staffCount}; decorated structures: ${snapshot.buildingCount}.`,
    `Lifetime dishes served: ${snapshot.dishesServed}.`,
    `Weather: ${snapshot.weather}.`
  ].join(' ');
}

export function localPiazzaPost(snapshot: PiazzaSnapshot): string {
  const seed = seedFrom(`${snapshot.cafeName}:${snapshot.day}:${snapshot.dailySpecial}`);
  const weather = WEATHER_PHRASES[snapshot.weather] ?? WEATHER_PHRASES.clear;
  const special = snapshot.dailySpecial.toLowerCase();

  const openings = [
    `${snapshot.cafeName} is keeping the piazza well fed and happily distracted`,
    `There is a warm glow around ${snapshot.cafeName} these days`,
    `${snapshot.cafeName} has found its rhythm, one table at a time`,
    `The little kitchen at ${snapshot.cafeName} is earning its reputation the honest way`
  ];

  const middle = [
    `Order the ${special} — it is the plate everyone seems to be leaning across the table to admire.`,
    `The ${special} deserves its place at the top of the menu, especially on a day like this.`,
    `Do not leave without the ${special}; it carries just enough ambition and a great deal of comfort.`,
    `The ${special} is the sort of dish that makes a short lunch stretch into a pleasant afternoon.`
  ];

  const closings = [
    `A visit here ${weather} feels like a small holiday.`,
    `The room is full of easy conversation, and the coffee is doing its part.`,
    `With staff who know the regulars and a menu that keeps its promises, this is a piazza worth crossing.`,
    `Nothing about the place is trying too hard, which is precisely why it works.`
  ];

  return `${pick(openings, seed)}; ${pick(middle, seed >> 2)} ${pick(closings, seed >> 4)}`;
}

export function sanitizePiazzaText(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  let text = stripControlCharacters(
    raw
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/https?:\/\/\S+/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/[*_#`~]/g, '')
      .replace(/[<>]/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();

  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }

  if (text.length > MAX_POST_LENGTH) {
    const clipped = text.slice(0, MAX_POST_LENGTH);
    const lastSpace = clipped.lastIndexOf(' ');
    text = `${clipped.slice(0, lastSpace > 200 ? lastSpace : MAX_POST_LENGTH).trim()}…`;
  }

  return text;
}

function extractResponse(payload: unknown, fallbackText: string): string {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return fallbackText;
  const record = payload as Record<string, unknown>;
  for (const key of ['response', 'text', 'message', 'content', 'result', 'answer']) {
    if (typeof record[key] === 'string') return record[key] as string;
  }
  return fallbackText;
}

export function readCachedPiazzaPost(snapshot: PiazzaSnapshot): PiazzaPost | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedPiazzaPost;
    if (!cached || cached.key !== cacheKeyFor(snapshot) || !cached.post?.text) return null;
    return cached.post;
  } catch {
    return null;
  }
}

export function cachePiazzaPost(snapshot: PiazzaSnapshot, post: PiazzaPost): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const value: CachedPiazzaPost = { key: cacheKeyFor(snapshot), post };
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Storage can be full or disabled; the feature still works for this session.
  }
}

export async function generatePiazzaPost(snapshot: PiazzaSnapshot): Promise<PiazzaPost> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const prompt = buildPiazzaPrompt(snapshot);
    const response = await fetch(`${ENDPOINT}?prompt=${encodeURIComponent(prompt)}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json, text/plain;q=0.9' }
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`Piazza service returned ${response.status}`);
    }

    let payload: unknown = rawText;
    try {
      payload = JSON.parse(rawText);
    } catch {
      // Some deployments return plain text; use it directly.
    }

    const text = sanitizePiazzaText(extractResponse(payload, rawText));
    if (text.length < 20) {
      throw new Error('Piazza service returned an empty review');
    }

    const post: PiazzaPost = {
      text,
      source: 'ai',
      day: snapshot.day,
      createdAt: Date.now()
    };
    cachePiazzaPost(snapshot, post);
    return post;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function createLocalPiazzaPost(snapshot: PiazzaSnapshot): PiazzaPost {
  return {
    text: localPiazzaPost(snapshot),
    source: 'local',
    day: snapshot.day,
    createdAt: Date.now()
  };
}
