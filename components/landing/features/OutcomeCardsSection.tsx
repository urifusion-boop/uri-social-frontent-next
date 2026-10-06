import { UserPlus, CalendarCheck, Radar, Target, Handshake, BarChart3 } from 'lucide-react';

const outcomes = [
  {
    icon: UserPlus,
    title: 'GET MORE CUSTOMERS',
    desc: 'Tell Jane your goal and budget. She helps create and run campaigns built around customer acquisition.',
    color: 'hsl(340, 74%, 42%)',
  },
  {
    icon: CalendarCheck,
    title: 'SHOW UP CONSISTENTLY',
    desc: 'Jane creates your graphics, videos, captions and content calendar, then helps publish them.',
    color: 'hsl(282, 67%, 38%)',
  },
  {
    icon: Radar,
    title: 'FIND PEOPLE ALREADY LOOKING FOR WHAT YOU SELL',
    desc: 'Uri monitors conversations and buying signals to surface potential customers.',
    color: 'hsl(207, 90%, 54%)',
  },
  {
    icon: Target,
    title: 'RUN BETTER ADS',
    desc: 'Give Jane a budget and objective. She creates campaigns, audiences and creatives, and learns from performance.',
    color: 'hsl(45, 100%, 51%)',
  },
  {
    icon: Handshake,
    title: 'TURN INTEREST INTO SALES',
    desc: 'Brings customer conversations together and helps you respond and follow up with interested prospects.',
    color: 'hsl(122, 39%, 49%)',
  },
  {
    icon: BarChart3,
    title: "KNOW WHAT'S ACTUALLY WORKING",
    desc: 'Real numbers, not vanity metrics: leads, qualified leads, customers, cost per customer, revenue.',
    color: 'hsl(340, 74%, 42%)',
  },
];

const OutcomeCardsSection = () => {
  return (
    <section className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            WHAT DO YOU NEED <span className="highlight-strip">URI TO DO?</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {outcomes.map((outcome) => {
            const Icon = outcome.icon;
            return (
              <div key={outcome.title} className="comic-panel p-5" style={{ backgroundColor: 'white' }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: outcome.color, border: '3px solid black' }}
                >
                  <Icon className="w-6 h-6" color="white" strokeWidth={2.5} />
                </div>
                <h3 className="text-sm font-black uppercase mb-2 leading-snug" style={{ color: 'black' }}>
                  {outcome.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  {outcome.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default OutcomeCardsSection;
