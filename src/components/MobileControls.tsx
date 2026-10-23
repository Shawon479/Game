import React, { useRef, useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';


interface MobileControlsProps {
  onJoystickMove: (vec: { x: number; y: number }) => void;
  onActionPress: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onJoystickMove, onActionPress }) => {
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchIdRef = useRef<number | null>(null);

  // Touch controls are for phones/tablets, not narrow desktop windows.
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640 ||
      (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches);
  });

  useEffect(() => {
    const updateTouchMode = () => {
      setIsTouchDevice(
        window.innerWidth < 640 ||
        (navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches)
      );
    };
    window.addEventListener('resize', updateTouchMode);
    return () => window.removeEventListener('resize', updateTouchMode);
  }, []);

  if (!isTouchDevice) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setIsDragging(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        setIsDragging(false);
        touchIdRef.current = null;
        setKnobPos({ x: 0, y: 0 });
        onJoystickMove({ x: 0, y: 0 });
        break;
      }
    }
  };

  const updateKnob = (clientX: number, clientY: number) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;

    let normX = dx;
    let normY = dy;

    if (dist > maxRadius) {
      normX = (dx / dist) * maxRadius;
      normY = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: normX, y: normY });
    onJoystickMove({ x: normX / maxRadius, y: -normY / maxRadius });
  };

  return (
    <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, pointerEvents: 'none', zIndex: 30 }}>
      {/* On-screen virtual joystick (bottom-left) */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          touchAction: 'none'
        }}
      >
        {/* Joystick Center Knob */}
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #d97746, #b95328)',
            boxShadow: '0 4px 12px rgba(217, 119, 70, 0.5)',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        />
      </div>

      {/* Floating Action Button (bottom-right) */}
      <button
        onClick={onActionPress}
        style={{
          position: 'absolute',
          bottom: 15,
          right: 15,
          width: 70,
          height: 70,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2a9d8f, #1b635a)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          color: '#fff',
          fontWeight: 800,
          fontSize: '1.2rem',
          boxShadow: '0 6px 18px rgba(42, 157, 143, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
      >
        <Sparkles size={20} />
        <span style={{ fontSize: '0.72rem' }}>ACT</span>
      </button>
    </div>
  );
};
