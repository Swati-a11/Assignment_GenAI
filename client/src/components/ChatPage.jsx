import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Sun, 
  Moon, 
  Trash2, 
  Send, 
  Paperclip,
  ArrowLeft,
  Coffee,
  Zap,
  Home
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const API_BASE = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5001/api'
    : 'https://assignment-genai-s9q1.onrender.com/api'
);

export default function ChatPage() {
  const { mentorId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Validate parameter context
  const isValidMentor = mentorId === 'hitesh' || mentorId === 'piyush';
  const mentorKey = isValidMentor ? mentorId : 'hitesh';

  // Chat Log & Inputs States
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Keep unique session identifiers
  const [hiteshSessionId] = useState(() => `hitesh_sess_${Math.random().toString(36).substring(2, 11)}`);
  const [piyushSessionId] = useState(() => `piyush_sess_${Math.random().toString(36).substring(2, 11)}`);

  const messagesEndRef = useRef(null);

  // Load chat history when mentor changes or route loads
  useEffect(() => {
    if (!isValidMentor) {
      navigate('/chat/hitesh', { replace: true });
      return;
    }
    fetchHistory();
  }, [mentorId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchHistory = async () => {
    const currentSessionId = mentorKey === 'hitesh' ? hiteshSessionId : piyushSessionId;
    try {
      const res = await fetch(`${API_BASE}/session/${currentSessionId}?persona=${mentorKey}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.history || []);
      }
    } catch (err) {
      console.error('History fetch failed:', err);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const currentSessionId = mentorKey === 'hitesh' ? hiteshSessionId : piyushSessionId;
    const userText = inputMessage.trim();
    setInputMessage('');

    // Optimistic UI update
    const updatedMessages = [
      ...messages,
      { role: 'user', parts: [{ text: userText }], timestamp: new Date() }
    ];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          persona: mentorKey,
          message: userText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.history);
      } else {
        const errData = await res.json();
        setMessages(prev => [
          ...prev,
          { role: 'model', parts: [{ text: `Error: ${errData.error || 'Request failed'}` }], timestamp: new Date() }
        ]);
      }
    } catch (err) {
      console.error('Send error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'model', parts: [{ text: `Network Error: Could not reach the AI Mentor API. Please verify port 5001 is running.` }], timestamp: new Date() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    const currentSessionId = mentorKey === 'hitesh' ? hiteshSessionId : piyushSessionId;
    if (!confirm(`Are you sure you want to clear your conversation history with ${mentorKey === 'hitesh' ? 'Hitesh Choudhary' : 'Piyush Garg'}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/session/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.history || []);
        
        // Trigger light success confetti
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 },
          colors: mentorKey === 'hitesh' ? ['#F59E0B', '#ffffff'] : ['#38BDF8', '#ffffff']
        });
      }
    } catch (err) {
      console.error('Clear failed:', err);
    }
  };

  const handlePersonaToggle = (newPersona) => {
    if (newPersona === mentorKey) return;
    navigate(`/chat/${newPersona}`);
  };

  const handleChipClick = (suggestionText) => {
    setInputMessage(suggestionText);
  };

  // Custom text parser for code blocks and inline formatting
  const renderMessageText = (text) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Code Block
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : 'javascript';
        const codeContent = match ? match[2] : part.slice(3, -3);

        return (
          <div key={index} className="my-3 border dark:border-white/[0.08] border-zinc-200 rounded-xl overflow-hidden shadow-lg font-mono text-xs w-full max-w-full">
            <div className="dark:bg-[#111827] bg-zinc-100 border-b dark:border-white/[0.06] border-zinc-200 px-4 py-2 flex items-center justify-between text-zinc-500 dark:text-zinc-400 select-none">
              <span className="text-[10px] uppercase tracking-wider font-semibold">{lang || 'code'}</span>
              <button 
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(codeContent.trim());
                  alert('Copied code to clipboard!');
                }}
                className="text-[10px] dark:hover:text-white hover:text-zinc-900 transition-colors bg-white dark:bg-zinc-800 border dark:border-white/[0.08] border-zinc-200 rounded px-2 py-0.5"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 dark:bg-black bg-zinc-950 text-cyan-400 dark:text-cyan-300 overflow-x-auto leading-relaxed whitespace-pre font-light">
              <code>{codeContent.trim()}</code>
            </pre>
          </div>
        );
      }

      // Inline code highlights
      const inlineParts = part.split(/(`[^`\n]+`)/g);
      return (
        <span key={index}>
          {inlineParts.map((subPart, subIndex) => {
            if (subPart.startsWith('`') && subPart.endsWith('`')) {
              return (
                <code key={subIndex} className="mx-1 rounded dark:bg-white/[0.05] bg-zinc-100 dark:border-white/[0.05] border border-zinc-200 px-1.5 py-0.5 font-mono text-xs font-semibold dark:text-amber-400 text-amber-600">
                  {subPart.slice(1, -1)}
                </code>
              );
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  const accentColor = mentorKey === 'hitesh' ? 'text-[#F59E0B]' : 'text-[#38BDF8]';
  const accentBorder = mentorKey === 'hitesh' ? 'border-[#F59E0B]/20' : 'border-[#38BDF8]/20';
  const accentBgGlow = mentorKey === 'hitesh' ? 'from-amber-500/[0.03] to-transparent' : 'from-sky-400/[0.03] to-transparent';

  return (
    <div className="min-h-screen transition-colors duration-500 relative dark:bg-[#09090b] bg-[#fafaf9] dark:text-white text-[#18181b] flex flex-col font-sans">
      
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b dark:border-white/[0.08] border-zinc-200/80 backdrop-blur-md dark:bg-[#09090b]/80 bg-[#fafaf9]/80">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-1 text-xs font-semibold hover:text-amber-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </button>
          
          <div className="h-4 w-px dark:bg-white/[0.08] bg-zinc-200 hidden sm:block"></div>

          <div className="flex items-center space-x-2 select-none">
            <GraduationCap className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-sm tracking-tight hidden xs:inline">AI Mentors</span>
            <span className="text-[10px] opacity-40 font-mono tracking-widest">/ {mentorKey === 'hitesh' ? 'Hitesh' : 'Piyush'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={handleClearChat}
            className="text-xs font-semibold text-zinc-500 dark:hover:text-white hover:text-zinc-900 border dark:border-white/[0.08] border-zinc-200 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 bg-white dark:bg-[#111827]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>

          <div className="h-4 w-px dark:bg-white/[0.08] bg-zinc-200"></div>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-500" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-zinc-700" />
            )}
          </button>
        </div>
      </nav>

      {/* Main centered chat container */}
      <main className="flex-1 flex items-center justify-center w-full max-w-5xl mx-auto px-4 sm:px-6 mt-20 mb-4 z-10">
        
        {/* Curved interior border mockup window */}
        <div className="w-full h-[calc(100vh-180px)] min-h-[500px] max-h-[760px] rounded-[32px] border dark:border-white/[0.08] border-zinc-200 dark:bg-[#111827] bg-white shadow-2xl relative overflow-hidden flex flex-col transition-all duration-300">
          
          {/* Chat Header banner */}
          <div className={`px-6 py-4 flex items-center justify-between border-b dark:border-white/[0.06] border-zinc-200 transition-all duration-300 bg-gradient-to-r ${accentBgGlow}`}>
            <div className="flex items-center space-x-3.5">
              {mentorKey === 'hitesh' ? (
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow flex items-center justify-center text-white font-serif text-sm font-bold relative overflow-hidden">
                  HC
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
              ) : (
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 p-0.5 shadow flex items-center justify-center text-white font-serif text-sm font-bold relative overflow-hidden">
                  PG
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
              )}
              
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="font-semibold text-sm select-none">
                    👨‍🏫 {mentorKey === 'hitesh' ? 'Hitesh Choudhary' : 'Piyush Garg'}
                  </h2>
                  <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded border ${
                    mentorKey === 'hitesh'
                      ? 'border-amber-500/20 bg-amber-500/5 text-amber-500'
                      : 'border-sky-400/20 bg-sky-400/5 text-sky-400'
                  }`}>
                    AI Mentor Online
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5 font-light">
                  {mentorKey === 'hitesh' 
                    ? 'JavaScript • React • Career Guidance • Chai aur Code' 
                    : 'Backend • System Design • React • Engineering'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Messages stream panel */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 dark:bg-black/10 bg-zinc-50/20">
            {messages.length <= 1 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto my-auto z-10 animate-fade-in py-12">
                <div className="text-4xl mb-4 select-none animate-bounce">👋</div>
                <h3 className="text-2xl font-bold dark:text-white text-zinc-900 mb-2">Welcome!</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-light leading-relaxed mb-6">
                  Ask your AI mentor anything.
                </p>
                
                {/* Suggestion Chips */}
                <div className="grid grid-cols-1 gap-2 w-full">
                  {[
                    "Explain closures.",
                    "Build a MERN project.",
                    "Help me crack interviews.",
                    "Explain React lifecycle."
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChipClick(suggestion)}
                      className={`text-left text-xs px-4 py-2.5 rounded-xl border transition-all duration-200 dark:bg-[#111827]/40 bg-white dark:text-zinc-300 text-zinc-700 hover:text-zinc-900 dark:hover:text-white select-none ${
                        mentorKey === 'hitesh'
                          ? 'dark:border-white/[0.06] border-zinc-200 hover:border-amber-500/30 hover:bg-amber-500/[0.02]'
                          : 'dark:border-white/[0.06] border-zinc-200 hover:border-sky-400/30 hover:bg-sky-400/[0.02]'
                      }`}
                    >
                      <span className={`mr-1.5 font-bold ${mentorKey === 'hitesh' ? 'text-amber-500' : 'text-sky-400'}`}>•</span> {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isModel = msg.role === 'model';
                return (
                  <div 
                    key={index} 
                    className={`flex items-start gap-3.5 ${isModel ? '' : 'flex-row-reverse'} animate-fade-in`}
                  >
                    {/* Avatar */}
                    <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px] border ${
                      isModel 
                        ? mentorKey === 'hitesh'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                        : 'dark:bg-zinc-800 bg-zinc-200 dark:border-white/[0.08] border-zinc-300 dark:text-zinc-300 text-zinc-700'
                    }`}>
                      {isModel ? (mentorKey === 'hitesh' ? 'HC' : 'PG') : 'ME'}
                    </div>

                    {/* Text content bubble */}
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm border ${
                      isModel
                        ? mentorKey === 'hitesh'
                          ? 'dark:bg-[#1f2937]/35 bg-white border-amber-500/10 text-zinc-800 dark:text-zinc-200'
                          : 'dark:bg-[#1f2937]/35 bg-white border-sky-400/10 text-zinc-800 dark:text-zinc-200'
                        : mentorKey === 'hitesh'
                          ? 'bg-amber-500 text-white border-amber-600/10'
                          : 'bg-sky-500 text-white border-sky-600/10'
                    }`}>
                      {isModel && (
                        <div className="flex items-center space-x-1.5 mb-1.5 opacity-60">
                          {mentorKey === 'hitesh' ? (
                            <Coffee className="h-3 w-3 text-amber-500" />
                          ) : (
                            <Zap className="h-3 w-3 text-sky-400" />
                          )}
                          <span className="text-[9px] uppercase font-mono tracking-wider font-semibold">
                            {mentorKey === 'hitesh' ? 'Hitesh Choudhary' : 'Piyush Garg'}
                          </span>
                        </div>
                      )}
                      <div className="text-sm leading-relaxed font-light">
                        {renderMessageText(msg.parts[0].text)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* AI thinking loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-4">
                <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-[10px] border ${
                  mentorKey === 'hitesh'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                }`}>
                  {mentorKey === 'hitesh' ? 'HC' : 'PG'}
                </div>
                <div className={`rounded-2xl px-4 py-3 border ${
                  mentorKey === 'hitesh'
                    ? 'dark:bg-[#1f2937]/35 bg-white border-amber-500/10'
                    : 'dark:bg-[#1f2937]/35 bg-white border-sky-400/10'
                }`}>
                  <div className="flex items-center space-x-1.5 py-1 px-0.5">
                    <span className={`h-2.5 w-2.5 rounded-full animate-bounce ${mentorKey === 'hitesh' ? 'bg-amber-500' : 'bg-sky-400'}`} style={{ animationDelay: '0ms' }}></span>
                    <span className={`h-2.5 w-2.5 rounded-full animate-bounce ${mentorKey === 'hitesh' ? 'bg-amber-500' : 'bg-sky-400'}`} style={{ animationDelay: '150ms' }}></span>
                    <span className={`h-2.5 w-2.5 rounded-full animate-bounce ${mentorKey === 'hitesh' ? 'bg-amber-500' : 'bg-sky-400'}`} style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Glassmorphic input field */}
          <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-white/[0.06] border-zinc-200/80 dark:bg-black/30 bg-zinc-50 flex items-center gap-3">
            <div className="flex-1 dark:bg-[#0c101b] bg-white border dark:border-white/[0.08] border-zinc-200 rounded-full px-4.5 py-2.5 flex items-center justify-between gap-2 shadow-inner focus-within:border-amber-500/30 transition-all">
              <button type="button" className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                <Paperclip className="h-4 w-4" />
              </button>
              <input 
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={mentorKey === 'hitesh' ? "Ask Hitesh Sir anything..." : "Ask Piyush Sir anything..."}
                className="bg-transparent text-sm w-full dark:text-zinc-100 text-zinc-900 placeholder-zinc-400 focus:outline-none px-2"
              />
              <button 
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className={`p-2 rounded-full transition-all duration-200 shrink-0 text-white cursor-pointer ${
                  mentorKey === 'hitesh'
                    ? 'bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-650'
                    : 'bg-sky-500 hover:bg-sky-400 disabled:bg-zinc-800 disabled:text-zinc-650'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Floating Control Center featuring the sliding segmented control */}
      <div className="p-4 bg-transparent border-t dark:border-white/[0.04] border-zinc-200/60 z-20">
        <div className="max-w-5xl mx-auto w-full dark:bg-[#111827]/85 bg-white border dark:border-white/[0.08] border-zinc-200 rounded-2xl py-3 px-5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          
          {/* Logo brand label */}
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2 select-none cursor-pointer hover:opacity-85 transition duration-200"
          >
            <GraduationCap className="h-4.5 w-4.5 text-amber-500" />
            <span className="font-bold text-sm tracking-tight">AI Mentors</span>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse ml-1"></span>
          </div>

          {/* Premium Animated Segmented Control */}
          <div className="relative flex items-center dark:bg-black/40 bg-zinc-100 border dark:border-white/[0.06] border-zinc-200/60 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => handlePersonaToggle('hitesh')}
              className={`relative px-4 py-1.75 rounded-lg text-xs font-semibold transition-colors duration-300 z-10 flex items-center space-x-1.5 cursor-pointer ${
                mentorKey === 'hitesh' 
                  ? 'text-white' 
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {mentorKey === 'hitesh' && (
                <motion.div
                  layoutId="activeSegment"
                  className="absolute inset-0 bg-amber-500 rounded-lg -z-10 shadow shadow-amber-500/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Coffee className="h-3 w-3" />
              <span>Hitesh Choudhary</span>
            </button>

            <button
              type="button"
              onClick={() => handlePersonaToggle('piyush')}
              className={`relative px-4 py-1.75 rounded-lg text-xs font-semibold transition-colors duration-300 z-10 flex items-center space-x-1.5 cursor-pointer ${
                mentorKey === 'piyush' 
                  ? 'text-white' 
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              {mentorKey === 'piyush' && (
                <motion.div
                  layoutId="activeSegment"
                  className="absolute inset-0 bg-sky-500 rounded-lg -z-10 shadow shadow-sky-500/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Zap className="h-3 w-3" />
              <span>Piyush Garg</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
