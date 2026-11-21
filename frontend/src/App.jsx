import React, { useState, useEffect, useRef } from 'react';
import { Menu, Sparkles, Bot, Code2, Globe, Cpu, Volume2, ArrowRight, Settings2, Radio, Music, Brain, Monitor, Sun, Moon } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import VoiceSettingsModal from './components/VoiceSettingsModal';
import GlowingOrb from './components/GlowingOrb';
import LiveScreenPreview from './components/LiveScreenPreview';
import MediaPlayerCard from './components/MediaPlayerCard';

const INITIAL_GREETING = "Hola Faisal! Main Senorita-AI hoon, aapki personal companion aur senior coding partner. Main aapke har jazbaat samajhti hoon aur aapke har project me madad karne ke liye taiyar hoon. Aaj hum kya banayein?";

// Helper to filter out code blocks before sending text to SpeechSynthesis/EdgeTTS
function cleanTextForSpeech(text) {
  if (!text) return '';
  let clean = text.replace(/```[\s\S]*?```/g, ' Maine code screen par show kar diya hai.');
  clean = clean.replace(/`([^`]+)`/g, '$1');
  clean = clean.replace(/[*_#~]/g, '');
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  clean = clean.replace(/\[emotion:[^\]]+\]/gi, '');
  return clean.trim();
}

export default function App() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('senorita_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    const defaultId = 'sess_' + Date.now();
    return [{
      id: defaultId,
      title: 'New Conversation',
      messages: [{
        id: 'msg_0',
        role: 'model',
        content: INITIAL_GREETING,
        emotion: 'caring',
        timestamp: Date.now()
      }]
    }];
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => sessions[0]?.id || 'sess_' + Date.now());
  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [lang, setLang] = useState(() => localStorage.getItem('senorita_lang') || 'hi-IN');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState('online');

  // Hands-Free Senorita Mode & Studio Neural Voice States
  const [senoritaMode, setSenoritaMode] = useState(() => localStorage.getItem('senorita_mode') === 'true');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => localStorage.getItem('senorita_neural_voice') || 'hi-IN-SwaraNeural');
  const [speechRate, setSpeechRate] = useState(() => parseFloat(localStorage.getItem('senorita_speech_rate')) || 1.05);
  const [speechPitch, setSpeechPitch] = useState(() => parseFloat(localStorage.getItem('senorita_speech_pitch')) || 1.05);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('caring');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('senorita_theme') || 'dark');
  const [activeMedia, setActiveMedia] = useState(null);

  // Sync theme
  useEffect(() => {
    localStorage.setItem('senorita_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const cooldownTimeoutRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const speechAccumulatorRef = useRef('');
  const isSpeakingRef = useRef(false);
  const isBusyRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);
  const senoritaModeRef = useRef(senoritaMode);

  // Sync ref & persistence
  useEffect(() => {
    senoritaModeRef.current = senoritaMode;
    localStorage.setItem('senorita_mode', senoritaMode);
    if (senoritaMode) {
      startListening();
    } else {
      stopListening();
    }
  }, [senoritaMode]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem('senorita_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Auto-scroll chat smoothly inside message container only (prevents window scrolling)
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentSession?.messages, isLoading]);

  // Check backend server status
  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('/api/health', { method: 'GET' }).catch(() => null);
        if (res && res.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('online');
        }
      } catch {
        setServerStatus('offline');
      }
    };
    checkServer();
  }, []);

  const handleSelectVoice = (voiceId) => {
    setSelectedVoiceId(voiceId);
    localStorage.setItem('senorita_neural_voice', voiceId);
  };

  const handleRateChange = (r) => {
    setSpeechRate(r);
    localStorage.setItem('senorita_speech_rate', r);
  };

  const handlePitchChange = (p) => {
    setSpeechPitch(p);
    localStorage.setItem('senorita_speech_pitch', p);
  };

  const handleTestVoice = (voiceId) => {
    const vId = voiceId || selectedVoiceId;
    speak("Namaste Faisal! Main Senorita hoon. Yeh meri asli melodious aawaz hai. Main aapke har jazbaat aur feelings ko samajhti hoon.", vId);
  };

  // Setup Web Speech API for voice recognition (Continuous + Instant)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      isRecognitionActiveRef.current = true;
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      // Discard results if AI is thinking or speaking
      if (isSpeakingRef.current || isBusyRef.current) return;

      let currentInterim = '';
      let currentFinal = '';

      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          currentFinal += item[0].transcript + ' ';
        } else {
          currentInterim += item[0].transcript + ' ';
        }
      }

      // Combine with previously finalized speech across recognition cycles
      const combined = (speechAccumulatorRef.current + ' ' + currentFinal + ' ' + currentInterim)
        .replace(/\s+/g, ' ')
        .trim();

      if (!combined) return;

      // Stream words live to transcript indicator & chat input box
      setInterimTranscript(combined);
      setInput(combined);
      latestTranscriptRef.current = combined;

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      // In Hands-Free Senorita Mode: auto-send with generous, human-friendly pauses
      if (senoritaModeRef.current) {
        const words = combined.split(/\s+/).filter(Boolean);
        // Never auto-send fragmented single syllables like "Tu", "Ki", "Ha" — wait for full sentence!
        if (words.length < 2 && combined.length < 6) {
          return;
        }

        // Generous 3800ms silence timer so user can speak naturally without being cut off
        silenceTimerRef.current = setTimeout(() => {
          const textToSend = latestTranscriptRef.current.trim();
          if (textToSend && textToSend.length > 2) {
            triggerCommit(textToSend);
          }
        }, 3800);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        console.warn('Microphone permission blocked.');
        senoritaModeRef.current = false;
        setSenoritaMode(false);
      }
      isRecognitionActiveRef.current = false;
      if (!senoritaModeRef.current) {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      isRecognitionActiveRef.current = false;

      // Do NOT restart if AI is generating, executing code, or speaking
      if (isBusyRef.current || isSpeakingRef.current) {
        setIsListening(false);
        return;
      }

      // In Senorita Mode, Chrome cycles recognition chunks. Preserve accumulated speech!
      if (senoritaModeRef.current) {
        if (latestTranscriptRef.current) {
          speechAccumulatorRef.current = latestTranscriptRef.current;
        }

        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (senoritaModeRef.current && !isBusyRef.current && !isSpeakingRef.current && !isRecognitionActiveRef.current) {
            startListening();
          } else if (!senoritaModeRef.current) {
            setIsListening(false);
          }
        }, 250);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    if (senoritaMode && !isBusyRef.current) {
      setTimeout(() => {
        if (!isRecognitionActiveRef.current && !isBusyRef.current) startListening();
      }, 400);
    }

    return () => {
      isRecognitionActiveRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
      try { recognition.abort(); } catch (e) { }
    };
  }, [lang]);

  const startListening = () => {
    if (isBusyRef.current || isSpeakingRef.current || isRecognitionActiveRef.current) return;
    const recognition = recognitionRef.current;
    if (!recognition) return;

    try {
      recognition.lang = lang;
      recognition.start();
      isRecognitionActiveRef.current = true;
      setIsListening(true);
    } catch (err) {
      if (err.name !== 'InvalidStateError') {
        console.warn('Recognition start caught:', err);
      }
    }
  };

  const stopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    const recognition = recognitionRef.current;
    if (recognition && isRecognitionActiveRef.current) {
      isRecognitionActiveRef.current = false;
      try {
        recognition.abort();
      } catch (err) { }
    }
    setIsListening(false);
  };

  // Trigger speech commit (captures full complete sentence)
  const triggerCommit = (textToSend) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    speechAccumulatorRef.current = '';
    latestTranscriptRef.current = '';
    setInterimTranscript('');

    // Abort recognition to flush Chrome's internal audio buffers
    isBusyRef.current = true;
    const recognition = recognitionRef.current;
    if (recognition && isRecognitionActiveRef.current) {
      isRecognitionActiveRef.current = false;
      try { recognition.abort(); } catch (e) { }
    }
    setIsListening(false);

    handleSendMessage(textToSend);
  };

  const toggleListening = () => {
    if (isListening || isRecognitionActiveRef.current) {
      stopListening();
      const textToSend = (latestTranscriptRef.current || input).trim();
      if (textToSend) {
        triggerCommit(textToSend);
      }
    } else {
      speechAccumulatorRef.current = '';
      latestTranscriptRef.current = '';
      setInterimTranscript('');
      isBusyRef.current = false;
      startListening();
    }
  };

  // High-Fidelity Studio Neural Voice Player with Echo-Cancelling Cooldown
  const speak = (text, overrideVoiceId) => {
    // Clear any active audio or synthesizers
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) { }
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const spokenText = cleanTextForSpeech(text);
    if (!spokenText) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      isBusyRef.current = false;
      if (senoritaModeRef.current) {
        setTimeout(startListening, 300);
      }
      return;
    }

    // Stop microphone immediately while Senorita is speaking
    stopListening();
    isBusyRef.current = true;
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    try {
      const activeVoice = overrideVoiceId || selectedVoiceId;
      const rateParam = (speechRate >= 1 ? '+' : '') + Math.round((speechRate - 1) * 100) + '%';
      const audioUrl = `/api/tts?text=${encodeURIComponent(spokenText)}&voice=${encodeURIComponent(activeVoice)}&rate=${encodeURIComponent(rateParam)}`;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      const handleSpeechDone = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        // 750ms acoustic cooldown so laptop speaker decay doesn't get heard by microphone!
        if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
        cooldownTimeoutRef.current = setTimeout(() => {
          isBusyRef.current = false;
          if (senoritaModeRef.current && !isSpeakingRef.current) {
            startListening();
          }
        }, 750);
      };

      audio.onended = handleSpeechDone;
      audio.onerror = () => {
        console.warn('Neural TTS stream error, falling back to local speech.');
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(spokenText);
          utterance.onend = handleSpeechDone;
          utterance.onerror = handleSpeechDone;
          window.speechSynthesis.speak(utterance);
        } else {
          handleSpeechDone();
        }
      };

      audio.play().catch((err) => {
        console.warn('Audio play prevented or interrupted:', err);
        handleSpeechDone();
      });
    } catch (e) {
      console.error('Audio playback error:', e);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      isBusyRef.current = false;
      if (senoritaModeRef.current) {
        setTimeout(startListening, 300);
      }
    }
  };

  const stopSpeaking = () => {
    if (cooldownTimeoutRef.current) clearTimeout(cooldownTimeoutRef.current);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) { }
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    isBusyRef.current = false;
    if (senoritaModeRef.current) {
      setTimeout(startListening, 300);
    }
  };

  // Live Screen Capture & Stream Methods
  const captureScreenFrame = () => {
    const video = screenVideoRef.current;
    if (!video || video.videoWidth === 0) return null;

    try {
      const canvas = document.createElement('canvas');
      const maxDim = 1280;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, width, height);
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch (e) {
      console.warn('Screen frame capture error:', e);
      return null;
    }
  };

  const startScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      alert("Screen sharing is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false
      });

      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        screenVideoRef.current.play().catch(() => {});
      }
      setIsScreenSharing(true);

      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          stopScreenShare();
        };
      }

      // Voice acknowledgement
      const greeting = "Maine aapki screen live dekhna shuru kar diya hai, Faisal! Ab aap apna VS Code ya koi bhi tab screen par open kijiye, main direct screen dekh kar help karungi.";
      const noticeMsg = {
        id: 'msg_' + Date.now(),
        role: 'model',
        content: greeting,
        emotion: 'confident',
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, noticeMsg] } : s));
      if (speechEnabled) speak(greeting);
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.warn('Screen share error:', err);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  // Handle Send Message (With Live Screen Vision & Strict Busy Lock)
  const handleSendMessage = async (textToSend) => {
    const messageContent = (textToSend || input).trim();
    if ((!messageContent && !attachedImage && !isScreenSharing) || isLoading) return;

    // Lock busy state & stop speech/recognition
    isBusyRef.current = true;
    speechAccumulatorRef.current = '';
    latestTranscriptRef.current = '';
    stopListening();
    stopSpeaking();

    // Auto-grab current live screen frame if screen share is active and no manual screenshot attached
    let currentImage = attachedImage;
    if (!currentImage && isScreenSharing) {
      currentImage = captureScreenFrame();
    }

    setInput('');
    setAttachedImage(null);
    setInterimTranscript('');

    const userMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: messageContent || (currentImage ? "Senorita, meri live screen dekh kar batao kya chal raha hai aur meri help karo." : "Hello!"),
      image: currentImage,
      timestamp: Date.now()
    };

    // Update session title on first message
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const isFirstMessage = s.messages.length <= 1;
        const newTitle = messageContent ? messageContent.slice(0, 32) : 'Visual Screen Analysis';
        return {
          ...s,
          title: isFirstMessage ? newTitle : s.title,
          messages: [...s.messages, userMessage]
        };
      }
      return s;
    }));

    setIsLoading(true);

    try {
      const history = (currentSession?.messages || [])
        .concat(userMessage)
        .map(m => ({
          role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: messageContent,
          history: history.slice(-6),
          imageBase64: currentImage,
          imageMime: 'image/png'
        })
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.reply || `Server error (${res.status}). Please check backend.`);
      }

      const replyText = data?.reply || "I didn't receive a valid reply.";
      const toolAction = data?.toolAction || null;
      const media = data?.media || null;
      const emotion = data?.emotion || 'caring';
      setCurrentEmotion(emotion);

      if (media) {
        setActiveMedia(media);
      }

      const aiMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        content: replyText,
        toolAction: toolAction,
        media: media,
        emotion: emotion,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, aiMessage]
          };
        }
        return s;
      }));

      // Speak reply if enabled
      if (speechEnabled) {
        speak(replyText);
      } else {
        isBusyRef.current = false;
        if (senoritaModeRef.current) {
          setTimeout(startListening, 300);
        }
      }
    } catch (err) {
      console.error(err);
      const isNetwork = err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('network');
      const errorMsg = isNetwork
        ? "My backend server is not running on port 3000, Faisal. Please start server.js or run `run_senorita.bat`."
        : err.message;

      const errAiMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'model',
        content: errorMsg,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...s.messages, errAiMessage] };
        }
        return s;
      }));

      if (speechEnabled) {
        speak(errorMsg);
      } else {
        isBusyRef.current = false;
        if (senoritaModeRef.current) {
          setTimeout(startListening, 300);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Session Handlers
  const handleNewSession = () => {
    const newId = 'sess_' + Date.now();
    const newSession = {
      id: newId,
      title: 'New Conversation',
      messages: [{
        id: 'msg_0',
        role: 'model',
        content: INITIAL_GREETING,
        emotion: 'caring',
        timestamp: Date.now()
      }]
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
  };

  const handleDeleteSession = (id) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const fallbackId = 'sess_' + Date.now();
        const fallback = {
          id: fallbackId,
          title: 'New Conversation',
          messages: [{
            id: 'msg_0',
            role: 'model',
            content: INITIAL_GREETING,
            emotion: 'caring',
            timestamp: Date.now()
          }]
        };
        setCurrentSessionId(fallbackId);
        return [fallback];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Quick Action Card Prompts
  const quickActions = [
    { title: 'Solve & Run Code', desc: 'Full-Stack Mentor', prompt: 'Write a JavaScript function to find Fibonacci numbers and explain it step by step' },
    { title: 'Play Relaxing Lofi', desc: 'Music & Vibes', prompt: 'Play some soothing lofi chill beats for me' },
    { title: 'Open VS Code & Chrome', desc: 'Desktop Control', prompt: 'Open VS Code and Google Chrome for me' },
    { title: 'Hardware: Volume & Sleep', desc: 'PC Control', prompt: 'Increase laptop volume and check battery' },
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`relative flex h-screen overflow-hidden font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#060913] text-slate-100' : 'bg-[#f0f3fa] text-slate-800'
    }`}>
      {/* Ambient Glowing Gradient Spheres for Glassmorphism Refraction */}
      <div className={`pointer-events-none absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-[120px] transition-all duration-700 animate-float-1 ${
        isDark ? 'bg-gradient-to-tr from-pink-600/35 to-rose-500/25' : 'bg-gradient-to-tr from-pink-400/35 to-rose-300/25'
      }`} />
      <div className={`pointer-events-none absolute top-1/4 -right-32 w-[580px] h-[580px] rounded-full blur-[130px] transition-all duration-700 animate-float-2 ${
        isDark ? 'bg-gradient-to-bl from-purple-600/40 to-indigo-600/30' : 'bg-gradient-to-bl from-purple-400/35 to-indigo-300/25'
      }`} />
      <div className={`pointer-events-none absolute -bottom-32 left-1/4 w-[480px] h-[480px] rounded-full blur-[120px] transition-all duration-700 animate-float-3 ${
        isDark ? 'bg-gradient-to-tr from-cyan-500/25 to-blue-600/20' : 'bg-gradient-to-tr from-cyan-400/30 to-blue-400/20'
      }`} />

      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        serverStatus={serverStatus}
        theme={theme}
      />

      {/* Main Chat Workspace */}
      <div className={`relative flex-1 flex flex-col h-full min-h-0 min-w-0 z-10 transition-colors duration-300 ${
        isDark ? 'bg-[#070b14]/55' : 'bg-white/45'
      } backdrop-blur-2xl`}>
        {/* Top Navbar */}
        <header className={`h-16 px-4 md:px-6 border-b flex items-center justify-between flex-shrink-0 z-20 transition-colors duration-300 ${
          isDark
            ? 'border-white/10 bg-slate-950/45 backdrop-blur-2xl shadow-sm'
            : 'border-white/80 bg-white/70 backdrop-blur-2xl shadow-sm'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg transition-colors md:hidden ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-pink-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className={`text-sm font-semibold truncate max-w-[180px] sm:max-w-md ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                {currentSession?.title || 'Senorita-AI'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Screen Sharing Header Toggle */}
            <button
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              title={isScreenSharing ? "Click to stop live screen sharing" : "Share your computer screen live with Senorita"}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
                isScreenSharing
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : isDark
                  ? 'bg-slate-900/80 text-slate-300 hover:text-white border-white/10 hover:border-white/20'
                  : 'bg-white text-slate-700 hover:text-slate-900 border-slate-300 hover:border-slate-400 shadow-sm'
              }`}
            >
              <Monitor className={`w-3.5 h-3.5 ${isScreenSharing ? 'text-emerald-400 animate-pulse' : isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <span>{isScreenSharing ? 'Live Screen: ON' : 'Share Screen'}</span>
            </button>

            {/* Senorita Hands-Free Quick Indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
              senoritaMode
                ? 'bg-pink-950/50 text-pink-300 border-pink-500/40 shadow-sm shadow-pink-500/20'
                : isDark
                ? 'bg-slate-900/80 text-slate-400 border-white/10'
                : 'bg-white text-slate-600 border-slate-300'
            }`}>
              <Radio className={`w-3 h-3 ${senoritaMode ? 'text-pink-400 animate-pulse' : 'text-slate-400'}`} />
              <span>{senoritaMode ? 'Auto-Listen' : 'Push-to-Talk'}</span>
            </div>

            {/* Dark / Light Mode Switcher Button */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className={`p-1.5 rounded-lg border transition-all ${
                isDark
                  ? 'border-white/10 bg-slate-900/80 text-amber-300 hover:text-amber-200 hover:bg-slate-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:text-purple-600 hover:bg-slate-100 shadow-sm'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Voice Settings Gear Button */}
            <button
              onClick={() => setVoiceSettingsOpen(true)}
              title="Voice & Speech Settings"
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-pink-300 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-slate-100'
              }`}
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <div className={`hidden md:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${
              isDark
                ? 'text-slate-400 bg-slate-900/80 border-white/10'
                : 'text-slate-600 bg-white border-slate-200 shadow-sm'
            }`}>
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Gemini 3.5 Flash Lite</span>
            </div>
          </div>
        </header>

        {/* Chat Messages Scrollable Container */}
        <main ref={chatScrollContainerRef} className="flex-1 overflow-y-auto px-2 md:px-4 py-4 space-y-3">
          {currentSession?.messages.length <= 1 ? (
            <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center text-center space-y-5">
              {/* Centerpiece 3D Glowing Holographic Orb */}
              <GlowingOrb
                isListening={isListening}
                isSpeaking={isSpeaking}
                emotion={currentEmotion}
              />

              <div>
                <h3 className={`text-2xl font-bold tracking-wide ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Welcome back, Faisal!
                </h3>
                <p className={`text-sm mt-1 max-w-md ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  I am Senorita-AI. I understand your feelings, run code live, play your songs & videos in-app, and listen hands-free!
                </p>
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(action.prompt)}
                    className={`p-3.5 rounded-2xl text-left transition-all hover:scale-[1.01] group shadow-lg backdrop-blur-xl ${
                      isDark
                        ? 'bg-slate-900/60 hover:bg-slate-850/80 border border-white/10 hover:border-pink-500/40 text-slate-200 hover:text-white'
                        : 'bg-white/80 hover:bg-white border border-slate-200/80 hover:border-purple-400 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-pink-500 font-semibold mb-1">
                      <span>{action.desc}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-sm font-medium">
                      {action.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-3">
              {currentSession.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onSpeak={speak}
                  theme={theme}
                />
              ))}

              {isLoading && (
                <div className={`py-4 px-5 rounded-3xl flex items-center gap-4 max-w-md backdrop-blur-xl border ${
                  isDark
                    ? 'bg-slate-900/50 border-white/10 text-slate-200 shadow-xl'
                    : 'bg-white/70 border-white/80 text-slate-800 shadow-lg'
                }`}>
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md animate-pulse">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-semibold text-pink-400">Senorita-AI is thinking & analyzing...</div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={chatBottomRef} />
        </main>

        {/* Chat Input Bar */}
        <footer className="flex-shrink-0 px-2 md:px-4 pb-3">
          <ChatInput
            input={input}
            setInput={setInput}
            onSubmit={() => handleSendMessage()}
            isListening={isListening}
            onToggleListen={toggleListening}
            isSpeaking={isSpeaking}
            onStopSpeak={stopSpeaking}
            speechEnabled={speechEnabled}
            setSpeechEnabled={setSpeechEnabled}
            lang={lang}
            setLang={setLang}
            isLoading={isLoading}
            onOpenVoiceSettings={() => setVoiceSettingsOpen(true)}
            senoritaMode={senoritaMode}
            setSenoritaMode={setSenoritaMode}
            interimTranscript={interimTranscript}
            attachedImage={attachedImage}
            setAttachedImage={setAttachedImage}
            isScreenSharing={isScreenSharing}
            onToggleScreenShare={isScreenSharing ? stopScreenShare : startScreenShare}
            theme={theme}
          />
        </footer>
      </div>

      {/* Live Screen Sharing Floating Video Preview */}
      <LiveScreenPreview
        videoRef={screenVideoRef}
        isActive={isScreenSharing}
        onStop={stopScreenShare}
        onManualCapture={() => handleSendMessage("Analyze my live screen right now and tell me what you see.")}
      />

      {/* Voice Customization Settings Modal */}
      <VoiceSettingsModal
        isOpen={voiceSettingsOpen}
        onClose={() => setVoiceSettingsOpen(false)}
        selectedVoiceId={selectedVoiceId}
        onSelectVoice={handleSelectVoice}
        speechRate={speechRate}
        onRateChange={handleRateChange}
        speechPitch={speechPitch}
        onPitchChange={handlePitchChange}
        onTestVoice={handleTestVoice}
      />
    </div>
  );
}
