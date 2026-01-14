import React from 'react';
import { motion } from 'framer-motion';

interface LandingHeroProps {
  onBookWash: () => void;
  onShowPrivacy: () => void;
  onShowTerms: () => void;
}

const AnimatedIcon: React.FC<{
  children: React.ReactNode;
  className: string;
  duration: number;
  delay: number;
}> = ({ children, className, duration, delay }) => {
  return (
    <motion.div
      className={`absolute text-slate-900/[.05] ${className}`}
      initial={{ y: 0, x: 0, opacity: 0 }}
      animate={{ 
        y: [0, -15, 0, 15, 0],
        x: [0, 10, 0, -10, 0],
        opacity: 1
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

const BackgroundAnimations = () => (
  <div className="absolute inset-0 z-0 overflow-hidden">
    <AnimatedIcon className="top-[10%] left-[5%] w-24 h-24" duration={25} delay={0}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19.99 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-1.99-2zM12 20c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm3-9h-2.5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5H15c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="top-[20%] right-[-3%] w-32 h-32" duration={30} delay={3}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M20.56 15.2c.11.63-.3 1.25-.94 1.35l-1.97.33c-.23.04-.42-.14-.4-.36 1.05-5.32-3.14-9.45-8.25-9.45S2.76 10.9 3.8 16.22c.02.22-.17.4-.4.36l-1.97-.33c-.63-.11-1.05-.72-.94-1.35L2.2 6.8c.24-1.36 1.43-2.3 2.8-2.3h14c1.37 0 2.56.94 2.8 2.3l1.76 8.4z"/></svg>
    </AnimatedIcon>
     <AnimatedIcon className="bottom-[10%] left-[-2%] w-28 h-28" duration={35} delay={5}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-3 8h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-2c0-.55-.45-1-1-1s-1 .45-1 1v2H4v-3c0-.55-.45-1-1-1s-1 .45-1 1v3h.01V9c0-.55.45-1 1-1h18c.55 0 1 .45 1 1v5h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="bottom-[25%] right-[5%] w-16 h-16" duration={22} delay={1}>
       <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.35 7.16h7.53l-6.09 4.42 2.35 7.16-6.14-4.42-6.14 4.42 2.35-7.16-6.09-4.42h7.53L12 2z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="top-[55%] left-[20%] w-12 h-12" duration={18} delay={4}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.35 7.16h7.53l-6.09 4.42 2.35 7.16-6.14-4.42-6.14 4.42 2.35-7.16-6.09-4.42h7.53L12 2z"/></svg>
    </AnimatedIcon>
  </div>
);


const LandingHero: React.FC<LandingHeroProps> = ({ onBookWash, onShowPrivacy, onShowTerms }) => {
  return (
    <div className="relative flex flex-col min-h-screen p-6 text-slate-900 overflow-hidden">
      <BackgroundAnimations />
      
      <div className="relative z-10 flex flex-col flex-grow">
          <header className="flex-shrink-0">
            <h1 className="text-2xl font-bold">PurWash</h1>
          </header>

          <main className="flex-grow flex flex-col items-center justify-center text-center">
            <div className="max-w-md">
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                Laundry day. Done.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Tamale’s premium pickup & delivery. 48-hour turnaround.
              </p>
              <button
                onClick={onBookWash}
                className="mt-8 bg-slate-900 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:bg-slate-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                Book a Wash
              </button>
            </div>
          </main>

          <footer className="flex-shrink-0 text-center text-sm text-slate-500 space-x-4">
            <span>+233 55 123 4567</span>
            <button onClick={onShowPrivacy} className="hover:underline">Privacy</button>
            <button onClick={onShowTerms} className="hover:underline">Terms</button>
          </footer>
      </div>
    </div>
  );
};

export default LandingHero;