import React from 'react';
import { Plus, MessageSquare, Trash2, Sparkles, Laptop } from 'lucide-react';

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  setIsOpen,
  serverStatus,
  theme = 'dark',
  currentUser,
  onOpenProfile
}) {
  const isDark = theme === 'dark';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 w-72 h-full flex-shrink-0 backdrop-blur-2xl border-r flex flex-col transition-all duration-300 ease-in-out ${
          isDark
            ? 'bg-slate-950/70 border-white/10 text-slate-100 shadow-[4px_0_24px_0_rgba(0,0,0,0.4)]'
            : 'bg-white/70 border-white/80 text-slate-800 shadow-[4px_0_24px_0_rgba(31,38,135,0.08)]'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-white/10' : 'border-white/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25 ring-1 ring-purple-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className={`font-bold text-sm tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                SENORITA <span className="text-pink-500">AI</span>
              </h1>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Smart Desktop Assistant</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-pink-500/15 text-pink-400 border border-pink-500/30 shadow-sm">
            v2.5
          </span>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewSession();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500/85 via-purple-600/85 to-indigo-600/85 hover:from-pink-500 hover:to-indigo-600 border border-white/20 text-white font-medium text-sm transition-all shadow-lg shadow-purple-600/25 active:scale-[0.98] backdrop-blur-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-1">
          <div className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${
            isDark ? 'text-slate-500' : 'text-slate-400'
          }`}>
            Conversations
          </div>
          {sessions.length === 0 ? (
            <div className={`text-xs px-3 py-4 text-center ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              No previous chats yet
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === currentSessionId;
              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    onSelectSession(sess.id);
                    setIsOpen(false);
                  }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-white/10 text-white border border-white/20 font-medium shadow-md backdrop-blur-xl'
                        : 'bg-purple-500/15 text-purple-950 border border-purple-400/50 font-medium shadow-md backdrop-blur-xl'
                      : isDark
                      ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                      : 'text-slate-600 hover:bg-black/5 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-pink-400' : 'text-slate-400'}`} />
                    <span className="truncate">{sess.title || 'Untitled Conversation'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(sess.id);
                    }}
                    title="Delete Chat"
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Capabilities Pill Box */}
        <div className={`p-3 mx-2.5 mb-2.5 rounded-2xl text-[11px] space-y-1.5 border transition-all ${
          isDark
            ? 'bg-slate-900/50 border-white/10 text-slate-400 backdrop-blur-xl'
            : 'bg-white/80 border-white/90 text-slate-600 shadow-sm backdrop-blur-xl'
        }`}>
          <div className={`flex items-center gap-1.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            <Laptop className="w-3.5 h-3.5 text-pink-400" />
            <span>Senorita-AI Desktop</span>
          </div>
          <p className="text-[10px] leading-relaxed">
            Live Screen Vision, Melodious Neural Voice, In-Chat Media & Code Execution.
          </p>
        </div>

        {/* Footer Server Status & Profile Pill */}
        <div className={`p-3 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-white/10 text-slate-400' : 'border-white/80 text-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-red-400'} animate-pulse`} />
            <span className="font-mono text-[11px] capitalize">{serverStatus}</span>
          </div>
          <button
            onClick={onOpenProfile}
            title="Edit profile & user persona"
            className="text-[10px] text-pink-400 hover:text-pink-300 font-mono truncate max-w-[120px] transition-colors"
          >
            {currentUser?.name ? `${currentUser.name}'s AI` : 'Personal AI'}
          </button>
        </div>
      </aside>
    </>
  );
}
