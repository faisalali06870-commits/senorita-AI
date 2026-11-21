import React, { useState } from 'react';
import { Monitor, X, Maximize2, Minimize2, Camera, Eye } from 'lucide-react';

export default function LiveScreenPreview({
  videoRef,
  isActive,
  onStop,
  onManualCapture
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isActive) return null;

  return (
    <div className="fixed bottom-24 right-6 z-30 transition-all duration-300 select-none">
      {isMinimized ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 border border-emerald-500/50 text-emerald-400 text-xs font-mono shadow-2xl backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Screen Live</span>
          <button
            onClick={() => setIsMinimized(false)}
            title="Expand Preview"
            className="p-1 hover:text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onStop}
            title="Stop Screen Share"
            className="p-1 hover:text-rose-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="w-72 bg-slate-900/95 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all">
          {/* Header */}
          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Senorita Live Vision</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize Preview"
                className="p-1 hover:text-white rounded transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onStop}
                title="Stop Sharing"
                className="p-1 hover:text-rose-400 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Video Preview */}
          <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Quick Action Overlay Button */}
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
              <button
                onClick={onManualCapture}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ask About This Screen</span>
              </button>
            </div>
          </div>

          {/* Subtext info */}
          <div className="px-3 py-1.5 bg-slate-950/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Senorita can see your screen live</span>
            <span className="text-emerald-400 font-mono">Active</span>
          </div>
        </div>
      )}
    </div>
  );
}
