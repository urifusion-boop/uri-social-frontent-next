'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Scenario {
  janeMsg1: string;
  userMsg: string;
  janeMsg2: string;
  placeholder: string;
  label: string;
  caption: string;
  tagline: string;
  footer: { type: 'buttons' } | { type: 'stats'; items: { value: string; label: string; color?: string }[] };
}

const scenarios: Scenario[] = [
  {
    janeMsg1:
      "I've prepared your content calendar for next week! 3 Instagram reels, 5 feed posts, and 2 LinkedIn articles.",
    userMsg: "Yes! And make the Tuesday post more casual, we're announcing a sale",
    janeMsg2: "Done! Updated with sale energy. Here's a preview:",
    placeholder: 'SALE',
    label: 'INSTAGRAM · TUESDAY 10:00 AM',
    caption: '"SALE ALERT. Your favourites just got friendlier on your wallet. Up to 40% off..."',
    tagline: 'Yes, you can literally just tell her "make me a post about our new product" and she\'ll do it.',
    footer: { type: 'buttons' },
  },
  {
    janeMsg1: 'Your Lekki weekend campaign is live! ₦20,000 budget, and 14 people have already messaged about it.',
    userMsg: "Nice! Make sure you follow up with anyone who hasn't ordered yet",
    janeMsg2:
      "On it. Already replied to all 14 and added them to your leads list. Here's the ad that's converting best:",
    placeholder: 'CAKES',
    label: 'FACEBOOK & INSTAGRAM · LEKKI, LAGOS',
    caption: '"Cake orders delivered same-day. Order before Friday for weekend delivery."',
    tagline: 'Yes, you can literally just tell her "get me more customers this weekend" and she\'ll do it.',
    footer: {
      type: 'stats',
      items: [
        { value: '14', label: 'Messages' },
        { value: '6', label: 'Orders' },
        { value: '₦48,000', label: 'Revenue', color: 'hsl(122, 39%, 49%)' },
      ],
    },
  },
];

const SCENARIO_INTERVAL_MS = 7000;

const WorkspaceSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % scenarios.length);
    }, SCENARIO_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const scenario = scenarios[activeIndex];

  return (
    <section
      id="see-her-in-action"
      className="py-16 lg:py-20 halftone-bg-light scroll-mt-16"
      style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
            style={{ color: 'black', transform: 'rotate(-1deg)' }}
          >
            <span className="highlight-strip">WATCH YOUR AI TEAM WORK</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            No menus to learn. No settings to configure. Just talk to Jane and she gets it done.
          </p>
        </div>

        <div className="relative flex justify-center">
          <div
            className="w-full max-w-2xl comic-panel transition-transform duration-300"
            style={{ backgroundColor: 'white', transform: 'rotate(1deg)' }}
          >
            {/* Browser header */}
            <div
              className="px-5 py-2 flex items-center gap-2"
              style={{ backgroundColor: 'black', color: 'white', borderBottom: '3px solid black' }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#EF4444', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: 'hsl(45, 100%, 51%)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: 'hsl(122, 39%, 49%)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
              />
              <span className="text-xs font-black ml-3 uppercase tracking-wider">URI SOCIAL — JANE'S WORKSPACE</span>
            </div>

            {/* Chat interface — fades between scenarios */}
            <div className="relative overflow-hidden" style={{ minHeight: 420 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="p-6 space-y-4"
                >
                  {/* Jane's message */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, hsl(340, 74%, 42%) 0%, hsl(340, 82%, 50%) 100%)',
                        border: '2px solid black',
                        color: 'white',
                      }}
                    >
                      J
                    </div>
                    <div
                      className="speech-bubble flex-1 text-sm"
                      style={{ border: '2px solid black', padding: '12px', color: 'black' }}
                    >
                      {scenario.janeMsg1}
                    </div>
                  </div>

                  {/* Your message */}
                  <div className="flex items-start gap-3 flex-row-reverse">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.08)', border: '2px solid black', color: 'black' }}
                    >
                      You
                    </div>
                    <div
                      className="speech-bubble speech-bubble-right flex-1 text-sm"
                      style={{ border: '2px solid black', padding: '12px', color: 'black' }}
                    >
                      {scenario.userMsg}
                    </div>
                  </div>

                  {/* Jane's response */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, hsl(340, 74%, 42%) 0%, hsl(340, 82%, 50%) 100%)',
                        border: '2px solid black',
                        color: 'white',
                      }}
                    >
                      J
                    </div>
                    <div
                      className="speech-bubble flex-1 text-sm"
                      style={{ border: '2px solid black', padding: '12px', color: 'black' }}
                    >
                      {scenario.janeMsg2}
                    </div>
                  </div>

                  {/* Preview card */}
                  <div
                    className="ml-11 comic-panel"
                    style={{ boxShadow: '3px 3px 0px black', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                  >
                    <div
                      className="h-28 flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                    >
                      <span className="text-2xl font-black" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                        {scenario.placeholder}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-black mb-1 uppercase" style={{ color: 'black' }}>
                        {scenario.label}
                      </p>
                      <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                        {scenario.caption}
                      </p>
                    </div>
                    {scenario.footer.type === 'buttons' ? (
                      <div className="flex" style={{ borderTop: '2px solid black' }}>
                        <button
                          className="flex-1 py-2 text-xs font-black uppercase"
                          style={{ color: 'hsl(122, 39%, 49%)', borderRight: '2px solid black' }}
                        >
                          APPROVE
                        </button>
                        <button
                          className="flex-1 py-2 text-xs font-black uppercase"
                          style={{ color: 'hsl(207, 90%, 54%)', borderRight: '2px solid black' }}
                        >
                          REVISE
                        </button>
                        <button className="flex-1 py-2 text-xs font-black uppercase" style={{ color: '#EF4444' }}>
                          REJECT
                        </button>
                      </div>
                    ) : (
                      <div className="flex text-center" style={{ borderTop: '2px solid black' }}>
                        {scenario.footer.items.map((item, i, items) => (
                          <div
                            key={item.label}
                            className="flex-1 py-2"
                            style={i < items.length - 1 ? { borderRight: '2px solid black' } : undefined}
                          >
                            <p className="text-sm font-black" style={{ color: item.color ?? 'black' }}>
                              {item.value}
                            </p>
                            <p className="text-[10px] font-bold uppercase" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                              {item.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Input field */}
            <div className="px-6 pb-5">
              <div className="flex items-center rounded-lg px-4 py-3 gap-3" style={{ border: '3px solid black' }}>
                <span className="text-sm flex-1 font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                  Give Jane a directive...
                </span>
                <span className="font-black" style={{ color: 'hsl(340, 74%, 42%)' }}>
                  ↑
                </span>
              </div>
            </div>

            {/* Scenario dots */}
            <div className="flex justify-center gap-2 pb-5">
              {scenarios.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Show example ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIndex ? 20 : 8,
                    height: 8,
                    backgroundColor: i === activeIndex ? 'hsl(340, 74%, 42%)' : 'rgba(0, 0, 0, 0.15)',
                    border: '1.5px solid black',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-base font-bold italic" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            {scenario.tagline}
          </p>
        </div>
      </div>
    </section>
  );
};

export default WorkspaceSection;
