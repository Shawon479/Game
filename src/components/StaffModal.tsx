import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Trash2, ChefHat, Flame, 
  UtensilsCrossed, Sprout, Coins, X, Check, Award
} from 'lucide-react';
import { gameStore } from '../engine/GameStore';
import type { StaffRole, StaffMember } from '../types/game';

interface RoleCardInfo {
  role: StaffRole;
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  wage: number;
  description: string;
  perks: string[];
}

const ROLES: RoleCardInfo[] = [
  {
    role: 'prep_cook',
    title: 'Prep Cook',
    icon: <ChefHat size={22} color="#f4a261" />,
    accentColor: '#f4a261',
    wage: 12,
    description: 'Master of ingredient prep. Automatically mills raw wheat into pizza dough and turns fresh tomatoes into sauce.',
    perks: ['Auto-mills harvested Wheat into Dough', 'Auto-crushes harvested Tomatoes into Sauce', 'Keeps pantry stocked without manual prep']
  },
  {
    role: 'oven_tender',
    title: 'Oven Tender',
    icon: <Flame size={22} color="#e76f51" />,
    accentColor: '#e76f51',
    wage: 15,
    description: 'Watches the stone hearth with eagle eyes. Pulls pizzas right when golden perfection is reached so nothing burns!',
    perks: ['Guarantees +50% Perfect Crust value', 'Prevents pizzas from ever burning', 'Handles rush hour oven peaks']
  },
  {
    role: 'server',
    title: 'Waiter / Server',
    icon: <UtensilsCrossed size={22} color="#2a9d8f" />,
    accentColor: '#2a9d8f',
    wage: 10,
    description: 'Delivers ready pizzas straight to waiting customers at the counter, maximizing tip speed and patience.',
    perks: ['Auto-serves matching counter orders', 'Maximizes customer tip potential', 'Frees you to farm and build']
  },
  {
    role: 'farmhand',
    title: 'Farmhand',
    icon: <Sprout size={22} color="#4ade80" />,
    accentColor: '#4ade80',
    wage: 8,
    description: 'Tends the Tuscan soil. Automatically waters dry crops and harvests ripe vegetables into your pantry.',
    perks: ['Waters dry crops continuously', 'Harvests ready crops automatically', 'Boosts crop growth turnover']
  }
];

export const StaffModal: React.FC = () => {
  const [, setTick] = useState(0);
  const [selectedRole, setSelectedRole] = useState<StaffRole>('prep_cook');

  useEffect(() => {
    return gameStore.subscribe(() => setTick(t => t + 1));
  }, []);

  const staff = gameStore.staff;
  const coins = gameStore.coins;
  const totalPayroll = staff.reduce((acc, s) => acc + s.dailyWage, 0);

  const handleHire = (role: StaffRole) => {
    gameStore.hireStaff(role);
  };

  const handleFire = (id: string) => {
    gameStore.fireStaff(id);
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'prep_cook': return { label: 'Prep Cook', color: '#f4a261' };
      case 'oven_tender': return { label: 'Oven Tender', color: '#e76f51' };
      case 'server': return { label: 'Server', color: '#2a9d8f' };
      case 'farmhand': return { label: 'Farmhand', color: '#4ade80' };
    }
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
              background: 'linear-gradient(135deg, #2a9d8f, #264653)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={24} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                Pizzeria Staff & Hires
              </h2>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Recruit skilled apprentices to automate kitchen stations, serving, and farm work.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              background: 'rgba(233, 196, 106, 0.12)',
              border: '1px solid rgba(233, 196, 106, 0.3)',
              padding: '6px 14px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <Coins size={16} color="#e9c46a" />
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Daily Payroll:</span>
              <span style={{ fontWeight: 800, color: '#ffd166', fontSize: '0.92rem' }}>
                🪙 {totalPayroll}/day
              </span>
            </div>

            <button 
              className="glass-button" 
              onClick={() => gameStore.closeModal()}
              style={{ width: 36, height: 36, padding: 0 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Tabs / Split view */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: 20, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          {/* Left Column: Hireable Roles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Available Professions (Hire Cost: 🪙 45)
            </div>

            {ROLES.map(r => {
              const count = staff.filter(s => s.role === r.role).length;
              const isSelected = selectedRole === r.role;

              return (
                <div 
                  key={r.role}
                  onClick={() => setSelectedRole(r.role)}
                  className="glass-panel"
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    border: isSelected ? `2px solid ${r.accentColor}` : '1px solid rgba(255,255,255,0.08)',
                    background: isSelected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {r.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Wage: 🪙 {r.wage}/day
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {count > 0 && (
                        <span style={{
                          background: 'rgba(42, 157, 143, 0.25)',
                          color: '#4ade80',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 12
                        }}>
                          {count} Hired
                        </span>
                      )}
                      <button
                        className="btn-primary"
                        disabled={coins < 45}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHire(r.role);
                        }}
                        style={{
                          padding: '6px 14px',
                          fontSize: '0.8rem',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <UserPlus size={14} />
                        Hire 🪙 45
                      </button>
                    </div>
                  </div>

                  <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {r.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {r.perks.map((perk, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#a7f3d0' }}>
                        <Check size={12} color="#34d399" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Currently Hired Roster */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Roster ({staff.length} staff)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Wages billed at midnight
              </div>
            </div>

            {staff.length === 0 ? (
              <div className="glass-panel" style={{
                padding: 40,
                textAlign: 'center',
                borderRadius: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                color: '#64748b'
              }}>
                <ChefHat size={48} strokeWidth={1.5} color="#475569" />
                <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '1rem' }}>No Staff Hired Yet</div>
                <div style={{ fontSize: '0.82rem', maxWidth: 280 }}>
                  Hire a Farmhand to water crops or an Oven Tender to never burn a pizza again!
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                {staff.map((member: StaffMember) => {
                  const badge = getRoleBadge(member.role);
                  return (
                    <div 
                      key={member.id}
                      className="glass-panel"
                      style={{
                        padding: '12px 16px',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      {/* Avatar preview */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${member.appearance.shirtColor}, #1e293b)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.3rem',
                          border: `2px solid ${badge.color}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                          👨‍🍳
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                            {member.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: badge.color,
                              background: 'rgba(255,255,255,0.06)',
                              padding: '2px 8px',
                              borderRadius: 10
                            }}>
                              {badge.label}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              Day {member.hiredAt}+
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Wage & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffd166' }}>
                            🪙 {member.dailyWage}/day
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Automating
                          </div>
                        </div>

                        <button
                          onClick={() => handleFire(member.id)}
                          className="glass-button"
                          style={{
                            width: 34,
                            height: 34,
                            padding: 0,
                            borderRadius: 8,
                            color: '#f87171'
                          }}
                          title={`Release ${member.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tycoon Tip Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(42, 157, 143, 0.15), rgba(38, 70, 83, 0.2))',
              border: '1px solid rgba(42, 157, 143, 0.3)',
              borderRadius: 12,
              padding: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginTop: 'auto'
            }}>
              <Award size={18} color="#2a9d8f" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                <strong style={{ color: '#5eead4' }}>Tycoon Tip:</strong> An Oven Tender combined with a Waiter will completely automate kitchen-to-table service, guaranteeing no burnt pizzas and constant tip flow while you expand the farm!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
