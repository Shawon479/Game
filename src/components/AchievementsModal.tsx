import { X, Trophy, CheckCircle2, Coins } from 'lucide-react';

import { gameStore } from '../engine/GameStore';

export const AchievementsModal: React.FC = () => {
  const achievements = gameStore.achievements;
  const completedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
      <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Trophy size={26} color="#ffb703" />
            <span>Estate Trophies & Milestones ({completedCount}/{achievements.length})</span>
          </div>
          <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
            <X size={20} />
          </button>
        </div>

        {/* List of achievements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
          {achievements.map(ach => {
            const percent = Math.min(100, Math.round((ach.progress / ach.goal) * 100));

            return (
              <div
                key={ach.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: ach.unlocked ? 'rgba(255, 183, 3, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                  border: ach.unlocked ? '1px solid rgba(255, 183, 3, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: ach.unlocked ? '#ffb703' : 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0
                  }}>
                    {ach.icon}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                        {ach.title}
                      </span>
                      {ach.unlocked && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#4ade80', fontSize: '0.75rem', fontWeight: 700 }}>
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 2 }}>
                      {ach.description}
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: 140, marginTop: 6 }}>
                      <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          width: `${percent}%`,
                          height: '100%',
                          background: ach.unlocked ? '#ffb703' : '#38bdf8',
                          borderRadius: 3
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, color: '#e9c46a', fontSize: '0.85rem' }}>
                    <Coins size={14} /> +{ach.rewardCoins}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                    +{ach.rewardXp} XP
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                    {ach.progress}/{ach.goal}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
