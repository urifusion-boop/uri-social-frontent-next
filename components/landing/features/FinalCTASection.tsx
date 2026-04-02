const FinalCTASection = () => {
  return (
    <section
      className="py-16 lg:py-20 relative overflow-hidden halftone-bg"
      style={{ backgroundColor: 'hsl(340, 74%, 42%)' }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div>
          {/* Relaxed character */}
          <div className="flex justify-center mb-8">
            <svg width="140" height="160" viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect
                x="20"
                y="110"
                width="100"
                height="8"
                rx="2"
                fill="hsl(45, 100%, 51%)"
                stroke="black"
                strokeWidth="2.5"
              />
              <rect x="30" y="118" width="8" height="30" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="2" />
              <rect x="102" y="118" width="8" height="30" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="2" />
              <rect
                x="50"
                y="92"
                width="40"
                height="18"
                rx="3"
                fill="hsl(207, 90%, 54%)"
                stroke="black"
                strokeWidth="2.5"
              />
              <rect x="55" y="96" width="30" height="10" rx="1" fill="white" />
              <text x="64" y="104" fontSize="6" fontWeight="900" fill="hsl(340, 74%, 42%)">
                JANE
              </text>
              <circle cx="70" cy="55" r="22" fill="#8D6E63" stroke="black" strokeWidth="3" />
              <rect x="56" y="49" width="12" height="8" rx="3" fill="black" />
              <rect x="72" y="49" width="12" height="8" rx="3" fill="black" />
              <line x1="68" y1="53" x2="72" y2="53" stroke="black" strokeWidth="2" />
              <path d="M60 63 Q70 73 80 63" stroke="black" strokeWidth="2.5" fill="white" strokeLinecap="round" />
              <rect
                x="52"
                y="77"
                width="36"
                height="35"
                rx="6"
                fill="hsl(122, 39%, 49%)"
                stroke="black"
                strokeWidth="3"
              />
              <path
                d="M52 85 L35 70 L40 60"
                stroke="#8D6E63"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M88 85 L105 70 L100 60"
                stroke="#8D6E63"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M48 48 Q48 33 70 33 Q92 33 92 48" fill="#2D2D2D" stroke="black" strokeWidth="2.5" />
              <circle cx="125" cy="20" r="12" fill="hsl(45, 100%, 51%)" stroke="black" strokeWidth="2" />
            </svg>
          </div>

          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'white' }}>
            IF YOU ARE READING THIS, YOU ARE ALREADY AHEAD.
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto font-bold" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Your competitors are still doing it manually. You won't be.
          </p>

          <button
            className="comic-btn px-10 py-4 rounded-lg text-lg"
            style={{ backgroundColor: 'black', color: 'white' }}
          >
            HIRE JANE →
          </button>

          <p className="text-sm mt-6 font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            JOIN 200+ AFRICAN BUSINESSES ALREADY WORKING WITH JANE
          </p>
        </div>
      </div>

      {/* Floating action words */}
      <div
        className="absolute top-16 left-8 hidden lg:block action-word animate-float-slow"
        style={{ fontSize: '11px', backgroundColor: 'hsl(122, 39%, 49%)', color: 'white', transform: 'rotate(-8deg)' }}
      >
        POSTED!
      </div>
      <div
        className="absolute bottom-20 right-12 hidden lg:block action-word animate-float-medium"
        style={{ fontSize: '11px', transform: 'rotate(6deg)' }}
      >
        SCHEDULED!
      </div>
      <div
        className="absolute top-1/3 right-8 hidden lg:block action-word animate-float-fast"
        style={{ fontSize: '11px', backgroundColor: 'hsl(282, 67%, 38%)', color: 'white', transform: 'rotate(-4deg)' }}
      >
        APPROVED!
      </div>
    </section>
  );
};

export default FinalCTASection;
