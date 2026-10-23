import React, { useState, useEffect } from 'react';
import { Package, X, ShoppingBag } from 'lucide-react';
import { gameStore } from '../engine/GameStore';

export const InventoryModal: React.FC = () => {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'crops' | 'kitchen' | 'seeds'>('all');

  useEffect(() => {
    return gameStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const inventory = gameStore.inventory;

  const itemDetails: Record<string, { name: string; icon: string; category: 'crops' | 'kitchen' | 'seeds'; sellValue?: number; description: string }> = {
    // Crops
    tomato: { name: 'San Marzano Tomato', icon: '🍅', category: 'crops', sellValue: 4, description: 'Plump Tuscan heirloom tomato. Key for pizza sauce.' },
    basil: { name: 'Genovese Basil', icon: '🌿', category: 'crops', sellValue: 3, description: 'Fragrant sweet herbal leaves for Neapolitan dishes.' },
    bell_pepper: { name: 'Sweet Bell Pepper', icon: '🫑', category: 'crops', sellValue: 6, description: 'Crisp and colorful garden pepper.' },
    mushroom: { name: 'Cremini Mushroom', icon: '🍄', category: 'crops', sellValue: 7, description: 'Earthy wood-loving mushroom.' },
    wheat: { name: 'Golden Durum Wheat', icon: '🌾', category: 'crops', sellValue: 3, description: 'Grain harvested to mill pizza flour and dough.' },

    // Kitchen Ingredients
    dough: { name: 'Fermented Pizza Dough', icon: '🍞', category: 'kitchen', description: 'Slow-fermented dough ball, ready for stretching.' },
    tomato_sauce: { name: 'Crushed Tomato Sauce', icon: '🥫', category: 'kitchen', description: 'Slow-simmered oregano and garlic tomato sauce.' },
    mozzarella: { name: 'Fior di Latte Mozzarella', icon: '🧀', category: 'kitchen', description: 'Creamy fresh artisan cheese for bubbly melt.' },
    pepperoni: { name: 'Artisan Pepperoni Slices', icon: '🥩', category: 'kitchen', description: 'Dry-cured spicy sausage rounds.' },

    // Seeds
    seed_tomato: { name: 'Tomato Seeds', icon: '🌱', category: 'seeds', description: 'Plant on tilled soil to grow tomatoes.' },
    seed_basil: { name: 'Basil Seeds', icon: '🌱', category: 'seeds', description: 'Fast-growing aromatic herb seeds.' },
    seed_bell_pepper: { name: 'Bell Pepper Seeds', icon: '🌱', category: 'seeds', description: 'Sweet pepper seeds suited for sunny soil.' },
    seed_mushroom: { name: 'Mushroom Spores', icon: '🍄', category: 'seeds', description: 'Moisture-loving spores that thrive in rainy weather.' },
    seed_wheat: { name: 'Wheat Seeds', icon: '🌾', category: 'seeds', description: 'Hardy grain seeds with generous harvest yields.' },
  };

  const inventoryEntries = Object.entries(inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({
      id,
      qty,
      ...(itemDetails[id] || { name: id.replace('_', ' '), icon: '📦', category: 'kitchen' as const, description: 'Kitchen ingredient' })
    }));

  const filteredItems = inventoryEntries.filter(item => {
    if (activeTab === 'all') return true;
    return item.category === activeTab;
  });

  const handleSellOne = (id: string) => {
    gameStore.sellCrop(id, 1);
  };

  const handleSellAll = (id: string, qty: number) => {
    gameStore.sellCrop(id, qty);
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div 
        className="modal-panel glass-panel" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 840, width: '92%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #e76f51, #b95328)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={24} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                Pantry & Storage
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Manage your fresh produce, prepared kitchen goods, and agricultural seeds.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              className="glass-panel glass-button"
              onClick={() => gameStore.openModal('shop')}
              style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ShoppingBag size={15} color="#2a9d8f" />
              <span>Buy Seeds</span>
            </button>

            <button 
              className="glass-button" 
              onClick={() => gameStore.closeModal()}
              style={{ width: 36, height: 36, padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { id: 'all', label: 'All Items' },
            { id: 'crops', label: 'Fresh Harvest' },
            { id: 'kitchen', label: 'Kitchen & Dairy' },
            { id: 'seeds', label: 'Seeds' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="glass-button"
              style={{
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: '0.82rem',
                fontWeight: activeTab === tab.id ? 800 : 500,
                background: activeTab === tab.id ? 'linear-gradient(135deg, #d97746, #b95328)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : '#cbd5e1',
                border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.06)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
          overflowY: 'auto',
          flex: 1,
          paddingRight: 4
        }}>
          {filteredItems.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: 48,
              textAlign: 'center',
              color: '#64748b',
              fontSize: '0.95rem'
            }}>
              No items in this category yet. Visit the garden or market!
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="glass-panel"
                style={{
                  padding: 12,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.8rem' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>
                          {item.name}
                        </div>
                        <span style={{
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          color: item.category === 'crops' ? '#4ade80' : (item.category === 'seeds' ? '#fde047' : '#60a5fa'),
                          letterSpacing: '0.4px'
                        }}>
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      padding: '3px 10px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      color: '#ffd166'
                    }}>
                      ×{item.qty}
                    </div>
                  </div>

                  <p style={{ margin: '4px 0 10px 0', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.3 }}>
                    {item.description}
                  </p>
                </div>

                {/* Sell Action for fresh crops */}
                {item.category === 'crops' && item.sellValue && (
                  <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 6
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                      Sell: <span style={{ color: '#ffd166', fontWeight: 700 }}>🪙 {item.sellValue} ea</span>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleSellOne(item.id)}
                        className="glass-button"
                        style={{ padding: '3px 8px', fontSize: '0.72rem', borderRadius: 6 }}
                        title="Sell 1 to local market"
                      >
                        Sell 1
                      </button>
                      <button
                        onClick={() => handleSellAll(item.id, item.qty)}
                        className="glass-button"
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          borderRadius: 6,
                          color: '#ffd166',
                          borderColor: 'rgba(233, 196, 106, 0.3)'
                        }}
                        title={`Sell all ${item.qty} items`}
                      >
                        Sell All (+🪙 {item.sellValue * item.qty})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
