import React, { useEffect, useRef, useState } from 'react';
import {
  X, Newspaper, Mail, Star, Coins, ChefHat, Copy, Upload,
  Wifi, WifiOff, Loader2, RefreshCw, Sparkles, Check, MapPin, Send
} from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { RECIPES } from '../data/recipes';
import {
  generatePiazzaPost,
  createLocalPiazzaPost,
  readCachedPiazzaPost,
  cachePiazzaPost,
  type PiazzaPost,
  type PiazzaSnapshot
} from '../engine/AiService';

const POSTCARD_PREFIX = 'SSPOST1.';
const RACK_KEY = 'slice_and_sprout_postcard_rack_v1';
const TIER_NAMES = ['Rustic Bistro', 'Trattoria di Toscana', 'Grand Villa Pizzeria'];

interface PostcardData {
  n: string;
  d: number;
  l: number;
  r: number;
  c: number;
  ds: number;
  sp: string;
  tier: number;
  b: number;
  st: number;
}

interface StoredPostcard {
  card: PostcardData;
  code: string;
  importedAt: number;
}

function stripControlCharacters(value: string): string {
  let safe = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    safe += code < 32 || code === 127 ? ' ' : value[i];
  }
  return safe;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function normalizeCard(raw: unknown): PostcardData | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.n !== 'string' || typeof record.d !== 'number') return null;
  const name = stripControlCharacters(record.n)
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 28);
  if (!name) return null;
  const special = typeof record.sp === 'string'
    ? stripControlCharacters(record.sp).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40)
    : "Chef's special";

  return {
    n: name,
    d: clampInt(record.d, 1, 9999, 1),
    l: clampInt(record.l, 1, 999, 1),
    r: Math.round(clampNumber(record.r, 0, 5, 3.5) * 10) / 10,
    c: clampInt(record.c, 0, 999_999_999, 0),
    ds: clampInt(record.ds, 0, 999_999_999, 0),
    sp: special || "Chef's special",
    tier: clampInt(record.tier, 1, 3, 1),
    b: clampInt(record.b, 0, 999, 0),
    st: clampInt(record.st, 0, 99, 0)
  };
}

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodePostcard(card: PostcardData): string {
  const payload = {
    v: 1,
    n: card.n,
    d: card.d,
    l: card.l,
    r: card.r,
    c: card.c,
    ds: card.ds,
    sp: card.sp,
    tier: card.tier,
    b: card.b,
    st: card.st
  };
  return `${POSTCARD_PREFIX}${toBase64Url(JSON.stringify(payload))}`;
}

function decodePostcard(code: string): PostcardData | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith(POSTCARD_PREFIX)) return null;
  const encoded = trimmed.slice(POSTCARD_PREFIX.length).replace(/\s+/g, '');
  if (!encoded || encoded.length > 2400) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as Record<string, unknown>;
    if (parsed.v !== 1) return null;
    return normalizeCard(parsed);
  } catch {
    return null;
  }
}

function loadRack(): StoredPostcard[] {
  try {
    const raw = localStorage.getItem(RACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const result: StoredPostcard[] = [];
    for (const entry of parsed.slice(0, 12)) {
      if (!entry || typeof entry !== 'object') continue;
      const record = entry as Record<string, unknown>;
      const card = normalizeCard(record.card);
      if (!card) continue;
      result.push({
        card,
        code: typeof record.code === 'string' ? record.code.slice(0, 3000) : '',
        importedAt: typeof record.importedAt === 'number' ? record.importedAt : Date.now()
      });
    }
    return result.sort((a, b) => b.importedAt - a.importedAt).slice(0, 8);
  } catch {
    return [];
  }
}

function persistRack(rack: StoredPostcard[]): void {
  try {
    localStorage.setItem(RACK_KEY, JSON.stringify(rack.slice(0, 8)));
  } catch {
    // The rack still works for this session if storage is unavailable.
  }
}

function fallbackCopy(text: string): boolean {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    area.style.pointerEvents = 'none';
    document.body.appendChild(area);
    area.focus();
    area.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(area);
    return copied;
  } catch {
    return false;
  }
}

function tierName(value: number): string {
  return TIER_NAMES[Math.max(0, Math.min(2, value - 1))];
}

export const SocialModal: React.FC = () => {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState<'review' | 'postcards'>('review');
  const currentCafeName = gameStore.cafeName;
  const [nameInput, setNameInput] = useState(currentCafeName);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rack, setRack] = useState<StoredPostcard[]>(loadRack);

  const makePostcard = (name: string): PostcardData => {
    const recipe = RECIPES.find(r => r.id === gameStore.dailySpecialRecipeId);
    return {
      n: name,
      d: gameStore.day,
      l: gameStore.level,
      r: Math.round(gameStore.reputationStars * 10) / 10,
      c: gameStore.coins,
      ds: gameStore.stats.dishesServed,
      sp: recipe?.name ?? "Chef's special",
      tier: gameStore.restaurantTier,
      b: gameStore.buildings.length,
      st: gameStore.staff.length
    };
  };

  // A postcard is a snapshot: keep its summary stable while the simulation
  // continues in the background. Saving a new café name refreshes it.
  const [cardSnapshot, setCardSnapshot] = useState<PostcardData>(() =>
    makePostcard(currentCafeName)
  );

  useEffect(() => {
    const unsubscribe = gameStore.subscribe(() => setTick(t => t + 1));
    return unsubscribe;
  }, []);

  const specialRecipe = RECIPES.find(r => r.id === gameStore.dailySpecialRecipeId);
  const specialName = specialRecipe?.name ?? "the chef's daily special";
  const weatherLabel = `${gameStore.weather.charAt(0).toUpperCase()}${gameStore.weather.slice(1)}`;
  const snapshot: PiazzaSnapshot = {
    cafeName: currentCafeName,
    day: gameStore.day,
    level: gameStore.level,
    reputation: gameStore.reputationStars,
    restaurantTier: gameStore.restaurantTier,
    coins: gameStore.coins,
    dailySpecial: specialName,
    staffCount: gameStore.staff.length,
    buildingCount: gameStore.buildings.length,
    dishesServed: gameStore.stats.dishesServed,
    weather: gameStore.weather
  };

  const cacheKey = `${snapshot.day}:${snapshot.cafeName.toLowerCase()}:${snapshot.dailySpecial}`;
  const [postState, setPostState] = useState<{ key: string; post: PiazzaPost | null }>(() => ({
    key: cacheKey,
    post: readCachedPiazzaPost(snapshot)
  }));
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const requestCounter = useRef(0);

  useEffect(() => {
    return () => {
      requestCounter.current += 1;
    };
  }, []);

  const post = postState.key === cacheKey ? postState.post : null;
  const nameDirty = nameInput.trim() !== currentCafeName;

  const myCard = cardSnapshot;
  const myCode = encodePostcard(myCard);

  const close = () => gameStore.closeModal();

  const handleSaveName = () => {
    if (!nameInput.trim() || !nameDirty) return;
    if (gameStore.setCafeName(nameInput)) {
      setNameInput(gameStore.cafeName);
      setCardSnapshot(makePostcard(gameStore.cafeName));
      setNameSaved(true);
      setNotice(null);
      window.setTimeout(() => setNameSaved(false), 2200);
    }
  };

  const handleGenerate = async () => {
    if (loading) return;
    const ticket = ++requestCounter.current;
    const requestedKey = cacheKey;
    setLoading(true);
    setNotice(null);

    try {
      const generated = await generatePiazzaPost(snapshot);
      if (ticket === requestCounter.current && requestedKey === cacheKey) {
        setPostState({ key: requestedKey, post: generated });
      }
    } catch {
      if (ticket === requestCounter.current && requestedKey === cacheKey) {
        const fallback = createLocalPiazzaPost(snapshot);
        cachePiazzaPost(snapshot, fallback);
        setPostState({ key: requestedKey, post: fallback });
        setNotice('The online critic is unavailable right now. A local edition is ready below, and you can try the online review again later.');
      }
    } finally {
      if (ticket === requestCounter.current) setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    let success = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(myCode);
        success = true;
      }
    } catch {
      success = false;
    }
    if (!success) success = fallbackCopy(myCode);
    setCopied(success);
    setCopyFailed(!success);
    if (success) {
      window.setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleImport = () => {
    const card = decodePostcard(importCode);
    if (!card) {
      setImportMessage({
        type: 'error',
        text: 'That postcard code could not be read. Check that the whole SSPOST1. code was copied.'
      });
      return;
    }

    const trimmedCode = importCode.trim();
    const entry: StoredPostcard = {
      card,
      code: trimmedCode,
      importedAt: Date.now()
    };
    const nextRack = [entry, ...rack.filter(item => item.code !== trimmedCode)].slice(0, 8);
    setRack(nextRack);
    persistRack(nextRack);
    setImportCode('');
    setImportMessage({
      type: 'success',
      text: `${card.n} is now pinned to your postcard rack.`
    });
  };

  const removePostcard = (entry: StoredPostcard) => {
    const nextRack = rack.filter(item => item !== entry);
    setRack(nextRack);
    persistRack(nextRack);
  };

  const clearRack = () => {
    if (!window.confirm('Clear every postcard from your local rack?')) return;
    setRack([]);
    persistRack([]);
    setImportMessage(null);
  };

  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="glass-panel modal-content piazza-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 850, padding: '22px 25px', gap: 14 }}
      >
        <div className="modal-header" style={{ paddingBottom: 10 }}>
          <div>
            <div className="modal-title" style={{ fontSize: '1.35rem' }}>
              <span style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #7b2d8b, #c77dff)',
                boxShadow: '0 4px 16px rgba(199,125,255,0.25)'
              }}>
                <Newspaper size={20} color="#fff" />
              </span>
              <span>Piazza Post</span>
            </div>
            <div className="piazza-subtitle">
              A slow social corner for your café — reviews and postcards shared asynchronously.
              There is no live world or real-time multiplayer.
            </div>
          </div>
          <button className="modal-close-btn" onClick={close} aria-label="Close Piazza Post">
            <X size={20} />
          </button>
        </div>

        <div className="piazza-tabs">
          <button
            className={`piazza-tab ${tab === 'review' ? 'active' : ''}`}
            onClick={() => setTab('review')}
          >
            <Newspaper size={15} />
            Critic&apos;s Review
          </button>
          <button
            className={`piazza-tab ${tab === 'postcards' ? 'active' : ''}`}
            onClick={() => setTab('postcards')}
          >
            <Mail size={15} />
            Postcard Rack
            {rack.length > 0 && <span className="piazza-tab-count">{rack.length}</span>}
          </button>
        </div>

        {tab === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '61vh', overflowY: 'auto', paddingRight: 3 }}>
            <div className="piazza-name-panel">
              <div style={{ minWidth: 0 }}>
                <div className="piazza-label">Your café name</div>
                <div style={{ fontSize: '0.68rem', color: '#8e9aa7', marginTop: 2 }}>
                  Used on reviews and shared postcards.
                </div>
              </div>
              <div className="piazza-name-controls">
                <input
                  className="piazza-name-input"
                  value={nameInput}
                  maxLength={28}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveName();
                  }}
                  placeholder="Name your café"
                  aria-label="Café name"
                />
                <button
                  className={`glass-button ${nameDirty && nameInput.trim() ? 'btn-primary' : ''}`}
                  onClick={handleSaveName}
                  disabled={!nameDirty || !nameInput.trim()}
                  style={{
                    padding: '7px 12px',
                    fontSize: '0.74rem',
                    opacity: nameDirty && nameInput.trim() ? 1 : 0.5,
                    cursor: nameDirty && nameInput.trim() ? 'pointer' : 'not-allowed',
                    flexShrink: 0
                  }}
                >
                  {nameSaved ? <><Check size={13} /> Saved</> : 'Save name'}
                </button>
              </div>
            </div>

            <div className="piazza-snapshot-row">
              <span><Star size={12} color="#ffd166" /> {snapshot.reputation.toFixed(1)} rep</span>
              <span><ChefHat size={12} color="#f4a261" /> Lv {snapshot.level} · {tierName(snapshot.restaurantTier)}</span>
              <span><Sparkles size={12} color="#c77dff" /> {specialName}</span>
              <span><Coins size={12} color="#e9c46a" /> {snapshot.coins.toLocaleString()} coins</span>
              <span><MapPin size={12} color="#60a5fa" /> {snapshot.weather}</span>
            </div>

            <div className={`piazza-critic-card ${loading ? 'loading' : ''}`}>
              <div className="piazza-critic-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="piazza-critic-mark">NR</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>Nonna Rosa&apos;s Piazza Critic</div>
                    <div style={{ fontSize: '0.66rem', color: '#8e9aa7' }}>
                      Day {snapshot.day} edition · {weatherLabel}
                    </div>
                  </div>
                </div>
                {post && (
                  <span className={`piazza-source-badge ${post.source === 'ai' ? 'online' : 'local'}`}>
                    {post.source === 'ai' ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {post.source === 'ai' ? 'AI · Gemini' : 'Local edition'}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="piazza-loading">
                  <Loader2 size={24} className="spin" color="#c77dff" />
                  <div>
                    <div style={{ color: '#e9d5ff', fontWeight: 700, fontSize: '0.86rem' }}>Nonna Rosa is sharpening her pencil…</div>
                    <div style={{ color: '#8e9aa7', fontSize: '0.7rem', marginTop: 3 }}>
                      One optional online request is on its way. Local reviews still work if it fails.
                    </div>
                  </div>
                </div>
              ) : post ? (
                <>
                  <div className="piazza-quote">&ldquo;</div>
                  <p className="piazza-review-text">{post.text}</p>
                  <div className="piazza-critic-footer">
                    <span>
                      {post.source === 'ai' ? 'Generated online and cached for today' : 'Written locally · no network needed'}
                      {post.createdAt ? ` · ${formatTime(post.createdAt)}` : ''}
                    </span>
                    <button
                      className="glass-button"
                      onClick={handleGenerate}
                      style={{ padding: '6px 10px', fontSize: '0.72rem', flexShrink: 0 }}
                    >
                      <RefreshCw size={12} />
                      {post.source === 'ai' ? 'New review' : 'Try online again'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="piazza-empty">
                  <div className="piazza-empty-icon">✒️</div>
                  <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                    The critic&apos;s chair is still empty.
                  </div>
                  <p style={{ maxWidth: 470, color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.5 }}>
                    Ask Nonna Rosa for a fresh two-sentence review of your café. This optional feature sends
                    your café name and summary to a public Gemini relay only when you press the button.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={handleGenerate}
                    style={{
                      padding: '9px 15px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.25)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={14} />
                    Ask the Critic
                  </button>
                  <div style={{ fontSize: '0.64rem', color: '#6f7b87' }}>
                    No request is made automatically. A local review appears if the service is down.
                  </div>
                </div>
              )}

              {notice && (
                <div className="piazza-notice">
                  <WifiOff size={13} />
                  <span>{notice}</span>
                </div>
              )}

              {!post && !loading && (
                <div style={{ fontSize: '0.64rem', color: '#6f7b87', textAlign: 'center', marginTop: 2 }}>
                  AI reviews are optional and cached by day, café name, and daily special.
                </div>
              )}
            </div>

            <div className="piazza-disclaimer">
              <strong>Asynchronous social, not multiplayer.</strong> Reviews and postcards are generated
              locally or on request; no café state, orders, or economy are shared with other players.
            </div>
          </div>
        )}

        {tab === 'postcards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, maxHeight: '61vh', overflowY: 'auto', paddingRight: 3 }}>
            <div className="piazza-postcard-intro">
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem' }}>A postcard from your piazza</div>
                <div style={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.45, marginTop: 3 }}>
                  Copy this code and send it to a friend. They can paste it into their own game to pin
                  your café to their postcard rack. Nothing updates live — it is a snapshot, like a real postcard.
                </div>
              </div>
              <div style={{ fontSize: '3rem', lineHeight: 1, opacity: 0.75 }}>📮</div>
            </div>

            <div className="piazza-grid">
              <div className="piazza-panel">
                <div className="piazza-panel-title">
                  <Send size={14} color="#c77dff" />
                  Share your café
                </div>
                <textarea
                  className="piazza-code"
                  value={myCode}
                  readOnly
                  rows={5}
                  onFocus={e => e.currentTarget.select()}
                  aria-label="Your café postcard code"
                />
                <button
                  className={`glass-button ${copied ? 'btn-success' : ''}`}
                  onClick={handleCopyCode}
                  style={{ width: '100%', marginTop: 8, padding: '8px 12px', fontSize: '0.77rem' }}
                >
                  {copied ? <><Check size={14} /> Copied to clipboard</> : <><Copy size={14} /> Copy postcard code</>}
                </button>
                {copyFailed && (
                  <div style={{ color: '#fca5a5', fontSize: '0.68rem', marginTop: 5 }}>
                    Clipboard access was blocked. Select the code above and copy it manually.
                  </div>
                )}
                <div style={{ color: '#7f8c99', fontSize: '0.66rem', marginTop: 6, lineHeight: 1.4 }}>
                  Includes: name, day, level, reputation, tier, coins, dishes served, daily special,
                  structures, and staff. No save data or personal information.
                </div>
              </div>

              <div className="piazza-panel">
                <div className="piazza-panel-title">
                  <Upload size={14} color="#93c5fd" />
                  Pin a friend&apos;s postcard
                </div>
                <textarea
                  className="piazza-code"
                  value={importCode}
                  onChange={e => {
                    setImportCode(e.target.value);
                    setImportMessage(null);
                  }}
                  rows={5}
                  placeholder="Paste an SSPOST1.… code here"
                  aria-label="Friend postcard code"
                />
                <button
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={!importCode.trim()}
                  style={{
                    width: '100%',
                    marginTop: 8,
                    padding: '8px 12px',
                    borderRadius: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    fontSize: '0.77rem',
                    fontWeight: 800,
                    cursor: importCode.trim() ? 'pointer' : 'not-allowed',
                    opacity: importCode.trim() ? 1 : 0.48
                  }}
                >
                  <Send size={14} />
                  Pin to my rack
                </button>
                {importMessage && (
                  <div className={`piazza-import-message ${importMessage.type}`}>
                    {importMessage.text}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                <div className="piazza-panel-title" style={{ margin: 0 }}>
                  <Mail size={14} color="#ffd166" />
                  Postcard rack
                  <span style={{ color: '#7f8c99', fontWeight: 500 }}>({rack.length}/8)</span>
                </div>
                {rack.length > 0 && (
                  <button
                    onClick={clearRack}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#7f8c99',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear rack
                  </button>
                )}
              </div>

              {rack.length === 0 ? (
                <div className="piazza-rack-empty">
                  <div style={{ fontSize: '2rem', marginBottom: 6 }}>🗂️</div>
                  <div style={{ color: '#b8c3ce', fontWeight: 700, fontSize: '0.82rem' }}>Your rack is waiting for its first postcard.</div>
                  <div style={{ color: '#7f8c99', fontSize: '0.7rem', marginTop: 3 }}>
                    Paste a friend&apos;s code above, or share yours and ask them to send one back.
                  </div>
                </div>
              ) : (
                <div className="piazza-rack">
                  {rack.map(entry => (
                    <article className="piazza-friend-card" key={`${entry.code}-${entry.importedAt}`}>
                      <button
                        className="piazza-friend-remove"
                        onClick={() => removePostcard(entry)}
                        title="Remove postcard"
                        aria-label={`Remove ${entry.card.n} postcard`}
                      >
                        <X size={11} />
                      </button>
                      <div className="piazza-friend-stamp">✉</div>
                      <div style={{ fontSize: '0.68rem', color: '#8e9aa7', letterSpacing: 0.4, textTransform: 'uppercase', fontWeight: 800 }}>
                        {tierName(entry.card.tier)}
                      </div>
                      <div style={{ fontWeight: 900, color: '#fff', fontSize: '1rem', marginTop: 1, paddingRight: 16 }}>
                        {entry.card.n}
                      </div>
                      <div style={{ color: '#c47dff', fontSize: '0.7rem', marginTop: 1 }}>
                        Day {entry.card.d} · Lv {entry.card.l} · ⭐ {entry.card.r.toFixed(1)}
                      </div>
                      <div className="piazza-friend-special">
                        <Sparkles size={10} />
                        {entry.card.sp}
                      </div>
                      <div className="piazza-friend-stats">
                        <span><Coins size={10} /> {entry.card.c.toLocaleString()}</span>
                        <span><ChefHat size={10} /> {entry.card.ds.toLocaleString()} dishes</span>
                        <span>🏗️ {entry.card.b}</span>
                        <span>👥 {entry.card.st}</span>
                      </div>
                      <div style={{ color: '#6f7b87', fontSize: '0.62rem', marginTop: 1 }}>
                        Pinned {new Date(entry.importedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="piazza-disclaimer">
              <strong>Postcards are snapshots.</strong> Codes are validated locally and stored only in this browser.
              Importing a card never changes your save, economy, or live café.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
