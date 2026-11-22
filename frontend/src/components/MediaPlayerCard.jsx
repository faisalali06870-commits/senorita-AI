import React, { useState } from 'react';
import { Music, Video, X, ExternalLink, Maximize2, Minimize2, Play, Volume2 } from 'lucide-react';

export default function MediaPlayerCard({
  media,
  onClose,
  theme = 'dark'
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  // Auto-play immediately only if media.autoPlay is explicitly true (when freshly commanded)
  const [isPlaying, setIsPlaying] = useState(Boolean(media?.autoPlay));

  if (!media || !media.videoId) return null;

  const isDark = theme === 'dark';

  return (
    <div className={`mt-3 mb-2 rounded-2xl overflow-hidden transition-all duration-300 ${
      isDark
        ? 'bg-slate-900/60 border border-white/10 shadow-2xl backdrop-blur-xl'
        : 'bg-white/80 border border-white/80 shadow-xl backdrop-blur-xl'
    }`}>
      {/* Player Header */}
      <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
        isDark ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-100/70 border-slate-200/80'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Animated Equalizer Bars */}
          <div className="flex items-end gap-0.5 h-4 w-4 flex-shrink-0">
            <span className={`w-1 h-2 bg-pink-500 rounded-full ${isPlaying ? 'animate-[bounce_0.8s_ease-in-out_infinite]' : 'h-1.5'}`} />
            <span className={`w-1 h-4 bg-purple-500 rounded-full ${isPlaying ? 'animate-[bounce_0.5s_ease-in-out_infinite]' : 'h-3'}`} />
            <span className={`w-1 h-3 bg-indigo-500 rounded-full ${isPlaying ? 'animate-[bounce_0.7s_ease-in-out_infinite]' : 'h-2'}`} />
          </div>
          
          <div className="truncate">
            <h4 className={`text-xs font-semibold truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              {media.title || 'Now Playing'}
            </h4>
            <p className="text-[10px] text-pink-400 font-mono">
              {isPlaying ? 'Senorita In-App Player • Playing Now' : 'Senorita In-App Player • Click Play'}
            </p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <a
            href={`https://www.youtube.com/watch?v=${media.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on YouTube (Optional)"
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand Player" : "Minimize Player"}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close Player"
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800' : 'text-slate-500 hover:text-rose-600 hover:bg-slate-200'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Embedded Iframe Player Body OR Thumbnail Preview */}
      {!isMinimized && (
        isPlaying ? (
          <div className="relative aspect-video w-full bg-black flex items-center justify-center">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${media.videoId}?autoplay=1&enablejsapi=1&rel=0`}
              title={media.title || "YouTube video player"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden group select-none">
            <img
              src={`https://img.youtube.com/vi/${media.videoId}/hqdefault.jpg`}
              alt={media.title || 'Video Thumbnail'}
              className="w-full h-full object-cover opacity-65 group-hover:opacity-85 transition-opacity duration-300"
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2.5">
              <button
                onClick={() => setIsPlaying(true)}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 flex items-center justify-center text-white shadow-xl shadow-pink-500/40 transition-all hover:scale-110 active:scale-95 ring-4 ring-white/20"
                title="Play Track"
              >
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </button>
              <span className="text-xs font-semibold text-white drop-shadow tracking-wide">
                Tap to Play Track
              </span>
            </div>
          </div>
        )
      )}

      {/* Footer Info */}
      <div className={`px-4 py-1.5 flex items-center justify-between text-[10px] ${
        isDark ? 'bg-slate-950/40 text-slate-400' : 'bg-slate-100/50 text-slate-500'
      }`}>
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-pink-400" />
          <span>Playing inside Senorita-AI</span>
        </span>
        <span className={`font-mono ${isPlaying ? 'text-purple-400' : 'text-slate-400'}`}>
          {isPlaying ? 'Audio & Video Active' : 'Ready to Play'}
        </span>
      </div>
    </div>
  );
}
