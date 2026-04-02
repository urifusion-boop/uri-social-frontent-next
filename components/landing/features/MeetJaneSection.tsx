const MeetJaneSection = () => {
  const stats = [
    { label: 'CONTENT CREATION', fill: 8 },
    { label: 'SPEED', fill: 10 },
    { label: 'STAMINA (24/7)', fill: 10 },
    { label: 'BRAND VOICE', fill: 8 },
    { label: 'DAYS OFF', fill: 10, note: '0' },
  ];

  return (
    <section
      className="py-16 lg:py-20 relative overflow-hidden halftone-bg-dark"
      style={{ backgroundColor: 'hsl(330, 40%, 7%)', color: 'white' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'white' }}>
            <span className="highlight-strip">EMPLOYEE OF THE MONTH.</span> EVERY MONTH.
          </h2>
        </div>

        <div className="relative flex justify-center">
          {/* Trading Card */}
          <div
            className="comic-panel max-w-sm w-full transition-transform duration-300"
            style={{ backgroundColor: 'white', color: 'black', transform: 'rotate(1deg)' }}
          >
            {/* Header */}
            <div
              className="text-center py-3"
              style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white', borderBottom: '3px solid black' }}
            >
              <p className="text-xs font-black uppercase tracking-widest">URI SOCIAL PRESENTS</p>
            </div>

            <div className="p-6">
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340, 74%, 42%) 0%, hsl(340, 82%, 50%) 100%)',
                    border: '3px solid black',
                    color: 'white',
                  }}
                >
                  J
                </div>
              </div>

              <div className="text-center mb-5">
                <h3 className="text-3xl font-black uppercase" style={{ color: 'black' }}>
                  JANE
                </h3>
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                  AI SOCIAL MEDIA MANAGER
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: 'hsl(122, 39%, 49%)' }}
                  />
                  <span className="text-xs font-black uppercase" style={{ color: 'hsl(122, 39%, 49%)' }}>
                    ACTIVE NOW
                  </span>
                </div>
              </div>

              <hr className="comic-divider mb-4" />

              {/* Stats bars */}
              <div className="space-y-3">
                {stats.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'black' }}>
                        {s.label}
                      </span>
                      {s.note && (
                        <span className="text-xs font-black" style={{ color: 'hsl(340, 74%, 42%)' }}>
                          {s.note}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-3 flex-1 rounded-sm"
                          style={{
                            border: '1px solid rgba(0, 0, 0, 0.2)',
                            backgroundColor: i < s.fill ? 'hsl(340, 74%, 42%)' : 'rgba(0, 0, 0, 0.08)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-center mt-5 italic font-medium" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                References available upon request. (Spoiler: she's never been fired.)
              </p>
            </div>
          </div>

          {/* Floating stats — text only, no emojis */}
          <div className="absolute top-8 -left-4 sm:left-4 hidden sm:block">
            <div className="speech-bubble text-xs font-bold !p-3" style={{ backgroundColor: 'white', color: 'black' }}>
              0 sick days taken
            </div>
          </div>
          <div className="absolute top-1/3 -right-4 sm:right-4 hidden sm:block">
            <div
              className="speech-bubble speech-bubble-right text-xs font-bold !p-3"
              style={{ backgroundColor: 'white', color: 'black' }}
            >
              Infinite posts drafted
            </div>
          </div>
          <div className="absolute bottom-12 -left-4 sm:left-8 hidden sm:block">
            <div className="speech-bubble text-xs font-bold !p-3" style={{ backgroundColor: 'white', color: 'black' }}>
              Zero salary negotiations
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetJaneSection;
