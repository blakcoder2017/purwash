import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import paystackBadge from '../images/paystackbadge.png';

interface LandingHeroProps {
  onBookWash: () => void;
  onTrackOrder: () => void;
  onShowPrivacy: () => void;
  onShowTerms: () => void;
}

const AnimatedIcon: React.FC<{
  children: React.ReactNode;
  className: string;
  duration: number;
  delay: number;
  radius: number;
}> = ({ children, className, duration, delay, radius }) => {
  return (
    <motion.div
      className={`absolute text-slate-900/[.08] ${className}`}
      initial={{ rotate: 0, opacity: 0 }}
      animate={{ rotate: 360, opacity: 1 }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <div style={{ transform: `translate(${radius}px, ${radius * 0.35}px)` }}>
        {children}
      </div>
    </motion.div>
  );
};

const BackgroundAnimations = () => (
  <div className="absolute inset-0 z-0 overflow-hidden">
    <AnimatedIcon className="top-[6%] left-[4%] w-16 h-16" duration={42} delay={0} radius={18}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19.99 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-1.99-2zM12 20c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm3-9h-2.5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5H15c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="top-[12%] right-[6%] w-20 h-20" duration={48} delay={4} radius={22}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M20.56 15.2c.11.63-.3 1.25-.94 1.35l-1.97.33c-.23.04-.42-.14-.4-.36 1.05-5.32-3.14-9.45-8.25-9.45S2.76 10.9 3.8 16.22c.02.22-.17.4-.4.36l-1.97-.33c-.63-.11-1.05-.72-.94-1.35L2.2 6.8c.24-1.36 1.43-2.3 2.8-2.3h14c1.37 0 2.56.94 2.8 2.3l1.76 8.4z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="top-[28%] left-[10%] w-12 h-12" duration={36} delay={2} radius={12}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-3 8h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-2c0-.55-.45-1-1-1s-1 .45-1 1v2H4v-3c0-.55-.45-1-1-1s-1 .45-1 1v3h.01V9c0-.55.45-1 1-1h18c.55 0 1 .45 1 1v5h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="top-[35%] right-[12%] w-10 h-10" duration={30} delay={1} radius={10}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.35 7.16h7.53l-6.09 4.42 2.35 7.16-6.14-4.42-6.14 4.42 2.35-7.16-6.09-4.42h7.53L12 2z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="top-[48%] left-[4%] w-14 h-14" duration={44} delay={6} radius={16}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.35 7.16h7.53l-6.09 4.42 2.35 7.16-6.14-4.42-6.14 4.42 2.35-7.16-6.09-4.42h7.53L12 2z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="top-[52%] right-[4%] w-12 h-12" duration={38} delay={3} radius={14}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19.99 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-1.99-2zM12 20c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm3-9h-2.5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5H15c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="bottom-[28%] left-[14%] w-12 h-12" duration={40} delay={5} radius={14}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M20.56 15.2c.11.63-.3 1.25-.94 1.35l-1.97.33c-.23.04-.42-.14-.4-.36 1.05-5.32-3.14-9.45-8.25-9.45S2.76 10.9 3.8 16.22c.02.22-.17.4-.4.36l-1.97-.33c-.63-.11-1.05-.72-.94-1.35L2.2 6.8c.24-1.36 1.43-2.3 2.8-2.3h14c1.37 0 2.56.94 2.8 2.3l1.76 8.4z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="bottom-[18%] right-[12%] w-14 h-14" duration={46} delay={7} radius={18}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-3 8h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1H8v-2c0-.55-.45-1-1-1s-1 .45-1 1v2H4v-3c0-.55-.45-1-1-1s-1 .45-1 1v3h.01V9c0-.55.45-1 1-1h18c.55 0 1 .45 1 1v5h-2v-1c0-.55-.45-1-1-1s-1 .45-1 1v1z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="bottom-[6%] left-[6%] w-16 h-16" duration={52} delay={2} radius={20}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.35 7.16h7.53l-6.09 4.42 2.35 7.16-6.14-4.42-6.14 4.42 2.35-7.16-6.09-4.42h7.53L12 2z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="bottom-[8%] right-[6%] w-10 h-10" duration={34} delay={9} radius={12}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M20.56 15.2c.11.63-.3 1.25-.94 1.35l-1.97.33c-.23.04-.42-.14-.4-.36 1.05-5.32-3.14-9.45-8.25-9.45S2.76 10.9 3.8 16.22c.02.22-.17.4-.4.36l-1.97-.33c-.63-.11-1.05-.72-.94-1.35L2.2 6.8c.24-1.36 1.43-2.3 2.8-2.3h14c1.37 0 2.56.94 2.8 2.3l1.76 8.4z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="top-[66%] left-[24%] w-8 h-8" duration={28} delay={8} radius={8}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.35 7.16h7.53l-6.09 4.42 2.35 7.16-6.14-4.42-6.14 4.42 2.35-7.16-6.09-4.42h7.53L12 2z"/></svg>
    </AnimatedIcon>
    <AnimatedIcon className="top-[72%] right-[18%] w-10 h-10" duration={33} delay={11} radius={10}>
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19.99 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-1.99-2zM12 20c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm3-9h-2.5c-.28 0-.5.22-.5.5v1c0 .28.22.5.5.5H15c.28 0 .5-.22.5-.5v-1c0-.28-.22-.5-.5-.5z"/></svg>
    </AnimatedIcon>
  </div>
);


const LandingHero: React.FC<LandingHeroProps> = ({ onBookWash, onTrackOrder, onShowPrivacy, onShowTerms }) => {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'pre-fix',
        hypothesisId: 'H1',
        location: 'client/components/LandingHero.tsx:83',
        message: 'landing_hero_render',
        data: {
          badgeSrc: paystackBadge,
          hasBadgeSrc: Boolean(paystackBadge)
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen p-6 text-slate-900 overflow-hidden">
      <BackgroundAnimations />
      
      <div className="relative z-10 flex flex-col flex-grow">
          <header className="flex-shrink-0 flex justify-between items-center">
            <h1 className="text-2xl font-bold">PurWash</h1>
            <button 
              onClick={onTrackOrder}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Track Order
            </button>
          </header>

          <main className="flex-grow flex flex-col items-center justify-center text-center">
            <div className="max-w-md">
              <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                Laundry day. Done.
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Tamale's premium pickup & delivery. 48-hour turnaround.
              </p>
              <div className="mt-5 flex items-center justify-center">
                <img
                  src={paystackBadge}
                  alt="Secured by Paystack"
                  className="h-8 w-auto opacity-90"
                  loading="lazy"
                  onLoad={(event) => {
                    const img = event.currentTarget;
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: 'debug-session',
                        runId: 'pre-fix',
                        hypothesisId: 'H2',
                        location: 'client/components/LandingHero.tsx:111',
                        message: 'landing_badge_loaded',
                        data: {
                          currentSrc: img.currentSrc,
                          naturalWidth: img.naturalWidth,
                          naturalHeight: img.naturalHeight
                        },
                        timestamp: Date.now()
                      })
                    }).catch(() => {});
                    // #endregion
                  }}
                  onError={(event) => {
                    const img = event.currentTarget;
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/d4f0130a-59ab-40d3-81c4-822ff2880a92', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sessionId: 'debug-session',
                        runId: 'pre-fix',
                        hypothesisId: 'H3',
                        location: 'client/components/LandingHero.tsx:125',
                        message: 'landing_badge_error',
                        data: {
                          currentSrc: img.currentSrc,
                          hasCurrentSrc: Boolean(img.currentSrc)
                        },
                        timestamp: Date.now()
                      })
                    }).catch(() => {});
                    // #endregion
                  }}
                />
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={onBookWash}
                  className="bg-slate-900 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:bg-slate-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Book a Wash
                </button>
                <button
                  onClick={onTrackOrder}
                  className="bg-white text-slate-900 font-semibold py-4 px-8 rounded-xl shadow-md border border-slate-200 hover:bg-slate-50 transition-colors duration-300"
                >
                  Track Order
                </button>
              </div>
            </div>
          </main>

          <footer className="flex-shrink-0 text-center text-sm text-slate-500 space-x-4">
            <span>Call/Whatsapp: 0552537904</span>
            <button onClick={onShowPrivacy} className="hover:underline">Privacy</button>
            <button onClick={onShowTerms} className="hover:underline">Terms</button>
          </footer>
      </div>
    </div>
  );
};

export default LandingHero;