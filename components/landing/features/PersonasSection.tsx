import { User, Store, Building2, Megaphone } from 'lucide-react';
import Link from 'next/link';

const PersonasSection = () => {
  const personas = [
    {
      icon: User,
      title: 'Individuals',
      description:
        "Trying to build an audience, grow your personal brand, but can't keep up with posting consistently?",
      color: 'hsl(340, 74%, 42%)',
      bg: 'rgba(203, 42, 124, 0.1)',
    },
    {
      icon: Store,
      title: 'Small & Mid Businesses',
      description: "You're the CEO, marketer, and customer service — all at once?",
      color: 'hsl(282, 67%, 38%)',
      bg: 'rgba(156, 39, 176, 0.1)',
    },
    {
      icon: Building2,
      title: 'Large Businesses',
      description: 'Need scale and consistency across multiple channels?',
      color: 'hsl(207, 90%, 54%)',
      bg: 'rgba(33, 150, 243, 0.1)',
    },
    {
      icon: Megaphone,
      title: 'Agencies',
      description: 'Managing 10+ client accounts is pure chaos?',
      color: 'hsl(122, 39%, 49%)',
      bg: 'rgba(76, 175, 80, 0.1)',
    },
  ];

  return (
    <section className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            WHO <span className="highlight-strip">JANE WORKS FOR</span>
          </h2>
          <p className="font-bold text-lg max-w-2xl mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Whether you're a one-person show or a full agency, Jane's got your back.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {personas.map((p, i) => {
            const Icon = p.icon;
            return (
              <Link
                key={i}
                href="#"
                className="comic-panel block p-6 hover:translate-y-[-2px] transition-transform duration-200"
                style={{ backgroundColor: 'white' }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg shrink-0" style={{ backgroundColor: p.bg, border: '2px solid black' }}>
                    <Icon style={{ color: p.color }} className="w-6 h-6" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black uppercase mb-1" style={{ color: 'black' }}>
                      {p.title}
                    </h3>
                    <p className="text-sm font-bold mb-3" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                      {p.description}
                    </p>
                    <span
                      className="text-sm font-black uppercase tracking-wide"
                      style={{ color: 'hsl(340, 74%, 42%)' }}
                    >
                      SEE HOW →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
