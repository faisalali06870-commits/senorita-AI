import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, Copy, Check, Volume2, Sparkles, Terminal, Play, Loader2, X } from 'lucide-react';
import MediaPlayerCard from './MediaPlayerCard';

const EMOTION_MAP = {
  caring: { label: 'Caring & Warm', emoji: '💖', style: 'border-pink-500/30 text-pink-300 bg-pink-950/40' },
  cheerful: { label: 'Cheerful & Radiant', emoji: '✨', style: 'border-amber-500/30 text-amber-300 bg-amber-950/40' },
  playful: { label: 'Sweet & Playful', emoji: '🌸', style: 'border-fuchsia-500/30 text-fuchsia-300 bg-fuchsia-950/40' },
  thoughtful: { label: 'Deep Focus & Architect', emoji: '🧠', style: 'border-indigo-500/30 text-indigo-300 bg-indigo-950/40' },
  confident: { label: 'Ready & Confident', emoji: '⚡', style: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/40' },
};

export default function ChatMessage({ message, onSpeak, theme = 'dark', currentUser }) {
  const isAi = message.role === 'model' || message.role === 'assistant';
  const isDark = theme === 'dark';
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [codeOutputs, setCodeOutputs] = useState({});
  const [runningCodeId, setRunningCodeId] = useState(null);

  const emotionInfo = message.emotion && EMOTION_MAP[message.emotion];

  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyFull = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleRunCode = async (code, language, codeId) => {
    setRunningCodeId(codeId);
    try {
      const res = await fetch('/api/code/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      const data = await res.json();
      setCodeOutputs(prev => ({
        ...prev,
        [codeId]: data
      }));
    } catch (err) {
      setCodeOutputs(prev => ({
        ...prev,
        [codeId]: { stderr: 'Failed to connect to execution runner.', exitCode: 1 }
      }));
    } finally {
      setRunningCodeId(null);
    }
  };

  const canRunLanguage = (lang) => {
    const l = (lang || '').toLowerCase();
    return ['javascript', 'js', 'node', 'python', 'py'].includes(l);
  };

  return (
    <div className={`w-full flex ${isAi ? 'justify-start' : 'justify-end'} py-1.5 sm:py-2 px-1 sm:px-2 md:px-4 transition-all`}>
      <div className={`flex gap-2 sm:gap-3.5 w-full ${isAi ? 'max-w-[96%] sm:max-w-2xl md:max-w-3xl' : 'max-w-[92%] sm:max-w-xl md:max-w-2xl flex-row-reverse'}`}>
        {/* Avatar */}
        <div className="flex-shrink-0 pt-0.5 sm:pt-1">
          {isAi ? (
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/40">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
          ) : (
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr ${currentUser?.avatarGradient || 'from-blue-600 via-indigo-600 to-cyan-500'} flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/30 text-xs sm:text-sm font-semibold`}>
              <span>{currentUser?.avatarIcon || '👤'}</span>
            </div>
          )}
        </div>

        {/* Message Glass Bubble */}
        <div className={`flex-1 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 backdrop-blur-2xl border transition-all relative overflow-hidden ${
          isAi
            ? isDark
              ? 'bg-slate-900/40 border-white/10 text-slate-100 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]'
              : 'bg-white/70 border-white/80 text-slate-800 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]'
            : isDark
            ? 'bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-slate-900/40 border-pink-500/30 text-slate-100 shadow-[0_8px_24px_0_rgba(0,0,0,0.3)]'
            : 'bg-gradient-to-br from-purple-100/90 to-pink-100/70 border-purple-300/80 text-slate-900 shadow-[0_8px_24px_0_rgba(31,38,135,0.06)]'
        }`}>
          {/* Subtle specular glass highlight at the top edge */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* Header Row inside bubble */}
          <div className={`flex items-center justify-between text-xs mb-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span className={`font-semibold tracking-wide ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}>
              {isAi ? 'Senorita-AI' : (currentUser?.name || 'Faisal')}
            </span>
            <div className="flex items-center gap-1.5">
              {isAi && onSpeak && (
                <button
                  onClick={() => onSpeak(message.content)}
                  title="Speak response"
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'hover:text-pink-300 hover:bg-white/10' : 'hover:text-pink-600 hover:bg-black/5'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => handleCopyFull(message.content)}
                title="Copy message"
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:text-blue-300 hover:bg-white/10' : 'hover:text-blue-600 hover:bg-black/5'
                }`}
              >
                {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Emotion indicator badge */}
          {emotionInfo && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md shadow-sm ${emotionInfo.style}`}>
                <span>{emotionInfo.emoji}</span>
                <span>{emotionInfo.label}</span>
              </span>
            </div>
          )}

        {/* Attached Vision Image Preview if user uploaded an image */}
        {message.image && (
          <div className={`my-2 max-w-sm rounded-xl overflow-hidden border shadow-lg ${
            isDark ? 'border-slate-700' : 'border-slate-300'
          }`}>
            <img src={message.image} alt="User attached screen" className="w-full h-auto object-cover max-h-64" />
          </div>
        )}

        {/* System tool execution badge if present */}
        {message.toolAction && (
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-mono my-1 border ${
            isDark ? 'bg-purple-950/50 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-800'
          }`}>
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Action: {message.toolAction}</span>
          </div>
        )}

        {/* Content with Markdown */}
        <div className={`prose max-w-none text-sm leading-relaxed space-y-3 ${
          isDark ? 'prose-invert text-slate-200' : 'text-slate-800'
        }`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const codeString = String(children).replace(/\n$/, '');
                const codeId = `${message.id}-${language}-${codeString.slice(0, 10)}`;
                const isRunnable = canRunLanguage(language);
                const isRunning = runningCodeId === codeId;
                const output = codeOutputs[codeId];

                if (!inline && match) {
                  return (
                    <div className="my-4 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-xl">
                      {/* Code Header Bar */}
                      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs text-slate-400">
                        <span className="font-mono text-xs uppercase tracking-wider text-pink-400 font-semibold">
                          {language}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* Run Code Button */}
                          {isRunnable && (
                            <button
                              onClick={() => handleRunCode(codeString, language, codeId)}
                              disabled={isRunning}
                              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-all"
                            >
                              {isRunning ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Running...</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                                  <span>Run Code</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Copy Code Button */}
                          <button
                            onClick={() => handleCopyCode(codeString, codeId)}
                            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors py-0.5 px-2 rounded hover:bg-slate-700/50"
                          >
                            {copiedIndex === codeId ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-medium">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Code Area */}
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: '1rem',
                          fontSize: '0.875rem',
                          background: '#090d16',
                        }}
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>

                      {/* Embedded Live Console Output */}
                      {output && (
                        <div className="border-t border-slate-800 bg-slate-950/90 p-3 text-xs font-mono space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800/80">
                            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                              <Terminal className="w-3 h-3 text-cyan-400" />
                              <span>Live Console Output ({output.duration})</span>
                            </span>
                            <button
                              onClick={() => setCodeOutputs(prev => ({ ...prev, [codeId]: null }))}
                              className="text-slate-500 hover:text-slate-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {output.stdout && (
                            <pre className="text-emerald-400 whitespace-pre-wrap font-mono text-[11px]">
                              {output.stdout}
                            </pre>
                          )}
                          {output.stderr && (
                            <pre className="text-rose-400 whitespace-pre-wrap font-mono text-[11px]">
                              {output.stderr}
                            </pre>
                          )}
                          {!output.stdout && !output.stderr && (
                            <p className="text-slate-500 italic">Program executed successfully with no stdout output.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <code className="bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-2 leading-relaxed">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc list-inside space-y-1 mb-2 text-slate-300">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal list-inside space-y-1 mb-2 text-slate-300">{children}</ol>;
              },
              a({ href, children }) {
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">
                    {children}
                  </a>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>

          {/* Embedded In-App Media Player (Plays songs & videos directly inside AI) */}
          {message.media && message.media.type === 'youtube' && (
            <MediaPlayerCard media={message.media} theme={theme} />
          )}
        </div>
      </div>
    </div>
  </div>
);
}
