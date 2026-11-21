import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export default function GlowingOrb({
  isListening,
  isSpeaking,
  emotion = 'caring'
}) {
  // Emotion color themes
  const colorThemes = {
    caring: {
      core: 'from-pink-500 via-rose-500 to-purple-600',
      glow: 'rgba(244, 63, 94, 0.45)',
      ring: 'border-pink-500/40',
      label: 'Caring & Warm'
    },
    cheerful: {
      core: 'from-amber-400 via-orange-500 to-pink-500',
      glow: 'rgba(245, 158, 11, 0.45)',
      ring: 'border-amber-400/40',
      label: 'Cheerful & Radiant'
    },
    playful: {
      core: 'from-fuchsia-500 via-purple-600 to-pink-500',
      glow: 'rgba(217, 70, 239, 0.45)',
      ring: 'border-fuchsia-500/40',
      label: 'Playful & Sweet'
    },
    thoughtful: {
      core: 'from-indigo-500 via-blue-600 to-purple-600',
      glow: 'rgba(99, 102, 241, 0.45)',
      ring: 'border-indigo-500/40',
      label: 'Deep Focus & Architecture'
    },
    confident: {
      core: 'from-cyan-400 via-blue-600 to-indigo-600',
      glow: 'rgba(6, 182, 212, 0.45)',
      ring: 'border-cyan-400/40',
      label: 'Ready & Confident'
    }
  };

  const theme = colorThemes[emotion] || colorThemes.caring;

  return (
    <div className="relative flex items-center justify-center py-6 select-none">
      {/* Outer Glow Halo */}
      <div
        className={`absolute w-36 h-36 rounded-full blur-2xl transition-all duration-700 pointer-events-none ${
          isSpeaking
            ? 'scale-125 opacity-90'
            : isListening
            ? 'scale-110 opacity-80'
            : 'scale-95 opacity-50'
        }`}
        style={{ background: theme.glow }}
      />

      {/* Rotating Orbital Rings */}
      <div
        className={`absolute w-28 h-28 rounded-full border border-dashed transition-all duration-500 animate-[spin_10s_linear_infinite] ${
          theme.ring
        } ${isSpeaking ? 'scale-110 border-opacity-80' : 'border-opacity-30'}`}
      />
      <div
        className={`absolute w-24 h-24 rounded-full border transition-all duration-500 animate-[spin_6s_linear_infinite_reverse] ${
          theme.ring
        } ${isListening ? 'scale-105 border-opacity-90' : 'border-opacity-20'}`}
      />

      {/* Pulsing Core Sphere */}
      <div
        className={`relative w-20 h-20 rounded-full bg-gradient-to-tr shadow-2xl flex items-center justify-center transition-all duration-500 ${
          theme.core
        } ${
          isSpeaking
            ? 'scale-110 shadow-pink-500/50 animate-pulse'
            : isListening
            ? 'scale-105 shadow-pink-500/40 ring-2 ring-pink-400/50'
            : 'hover:scale-105 shadow-purple-500/30'
        }`}
      >
        <div className="absolute inset-1 rounded-full bg-white/15 backdrop-blur-[2px] flex items-center justify-center">
          {isSpeaking ? (
            <Sparkles className="w-8 h-8 text-white animate-spin" style={{ animationDuration: '4s' }} />
          ) : isListening ? (
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          ) : (
            <Heart className="w-8 h-8 text-white/90 fill-white/80 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
