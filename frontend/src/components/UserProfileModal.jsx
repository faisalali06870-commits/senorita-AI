import React, { useState } from 'react';
import { User, Sparkles, Check, X, Shield, Heart } from 'lucide-react';

export const AVATAR_STYLES = [
  { id: 'purple', name: 'Cosmic Boss', gradient: 'from-purple-600 via-pink-600 to-indigo-600', ring: 'ring-purple-400', icon: '👑' },
  { id: 'pink', name: 'Sweet Blossom', gradient: 'from-pink-500 via-rose-500 to-fuchsia-600', ring: 'ring-pink-400', icon: '💖' },
  { id: 'cyan', name: 'Cyber Ocean', gradient: 'from-blue-600 via-cyan-500 to-teal-400', ring: 'ring-cyan-400', icon: '⚡' },
  { id: 'emerald', name: 'Zen Emerald', gradient: 'from-emerald-600 via-teal-500 to-green-400', ring: 'ring-emerald-400', icon: '🌿' },
  { id: 'amber', name: 'Golden Aura', gradient: 'from-amber-500 via-orange-500 to-yellow-400', ring: 'ring-amber-400', icon: '☀️' },
];

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onSaveUser,
  theme = 'dark',
  isFirstTime = false
}) {
  const [name, setName] = useState(currentUser?.name || 'Boss');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatarId || 'purple');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const activeAvatarObj = AVATAR_STYLES.find(a => a.id === selectedAvatar) || AVATAR_STYLES[0];

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setError('Kripya apna naam kam se kam 2 characters ka enter karein.');
      return;
    }
    setError('');
    onSaveUser({
      name: trimmed,
      avatarId: selectedAvatar,
      avatarGradient: activeAvatarObj.gradient,
      avatarIcon: activeAvatarObj.icon,
      savedAt: Date.now()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Backdrop */}
      <div
        onClick={isFirstTime ? undefined : onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity"
      />

      {/* Glassmorphism Modal Card */}
      <div className={`relative w-full max-w-md rounded-3xl p-6 md:p-8 backdrop-blur-3xl border shadow-2xl transition-all duration-300 ${
        isDark
          ? 'bg-slate-950/80 border-white/15 text-slate-100 shadow-[0_16px_50px_0_rgba(0,0,0,0.6)]'
          : 'bg-white/85 border-white/90 text-slate-800 shadow-[0_16px_50px_0_rgba(31,38,135,0.15)]'
      }`}>
        {/* Specular glass highlight line at top */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${activeAvatarObj.gradient} flex items-center justify-center text-white shadow-lg`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide flex items-center gap-1.5">
                {isFirstTime ? 'Welcome to Senorita AI' : 'Personal Profile & Account'}
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {isFirstTime ? 'Senorita aapko kis naam se pukare?' : 'Apna name aur persona personalize karein'}
              </p>
            </div>
          </div>

          {!isFirstTime && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-800 hover:bg-black/5'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Name Input */}
          <div>
            <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Aapka Naam (Your Name)
            </label>
            <div className={`relative flex items-center rounded-2xl border transition-all ${
              isDark
                ? 'bg-slate-900/60 border-white/10 focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/20'
                : 'bg-white/90 border-slate-300 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-500/20 shadow-sm'
            }`}>
              <span className="pl-3.5 pr-2 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Boss, Faisal, Aman, Priya..."
                autoFocus
                maxLength={30}
                className="w-full bg-transparent py-3 pr-4 text-sm font-medium focus:outline-none placeholder-slate-400"
              />
            </div>
            {error && (
              <p className="text-xs text-rose-400 mt-1.5 font-medium">{error}</p>
            )}
          </div>

          {/* Avatar Color / Persona Selector */}
          <div>
            <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Choose Your Theme Avatar
            </label>
            <div className="grid grid-cols-5 gap-2.5">
              {AVATAR_STYLES.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`h-11 rounded-2xl bg-gradient-to-tr ${avatar.gradient} flex items-center justify-center text-white text-base shadow-md transition-all hover:scale-105 relative ${
                      isSelected ? 'ring-2 ring-white scale-105 shadow-lg' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={avatar.name}
                  >
                    <span>{avatar.icon}</span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-slate-900 rounded-full flex items-center justify-center text-[10px] shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Greeting Preview Card */}
          <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1 ${
            isDark ? 'bg-pink-950/20 border-pink-500/25 text-pink-200' : 'bg-pink-50 border-pink-200 text-pink-900'
          }`}>
            <div className="flex items-center gap-1.5 font-semibold text-pink-500">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Senorita Live Greeting:</span>
            </div>
            <p className="italic font-medium">
              "Yes {name.trim() ? (name.trim().toLowerCase() === 'boss' ? 'Boss' : `Boss ${name.trim()}`) : 'Boss'}! Senorita here, ready for your command. Bataiye aaj kya execute karna hai? ⚡"
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            {!isFirstTime && (
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-semibold border transition-all ${
                  isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-semibold text-xs tracking-wide shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isFirstTime ? 'Start Journey with Senorita ✨' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
