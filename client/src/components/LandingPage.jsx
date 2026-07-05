import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ArrowRight,
  GraduationCap,
  Sun,
  Moon,
  Coffee,
  Zap,
  Code
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const WORDS = ["Chat with Hitesh Choudhary", "Chat with Piyush Garg"];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [stars, setStars] = useState([]);
  
  // Typewriter states
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  // Generate stars on mount
  useEffect(() => {
    const generatedStars = Array.from({ length: 60 }).map((_, idx) => ({
      id: idx,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1.2,
      delay: Math.random() * 4,
      blinkClass: Math.random() > 0.5 ? 'animate-star-blink-slow' : 'animate-star-blink-medium',
      float: Math.random() > 0.6
    }));
    setStars(generatedStars);
  }, []);

  // Typewriter effect loop
  useEffect(() => {
    const fullWord = WORDS[currentWordIdx];
    if (!isDeleting) {
      // Typing phase
      if (currentText.length < fullWord.length) {
        const nextChar = fullWord.slice(0, currentText.length + 1);
        const timer = setTimeout(() => {
          setCurrentText(nextChar);
        }, 80 + Math.random() * 60);
        return () => clearTimeout(timer);
      } else {
        // Pause for 2 seconds after fully typed
        const timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      // Deleting phase
      if (currentText.length > 0) {
        const prevText = fullWord.slice(0, currentText.length - 1);
        const timer = setTimeout(() => {
          setCurrentText(prevText);
        }, 45);
        return () => clearTimeout(timer);
      } else {
        // Fully erased: switch word indexes
        setIsDeleting(false);
        setCurrentWordIdx((prev) => (prev + 1) % WORDS.length);
      }
    }
  }, [currentText, isDeleting, currentWordIdx]);

  return (
    <div className="min-h-screen transition-colors duration-500 relative overflow-hidden dark:bg-[#09090b] bg-[#fafaf9] dark:text-white text-[#18181b] select-none flex flex-col font-sans">
      
      {/* Styles Injection for Custom Animations (Star blinks & handwriting typography) */}
      <style>{`
        @keyframes starBlinkSlow {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.85; transform: scale(1.2); }
        }
        @keyframes starBlinkMedium {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes floatEffect {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-15px) rotate(2deg); }
        }
        .animate-star-blink-slow {
          animation: starBlinkSlow 4s infinite ease-in-out;
        }
        .animate-star-blink-medium {
          animation: starBlinkMedium 2.5s infinite ease-in-out;
        }
        .animate-float-slow {
          animation: floatEffect 8s infinite ease-in-out alternate;
        }
        .handwritten-font {
          font-family: 'Kalam', 'Caveat', cursive;
        }
      `}</style>

      {/* Grid overlay background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      {/* Subtle Amber Glow Behind Hero */}
      <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/[0.04] dark:bg-amber-500/[0.03] rounded-full blur-[110px] pointer-events-none z-0"></div>

      {/* Blinking Starfield */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className={`absolute rounded-full bg-white dark:bg-white bg-opacity-70 dark:bg-opacity-80 ${star.blinkClass} ${star.float ? 'animate-float-slow' : ''}`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              boxShadow: star.size > 2 ? '0 0 6px rgba(255,255,255,0.6)' : 'none'
            }}
          />
        ))}
      </div>

      {/* Minimal Top Nav */}
      <nav className={`fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between border-b transition-all duration-300 backdrop-blur-md ${
        isScrolled 
          ? 'dark:bg-[#09090b]/80 bg-[#fafaf9]/80 dark:border-white/[0.08] border-gray-200/60 shadow-sm'
          : 'bg-transparent border-transparent'
      }`}
      style={{
        backgroundColor: window.scrollY > 20 
          ? (theme === 'dark' ? 'rgba(9,9,11,0.75)' : 'rgba(250,250,249,0.75)') 
          : 'transparent'
      }}>
        <div className="flex items-center space-x-2 cursor-pointer select-none">
          <GraduationCap className="h-6 w-6 text-amber-500" />
          <span className="font-bold text-lg tracking-tight select-none">AI Mentors</span>
        </div>

        <div className="flex items-center space-x-6">
          <span onClick={handleExplore} className="text-xs font-semibold hover:text-amber-500 dark:text-zinc-400 dark:hover:text-white text-zinc-600 cursor-pointer transition-colors">Mentors</span>
          
          {/* Animated Toggle Switch */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
            ) : (
              <Moon className="h-4.5 w-4.5 text-zinc-700" />
            )}
          </button>
        </div>
      </nav>

      {/* Main Hero Container */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 flex flex-col justify-center text-center mt-28 z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight dark:text-white text-zinc-900 select-none">
            Learn from AI Mentors
          </h1>
          
          {/* Typewriter text block */}
          <div className="text-3xl md:text-4xl font-semibold mt-4 min-h-[50px] flex items-center justify-center">
            <span className="handwritten-font text-amber-500 dark:text-amber-400">
              {currentText}
            </span>
            <span className="inline-block w-0.5 h-7 dark:bg-amber-400 bg-amber-500 ml-1.5 animate-pulse"></span>
          </div>

          <p className="mt-6 text-sm md:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Ask coding questions, build projects, prepare for interviews, and learn directly from AI mentors inspired by India's most loved programming educators.
          </p>
        </motion.div>

        {/* Call to action Group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-8 flex justify-center gap-4"
        >
          <button 
            onClick={handleExplore}
            className="bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-6 py-3 rounded-full shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300 flex items-center space-x-1.5 cursor-pointer transform hover:-translate-y-0.5"
          >
            <span>Choose Your Mentor</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>

      {/* Mentor Cards Grid Section */}
      <section id="mentors-sec" className="max-w-5xl mx-auto w-full px-6 py-20 z-10 border-t dark:border-white/[0.04] border-zinc-200">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 dark:text-white text-zinc-950">AI Coding Mentors</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
          
          {/* Card 1: Hitesh Choudhary */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => navigate('/chat/hitesh')}
            className="group relative cursor-pointer w-full max-w-[420px] dark:bg-[#111827] bg-white border dark:border-white/[0.06] border-zinc-200 rounded-[32px] p-8 flex flex-col items-center text-center shadow-md dark:shadow-black/50 hover:shadow-xl hover:shadow-amber-500/[0.05] hover:border-amber-500/30 transition-all duration-300"
          >
            {/* Hover Glow Highlight */}
            <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-b from-amber-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative mb-6">
              {/* Avatar circle */}
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow flex items-center justify-center text-white font-serif text-2xl font-bold relative overflow-hidden">
                HC
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
              <div className="absolute -bottom-1 -right-1 dark:bg-[#111827] bg-white border dark:border-white/[0.08] border-zinc-200 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-amber-500 flex items-center gap-1 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>AI Ready</span>
              </div>
            </div>

            <h3 className="text-xl font-bold dark:text-white text-zinc-900 group-hover:text-amber-500 transition-colors">Hitesh Choudhary</h3>
            <span className="text-xs font-semibold font-mono tracking-wider text-amber-500 uppercase mt-1">Chai aur Code</span>
            
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[72px]">
              Calm, practical mentor who explains programming concepts using simple real-world examples and project-based learning.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["JavaScript", "React", "Career Guidance"].map((badge, idx) => (
                <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-lg dark:bg-white/[0.03] bg-zinc-100 dark:border-white/[0.04] border-zinc-200/60 border text-zinc-600 dark:text-zinc-300">
                  {badge}
                </span>
              ))}
            </div>

            <button className="mt-8 w-full bg-amber-500 group-hover:bg-amber-400 text-white font-semibold text-sm py-3.5 rounded-2xl flex items-center justify-center space-x-1.5 transition-all duration-300 shadow-md group-hover:shadow-amber-500/25">
              <span>Chat with Hitesh</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>

          {/* Card 2: Piyush Garg */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => navigate('/chat/piyush')}
            className="group relative cursor-pointer w-full max-w-[420px] dark:bg-[#111827] bg-white border dark:border-white/[0.06] border-zinc-200 rounded-[32px] p-8 flex flex-col items-center text-center shadow-md dark:shadow-black/50 hover:shadow-xl hover:shadow-sky-500/[0.05] hover:border-sky-400/30 transition-all duration-300"
          >
            {/* Hover Glow Highlight */}
            <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-b from-sky-400/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative mb-6">
              {/* Avatar circle */}
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-tr from-sky-600 to-sky-400 p-0.5 shadow flex items-center justify-center text-white font-serif text-2xl font-bold relative overflow-hidden">
                PG
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
              <div className="absolute -bottom-1 -right-1 dark:bg-[#111827] bg-white border dark:border-white/[0.08] border-zinc-200 rounded-full px-2.5 py-0.5 text-[9px] font-bold text-sky-400 flex items-center gap-1 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                <span>AI Ready</span>
              </div>
            </div>

            <h3 className="text-xl font-bold dark:text-white text-zinc-900 group-hover:text-sky-400 transition-colors">Piyush Garg</h3>
            <span className="text-xs font-semibold font-mono tracking-wider text-sky-400 uppercase mt-1">Engineering</span>
            
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[72px]">
              Logical mentor focused on software architecture, backend engineering, scalability, and modern web development.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["Backend", "System Design", "React"].map((badge, idx) => (
                <span key={idx} className="text-[11px] font-medium px-2.5 py-1 rounded-lg dark:bg-white/[0.03] bg-zinc-100 dark:border-white/[0.04] border-zinc-200/60 border text-zinc-600 dark:text-zinc-300">
                  {badge}
                </span>
              ))}
            </div>

            <button className="mt-8 w-full bg-sky-500 group-hover:bg-sky-400 text-white font-semibold text-sm py-3.5 rounded-2xl flex items-center justify-center space-x-1.5 transition-all duration-300 shadow-md group-hover:shadow-sky-500/25">
              <span>Chat with Piyush</span>
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </motion.div>

        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-[11px] font-mono text-zinc-400 dark:text-zinc-650 py-10 border-t dark:border-white/[0.04] border-zinc-200 bg-black/[0.01] dark:bg-black/30 mt-auto">
        AI Mentors • Created for the AI Mentor Challenge
      </footer>
    </div>
  );
}

// Scroll tracker helper
let isScrolled = false;
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    isScrolled = window.scrollY > 20;
  });
}

function handleExplore() {
  document.getElementById('mentors-sec')?.scrollIntoView({ behavior: 'smooth' });
}
