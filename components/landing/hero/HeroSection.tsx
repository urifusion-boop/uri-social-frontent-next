'use client';

const HeroSection = () => {
  return (
    <section
      className="relative flex items-center halftone-bg overflow-hidden pt-20 pb-12"
      style={{ backgroundColor: 'hsl(340, 74%, 42%)', minHeight: '85vh' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        {/* Comic headline */}
        <div className="text-center mb-8">
          <h1
            className="comic-headline text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-4"
            style={{ color: 'white' }}
          >
            YOUR SOCIAL MEDIA MANAGER <span className="highlight-strip">JUST CLOCKED IN.</span>
          </h1>
          <p
            className="text-base sm:text-lg font-semibold max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255, 255, 255, 0.85)' }}
          >
            Meet Jane — she creates posts, publishes on time, monitors trends, replies to customers, and writes you a
            performance report every week. She never takes leave. She never asks for a raise. She just... delivers.
          </p>
        </div>

        {/* Before/After Comic Panels */}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6 max-w-5xl mx-auto mb-8">
          {/* BEFORE Panel */}
          <div className="comic-panel relative" style={{ backgroundColor: 'white' }}>
            <div className="comic-caption absolute top-3 left-3 z-10">PANEL 1: BEFORE JANE</div>
            <div className="p-4 pt-12">
              {/* SVG Character - stressed */}
              <div className="flex justify-center mb-4">
                <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="40" r="28" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="3" />
                  <circle cx="50" cy="36" r="4" fill="white" stroke="hsl(var(--foreground))" strokeWidth="2" />
                  <circle cx="70" cy="36" r="4" fill="white" stroke="hsl(var(--foreground))" strokeWidth="2" />
                  <circle cx="51" cy="37" r="2" fill="hsl(var(--foreground))" />
                  <circle cx="71" cy="37" r="2" fill="hsl(var(--foreground))" />
                  <path
                    d="M48 52 Q60 46 72 52"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M86 28 Q88 22 90 28 Q88 32 86 28Z"
                    fill="hsl(var(--uri-blue))"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M92 36 Q94 32 96 36 Q94 39 92 36Z"
                    fill="hsl(var(--uri-blue))"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="38"
                    y="68"
                    width="44"
                    height="50"
                    rx="6"
                    fill="hsl(var(--uri-purple))"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="3"
                  />
                  <rect
                    x="14"
                    y="60"
                    width="24"
                    height="12"
                    rx="6"
                    fill="#8D6E63"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="82"
                    y="60"
                    width="24"
                    height="12"
                    rx="6"
                    fill="#8D6E63"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M32 35 Q32 12 60 12 Q88 12 88 35"
                    fill="#2D2D2D"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
              <div className="space-y-3">
                <div className="speech-bubble text-sm text-foreground">"My last post was 3 weeks ago..."</div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <span className="action-word text-xs !rotate-[-3deg]">BEHIND!</span>
                  <span
                    className="action-word text-xs !rotate-[2deg]"
                    style={{
                      background: 'hsl(var(--destructive))',
                      color: 'white',
                      borderColor: 'hsl(var(--foreground))',
                    }}
                  >
                    0 ENGAGEMENT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AFTER Panel */}
          <div className="comic-panel relative" style={{ backgroundColor: 'white' }}>
            <div
              className="comic-caption absolute top-3 left-3 z-10"
              style={{ background: 'hsl(var(--uri-green))', color: 'white', borderColor: 'hsl(var(--foreground))' }}
            >
              PANEL 2: AFTER JANE
            </div>
            <div className="p-4 pt-12">
              <div className="flex justify-center mb-4">
                <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="40" r="28" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="3" />
                  <path
                    d="M46 36 Q50 32 54 36"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M66 36 Q70 32 74 36"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M48 48 Q60 58 72 48"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <rect
                    x="38"
                    y="68"
                    width="44"
                    height="50"
                    rx="6"
                    fill="hsl(var(--uri-green))"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="3"
                  />
                  <rect
                    x="10"
                    y="78"
                    width="28"
                    height="12"
                    rx="6"
                    fill="#8D6E63"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="82"
                    y="78"
                    width="28"
                    height="12"
                    rx="6"
                    fill="#8D6E63"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M32 35 Q32 12 60 12 Q88 12 88 35"
                    fill="#2D2D2D"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2.5"
                  />
                  <rect x="44" y="30" width="14" height="10" rx="3" fill="hsl(var(--foreground))" />
                  <rect x="62" y="30" width="14" height="10" rx="3" fill="hsl(var(--foreground))" />
                  <line x1="58" y1="35" x2="62" y2="35" stroke="hsl(var(--foreground))" strokeWidth="2" />
                </svg>
              </div>
              <div className="space-y-3">
                <div className="speech-bubble text-sm text-foreground">"Jane's got it handled."</div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <span
                    className="action-word text-xs !rotate-[3deg]"
                    style={{
                      background: 'hsl(var(--uri-green))',
                      color: 'white',
                      borderColor: 'hsl(var(--foreground))',
                    }}
                  >
                    POSTED!
                  </span>
                  <span
                    className="action-word text-xs !rotate-[-2deg]"
                    style={{ background: 'hsl(var(--primary))', color: 'white', borderColor: 'hsl(var(--foreground))' }}
                  >
                    SCHEDULED!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            className="comic-btn px-6 py-3 rounded-lg text-sm"
            style={{ backgroundColor: 'black', color: 'white' }}
          >
            HIRE JANE — IT'S FREE
          </button>
          <button
            className="comic-btn px-6 py-3 rounded-lg text-sm"
            style={{ backgroundColor: 'white', color: 'hsl(340, 74%, 42%)' }}
          >
            SEE HER IN ACTION
          </button>
        </div>

        {/* Trust bar */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            TRUSTED BY 200+ BUSINESSES ACROSS NIGERIA · GHANA · KENYA · SOUTH AFRICA
          </p>
          <div className="flex justify-center -space-x-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black"
                style={{
                  backgroundColor: 'white',
                  color: 'black',
                  borderWidth: '3px',
                  borderStyle: 'solid',
                  borderColor: 'black',
                }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black"
              style={{
                backgroundColor: 'hsl(45, 100%, 51%)',
                color: 'black',
                borderWidth: '3px',
                borderStyle: 'solid',
                borderColor: 'black',
              }}
            >
              +194
            </div>
          </div>
        </div>
      </div>

      {/* Floating action words — kept select few */}
      <div className="absolute top-24 right-8 hidden lg:block action-word !text-xs animate-float-slow">TRENDING!</div>
      <div
        className="absolute bottom-32 left-12 hidden lg:block action-word !text-xs !rotate-[6deg] animate-float-medium"
        style={{ background: 'hsl(var(--uri-green))', color: 'white', borderColor: 'hsl(var(--foreground))' }}
      >
        APPROVED!
      </div>
      <div
        className="absolute top-1/2 right-16 hidden lg:block action-word !text-xs !rotate-[-8deg] animate-float-fast"
        style={{
          background: 'hsl(var(--primary-foreground))',
          color: 'hsl(var(--primary))',
          borderColor: 'hsl(var(--foreground))',
        }}
      >
        SCHEDULED!
      </div>
    </section>
  );
};

export default HeroSection;
