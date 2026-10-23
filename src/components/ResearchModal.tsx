import React, { useEffect, useState } from 'react';
import { gameStore } from '../engine/GameStore';
import type { ResearchProject } from '../types/game';

export const ResearchModal: React.FC = () => {
  const [projects, setProjects] = useState<ResearchProject[]>([...gameStore.researchProjects]);
  const [coins, setCoins] = useState(gameStore.coins);
  const [level, setLevel] = useState(gameStore.level);

  useEffect(() => {
    const unsub = gameStore.subscribe(() => {
      setProjects([...gameStore.researchProjects]);
      setCoins(gameStore.coins);
      setLevel(gameStore.level);
    });
    return unsub;
  }, []);

  const handleConduct = (projectId: string) => {
    gameStore.conductResearch(projectId);
  };

  const handleClose = () => gameStore.closeModal();

  const baseModal: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  };

  const card: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    border: '1px solid rgba(255,200,100,0.25)',
    borderRadius: '20px',
    padding: '28px',
    width: '90%',
    maxWidth: '540px',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,200,50,0.06)',
  };

  return (
    <div style={baseModal} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={card}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{
              margin: 0,
              color: '#ffc857',
              fontSize: '22px',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              letterSpacing: '-0.3px',
            }}>📜 Recipe Research Lab</h2>
            <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '12px', fontFamily: "'Inter', sans-serif" }}>
              Spend coins to unlock new recipes for your pizzeria
            </p>
          </div>
          <button onClick={handleClose} style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Coin balance */}
        <div style={{
          background: 'rgba(255,200,80,0.08)',
          border: '1px solid rgba(255,200,80,0.2)',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>🪙</span>
          <span style={{ color: '#ffc857', fontWeight: 700, fontSize: '16px', fontFamily: "'Inter', sans-serif" }}>
            {coins.toFixed(0)} coins available
          </span>
          <span style={{ color: '#888', fontSize: '13px', marginLeft: 'auto', fontFamily: "'Inter', sans-serif" }}>
            Lv. {level}
          </span>
        </div>

        {/* Project cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {projects.map(project => {
            const canAfford = coins >= project.costCoins;
            const meetsLevel = level >= project.requiresLevel;
            const canResearch = !project.unlocked && canAfford && meetsLevel;

            return (
              <div key={project.id} style={{
                background: project.unlocked
                  ? 'linear-gradient(135deg, rgba(42,157,143,0.12), rgba(42,157,143,0.06))'
                  : 'rgba(255,255,255,0.04)',
                border: project.unlocked
                  ? '1px solid rgba(42,157,143,0.4)'
                  : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                opacity: !project.unlocked && !meetsLevel ? 0.5 : 1,
              }}>
                {/* Icon */}
                <div style={{
                  fontSize: '32px',
                  lineHeight: 1,
                  filter: project.unlocked ? 'none' : (!meetsLevel ? 'grayscale(1)' : 'none'),
                }}>{project.icon}</div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: project.unlocked ? '#2a9d8f' : '#e0e0e0',
                    fontSize: '15px',
                    fontWeight: 700,
                    fontFamily: "'Inter', sans-serif",
                    marginBottom: '3px',
                  }}>{project.recipeName}</div>
                  <div style={{
                    color: '#aaa',
                    fontSize: '12px',
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: '1.4',
                    marginBottom: '10px',
                  }}>{project.description}</div>

                  {/* Requirements row */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {project.unlocked ? (
                      <span style={{
                        background: 'rgba(42,157,143,0.2)',
                        color: '#2a9d8f',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700,
                        fontFamily: "'Inter', sans-serif",
                      }}>✅ Researched</span>
                    ) : (
                      <>
                        <span style={{
                          background: canAfford ? 'rgba(255,200,80,0.15)' : 'rgba(255,80,80,0.15)',
                          color: canAfford ? '#ffc857' : '#ff8a8a',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: "'Inter', sans-serif",
                        }}>🪙 {project.costCoins} coins</span>
                        {!meetsLevel && (
                          <span style={{
                            background: 'rgba(150,80,255,0.15)',
                            color: '#c77dff',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: "'Inter', sans-serif",
                          }}>🔒 Req. Lv. {project.requiresLevel}</span>
                        )}
                        <button
                          onClick={() => canResearch && handleConduct(project.id)}
                          disabled={!canResearch}
                          style={{
                            marginLeft: 'auto',
                            background: canResearch
                              ? 'linear-gradient(135deg, #e63946, #c1121f)'
                              : 'rgba(255,255,255,0.08)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '7px 16px',
                            color: canResearch ? '#fff' : '#555',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: canResearch ? 'pointer' : 'not-allowed',
                            fontFamily: "'Inter', sans-serif",
                            transition: 'all 0.2s',
                          }}
                        >
                          {canAfford && meetsLevel ? '🔬 Research' : !meetsLevel ? '🔒 Locked' : '💸 Need Coins'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '20px',
          color: '#555',
          fontSize: '11px',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center',
        }}>
          💡 Researching new recipes unlocks them in the Prep Station and Recipe Book
        </div>
      </div>
    </div>
  );
};
