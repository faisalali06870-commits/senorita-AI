import React from 'react';
import { X, Volume2, Sliders, Check, Play, Sparkles, Heart } from 'lucide-react';

const DEFAULT_NEURAL_VOICES = [
  {
    id: 'hi-IN-SwaraNeural',
    name: 'Swara (Melodious Hindi & Hinglish)',
    tag: 'Recommended • Most Sweet',
    desc: 'Soft, gentle, highly emotional and melodious voice'
  },
  {
    id: 'en-IN-NeerjaNeural',
    name: 'Neerja (Indian English)',
    tag: 'Expressive & Warm',
    desc: 'Clear, modern, friendly Indian female voice'
  },
  {
    id: 'en-US-AnaNeural',
    name: 'Ana (Sweet & Youthful)',
    tag: 'Cute & Playful',
    desc: 'Very soft, natural, and cheerful girl voice'
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (Natural Companion)',
    tag: 'Studio Grade',
    desc: 'Warm, realistic, Hollywood AI-grade voice'
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (British Elegance)',
    tag: 'Soothing & Calm',
    desc: 'Charming, calm, and sophisticated female voice'
  }
];

export default function VoiceSettingsModal({
  isOpen,
  onClose,
  neuralVoices = DEFAULT_NEURAL_VOICES,
  selectedVoiceId,
  onSelectVoice,
  speechRate,
  onRateChange,
  speechPitch,
  onPitchChange,
  onTestVoice,
  isTesting
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-slate-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Heart className="w-4 h-4 fill-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                Senorita Voice & Personality
              </h3>
              <p className="text-xs text-slate-400">Choose a melodious, human-like girl voice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Neural Voices Cards */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Studio Neural Voices (Melodious & Lifelike)</span>
            <span className="text-[10px] text-pink-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>AI Emotional Tone</span>
            </span>
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {neuralVoices.map((v) => {
              const isSelected = v.id === selectedVoiceId;
              return (
                <div
                  key={v.id}
                  onClick={() => onSelectVoice(v.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-950/40 border-pink-500/60 shadow-lg shadow-purple-500/10 ring-1 ring-pink-500/40'
                      : 'bg-slate-850/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{v.name}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-pink-500/10 text-pink-300 border border-pink-500/20">
                        {v.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{v.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTestVoice(v.id);
                      }}
                      title="Preview this voice"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition-all shadow"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white shadow">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Speed Adjustment */}
        <div className="space-y-2 pt-1 border-t border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">Speaking Pace</span>
            <span className="text-purple-400 font-mono font-medium">{speechRate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.3"
            step="0.05"
            value={speechRate}
            onChange={(e) => onRateChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <button
            onClick={() => onTestVoice(selectedVoiceId)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition-all active:scale-95 shadow"
          >
            <Play className="w-3.5 h-3.5 text-pink-400" />
            <span>Hear Sample</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-pink-500/20 transition-all active:scale-95"
          >
            Save & Enjoy
          </button>
        </div>
      </div>
    </div>
  );
}
