import React, { useState, useEffect } from 'react';
import { 
  Coins, Star, Sun, CloudRain, Cloud, CloudLightning, 
  BookOpen, Hammer, ShoppingBag, Trophy, MapPin, 
  Volume2, VolumeX, Settings, Users, Package, Target,
  FlaskConical, Medal, Coffee, MessageCircle
} from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { audioManager } from '../engine/AudioManager';

export const HUD: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return gameStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const coins = gameStore.coins;
  const level = gameStore.level;
  const xp = gameStore.xp;
  const xpNeeded = level * 100;
  const xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));
  const reputation = gameStore.reputationStars;
  const day = gameStore.day;
  const weather = gameStore.weather;
  const proximityTarget = gameStore.proximityTarget;
  const isMuted = audioManager.getMuted();
  const coffeeReady = gameStore.espressoCooldown <= 0;
  const coffeeStatus = coffeeReady
    ? `Espresso ready · 🪙 ${gameStore.ESPRESSO_COST}`
    : `Espresso machine heating · ${Math.ceil(gameStore.espressoCooldown)}s`;
  const proximitySublabel =
    proximityTarget?.type === 'station_cafe' && !coffeeReady
      ? `Machine heating · ready in ${Math.ceil(gameStore.espressoCooldown)}s`
      : proximityTarget?.sublabel;

  // Convert game seconds (0 to 720) to clock time (6:00 AM to 6:00 AM)
  const hourFloat = (gameStore.timeOfDaySeconds / 720) * 24;
  const hour = Math.floor(hourFloat);
  const minute = Math.floor((hourFloat - hour) * 60);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const timeStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;

  const getWeatherIcon = () => {
    switch (weather) {
      case 'clear': return <Sun size={18} className="text-amber-400" color="#f59e0b" />;
      case 'cloudy': return <Cloud size={18} className="text-gray-300" color="#cbd5e1" />;
      case 'rain': return <CloudRain size={18} className="text-blue-400" color="#60a5fa" />;
      case 'storm': return <CloudLightning size={18} className="text-purple-400" color="#c084fc" />;
    }
  };

  const toggleSound = () => {
    audioManager.init();
    audioManager.setMuted(!isMuted);
    setTick(t => t + 1);
  };

  return (
    <>
      {/* Top Floating HUD Bar */}
      <div className="hud-topbar" style={{
        position: 'absolute',
        top: 14,
        left: 14,
        right: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 20,
        pointerEvents: 'none'
      }}>
        {/* Left: Brand, Day, Time, Weather */}
        <div className="glass-panel hud-brand-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '8px 18px',
          pointerEvents: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1.4rem' }}>🍕</span>
            <div>
              <div
                title={gameStore.cafeName}
                style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  letterSpacing: '-0.3px',
                  color: '#fff',
                  maxWidth: 168,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {gameStore.cafeName}
              </div>
              <div className="hud-brand-tagline" style={{ fontSize: '0.72rem', color: '#aaa' }}>Tuscan Pizzeria & Farm</div>
            </div>
          </div>

          <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.15)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="hud-day" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffd166', whiteSpace: 'nowrap' }}>
              Day {day}
            </div>
            <div className="hud-clock" style={{ fontSize: '0.85rem', color: '#e2e8f0', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              {timeStr}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 12 }}>
              {getWeatherIcon()}
              <span className="hud-weather-label" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{weather}</span>
            </div>
          </div>
        </div>

        {/* Center: Level, XP, Stars */}
        <div className="glass-panel hud-level-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '8px 20px',
          pointerEvents: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              background: 'linear-gradient(135deg, #d97746, #b95328)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.82rem',
              padding: '3px 8px',
              borderRadius: 8,
              boxShadow: '0 2px 6px rgba(217, 119, 70, 0.4)'
            }}>
              LVL {level}
            </div>

            <div style={{ width: 100 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#cbd5e1', marginBottom: 3 }}>
                <span>XP</span>
                <span>{xp}/{xpNeeded}</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${xpPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2a9d8f, #e9c46a)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.15)' }} />

          {/* Reputation Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Customer Reputation Rating">
            <Star size={16} fill="#ffb703" color="#ffb703" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffb703' }}>
              {reputation.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Right: Coins Counter & Settings */}
        <div className="hud-right-group" style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto' }}>
          <div
            className="glass-panel hud-coffee"
            title={coffeeStatus}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 12px',
              border: coffeeReady ? '1px solid rgba(200, 154, 114, 0.45)' : '1px solid rgba(255,255,255,0.08)',
              opacity: coffeeReady ? 1 : 0.72
            }}
          >
            <Coffee size={17} color={coffeeReady ? '#e0b383' : '#94a3b8'} />
            <span style={{ fontWeight: 700, fontSize: '0.8rem', color: coffeeReady ? '#e8c9a4' : '#cbd5e1' }}>
              {coffeeReady ? `☕ ${gameStore.ESPRESSO_COST}` : `${Math.ceil(gameStore.espressoCooldown)}s`}
            </span>
          </div>

          <div className="glass-panel hud-coins" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            background: 'linear-gradient(135deg, rgba(233, 196, 106, 0.15), rgba(31, 36, 33, 0.9))'
          }}>
            <Coins size={20} color="#e9c46a" />
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#e9c46a', letterSpacing: '-0.3px' }}>
              {coins.toLocaleString()}
            </span>
          </div>

          <button
            className="glass-panel glass-button hud-social"
            onClick={() => gameStore.openModal('piazza')}
            style={{ width: 42, height: 42, padding: 0 }}
            title="Piazza Post — AI review & café postcards [P]"
            aria-label="Open Piazza Post reviews and café postcards"
          >
            <MessageCircle size={18} color="#c77dff" />
          </button>

          <button 
            className="glass-panel glass-button"
            onClick={toggleSound}
            style={{ width: 42, height: 42, padding: 0 }}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX size={18} color="#f87171" /> : <Volume2 size={18} color="#4ade80" />}
          </button>

          <button 
            className="glass-panel glass-button"
            onClick={() => gameStore.openModal('settings')}
            style={{ width: 42, height: 42, padding: 0 }}
            title="Settings & Save Slots"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Proximity Interaction Prompt [E] */}
      {proximityTarget && (
        <div style={{
          position: 'absolute',
          bottom: 95,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 25,
          pointerEvents: 'auto',
          animation: 'bounceSlow 2s infinite ease-in-out'
        }}>
          <button 
            className="glass-panel btn-primary"
            onClick={() => {
              audioManager.init();
              if (proximityTarget.type === 'station_prep') gameStore.openModal('prep');
              else if (proximityTarget.type === 'station_oven') gameStore.openModal('oven');
              else if (proximityTarget.type === 'station_counter') gameStore.openModal('counter');
              else if (proximityTarget.type === 'station_cafe') gameStore.brewEspresso();
              else if (proximityTarget.type === 'farm_plot' && proximityTarget.plotId !== undefined) {
                gameStore.openModal('farm', proximityTarget.plotId);
              }
            }}
            style={{
              padding: '12px 24px',
              borderRadius: 30,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              border: '2px solid rgba(255, 255, 255, 0.4)'
            }}
          >
            <span style={{
              background: '#fff',
              color: '#d97746',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: '0.85rem'
            }}>
              E
            </span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>{proximityTarget.label}</div>
              {proximitySublabel && (
                <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>{proximitySublabel}</div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Bottom Main Navigation Dock */}
      <div className="bottom-nav-dock" style={{
        position: 'absolute',
        bottom: 18,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 20,
        maxWidth: 'calc(100vw - 20px)'
      }}>
        <div className="glass-panel bottom-nav-panel" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          maxWidth: '100%',
          overflowX: 'auto'
        }}>
          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('recipes')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Recipe Cookbook [K]"
          >
            <BookOpen size={15} color="#e9c46a" />
            <span>Recipes <kbd style={{ opacity: 0.6, fontSize: '0.68rem' }}>[K]</kbd></span>
          </button>

          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('build')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Tycoon Construction [B]"
          >
            <Hammer size={15} color="#f4a261" />
            <span>Build <kbd style={{ opacity: 0.6, fontSize: '0.68rem' }}>[B]</kbd></span>
          </button>

          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('inventory')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Pantry & Inventory [I]"
          >
            <Package size={15} color="#fb923c" />
            <span>Pantry <kbd style={{ opacity: 0.6, fontSize: '0.68rem' }}>[I]</kbd></span>
          </button>

          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('staff')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Pizzeria Staff Hires"
          >
            <Users size={15} color="#4ade80" />
            <span>Staff {gameStore.staff.length > 0 && `(${gameStore.staff.length})`}</span>
          </button>

          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('shop')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Market & Seed Shop"
          >
            <ShoppingBag size={15} color="#2a9d8f" />
            <span>Market</span>
          </button>

          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('challenges')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Daily Objectives [C]"
          >
            <Target size={15} color="#f472b6" />
            <span>Goals <kbd style={{ opacity: 0.6, fontSize: '0.68rem' }}>[C]</kbd></span>
          </button>

          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('achievements')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Achievements"
          >
            <Trophy size={15} color="#ffb703" />
            <span>Trophies</span>
          </button>

          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('research')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Recipe Research Lab [R]"
          >
            <FlaskConical size={15} color="#c77dff" />
            <span>Research <kbd style={{ opacity: 0.6, fontSize: '0.68rem' }}>[R]</kbd></span>
          </button>

          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('leaderboard')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Hall of Fame [L]"
          >
            <Medal size={15} color="#ffc857" />
            <span>Scores <kbd style={{ opacity: 0.6, fontSize: '0.68rem' }}>[L]</kbd></span>
          </button>

          <button 
            className="glass-button"
            onClick={() => gameStore.openModal('map')}
            style={{ padding: '8px 12px', fontSize: '0.82rem' }}
            title="Estate Minimap [M]"
          >
            <MapPin size={15} color="#60a5fa" />
            <span>Map <kbd style={{ opacity: 0.6, fontSize: '0.68rem' }}>[M]</kbd></span>
          </button>
        </div>
      </div>

      {/* Toast Notification Container */}
      {gameStore.toast && (
        <div className="toast-container">
          <div className={`toast-pill ${gameStore.toast.type}`}>
            <div className="toast-title">{gameStore.toast.title}</div>
            <div className="toast-body">{gameStore.toast.body}</div>
          </div>
        </div>
      )}
    </>
  );
};
