const WorkspaceSection = () => {
  return (
    <section className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
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

            {/* Chat interface */}
            <div className="p-6 space-y-4">
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
                  I've prepared your content calendar for next week! 3 Instagram reels, 5 feed posts, and 2 LinkedIn
                  articles.
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
                  Yes! And make the Tuesday post more casual, we're announcing a sale
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
                  Done! Updated with sale energy. Here's a preview:
                </div>
              </div>

              {/* Post preview */}
              <div
                className="ml-11 comic-panel"
                style={{ boxShadow: '3px 3px 0px black', backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
              >
                <div
                  className="h-28 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                >
                  <span className="text-2xl font-black" style={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                    SALE
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-black mb-1 uppercase" style={{ color: 'black' }}>
                    INSTAGRAM · TUESDAY 10:00 AM
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                    "SALE ALERT — Your favourites just got friendlier on your wallet. Up to 40% off..."
                  </p>
                </div>
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
              </div>
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
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-base font-bold italic" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Yes, you can literally just tell her "make me a post about our new product" and she'll do it.
          </p>
        </div>
      </div>
    </section>
  );
};

export default WorkspaceSection;
