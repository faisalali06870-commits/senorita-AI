import React, { useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, Languages, Settings2, Radio, Image as ImageIcon, X, Monitor } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  onSubmit,
  isListening,
  onToggleListen,
  isSpeaking,
  onStopSpeak,
  speechEnabled,
  setSpeechEnabled,
  lang,
  setLang,
  isLoading,
  onOpenVoiceSettings,
  senoritaMode,
  setSenoritaMode,
  interimTranscript,
  attachedImage,
  setAttachedImage,
  isScreenSharing,
  onToggleScreenShare,
  theme = 'dark'
}) {
  const isDark = theme === 'dark';
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Clipboard Paste Support (Win+Shift+S -> Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setAttachedImage(event.target.result);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Zero-Layout-Shift Fixed Status Bar */}
      <div className="h-8 mb-2 flex items-center justify-center transition-all select-none">
        {isSpeaking ? (
          <button
            onClick={onStopSpeak}
            className="px-4 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-medium flex items-center gap-2 hover:bg-purple-500/30 transition-all shadow-lg animate-pulse"
          >
            <Volume2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Senorita is speaking... Click to mute</span>
          </button>
        ) : interimTranscript ? (
          <div className="px-4 py-1 rounded-full bg-pink-500/15 border border-pink-500/40 text-pink-300 text-xs font-medium flex items-center gap-2 shadow-lg shadow-pink-500/10 max-w-lg truncate">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping flex-shrink-0" />
            <span className="truncate">
              Hearing: <span className="text-white font-semibold italic">"{interimTranscript}"</span>
            </span>
          </div>
        ) : isListening ? (
          <div className="px-4 py-1 rounded-full bg-slate-900/80 border border-pink-500/30 text-pink-300 text-xs font-medium flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse flex-shrink-0" />
            <span>
              {senoritaMode ? 'Senorita Mode: Listening for your voice...' : 'Listening... Speak now'}
            </span>
          </div>
        ) : isLoading ? (
          <div className="px-4 py-1 rounded-full bg-slate-900/80 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            <span>Senorita is thinking & analyzing...</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 opacity-60">
            <span>Senorita-AI Desktop Companion</span>
          </div>
        )}
      </div>

      {/* Attached Image Thumbnail Preview */}
      {attachedImage && (
        <div className="relative inline-flex items-center gap-2 mb-2 p-1.5 bg-slate-900 border border-pink-500/40 rounded-xl shadow-lg">
          <img src={attachedImage} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-slate-700" />
          <div className="text-xs text-slate-300 pr-6">
            <p className="font-semibold text-pink-400">Screen / Image Attached</p>
            <p className="text-[10px] text-slate-400">Senorita will analyze this visual</p>
          </div>
          <button
            onClick={() => setAttachedImage(null)}
            className="absolute top-1 right-1 p-1 bg-slate-800 hover:bg-red-500/40 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className={`relative rounded-3xl transition-all ${
        isDark
          ? 'bg-slate-900/50 border border-white/15 shadow-[0_12px_40px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl focus-within:border-pink-500/60 focus-within:ring-2 focus-within:ring-pink-500/20'
          : 'bg-white/80 border border-white/90 shadow-[0_12px_40px_0_rgba(31,38,135,0.09)] backdrop-blur-2xl focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20'
      }`}>
        {/* Top Controls Row */}
        <div className={`flex items-center justify-between px-3 pt-2 text-xs border-b flex-wrap gap-2 pb-1.5 ${
          isDark ? 'border-white/5 text-slate-400' : 'border-slate-200/80 text-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            {/* Hands-Free Senorita Mode Toggle */}
            <button
              type="button"
              onClick={() => setSenoritaMode(!senoritaMode)}
              title="Continuous Auto-Listening like Senorita"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                senoritaMode
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-500/20 ring-1 ring-pink-400'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${senoritaMode ? 'animate-pulse text-pink-200' : ''}`} />
              <span>{senoritaMode ? 'Senorita Mode: ON' : 'Senorita Mode: OFF'}</span>
            </button>

            {/* Language toggle */}
            <button
              type="button"
              onClick={() => {
                const next = lang === 'hi-IN' ? 'en-IN' : 'hi-IN';
                setLang(next);
                localStorage.setItem('senorita_lang', next);
              }}
              title="Click to toggle language between Hindi/Hinglish and English"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                lang === 'hi-IN'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              }`}
            >
              <Languages className="w-3.5 h-3.5 text-pink-400" />
              <span>{lang === 'hi-IN' ? '🇮🇳 Hindi / Hinglish' : '🌐 English'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Live Screen Share Button */}
            <button
              type="button"
              onClick={onToggleScreenShare}
              title={isScreenSharing ? "Click to stop live screen share" : "Share your computer screen live with Senorita"}
              className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                isScreenSharing
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
              }`}
            >
              <Monitor className={`w-3.5 h-3.5 ${isScreenSharing ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{isScreenSharing ? 'Screen: LIVE' : 'Live Screen'}</span>
            </button>

            {/* Screen Vision / Image Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach screen / image for Senorita to see"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-pink-300 hover:bg-slate-800 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Upload</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFile}
              accept="image/*"
              className="hidden"
            />

            {/* Voice Settings Button */}
            <button
              type="button"
              onClick={onOpenVoiceSettings}
              title="Change Voice & Speed"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-pink-300 hover:bg-slate-800 transition-colors"
            >
              <Settings2 className="w-3 h-3 text-purple-400" />
              <span>Voice</span>
            </button>

            {/* Auto-Speech Toggle */}
            <button
              type="button"
              onClick={() => setSpeechEnabled(!speechEnabled)}
              title={speechEnabled ? 'Voice reply enabled' : 'Voice reply muted'}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
                speechEnabled ? 'text-pink-300 bg-pink-950/40' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {speechEnabled ? <Volume2 className="w-3 h-3 text-pink-400" /> : <VolumeX className="w-3 h-3" />}
              <span>{speechEnabled ? 'Voice ON' : 'Muted'}</span>
            </button>
          </div>
        </div>

        {/* Text Area & Action Buttons */}
        <div className="flex items-end gap-2 p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isScreenSharing
                ? "Senorita can see your screen live! Speak or ask anything about what's visible on your screen..."
                : senoritaMode
                ? "Senorita Mode Active — Speak anytime hands-free! Or paste screenshot (Ctrl+V)..."
                : isListening
                ? "Listening to your voice..."
                : "Ask Senorita anything, give voice commands, paste code or screenshots (Ctrl+V)..."
            }
            className={`flex-1 bg-transparent text-sm focus:outline-none resize-none max-h-44 py-1.5 px-2 ${
              isDark ? 'text-slate-100 placeholder-slate-400' : 'text-slate-800 placeholder-slate-500'
            }`}
          />

          {/* Voice Input (Mic) Button */}
          <button
            type="button"
            onClick={onToggleListen}
            title={isListening ? 'Stop listening' : 'Start listening'}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                : isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send Button */}
          <button
            type="button"
            disabled={(!input.trim() && !isListening && !attachedImage) || isLoading}
            onClick={onSubmit}
            title="Send Message"
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center flex-shrink-0 ${
              (input.trim() || attachedImage) && !isLoading
                ? 'bg-gradient-to-tr from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-600/20'
                : isDark
                ? 'bg-slate-800/60 text-slate-500 cursor-not-allowed'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="hidden sm:block text-[11px] text-slate-400">
          Tip: Press <strong className="text-pink-400">Win + Shift + S</strong> to snip any error on your screen, then press <strong className="text-pink-400">Ctrl + V</strong> here to let Senorita solve it!
        </p>
        <p className="sm:hidden text-[11px] text-slate-400">
          Tip: Tap <strong className="text-pink-400">Mic</strong> to talk or upload images directly to Senorita!
        </p>
      </div>
    </div>
  );
}
