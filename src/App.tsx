import React, { useEffect, useRef, useState } from 'react';
import { WorldScene } from './engine/WorldScene';
import { gameStore } from './engine/GameStore';
import { audioManager } from './engine/AudioManager';
import { HUD } from './components/HUD';
import { PrepStationModal } from './components/PrepStationModal';
import { OvenStationModal } from './components/OvenStationModal';
import { CounterStationModal } from './components/CounterStationModal';
import { FarmModal } from './components/FarmModal';
import { BuildMenuModal } from './components/BuildMenuModal';
import { SeedShopModal } from './components/SeedShopModal';
import { RecipeBookModal } from './components/RecipeBookModal';
import { AchievementsModal } from './components/AchievementsModal';
import { SettingsModal } from './components/SettingsModal';
import { StaffModal } from './components/StaffModal';
import { InventoryModal } from './components/InventoryModal';
import { ChallengesModal } from './components/ChallengesModal';
import { DaySummaryModal } from './components/DaySummaryModal';
import { ResearchModal } from './components/ResearchModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SocialModal } from './components/SocialModal';
import { BuildPlacementHUD } from './components/BuildPlacementHUD';
import { SpecialEventBanner } from './components/SpecialEventBanner';
import { ComboIndicator } from './components/ComboIndicator';
import { Minimap } from './components/Minimap';
import { TutorialOverlay } from './components/TutorialOverlay';
import { MobileControls } from './components/MobileControls';

export const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const worldSceneRef = useRef<WorldScene | null>(null);
  const [activeModal, setActiveModal] = useState(gameStore.activeModal);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any existing children from strictmode or remounts
    container.innerHTML = '';

    const scene = new WorldScene(container);
    worldSceneRef.current = scene;

    const unsubscribe = gameStore.subscribe(() => {
      setActiveModal(gameStore.activeModal);
    });

    const handleFirstGesture = () => {
      audioManager.init();
      audioManager.startMusic();
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      unsubscribe();
      scene.destroy();
      worldSceneRef.current = null;
      container.innerHTML = '';
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  const handleJoystickMove = (vec: { x: number; y: number }) => {
    if (worldSceneRef.current) {
      worldSceneRef.current.joystickVector = vec;
    }
  };

  const handleMobileAction = () => {
    if (worldSceneRef.current) {
      worldSceneRef.current.triggerProximityAction();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 3D Canvas Viewport */}
      <div ref={containerRef} className="game-viewport" />

      {/* Subtle cinematic color grade and vignette */}
      <div className="scene-vignette" />

      {/* Persistent HUD Overlay */}
      <HUD />

      {/* In-world Build 2.0 controls (only while placing or relocating) */}
      <BuildPlacementHUD />

      {/* Live Special Event Banner (shows when events are active) */}
      <SpecialEventBanner />

      {/* Serving Combo Indicator */}
      <ComboIndicator />

      {/* Mini Radar on HUD */}
      <Minimap />

      {/* First-time Tutorial Guide */}
      <TutorialOverlay />

      {/* Mobile Touch Controls */}
      <MobileControls 
        onJoystickMove={handleJoystickMove} 
        onActionPress={handleMobileAction} 
      />

      {/* Modal Dialogs */}
      {activeModal === 'prep' && <PrepStationModal />}
      {activeModal === 'oven' && <OvenStationModal />}
      {activeModal === 'counter' && <CounterStationModal />}
      {activeModal === 'farm' && <FarmModal />}
      {activeModal === 'build' && <BuildMenuModal />}
      {activeModal === 'shop' && <SeedShopModal />}
      {activeModal === 'recipes' && <RecipeBookModal />}
      {activeModal === 'achievements' && <AchievementsModal />}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'staff' && <StaffModal />}
      {activeModal === 'inventory' && <InventoryModal />}
      {activeModal === 'challenges' && <ChallengesModal />}
      {activeModal === 'day_summary' && <DaySummaryModal />}
      {activeModal === 'research' && <ResearchModal />}
      {activeModal === 'leaderboard' && <LeaderboardModal />}
      {activeModal === 'piazza' && <SocialModal />}
      {activeModal === 'map' && <Minimap isFullScreen={true} />}
    </div>
  );
};

export default App;
