import React, { useEffect, useState } from 'react';
import { X, BookOpen, Lock, Star, Sparkles, Check } from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { RECIPES, INGREDIENT_ITEMS } from '../data/recipes';

export const RecipeBookModal: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return gameStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const special = RECIPES.find(r => r.id === gameStore.dailySpecialRecipeId) ?? null;
  const chosenToday = gameStore.dailySpecialChosenDay === gameStore.day;
  const bonusPercent = Math.round(gameStore.DAILY_SPECIAL_PRICE_BONUS * 100);

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={26} color="#e9c46a" />
            <span>Master Cookbook &amp; Recipes</span>
          </div>
          <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
            <X size={20} />
          </button>
        </div>

        {/* Chef's Daily Special */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '13px 15px',
          borderRadius: 15,
          border: '1px solid rgba(233, 196, 106, 0.33)',
          background: 'linear-gradient(135deg, rgba(233,196,106,0.13), rgba(217,119,70,0.07), rgba(31,36,33,0.25))'
        }}>
          <div style={{
            position: 'absolute',
            right: -20,
            top: -25,
            width: 110,
            height: 110,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(233,196,106,0.2), transparent 68%)',
            pointerEvents: 'none'
          }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #e9c46a, #d97746)',
              boxShadow: '0 4px 16px rgba(233,196,106,0.25)'
            }}>
              <Star size={21} color="#2d2a1c" fill="#2d2a1c" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.67rem',
                  fontWeight: 900,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  color: '#ffd166'
                }}>
                  Chef&apos;s Daily Special
                </span>
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: chosenToday ? '#a7f3d0' : '#fde68a',
                  background: chosenToday ? 'rgba(42,157,143,0.18)' : 'rgba(233,196,106,0.12)',
                  border: chosenToday ? '1px solid rgba(42,157,143,0.28)' : '1px solid rgba(233,196,106,0.22)',
                  padding: '2px 7px',
                  borderRadius: 20
                }}>
                  {chosenToday ? <><Check size={9} /> Locked in for today</> : 'Chef\'s pick · 1 change available'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.3rem' }}>{special?.icon ?? '⭐'}</span>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                  {special?.name ?? 'Choose a special'}
                </span>
                <span style={{ fontSize: '0.73rem', color: '#fde68a', fontWeight: 700 }}>
                  +{bonusPercent}% sale price · 3× order chance
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#b8c3ce', marginTop: 3, lineHeight: 1.4 }}>
                The kitchen picks one special each morning. Choose any unlocked recipe once today to replace it and lock in your pick until tomorrow.
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '46vh', overflowY: 'auto', paddingRight: 2 }}>
          {RECIPES.map(recipe => {
            const isUnlocked = gameStore.unlockedRecipes.includes(recipe.id);
            const isSpecial = gameStore.dailySpecialRecipeId === recipe.id;
            const specialPrice = Math.round(recipe.basePrice * (1 + gameStore.DAILY_SPECIAL_PRICE_BONUS));
            const canChoose = isUnlocked && !chosenToday && !isSpecial;

            return (
              <div
                key={recipe.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: isSpecial
                    ? 'linear-gradient(135deg, rgba(233,196,106,0.12), rgba(255,255,255,0.035))'
                    : (isUnlocked ? 'rgba(255, 255, 255, 0.045)' : 'rgba(0, 0, 0, 0.25)'),
                  border: isSpecial
                    ? '1px solid rgba(233,196,106,0.4)'
                    : (isUnlocked ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.05)'),
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  opacity: isUnlocked ? 1 : 0.5
                }}
              >
                <div style={{ display: 'flex', gap: 11, minWidth: 0 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 11,
                    background: isSpecial ? 'rgba(233,196,106,0.2)' : 'rgba(217, 119, 70, 0.17)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.45rem',
                    flexShrink: 0
                  }}>
                    {recipe.icon}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h4 style={{ fontWeight: 800, fontSize: '0.93rem', color: '#fff' }}>
                        {recipe.name}
                      </h4>
                      {isSpecial && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          background: 'rgba(233,196,106,0.18)',
                          border: '1px solid rgba(233,196,106,0.28)',
                          color: '#ffd166',
                          padding: '2px 6px',
                          borderRadius: 20
                        }}>
                          <Star size={9} fill="#ffd166" /> Special
                        </span>
                      )}
                      {!isUnlocked && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: '0.64rem',
                          background: 'rgba(0,0,0,0.4)',
                          padding: '2px 7px',
                          borderRadius: 6,
                          color: '#f87171'
                        }}>
                          <Lock size={9} /> Lvl {recipe.unlockLevel}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: 2, lineHeight: 1.35 }}>
                      {recipe.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {recipe.ingredients.map(ing => {
                        const info = INGREDIENT_ITEMS[ing.itemId];
                        return (
                          <span
                            key={ing.itemId}
                            style={{
                              fontSize: '0.65rem',
                              background: 'rgba(255, 255, 255, 0.07)',
                              padding: '2px 6px',
                              borderRadius: 5,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3
                            }}
                          >
                            <span>{info?.icon || '📦'}</span>
                            <span>{info?.name || ing.itemId} ×{ing.qty}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 100 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: isSpecial ? '#ffd166' : '#e9c46a' }}>
                    🪙 {isSpecial ? specialPrice : recipe.basePrice}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                    {isSpecial ? `Base ${recipe.basePrice} +${bonusPercent}%` : 'Base sell price'}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#4ade80', marginTop: 2 }}>
                    {recipe.idealBakeSeconds}s ideal bake
                  </div>

                  {isUnlocked && (
                    <button
                      onClick={() => gameStore.setDailySpecial(recipe.id)}
                      disabled={!canChoose}
                      style={{
                        marginTop: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        padding: '5px 8px',
                        borderRadius: 7,
                        border: isSpecial
                          ? '1px solid rgba(233,196,106,0.35)'
                          : '1px solid rgba(255,255,255,0.12)',
                        background: isSpecial
                          ? 'rgba(233,196,106,0.13)'
                          : (canChoose ? 'rgba(233,196,106,0.08)' : 'rgba(255,255,255,0.035)'),
                        color: isSpecial ? '#ffd166' : (canChoose ? '#fde68a' : '#7f8c99'),
                        fontSize: '0.64rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-family)',
                        cursor: canChoose ? 'pointer' : 'not-allowed',
                        opacity: canChoose ? 1 : 0.72,
                        whiteSpace: 'nowrap'
                      }}
                      title={chosenToday && !isSpecial ? 'You already chose today\'s special' : 'Feature this recipe today'}
                    >
                      {isSpecial ? <><Star size={10} fill="#ffd166" /> Today&apos;s Special</> : (chosenToday ? 'Chosen today' : <><Sparkles size={10} /> Make Special</>)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
