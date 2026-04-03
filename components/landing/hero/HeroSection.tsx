'use client';

import WhatsAppPhoneMockup from './WhatsAppPhoneMockup';

const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex items-center halftone-bg overflow-hidden pt-20 pb-12"
      style={{ backgroundColor: 'hsl(340, 74%, 42%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Left Side — Headline + CTAs */}
          <div className="flex-1 text-center lg:text-left">
            <h1
              className="comic-headline text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-4"
              style={{ color: 'white' }}
            >
              YOUR SOCIAL MEDIA MANAGER <span className="highlight-strip">JUST CLOCKED IN.</span>
            </h1>
            <p
              className="text-base sm:text-lg font-semibold max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8"
              style={{ color: 'rgba(255, 255, 255, 0.85)' }}
            >
              Meet Jane — she creates posts, publishes on time, monitors trends, replies to customers, and writes you a
              performance report every week. She never takes leave. She never asks for a raise. She just... delivers.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center mb-8">
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
            <div className="text-center lg:text-left space-y-2">
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                TRUSTED BY 200+ BUSINESSES ACROSS NIGERIA · GHANA · KENYA · SOUTH AFRICA
              </p>
              <div className="flex justify-center lg:justify-start -space-x-2">
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

          {/* Right Side — WhatsApp Phone Mockup */}
          <div className="flex-shrink-0 relative">
            <WhatsAppPhoneMockup />
          </div>
        </div>
      </div>

      {/* Floating action words */}
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
