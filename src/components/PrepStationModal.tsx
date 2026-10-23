import React, { useState } from 'react';
import { X, ChefHat, AlertCircle, ShoppingCart } from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { RECIPES, INGREDIENT_ITEMS } from '../data/recipes';
import { audioManager } from '../engine/AudioManager';

export const PrepStationModal: React.FC = () => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    gameStore.unlockedRecipes[0] || 'margherita_pizza'
  );

  const recipe = RECIPES.find(r => r.id === selectedRecipeId) || RECIPES[0];
  const canCraft = gameStore.canCraftRecipe(recipe.id);

  const handleAssemble = () => {
    audioManager.init();
    if (gameStore.prepPizza(recipe.id)) {
      // Close prep and open oven automatically for seamless cooking flow!
      gameStore.closeModal();
      gameStore.openModal('oven');
    }
  };

  const handleQuickBuy = (itemId: string) => {
    const itemInfo = INGREDIENT_ITEMS[itemId];
    if (!itemInfo) return;
    gameStore.buyItem(itemId, 2, itemInfo.buyPrice);
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <ChefHat size={26} color="#d97746" />
            <span>Kitchen Prep Counter</span>
          </div>
          <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
          {/* Left Column: Recipe Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
              Select Recipe to Prep:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
              {RECIPES.map(rec => {
                const isUnlocked = gameStore.unlockedRecipes.includes(rec.id);
                const isSelected = rec.id === selectedRecipeId;
                const canMake = gameStore.canCraftRecipe(rec.id);

                return (
                  <div
                    key={rec.id}
                    onClick={() => isUnlocked && setSelectedRecipeId(rec.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(217, 119, 70, 0.35), rgba(31, 36, 33, 0.9))' 
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '1.5px solid #d97746' : '1px solid rgba(255, 255, 255, 0.1)',
                      opacity: isUnlocked ? 1 : 0.5,
                      cursor: isUnlocked ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.5rem' }}>{rec.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isSelected ? '#fff' : '#e2e8f0' }}>
                          {rec.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#e9c46a', fontWeight: 600 }}>
                          🪙 {rec.basePrice} base
                        </div>
                      </div>
                    </div>

                    {!isUnlocked ? (
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 6 }}>
                        Lvl {rec.unlockLevel}
                      </span>
                    ) : canMake ? (
                      <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>✓ Ready</span>
                    ) : (
                      <span style={{ color: '#f87171', fontSize: '0.75rem' }}>Missing</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Recipe Details & Pizza Board */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>{recipe.name}</h3>
                <span style={{ fontSize: '0.8rem', background: '#2a9d8f', color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                  🪙 {recipe.basePrice}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4, lineHeight: 1.4 }}>
                {recipe.description}
              </p>
            </div>

            {/* Ingredients Checklist */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
                Required Fresh Ingredients:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recipe.ingredients.map(req => {
                  const item = INGREDIENT_ITEMS[req.itemId];
                  const hasQty = gameStore.inventory[req.itemId] || 0;
                  const hasEnough = hasQty >= req.qty;

                  return (
                    <div
                      key={req.itemId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: hasEnough ? 'rgba(42, 157, 143, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: hasEnough ? '1px solid rgba(42, 157, 143, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{item?.icon || '📦'}</span>
                        <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500 }}>
                          {item?.name || req.itemId}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: hasEnough ? '#4ade80' : '#f87171'
                        }}>
                          {hasQty}/{req.qty}
                        </span>

                        {!hasEnough && item && (
                          <button
                            onClick={() => handleQuickBuy(req.itemId)}
                            style={{
                              background: '#d97746',
                              border: 'none',
                              color: '#fff',
                              borderRadius: 6,
                              padding: '2px 6px',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}
                            title={`Buy 2x for 🪙 ${item.buyPrice * 2}`}
                          >
                            <ShoppingCart size={11} /> +Buy
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Assemble Action Button */}
            <div>
              <button
                className={`glass-button ${canCraft ? 'btn-primary' : ''}`}
                onClick={handleAssemble}
                disabled={!canCraft}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  fontSize: '0.98rem',
                  opacity: canCraft ? 1 : 0.45,
                  cursor: canCraft ? 'pointer' : 'not-allowed'
                }}
              >
                {canCraft ? (
                  <>
                    <ChefHat size={18} />
                    <span>Assemble & Load into Oven</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} />
                    <span>Missing Ingredients in Pantry</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
