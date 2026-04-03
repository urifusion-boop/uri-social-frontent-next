'use client';

import { useState, useEffect, useCallback } from 'react';

const conversations = [
  {
    user: 'Bola',
    business: 'Lagos Bites',
    industry: 'Restaurant',
    color: 'hsl(var(--uri-green))',
    time: '8:15 AM',
    userMsg: 'Jane, create a Monday motivation post for LinkedIn. Something about hustle and good food.',
    janeMsg: "Done! Here's a draft with a carousel layout. Check your queue to approve. ✅",
    preview: { text: 'Monday = Fresh energy + Fresh ingredients 🍽️', platform: 'LinkedIn' },
  },
  {
    user: 'Chike',
    business: 'FreshFit Gym',
    industry: 'Fitness',
    color: 'hsl(var(--uri-purple))',
    time: '10:30 AM',
    userMsg: 'I need 3 Instagram posts for our January promo. 30% off new memberships.',
    janeMsg: '3 posts drafted — a carousel, a story, and a reel script. All in your approval queue!',
    preview: { text: 'NEW YEAR. NEW YOU. 30% OFF', platform: 'Instagram' },
  },
  {
    user: 'Amina',
    business: 'Aura Beauty',
    industry: 'Beauty',
    color: 'hsl(var(--uri-blue))',
    time: '2:45 PM',
    userMsg: 'Post something about our new lash collection dropping Friday. Make it exciting.',
    janeMsg: "Ooh, launching Friday? I've drafted a teaser post and a countdown story. Ready for review! 🔥",
    preview: { text: 'Something beautiful is coming... 👀', platform: 'Instagram' },
  },
  {
    user: 'David',
    business: 'PayStack Jr',
    industry: 'Tech',
    color: 'hsl(var(--uri-yellow))',
    time: '6:00 PM',
    userMsg: 'We just hit 10,000 users. Create a celebration post for Twitter and LinkedIn.',
    janeMsg: "Congrats! 🎉 I've drafted a Twitter thread and a LinkedIn announcement. Both in your queue.",
    preview: { text: '10,000 users. 0 days off. 🚀', platform: 'X' },
  },
  {
    user: 'Ngozi',
    business: 'Lagos Homes',
    industry: 'Real Estate',
    color: 'hsl(var(--uri-magenta))',
    time: '9:00 AM',
    userMsg: 'New listing just came in. 3-bed in Lekki Phase 1. Post it everywhere.',
    janeMsg: "Listed! I've created posts for Instagram, Facebook, and LinkedIn with the property highlights.",
    preview: { text: 'JUST LISTED: 3-Bed in Lekki Phase 1', platform: 'Multi' },
  },
  {
    user: 'Chidi',
    business: 'Bloom Coffee',
    industry: 'Coffee',
    color: 'hsl(var(--uri-hot-pink))',
    time: '11:00 PM',
    userMsg: 'Our Ethiopian blend launches tomorrow. Hit them with a teaser.',
    janeMsg: 'Teaser post ready! Carousel format with your brand colors. Scheduled for 9 AM tomorrow. ☕',
    preview: { text: 'Something special from Sidamo...', platform: 'Instagram' },
  },
];

const platformIcons: Record<string, string> = {
  LinkedIn: 'in',
  Instagram: 'IG',
  X: '𝕏',
  Multi: '📱',
};

const TypingIndicator = () => (
  <div className="flex items-center gap-[3px] px-3 py-2">
    <span className="typing-dot w-[6px] h-[6px] rounded-full bg-[#999]" />
    <span className="typing-dot w-[6px] h-[6px] rounded-full bg-[#999]" />
    <span className="typing-dot w-[6px] h-[6px] rounded-full bg-[#999]" />
  </div>
);

const WhatsAppPhoneMockup = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<'userMsg' | 'typing' | 'janeMsg'>('userMsg');
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showTapHint, setShowTapHint] = useState(true);

  const convo = conversations[activeIndex];

  const advanceCycle = useCallback(() => {
    if (isPaused) return;

    if (phase === 'userMsg') {
      setPhase('typing');
    } else if (phase === 'typing') {
      setPhase('janeMsg');
    } else {
      // Transition to next conversation
      setIsVisible(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % conversations.length);
        setPhase('userMsg');
        setIsVisible(true);
      }, 500);
    }
  }, [phase, isPaused]);

  useEffect(() => {
    const durations = { userMsg: 1200, typing: 800, janeMsg: 3500 };
    const timer = setTimeout(advanceCycle, durations[phase]);
    return () => clearTimeout(timer);
  }, [phase, activeIndex, advanceCycle]);

  useEffect(() => {
    const timer = setTimeout(() => setShowTapHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div
        className="hero-phone relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onClick={() => setIsPaused((p) => !p)}
        style={{ transform: 'rotate(12deg)' }}
      >
        {/* Phone Frame */}
        <div
          className="relative w-[260px] sm:w-[280px] lg:w-[320px] rounded-[40px] border-[3px] border-foreground overflow-hidden"
          style={{
            aspectRatio: '320/640',
            boxShadow: '0 20px 60px rgba(0,0,0,.12)',
            background: '#ECE5DD',
          }}
        >
          {/* Status Bar */}
          <div className="flex items-center justify-between px-5 pt-2 pb-1 bg-[#075E54] text-white text-[10px] font-medium">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <svg width="12" height="10" viewBox="0 0 12 10" fill="white">
                <rect x="0" y="6" width="2" height="4" rx="0.5" />
                <rect x="3" y="4" width="2" height="6" rx="0.5" />
                <rect x="6" y="2" width="2" height="8" rx="0.5" />
                <rect x="9" y="0" width="2" height="10" rx="0.5" />
              </svg>
              <svg width="12" height="9" viewBox="0 0 12 9" fill="white">
                <path d="M6 2C7.8 2 9.4 2.7 10.5 3.9L12 2.4C10.5 0.9 8.4 0 6 0S1.5 0.9 0 2.4L1.5 3.9C2.6 2.7 4.2 2 6 2ZM6 5C6.8 5 7.5 5.3 8 5.8L6 8L4 5.8C4.5 5.3 5.2 5 6 5Z" />
              </svg>
              <svg width="18" height="9" viewBox="0 0 18 9" fill="white">
                <rect x="0" y="1" width="14" height="7" rx="1" stroke="white" strokeWidth="0.8" fill="none" />
                <rect x="1" y="2" width="10" height="5" rx="0.5" />
                <rect x="15" y="3" width="2" height="3" rx="0.5" />
              </svg>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="flex items-center gap-2 px-2 py-2 bg-[#075E54]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <path
                d="M10 3L5 8l5 5"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[11px] font-black text-primary-foreground">
              J
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[13px] font-bold leading-tight">Jane</div>
              <div className="text-[#25D366] text-[10px] leading-tight">Online</div>
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M15.6 10.7c.2-.1.4-.2.6-.2.4 0 .7.2 1 .5l2.2 2.2c.3.3.4.6.4 1s-.1.7-.4 1L17 17.6c-.5.5-1.2.4-1.6-.2-.4-.6-.9-1-1.5-1.5-2-1.6-4.2-3.8-5.8-5.8-.5-.6-1-1.1-1.5-1.5-.6-.4-.7-1.1-.2-1.6l2.4-2.4c.3-.3.6-.4 1-.4s.7.1 1 .4L13 6.8c.3.3.5.6.5 1 0 .2-.1.4-.2.6" />
              </svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
              </svg>
            </div>
          </div>

          {/* Chat Area */}
          <div
            className="relative flex flex-col px-2 py-3 overflow-hidden"
            style={{
              height: 'calc(100% - 100px)',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 5a2 2 0 100-4 2 2 0 000 4zm30 0a2 2 0 100-4 2 2 0 000 4zm-30 30a2 2 0 100-4 2 2 0 000 4zm30 0a2 2 0 100-4 2 2 0 000 4zm-15 15a2 2 0 100-4 2 2 0 000 4zm0-30a2 2 0 100-4 2 2 0 000 4z' fill='%23c8c0b8' fill-opacity='0.08'/%3E%3C/svg%3E")`,
              backgroundColor: '#ECE5DD',
            }}
          >
            {/* User Context Strip */}
            <div
              className="flex items-center gap-2 mb-3 px-1 transition-all duration-500"
              style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(-8px)' }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white"
                style={{ background: convo.color }}
              >
                {convo.user[0]}
              </div>
              <span className="text-[10px] font-bold text-[#444]">{convo.user}</span>
              <span className="text-[9px] text-[#888]">· {convo.business}</span>
              <span className="text-[7px] bg-[#ddd] text-[#666] px-1.5 py-[1px] rounded-full font-semibold">
                {convo.industry}
              </span>
            </div>

            {/* Messages */}
            <div
              className="flex flex-col gap-2 flex-1 transition-all duration-500"
              style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(10px)' }}
            >
              {/* User Message */}
              <div className="flex justify-end">
                <div className="relative max-w-[85%] bg-[#DCF8C6] rounded-tl-xl rounded-tr-[4px] rounded-b-xl px-2.5 py-1.5 text-[11px] text-[#111] leading-snug">
                  {convo.userMsg}
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-[8px] text-[#999]">{convo.time}</span>
                    {phase === 'janeMsg' && (
                      <svg width="14" height="8" viewBox="0 0 16 10" fill="#53BDEB">
                        <path
                          d="M1 5l3 3L11 1"
                          stroke="#53BDEB"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M4 5l3 3L14 1"
                          stroke="#53BDEB"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  {/* Tail */}
                  <div className="absolute top-0 -right-[6px] w-0 h-0 border-l-[6px] border-l-[#DCF8C6] border-b-[6px] border-b-transparent" />
                </div>
              </div>

              {/* Typing or Jane's reply */}
              {phase === 'typing' && (
                <div className="flex justify-start">
                  <div className="relative bg-white rounded-tr-xl rounded-tl-[4px] rounded-b-xl px-1.5 py-1 shadow-sm">
                    <TypingIndicator />
                    <div className="absolute top-0 -left-[6px] w-0 h-0 border-r-[6px] border-r-white border-b-[6px] border-b-transparent" />
                  </div>
                </div>
              )}

              {phase === 'janeMsg' && (
                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <div className="flex justify-start">
                    <div className="relative max-w-[85%] bg-white rounded-tr-xl rounded-tl-[4px] rounded-b-xl px-2.5 py-1.5 text-[11px] text-[#111] leading-snug shadow-sm">
                      {convo.janeMsg}
                      <div className="text-[8px] text-[#999] text-right mt-0.5">{convo.time}</div>
                      <div className="absolute top-0 -left-[6px] w-0 h-0 border-r-[6px] border-r-white border-b-[6px] border-b-transparent" />
                    </div>
                  </div>
                  <div className="text-[8px] text-[#999] pl-2 font-medium">Jane · AI Social Manager</div>

                  {/* Preview Card */}
                  <div className="flex justify-start pl-1">
                    <div className="bg-white rounded-lg border border-[#e0e0e0] overflow-hidden max-w-[80%] shadow-sm">
                      <div className="bg-[#f0f0f0] px-2 py-1.5 text-[10px] font-bold text-[#333] leading-tight">
                        {convo.preview.text}
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 border-t border-[#eee]">
                        <span className="text-[8px] font-bold text-[#666] bg-[#e8e8e8] px-1.5 py-[1px] rounded">
                          {platformIcons[convo.preview.platform] || convo.preview.platform}
                        </span>
                        <span className="text-[8px] text-[#999]">Draft ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex items-center gap-1.5 mt-2 bg-white rounded-full px-2 py-1.5 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
              </svg>
              <span className="flex-1 text-[10px] text-[#999]">Type a message</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tap to pause hint — mobile only */}
      <div
        className="mt-3 text-[11px] text-primary-foreground/50 font-medium lg:hidden transition-opacity duration-500"
        style={{ opacity: showTapHint ? 1 : 0 }}
      >
        Tap to pause
      </div>
    </div>
  );
};

export default WhatsAppPhoneMockup;
