const TestimonialsSection = () => {
  const testimonials = [
    {
      quote:
        'I used to spend my Sundays batch-creating content. Now Jane handles everything and my Sundays are mine again. Omo, this thing is real.',
      name: 'Bola A.',
      title: 'Founder, Lagos Bites',
      industry: 'Food delivery',
      initial: 'B',
      color: 'hsl(282, 67%, 38%)',
    },
    {
      quote:
        'Our posting went from once a week to daily. Engagement tripled in the first month. Jane understands our brand better than our last intern did.',
      name: 'Chike N.',
      title: 'CEO, FreshFit Gym',
      industry: 'Fitness',
      initial: 'C',
      color: 'hsl(207, 90%, 54%)',
    },
    {
      quote:
        'The WhatsApp approval is genius. I approve posts between meetings. No logging in, no dashboards, no stress.',
      name: 'Amina T.',
      title: 'Owner, Aura Beauty Studio',
      industry: 'Beauty',
      initial: 'A',
      color: 'hsl(122, 39%, 49%)',
    },
    {
      quote:
        'We manage 4 brands. Jane handles all of them without mixing up the voices. That alone is worth the subscription.',
      name: 'David O.',
      title: 'Creative Director, Pulse Agency',
      industry: 'Agency',
      initial: 'D',
      color: 'hsl(45, 100%, 51%)',
    },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg overflow-hidden" style={{ backgroundColor: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
            style={{ color: 'black', transform: 'rotate(-1deg)' }}
          >
            DON'T TAKE OUR WORD FOR IT. <span className="highlight-strip">TAKE THEIRS.</span>
          </h2>
          <p className="text-xs italic font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            * Placeholder testimonials — to be replaced with real ones
          </p>
        </div>

        {/* Marquee testimonials */}
        <div className="relative">
          <div className="flex gap-6 animate-marquee" style={{ width: 'max-content' }}>
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i} className="w-80 flex-shrink-0">
                <div className="speech-bubble text-sm mb-8" style={{ border: '2px solid black', color: 'black' }}>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <span key={j} className="text-lg" style={{ color: 'hsl(45, 100%, 51%)' }}>
                        ★
                      </span>
                    ))}
                  </div>
                  "{t.quote}"
                </div>
                <div className="flex items-center gap-3 pl-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg"
                    style={{ backgroundColor: t.color, border: '3px solid black', color: 'white' }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: 'black' }}>
                      {t.name}
                    </p>
                    <p className="text-xs font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                      {t.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
