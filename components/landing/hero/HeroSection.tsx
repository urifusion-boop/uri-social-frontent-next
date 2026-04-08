'use client';

import WhatsAppPhoneMockup from './WhatsAppPhoneMockup';

const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex items-center halftone-bg overflow-hidden pt-20 sm:pt-24 pb-12 sm:pb-16"
      style={{ backgroundColor: 'hsl(340, 74%, 42%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 sm:gap-10 lg:gap-12">
          {/* Left Side — Headline + CTAs */}
          <div className="flex-1 text-left w-full lg:w-auto">
            <h1
              className="comic-headline text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-5 leading-tight"
              style={{ color: 'white' }}
            >
              YOUR SOCIAL MEDIA MANAGER <span className="highlight-strip">JUST CLOCKED IN.</span>
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg font-semibold max-w-full lg:max-w-xl leading-relaxed mb-5 sm:mb-6"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              Meet Jane — she creates posts, publishes on time, monitors trends, replies to customers, and writes you a
              performance report every week. She never takes leave. She never asks for a raise. She just... delivers.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start mb-5 sm:mb-6 w-full sm:w-auto">
              <button
                className="comic-btn px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold w-full sm:w-auto"
                style={{
                  backgroundColor: 'black',
                  color: 'white',
                  border: '3px solid black',
                }}
              >
                HIRE JANE — IT'S FREE
              </button>
              <button
                className="comic-btn px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold w-full sm:w-auto"
                style={{
                  backgroundColor: 'white',
                  color: 'hsl(340, 74%, 42%)',
                  border: '3px solid black',
                }}
              >
                SEE HER IN ACTION
              </button>
            </div>

            {/* Trust bar */}
            <div className="text-left space-y-2 w-full">
              <p
                className="text-xs sm:text-sm font-bold uppercase tracking-wider"
                style={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                TRUSTED BY 200+ BUSINESSES ACROSS NIGERIA · GHANA · KENYA · SOUTH AFRICA
              </p>
              <div className="flex justify-start -space-x-1.5 sm:-space-x-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black"
                    style={{
                      backgroundColor: 'white',
                      color: 'black',
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: 'black',
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-black"
                  style={{
                    backgroundColor: 'hsl(45, 100%, 51%)',
                    color: 'black',
                    borderWidth: '2px',
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
          {/* <div className="flex-shrink-0 relative w-full lg:w-auto flex justify-center lg:justify-end mt-4 lg:mt-0">
            <WhatsAppPhoneMockup />
          </div> */}
        </div>
      </div>

      {/* Floating action words */}
      <div className="absolute top-20 sm:top-24 right-4 sm:right-8 hidden md:block action-word !text-xs animate-float-slow">
        TRENDING!
      </div>
      <div
        className="absolute bottom-24 sm:bottom-32 left-4 sm:left-12 hidden md:block action-word !text-xs !rotate-[6deg] animate-float-medium"
        style={{ background: 'hsl(var(--uri-green))', color: 'white', borderColor: 'hsl(var(--foreground))' }}
      >
        APPROVED!
      </div>
      <div
        className="absolute top-1/2 right-8 sm:right-16 hidden xl:block action-word !text-xs !rotate-[-8deg] animate-float-fast"
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
