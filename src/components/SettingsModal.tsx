import React, { useState } from 'react';
import { X, Settings, Volume2, Save, Download, Upload, RotateCcw, Keyboard } from 'lucide-react';
import { gameStore } from '../engine/GameStore';
import { audioManager } from '../engine/AudioManager';

export const SettingsModal: React.FC = () => {
  const [musicVol, setMusicVol] = useState(audioManager.getMusicVolume());
  const [sfxVol, setSfxVol] = useState(audioManager.getSfxVolume());

  const handleMusicChange = (val: number) => {
    setMusicVol(val);
    audioManager.setMusicVolume(val);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    audioManager.setSfxVolume(val);
  };

  const handleSaveSlot = (slot: string) => {
    audioManager.init();
    gameStore.saveToStorage(slot);
  };

  const handleLoadSlot = (slot: string) => {
    audioManager.init();
    gameStore.loadFromStorage(slot);
  };

  const handleExportJson = () => {
    const raw = localStorage.getItem('slice_and_sprout_save_v1_autosave');
    if (!raw) {
      gameStore.saveToStorage('autosave');
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(raw || '{}');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `slice_and_sprout_save_day_${gameStore.day}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    gameStore.showToast('Save Exported! 📥', 'Save file downloaded to your device.', 'success');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          localStorage.setItem('slice_and_sprout_save_v1_autosave', content);
          gameStore.loadFromStorage('autosave');
        } catch {
          gameStore.showToast('Import Failed', 'Invalid save file format.', 'warning');
        }
      };
    }
  };

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={26} color="#cbd5e1" />
            <span>Game Settings & Saved Progress</span>
          </div>
          <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
            <X size={20} />
          </button>
        </div>

        {/* Audio Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Volume2 size={16} color="#4ade80" />
            <span>Audio & Soundscapes</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span>Music Volume</span>
                <span>{Math.round(musicVol * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={musicVol} 
                onChange={e => handleMusicChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#d97746' }}
              />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                <span>SFX Volume</span>
                <span>{Math.round(sfxVol * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={sfxVol} 
                onChange={e => handleSfxChange(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#2a9d8f' }}
              />
            </div>
          </div>
        </div>

        {/* Save Slots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={16} color="#38bdf8" />
            <span>Save & Load Slots</span>
          </div>

          {['slot_1', 'slot_2'].map((slot, idx) => (
            <div
              key={slot}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Save Slot #{idx + 1}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="glass-button"
                  onClick={() => handleSaveSlot(slot)}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  Save
                </button>
                <button
                  className="glass-button"
                  onClick={() => handleLoadSlot(slot)}
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  Load
                </button>
              </div>
            </div>
          ))}

          {/* Export / Import */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="glass-button"
              onClick={handleExportJson}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> Export Save File
            </button>

            <label className="glass-button" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>
              <Upload size={14} /> Import Save File
              <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Controls Reference */}
        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px 16px', borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.82rem', color: '#cbd5e1', marginBottom: 6 }}>
            <Keyboard size={14} /> Controls Guide
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
            <div><b>WASD / Arrows</b> — Walk character</div>
            <div><b>Click ground</b> — Walk to a spot</div>
            <div><b>Right Click Drag</b> — Orbit camera</div>
            <div><b>Mouse Wheel</b> — Zoom in / out</div>
            <div><b>[E] / Space</b> — Interact with station, plot or Caffè bar</div>
            <div><b>[B]</b> — Tycoon construction shop</div>
            <div><b>[K]</b> — Recipe cookbook</div>
            <div><b>[I]</b> — Pantry &amp; inventory</div>
            <div><b>[R]</b> — Research lab</div>
            <div><b>[C]</b> — Daily goals</div>
            <div><b>[L]</b> — Hall of fame</div>
            <div><b>[M]</b> — Estate map</div>
            <div><b>[U]</b> — Staff hiring</div>
            <div><b>[Esc]</b> — Close menus</div>
          </div>
        </div>

        {/* Reset */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all game data and start fresh?')) {
                gameStore.resetGame();
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <RotateCcw size={12} /> Reset Data & Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
};
