import React, { useRef, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { gameStore } from '../engine/GameStore';
import { WORLD_LAYOUT } from '../data/worldLayout';

interface MinimapProps {
  isFullScreen?: boolean;
}

export const Minimap: React.FC<MinimapProps> = ({ isFullScreen = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId = 0;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const bounds = WORLD_LAYOUT.bounds;
      const padding = isFullScreen ? 22 : 7;
      const worldWidth = bounds.maxX - bounds.minX;
      const worldHeight = bounds.maxZ - bounds.minZ;

      // Uniform scale keeps the estate from stretching on the little radar.
      const scale = Math.min(
        (width - padding * 2) / worldWidth,
        (height - padding * 2) / worldHeight
      );
      const originX = width / 2;
      const originY = height / 2;
      const toScreenX = (x: number) => originX + x * scale;
      const toScreenY = (z: number) => originY + z * scale;

      const rect = (x: number, z: number, w: number, d: number, fill: string, stroke?: string) => {
        ctx.fillStyle = fill;
        ctx.fillRect(toScreenX(x - w / 2), toScreenY(z - d / 2), w * scale, d * scale);
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1;
          ctx.strokeRect(toScreenX(x - w / 2), toScreenY(z - d / 2), w * scale, d * scale);
        }
      };

      const dot = (x: number, z: number, radius: number, fill: string, stroke?: string) => {
        ctx.beginPath();
        ctx.arc(toScreenX(x), toScreenY(z), radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      };

      // Meadow backdrop with a faint survey grid.
      ctx.fillStyle = '#20302a';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.lineWidth = 1;
      for (let x = Math.ceil(bounds.minX / 5) * 5; x <= bounds.maxX; x += 5) {
        ctx.beginPath();
        ctx.moveTo(toScreenX(x), 0);
        ctx.lineTo(toScreenX(x), height);
        ctx.stroke();
      }
      for (let z = Math.ceil(bounds.minZ / 5) * 5; z <= bounds.maxZ; z += 5) {
        ctx.beginPath();
        ctx.moveTo(0, toScreenY(z));
        ctx.lineTo(width, toScreenY(z));
        ctx.stroke();
      }

      // Fields and background
      rect(-21, 0, 12, 16, '#2b3d2f');
      rect(0, 22, 48, 14, '#293929');
      rect(-14, 27.5, 16, 7, '#4b435f');
      rect(-15, 31.5, 15, 6, '#4d4335');

      // Road and pavements
      const road = WORLD_LAYOUT.road;
      rect(0, road.centerZ, 64, road.halfWidth * 2 + 2.6, '#3c4146', '#565d63');
      ctx.strokeStyle = 'rgba(242, 228, 191, 0.65)';
      ctx.lineWidth = isFullScreen ? 1.4 : 1;
      ctx.setLineDash([isFullScreen ? 8 : 4, isFullScreen ? 7 : 4]);
      ctx.beginPath();
      ctx.moveTo(toScreenX(bounds.minX), toScreenY(road.centerZ));
      ctx.lineTo(toScreenX(bounds.maxX), toScreenY(road.centerZ));
      ctx.stroke();
      ctx.setLineDash([]);
      rect(0, WORLD_LAYOUT.sidewalk.northCenterZ, 64, WORLD_LAYOUT.sidewalk.halfDepth * 2, '#7d7463');
      rect(0, WORLD_LAYOUT.sidewalk.southCenterZ, 64, WORLD_LAYOUT.sidewalk.halfDepth * 2, '#7d7463');

      // Cobbled café piazza
      rect(-1.2, -1.0, 21.0, 16.5, '#685f50');
      rect(WORLD_LAYOUT.patio.minX + (WORLD_LAYOUT.patio.maxX - WORLD_LAYOUT.patio.minX) / 2,
        WORLD_LAYOUT.patio.minZ + (WORLD_LAYOUT.patio.maxZ - WORLD_LAYOUT.patio.minZ) / 2,
        WORLD_LAYOUT.patio.maxX - WORLD_LAYOUT.patio.minX,
        WORLD_LAYOUT.patio.maxZ - WORLD_LAYOUT.patio.minZ,
        '#7b6b50', 'rgba(233, 196, 106, 0.35)');

      // Café footprint and farm
      const cafe = WORLD_LAYOUT.cafe;
      rect(cafe.centerX, (cafe.backZ + cafe.frontZ) / 2, cafe.width, cafe.frontZ - cafe.backZ, '#a9543b', '#e3c88e');
      rect(cafe.centerX, cafe.frontZ - 0.65, cafe.width + 0.8, 1.3, '#d9c19a');
      const farmFence = WORLD_LAYOUT.farmFence;
      rect(
        (farmFence.minX + farmFence.maxX) / 2,
        (farmFence.minZ + farmFence.maxZ) / 2,
        farmFence.maxX - farmFence.minX,
        farmFence.maxZ - farmFence.minZ,
        'rgba(70, 92, 58, 0.75)',
        '#b69a63'
      );

      // Farm beds
      gameStore.farmPlots.forEach(plot => {
        let color = '#5c4328';
        if (plot.state === 'tilled') color = '#4a2f1b';
        if (plot.state === 'growing') color = '#3f8f4f';
        if (plot.state === 'ready') color = '#eabf45';
        rect(plot.worldX, plot.worldZ, 1.75, 1.75, color, 'rgba(255,255,255,0.25)');
      });

      // Tables, fountain and buildings
      gameStore.buildings.forEach(building => {
        if (building.typeId === 'table_rustic' || building.typeId === 'table_terrace') {
          rect(building.x, building.z, 2.5, 2.5, 'rgba(232, 209, 167, 0.34)', '#e8d1a7');
        } else if (building.typeId === 'path_cobblestone') {
          rect(building.x, building.z, 2.3, 2.3, 'rgba(190, 174, 146, 0.4)');
        } else if (building.typeId === 'glass_greenhouse') {
          rect(building.x, building.z, 3.1, 3.1, 'rgba(150, 215, 210, 0.45)', '#9ee6df');
        } else if (building.typeId === 'lantern_amber') {
          dot(building.x, building.z, 2, '#ffd166');
        } else {
          rect(building.x, building.z, 1.6, 1.6, '#9ca3af');
        }
      });

      const fountain = WORLD_LAYOUT.fountain;
      dot(fountain.x, fountain.z, Math.max(4, fountain.radius * scale), '#4f9cc0', '#bce6f2');

      // Station markers
      const stationMarks = [
        { x: WORLD_LAYOUT.stations.prep.x, z: WORLD_LAYOUT.stations.prep.z, color: '#e9c46a', label: 'Prep' },
        { x: WORLD_LAYOUT.stations.oven.x, z: WORLD_LAYOUT.stations.oven.z, color: '#ff6b35', label: 'Oven' },
        { x: WORLD_LAYOUT.stations.counter.x, z: WORLD_LAYOUT.stations.counter.z, color: '#77c59a', label: 'Counter' },
        { x: WORLD_LAYOUT.stations.espresso.x, z: WORLD_LAYOUT.stations.espresso.z, color: '#c89a72', label: 'Caffè' }
      ];
      stationMarks.forEach(station => {
        dot(station.x, station.z, isFullScreen ? 5 : 2.5, station.color, '#fff7e7');
        if (isFullScreen) {
          ctx.font = '600 10px "Trebuchet MS", sans-serif';
          ctx.fillStyle = '#f6edd8';
          ctx.textAlign = 'center';
          ctx.fillText(station.label, toScreenX(station.x), toScreenY(station.z) - 9);
        }
      });

      // Queue dots and customers
      if (isFullScreen) {
        ctx.fillStyle = 'rgba(255, 244, 214, 0.55)';
        WORLD_LAYOUT.queue.forEach(spot => {
          ctx.beginPath();
          ctx.arc(toScreenX(spot.x), toScreenY(spot.z), 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      gameStore.customers.forEach(customer => {
        dot(
          customer.position.x,
          customer.position.z,
          isFullScreen ? 3.8 : 2.4,
          customer.appearance.shirtColor || '#38bdf8',
          'rgba(255,255,255,0.75)'
        );
      });

      // Staff
      gameStore.staff.forEach((staff, index) => {
        const offset = (index % 3) * 0.45;
        dot(-2 + offset, -6.2, 2.2, staff.appearance.shirtColor || '#4ade80');
      });

      // Player
      const playerX = toScreenX(gameStore.playerPos?.x ?? WORLD_LAYOUT.spawn.x);
      const playerY = toScreenY(gameStore.playerPos?.z ?? WORLD_LAYOUT.spawn.z);
      ctx.beginPath();
      ctx.arc(playerX, playerY, isFullScreen ? 6.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = isFullScreen ? 2.4 : 1.6;
      ctx.stroke();
      if (isFullScreen) {
        ctx.beginPath();
        ctx.arc(playerX, playerY, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Labels on the large map
      if (isFullScreen) {
        ctx.font = '700 11px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f6edd8';
        ctx.fillText('SLICE & SPROUT', toScreenX(cafe.centerX), toScreenY(cafe.backZ) - 8);
        ctx.fillStyle = 'rgba(241, 230, 198, 0.85)';
        ctx.font = '600 10px "Trebuchet MS", sans-serif';
        ctx.fillText('TERRAZZA', toScreenX(10.5), toScreenY(-0.7));
        ctx.fillText('ORTO', toScreenX(-12.5), toScreenY(6.9));
        ctx.fillText('PIAZZA', toScreenX(0), toScreenY(12) - 10);
        ctx.fillStyle = 'rgba(200, 219, 227, 0.72)';
        ctx.font = '600 9px "Trebuchet MS", sans-serif';
        ctx.fillText('VIA DELLE OLIVE', toScreenX(0), toScreenY(16.25) + 13);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isFullScreen]);

  if (isFullScreen) {
    return (
      <div className="modal-backdrop" onClick={() => gameStore.closeModal()}>
        <div className="glass-panel modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
          <div className="modal-header">
            <div className="modal-title">
              <MapPin size={24} color="#60a5fa" />
              <span>Estate Radar & Café Map</span>
            </div>
            <button className="modal-close-btn" onClick={() => gameStore.closeModal()}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <canvas
              ref={canvasRef}
              width={460}
              height={360}
              style={{ width: '100%', maxWidth: 460, borderRadius: 16, border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: '#ef4444', borderRadius: '50%' }} />
              <span>You (Chef)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: '#ff6b35', borderRadius: '50%' }} />
              <span>Wood oven</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: '#c89a72', borderRadius: '50%' }} />
              <span>Caffè bar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: '#15803d', borderRadius: 2 }} />
              <span>Farm plots</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: '#38bdf8', borderRadius: '50%' }} />
              <span>Guests</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, background: '#4f9cc0', borderRadius: '50%' }} />
              <span>Fountain</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      top: 96,
      left: 14,
      zIndex: 15,
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.15)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      cursor: 'pointer'
    }} onClick={() => gameStore.openModal('map')} title="Open estate map [M]">
      <canvas ref={canvasRef} width={140} height={112} />
    </div>
  );
};
