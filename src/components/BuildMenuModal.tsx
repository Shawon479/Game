import React, { useMemo, useState, useEffect } from 'react';
import {
  X, Hammer, Lock, ArrowUpCircle, Sparkles, Check, Search, MapPin,
  Wand2, Move, Trash2, Coins, LayoutGrid, RotateCw
} from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { BUILDINGS } from '../data/buildings';
import { audioManager } from '../engine/AudioManager';

type BuildTab = 'catalog' | 'upgrades' | 'manage';
type BuildCategory = 'all' | 'restaurant' | 'farm' | 'decoration' | 'infrastructure';

const CATEGORY_META: Record<Exclude<BuildCategory, 'all'>, { label: string; icon: string; color: string }> = {
  restaurant: { label: 'Dining', icon: '🍽️', color: '#f4a261' },
  farm: { label: 'Farm', icon: '🌱', color: '#7ac74f' },
  decoration: { label: 'Decor', icon: '🌿', color: '#e9c46a' },
  infrastructure: { label: 'Paths', icon: '🧱', color: '#8ecae6' }
};

const TIERS = [
  {
    tierNum: 1,
    name: 'Rustic Bistro & Hearth',
    cost: 0,
    capacity: 4,
    bakingSpeed: 'Standard',
    tipBonus: '+0%',
    desc: 'Humble countryside stone pizzeria with a wood-fired hearth and cozy front counter.',
    perks: ['Capacity: 4 dining guests', 'Base tip rate', 'Standard wood hearth']
  },
  {
    tierNum: 2,
    name: 'Trattoria di Toscana',
    cost: 220,
    capacity: 6,
    bakingSpeed: '+25% faster',
    tipBonus: '+15% tips',
    desc: 'An expanded Mediterranean trattoria with charming pergola dining and an accelerated brick hearth.',
    perks: ['Capacity: 6 dining guests', '+15% customer tip bonus', 'Oven bakes +25% faster', 'Expanded patio ambiance']
  },
  {
    tierNum: 3,
    name: 'Grand Villa Pizzeria',
    cost: 480,
    capacity: 8,
    bakingSpeed: '+50% faster',
    tipBonus: '+35% tips',
    desc: 'A prestigious Tuscan culinary villa that attracts food critics and bustling crowds from Florence.',
    perks: ['Capacity: 8 dining guests', '+35% customer tip bonus', 'Oven bakes +50% faster', 'Prestigious villa ambiance']
  }
];

const TAB_META: Array<{ id: BuildTab; label: string; icon: React.ReactNode }> = [
  { id: 'catalog', label: 'Catalog', icon: <LayoutGrid size={16} /> },
  { id: 'upgrades', label: 'Upgrades', icon: <ArrowUpCircle size={16} /> },
  { id: 'manage', label: 'Manage Estate', icon: <Hammer size={16} /> }
];

export const BuildMenuModal: React.FC = () => {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState<BuildTab>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<BuildCategory>('all');
  const [query, setQuery] = useState('');
  const [confirmSell, setConfirmSell] = useState<string | null>(null);

  useEffect(() => {
    return gameStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const tier = gameStore.restaurantTier;
  const coins = gameStore.coins;
  const placedCount = gameStore.buildings.length;
  const seatCount = gameStore.getSeatingSpots().length;
  const decorCount = gameStore.buildings.filter(b => {
    const def = BUILDINGS.find(d => d.typeId === b.typeId);
    return def?.category === 'decoration';
  }).length;

  const filteredBuildings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return BUILDINGS.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = !needle ||
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        item.effect.description.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [query, selectedCategory]);

  const handlePlace = (typeId: string) => {
    audioManager.init();
    gameStore.beginPlacement(typeId);
  };

  const handleAuto = (typeId: string) => {
    audioManager.init();
    if (gameStore.autoPlaceBuilding(typeId)) {
      gameStore.closeModal();
    }
  };

  const handleUpgradeTier = () => {
    gameStore.upgradeRestaurantTier();
  };

  const openMove = (buildingId: string) => {
    audioManager.init();
    gameStore.beginMovePlacement(buildingId);
  };

  const handleSell = (buildingId: string) => {
    if (confirmSell !== buildingId) {
      setConfirmSell(buildingId);
      return;
    }
    gameStore.sellBuilding(buildingId);
    setConfirmSell(null);
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div
        className="glass-panel modal-content build-studio-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 880, padding: '22px 26px', gap: 14 }}
      >
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: 12 }}>
          <div>
            <div className="modal-title" style={{ fontSize: '1.35rem' }}>
              <span style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #d97746, #b95328)',
                boxShadow: '0 4px 16px rgba(217,119,70,0.35)'
              }}>
                <Hammer size={21} color="#fff" />
              </span>
              <span>Build &amp; Design Studio</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4, marginLeft: 48 }}>
              Shape the café grounds, then place structures directly in the world.
            </div>
          </div>
          <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
            <X size={20} />
          </button>
        </div>

        {/* Estate stats */}
        <div className="build-stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 8,
          padding: '10px 12px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.035)',
          border: '1px solid rgba(255,255,255,0.07)'
        }}>
          {[
            { label: 'Coins', value: coins.toLocaleString(), icon: <Coins size={15} color="#e9c46a" /> },
            { label: 'Structures', value: placedCount.toString(), icon: <Hammer size={15} color="#f4a261" /> },
            { label: 'Seats', value: seatCount.toString(), icon: <span style={{ fontSize: 14 }}>🪑</span> },
            { label: 'Decor', value: decorCount.toString(), icon: <span style={{ fontSize: 14 }}>🌿</span> }
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)',
                flexShrink: 0
              }}>
                {stat.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            gap: 4,
            padding: 4,
            borderRadius: 12,
            background: 'rgba(0,0,0,0.22)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {TAB_META.map(item => (
              <button
                key={item.id}
                className="glass-button"
                onClick={() => {
                  setTab(item.id);
                  setConfirmSell(null);
                }}
                style={{
                  padding: '8px 13px',
                  fontSize: '0.8rem',
                  border: tab === item.id ? '1px solid rgba(233,196,106,0.35)' : '1px solid transparent',
                  background: tab === item.id ? 'rgba(233,196,106,0.15)' : 'transparent',
                  color: tab === item.id ? '#ffd166' : '#cbd5e1'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {tab === 'catalog' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 11px',
              borderRadius: 11,
              background: 'rgba(0,0,0,0.22)',
              border: '1px solid rgba(255,255,255,0.08)',
              minWidth: 210
            }}>
              <Search size={15} color="#94a3b8" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search the catalog…"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontFamily: 'var(--font-family)',
                  fontSize: '0.8rem',
                  width: '100%'
                }}
              />
            </div>
          )}
        </div>

        {/* Catalog */}
        {tab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
              {(['all', 'restaurant', 'farm', 'decoration', 'infrastructure'] as const).map(cat => {
                const meta = cat === 'all'
                  ? { label: 'All', icon: '✨', color: '#e9c46a' }
                  : CATEGORY_META[cat];
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 10px',
                      borderRadius: 20,
                      border: active ? `1px solid ${meta.color}88` : '1px solid rgba(255,255,255,0.09)',
                      background: active ? `${meta.color}22` : 'rgba(255,255,255,0.035)',
                      color: active ? meta.color : '#aab6c3',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{meta.icon}</span>
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(238px, 1fr))',
              gap: 11,
              maxHeight: '47vh',
              overflowY: 'auto',
              paddingRight: 3,
              alignContent: 'start'
            }}>
              {filteredBuildings.map(item => {
                const isUnlocked = gameStore.level >= item.unlockLevel;
                const canAfford = coins >= item.cost;
                const countPlaced = gameStore.buildings.filter(b => b.typeId === item.typeId).length;
                const meta = CATEGORY_META[item.category];
                const disabled = !isUnlocked || !canAfford;

                return (
                  <div
                    key={item.typeId}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      padding: '13px 14px',
                      borderRadius: 14,
                      background: 'linear-gradient(155deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))',
                      border: `1px solid ${isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 10,
                      opacity: isUnlocked ? 1 : 0.66
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: `linear-gradient(90deg, transparent, ${meta.color}cc, transparent)`
                    }} />

                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.35rem',
                          background: `linear-gradient(135deg, ${meta.color}2f, rgba(255,255,255,0.04))`,
                          border: `1px solid ${meta.color}33`
                        }}>
                          {item.icon}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            color: canAfford ? '#e9c46a' : '#f87171'
                          }}>
                            🪙 {item.cost}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#7f8c99', marginTop: 1 }}>
                            {item.footprint.width}×{item.footprint.depth} · {meta.label}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', marginTop: 9, lineHeight: 1.2 }}>
                        {item.name}
                      </div>
                      <p style={{
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        marginTop: 4,
                        lineHeight: 1.38,
                        minHeight: 38
                      }}>
                        {item.description}
                      </p>

                      <div style={{
                        marginTop: 7,
                        fontSize: '0.68rem',
                        color: '#a7f3d0',
                        fontWeight: 600,
                        background: 'rgba(42, 157, 143, 0.13)',
                        border: '1px solid rgba(42, 157, 143, 0.18)',
                        padding: '4px 7px',
                        borderRadius: 7,
                        lineHeight: 1.3
                      }}>
                        ✨ {item.effect.description}
                      </div>
                    </div>

                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 7,
                        fontSize: '0.68rem',
                        color: '#8e9aa7'
                      }}>
                        <span>Owned: {countPlaced}</span>
                        {isUnlocked ? (
                          canAfford ? (
                            <span style={{ color: '#7bdba0' }}>In budget</span>
                          ) : (
                            <span style={{ color: '#f87171' }}>Need {item.cost - coins} more</span>
                          )
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Lock size={10} /> Level {item.unlockLevel}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="glass-button"
                          onClick={() => handleAuto(item.typeId)}
                          disabled={disabled}
                          title="Quick auto-place"
                          style={{
                            flex: '0 0 auto',
                            padding: '7px 9px',
                            fontSize: '0.73rem',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.4 : 0.9
                          }}
                        >
                          <Wand2 size={13} />
                          Auto
                        </button>
                        <button
                          className={`glass-panel ${disabled ? 'glass-button' : 'btn-primary'}`}
                          onClick={() => handlePlace(item.typeId)}
                          disabled={disabled}
                          style={{
                            flex: 1,
                            padding: '7px 9px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.45 : 1,
                            gap: 5
                          }}
                        >
                          {isUnlocked ? <MapPin size={13} /> : <Lock size={12} />}
                          {isUnlocked ? 'Place in world' : `Unlock Lvl ${item.unlockLevel}`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredBuildings.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '38px 20px',
                  color: '#7f8c99',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                  No structures match this search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upgrades */}
        {tab === 'upgrades' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
            maxHeight: '53vh',
            overflowY: 'auto',
            paddingRight: 4
          }}>
            {TIERS.map(t => {
              const isCurrent = tier === t.tierNum;
              const isPast = tier > t.tierNum;
              const isNext = tier + 1 === t.tierNum;
              const canAfford = coins >= t.cost;
              return (
                <div
                  key={t.tierNum}
                  className="glass-panel"
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    border: isCurrent
                      ? '1px solid #e9c46a'
                      : (isNext ? '1px solid rgba(255,255,255,0.19)' : '1px solid rgba(255,255,255,0.07)'),
                    background: isCurrent
                      ? 'linear-gradient(135deg, rgba(233,196,106,0.11), rgba(31,36,33,0.5))'
                      : 'rgba(255,255,255,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: isCurrent ? 'linear-gradient(135deg, #e9c46a, #d4a373)' : 'rgba(255,255,255,0.09)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isCurrent ? '#1f2421' : '#fff',
                        fontWeight: 900,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {t.tierNum}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.97rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          {t.name}
                          {isCurrent && (
                            <span style={{
                              background: '#e9c46a',
                              color: '#1f2421',
                              fontSize: '0.62rem',
                              fontWeight: 900,
                              padding: '2px 7px',
                              borderRadius: 10,
                              letterSpacing: 0.4
                            }}>
                              ACTIVE
                            </span>
                          )}
                          {isPast && (
                            <span style={{ color: '#4ade80', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Check size={12} /> Unlocked
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2, lineHeight: 1.35 }}>
                          {t.desc}
                        </div>
                      </div>
                    </div>

                    {isNext && (
                      <button
                        className="btn-primary"
                        onClick={handleUpgradeTier}
                        disabled={!canAfford}
                        style={{
                          padding: '8px 13px',
                          fontSize: '0.78rem',
                          borderRadius: 9,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          flexShrink: 0,
                          opacity: canAfford ? 1 : 0.5
                        }}
                      >
                        <Sparkles size={14} />
                        🪙 {t.cost}
                      </button>
                    )}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 5,
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    paddingTop: 8
                  }}>
                    {t.perks.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: '#a7f3d0' }}>
                        <Check size={11} color="#34d399" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px dashed rgba(233,196,106,0.25)',
              background: 'rgba(233,196,106,0.05)',
              color: '#b8c3ce',
              fontSize: '0.72rem',
              lineHeight: 1.4
            }}>
              💡 Restaurant upgrades raise prices, tips and oven speed. Add tables and ambiance decorations to earn more from every service.
            </div>
          </div>
        )}

        {/* Manage */}
        {tab === 'manage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '53vh', overflowY: 'auto', paddingRight: 3 }}>
            {[...gameStore.buildings]
              .sort((a, b) => a.z - b.z || a.x - b.x)
              .map(building => {
                const def = BUILDINGS.find(d => d.typeId === building.typeId);
                if (!def) return null;
                const meta = CATEGORY_META[def.category];
                const refund = gameStore.getBuildingRefund(building.buildingId);
                const confirming = confirmSell === building.buildingId;
                return (
                  <div
                    key={building.buildingId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 11px',
                      borderRadius: 12,
                      background: confirming ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.035)',
                      border: confirming ? '1px solid rgba(248,113,113,0.35)' : '1px solid rgba(255,255,255,0.07)'
                    }}
                  >
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      background: `${meta.color}1d`,
                      flexShrink: 0
                    }}>
                      {def.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.83rem',
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {def.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#7f8c99', marginTop: 1 }}>
                        {meta.label} · ({building.x.toFixed(1)}, {building.z.toFixed(1)}) · rotation {Math.round((building.rotation || 0) * 180 / Math.PI)}°
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      flexShrink: 0
                    }}>
                      {confirming && (
                        <button
                          className="glass-button"
                          onClick={() => setConfirmSell(null)}
                          style={{ padding: '5px 7px', fontSize: '0.68rem' }}
                          title="Cancel sale"
                        >
                          <X size={12} />
                        </button>
                      )}
                      <button
                        className="glass-button"
                        onClick={() => openMove(building.buildingId)}
                        style={{ padding: '6px 8px', fontSize: '0.7rem' }}
                        title="Move this structure in the world"
                      >
                        <Move size={12} />
                        Move
                      </button>
                      <button
                        onClick={() => handleSell(building.buildingId)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 8px',
                          borderRadius: 8,
                          border: confirming ? '1px solid rgba(248,113,113,0.55)' : '1px solid rgba(255,255,255,0.11)',
                          background: confirming ? 'rgba(220,38,38,0.22)' : 'rgba(255,255,255,0.05)',
                          color: confirming ? '#fecaca' : '#cbd5e1',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'var(--font-family)'
                        }}
                        title={confirming ? 'Click again to sell' : 'Sell for 50% of the build cost'}
                      >
                        <Trash2 size={12} />
                        {confirming ? `Confirm +${refund}` : `Sell +${refund}`}
                      </button>
                    </div>
                  </div>
                );
              })}

            {gameStore.buildings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#7f8c99', fontSize: '0.85rem' }}>
                The grounds are empty. Place your first structure from the catalog.
              </div>
            )}

            <div style={{
              marginTop: 2,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'rgba(96,165,250,0.06)',
              border: '1px dashed rgba(96,165,250,0.24)',
              color: '#a9bfd5',
              fontSize: '0.72rem',
              lineHeight: 1.4
            }}>
              <strong style={{ color: '#bfdbfe' }}>Move:</strong> pick a new spot in the world with the green/red footprint, rotate with <kbd>R</kbd>, then click or press <kbd>Enter</kbd>. Selling refunds 50% of the original price.
            </div>
          </div>
        )}

        {/* Footer hint */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingTop: 10,
          fontSize: '0.67rem',
          color: '#6f7b87',
          flexWrap: 'wrap'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={11} /> Click to place
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <RotateCw size={11} /> R to rotate
          </span>
          <span><kbd>Enter</kbd> confirm</span>
          <span><kbd>Esc</kbd> cancel</span>
        </div>
      </div>
    </div>
  );
};
