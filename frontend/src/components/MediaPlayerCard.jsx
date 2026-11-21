import React, { useState } from 'react';
import { Music, Video, X, ExternalLink, Maximize2, Minimize2, Play, Volume2 } from 'lucide-react';

export default function MediaPlayerCard({
  media,
  onClose,
  theme = 'dark'
}) {
  const [isMinimized, setIsMinimized] = useState(false);

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
            <span className="w-1 h-2 bg-pink-500 rounded-full animate-[bounce_0.8s_ease-in-out_infinite]" />
            <span className="w-1 h-4 bg-purple-500 rounded-full animate-[bounce_0.5s_ease-in-out_infinite]" />
            <span className="w-1 h-3 bg-indigo-500 rounded-full animate-[bounce_0.7s_ease-in-out_infinite]" />
          </div>
          
          <div className="truncate">
            <h4 className={`text-xs font-semibold truncate ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              {media.title || 'Now Playing'}
            </h4>
            <p className="text-[10px] text-pink-400 font-mono">Senorita In-App Player • Playing Now</p>
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

      {/* Embedded Iframe Player Body */}
      {!isMinimized && (
        <div className="relative aspect-video w-full bg-black flex items-center justify-center">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${media.videoId}?autoplay=1&enablejsapi=1&rel=0`}
            title={media.title || "YouTube video player"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* Footer Info */}
      <div className={`px-4 py-1.5 flex items-center justify-between text-[10px] ${
        isDark ? 'bg-slate-950/40 text-slate-400' : 'bg-slate-100/50 text-slate-500'
      }`}>
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-pink-400" />
          <span>Playing inside Senorita-AI</span>
        </span>
        <span className="font-mono text-purple-400">Audio & Video Active</span>
      </div>
    </div>
  );
}
