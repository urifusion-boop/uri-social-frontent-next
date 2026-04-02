const ProblemSection = () => {
  const panels = [
    {
      caption: 'MEANWHILE, AT YOUR DESK...',
      letter: 'C',
      letterBg: 'bg-uri-blue',
      bubble: 'You start your day with 100+ unread emails and zero social media posts ready.',
      title: 'THE GHOST ACCOUNT',
      desc: "You set up Instagram, posted for 2 weeks, then life happened. Now your last post says 'Happy New Year 2024.'",
      rotation: '-rotate-1',
      color: 'bg-uri-blue/10',
    },
    {
      caption: 'THE SOCIAL MEDIA SITUATION...',
      letter: 'S',
      letterBg: 'bg-uri-purple',
      bubble: "Your social media hasn't been updated in weeks. Cobwebs are forming.",
      title: 'THE COPY-PASTE CAPTIONS',
      desc: "You asked ChatGPT to write a post. It sounded like a robot wrote it. Because a robot wrote it. A robot that doesn't know your brand.",
      rotation: 'rotate-1',
      color: 'bg-uri-purple/10',
    },
    {
      caption: 'THE CYCLE CONTINUES...',
      letter: 'G',
      letterBg: 'bg-uri-green',
      bubble: "Everything keeps getting pushed to 'next week'. Sound familiar?",
      title: 'THE GUESSING GAME',
      desc: "You post when you remember. You use hashtags that feel right. You have no idea what's actually working.",
      rotation: '-rotate-[0.5deg]',
      color: 'bg-uri-green/10',
    },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            BE HONEST. <span className="highlight-strip">WHEN LAST DID YOU POST?</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto font-medium" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Your competitor posted 3 times today. You posted... that one graphic from February.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {panels.map((p, i) => (
            <div
              key={i}
              className={`comic-panel ${p.rotation}`}
              style={{ backgroundColor: i === 0 ? '#E3F2FD' : i === 1 ? '#F3E5F5' : '#E8F5E9' }}
            >
              <div className="comic-caption m-3">{p.caption}</div>
              <div className="p-5 pt-2">
                <div className="flex justify-center mb-3">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-white`}
                    style={{
                      backgroundColor: i === 0 ? '#2196F3' : i === 1 ? '#9C27B0' : '#4CAF50',
                      borderWidth: '3px',
                      borderStyle: 'solid',
                      borderColor: 'black',
                    }}
                  >
                    {p.letter}
                  </div>
                </div>
                <div className="speech-bubble text-sm mb-4" style={{ color: 'black' }}>
                  {p.bubble}
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-black mb-1 uppercase" style={{ color: 'black' }}>
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                    {p.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xl sm:text-2xl font-black mb-2" style={{ color: 'black' }}>
            Sound familiar?
          </p>
          <p className="text-xl sm:text-2xl font-black" style={{ color: 'hsl(340, 74%, 42%)' }}>
            What if you could hire someone who actually shows up? Meet Jane.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
