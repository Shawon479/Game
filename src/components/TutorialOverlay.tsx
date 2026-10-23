import React, { useEffect, useState } from 'react';
import { ChefHat, ArrowRight, SkipForward } from 'lucide-react';

import { gameStore } from '../engine/GameStore';
import { audioManager } from '../engine/AudioManager';

export const TutorialOverlay: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    return gameStore.subscribe(() => setTick(t => t + 1));
  }, []);

  if (gameStore.tutorialComplete) return null;

  const step = gameStore.tutorialStep;

  const steps = [
    {
      title: 'Welcome to Slice & Sprout! 🍕',
      body: 'You run an open-front Tuscan bistro on the village’s cobbled street. Guests arrive from town, cross the road and queue at the counter. Walk with WASD or click-to-move — and try the Caffè espresso bar beside the terrace.',
      action: 'Start Guided Tour'
    },
    {
      title: 'Step 1: Till Garden Soil 🌱',
      body: 'Walk west across the piazza to the fenced wooden farm beds. Press [E] or tap to till the soil with your spade!',
      action: 'Got it!'
    },
    {
      title: 'Step 2: Plant Farm Seeds 🍅',
      body: 'Select San Marzano Tomato or Sweet Basil seeds from your inventory sack and sow them into the earth.',
      action: 'Understood'
    },
    {
      title: 'Step 3: Water the Soil 💧',
      body: 'Crops need hydration to thrive! Click "Water Plot" to boost crop growth speed by +40%.',
      action: 'Hydrate!'
    },
    {
      title: 'Step 4: Harvest Your Produce 🧺',
      body: 'Your crops have ripened in the warm sun! Harvest them straight into your kitchen pantry.',
      action: 'Gather Crop'
    },
    {
      title: 'Step 5: Prep Margherita Classica 🍕',
      body: 'Head to the Kitchen Prep Counter. Combine artisan dough, San Marzano sauce, fresh mozzarella, and basil!',
      action: 'Assemble Pizza'
    },
    {
      title: 'Step 6: Bake to Golden Crust 🔥',
      body: 'Watch the temperature gauge! Pull the pizza when the needle enters the green "Golden Window" sweet spot!',
      action: 'To the Oven!'
    },
    {
      title: 'Step 7: Serve & Collect Coins 🪙',
      body: 'Walk to the open Serving Counter and hand your hot pizza to the waiting guest. For an impatient guest, the terrace espresso bar can warm their patience back up!',
      action: 'Serve Guests'
    }
  ];

  const current = steps[step] || steps[0];

  const handleNext = () => {
    audioManager.init();
    audioManager.playClick();
    gameStore.advanceTutorial();
  };

  const handleSkip = () => {
    audioManager.init();
    audioManager.playClick();
    gameStore.skipTutorial();
  };

  return (
    <div style={{
      position: 'absolute',
      top: 75,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 35,
      pointerEvents: 'auto',
      maxWidth: 520,
      width: '90%'
    }}>
      <div className="glass-panel" style={{
        padding: '14px 20px',
        border: '1.5px solid rgba(217, 119, 70, 0.5)',
        background: 'linear-gradient(135deg, rgba(31, 36, 33, 0.95), rgba(45, 20, 15, 0.92))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #d97746, #b95328)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0
          }}>
            <ChefHat size={20} />
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#ffd166' }}>
              {current.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: 2, lineHeight: 1.35 }}>
              {current.body}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
          <button
            className="glass-panel btn-primary"
            onClick={handleNext}
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>{current.action}</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.7rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2
            }}
          >
            <SkipForward size={11} /> Skip Guide
          </button>
        </div>
      </div>
    </div>
  );
};
