const BuiltForAfricaSection = () => {
  const features = [
    {
      letter: 'M',
      title: 'Multilingual queen',
      desc: 'Posts in English, Pidgin, Yoruba, Hausa, Igbo, French, and more. Jane code-switches better than you.',
      color: 'hsl(282, 67%, 38%)',
    },
    {
      letter: 'W',
      title: 'WhatsApp everything',
      desc: "Approve posts, get alerts, review performance — all from WhatsApp. Because that's how we move.",
      color: 'hsl(122, 39%, 49%)',
    },
    {
      letter: 'N',
      title: 'Naira pricing, no wahala',
      desc: 'No dollar conversions. No surprise charges. Pricing that makes sense for African businesses.',
      color: 'hsl(45, 100%, 51%)',
    },
    {
      letter: 'P',
      title: 'Mobile-first, always',
      desc: 'Designed for the way you actually work. Phone in one hand, business in the other.',
      color: 'hsl(207, 90%, 54%)',
    },
    {
      letter: 'T',
      title: 'Knows your audience',
      desc: 'Optimized for WAT, EAT, CAT timezones. Posts when your people are scrolling.',
      color: 'hsl(282, 67%, 38%)',
    },
    {
      letter: 'L',
      title: 'Local trends, local vibes',
      desc: 'Jane monitors Nigerian Twitter, Lagos Instagram, Nairobi TikTok. She gets the culture.',
      color: 'hsl(340, 74%, 42%)',
    },
  ];

  const countries = [
    { name: 'Nigeria', flag: '🇳🇬', x: '42%', y: '52%' },
    { name: 'Ghana', flag: '🇬🇭', x: '35%', y: '50%' },
    { name: 'Kenya', flag: '🇰🇪', x: '62%', y: '52%' },
    { name: 'South Africa', flag: '🇿🇦', x: '52%', y: '78%' },
    { name: 'Egypt', flag: '🇪🇬', x: '55%', y: '25%' },
  ];

  return (
    <section
      className="py-16 lg:py-20 relative overflow-hidden halftone-bg-dark"
      style={{ backgroundColor: 'hsl(330, 40%, 7%)', color: 'white' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
            style={{ color: 'white', transform: 'rotate(-1deg)' }}
          >
            <span className="highlight-strip">SHE SPEAKS YOUR LANGUAGE.</span> LITERALLY.
          </h2>
        </div>

        {/* Africa map with pins */}
        <div className="flex justify-center mb-12">
          <div className="relative w-64 h-72">
            <svg
              width="256"
              height="288"
              viewBox="0 0 256 288"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                d="M128 20 C100 20 80 30 70 50 C60 70 55 80 50 100 C45 120 40 140 45 160 C50 180 55 200 60 220 C65 240 75 260 90 270 C105 280 125 282 140 275 C155 268 170 250 180 230 C190 210 195 190 198 170 C201 150 200 130 195 110 C190 90 180 70 170 50 C160 30 145 20 128 20Z"
                fill="hsl(340, 74%, 42%)"
                stroke="black"
                strokeWidth="3"
                opacity="0.8"
              />
            </svg>
            {/* Country pins */}
            {countries.map((c) => (
              <div
                key={c.name}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-float-slow"
                style={{ left: c.x, top: c.y }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-lg"
                  style={{ backgroundColor: 'white', border: '2px solid black' }}
                >
                  {c.flag}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="comic-panel transition-colors duration-150 hover:bg-white/10"
              style={{ borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <div className="p-5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black mb-4"
                  style={{ backgroundColor: f.color, border: '3px solid black', color: 'white' }}
                >
                  {f.letter}
                </div>
                <h3 className="text-lg font-black mb-2 uppercase" style={{ color: 'white' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BuiltForAfricaSection;
