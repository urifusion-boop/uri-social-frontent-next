import {
  Ear,
  ClipboardList,
  Sparkles,
  Send,
  Megaphone,
  Search,
  MessageCircle,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

const steps = [
  {
    num: 1,
    icon: Ear,
    title: 'LISTEN',
    desc: 'Understand customers, conversations and demand.',
    color: 'hsl(340, 74%, 42%)',
  },
  {
    num: 2,
    icon: ClipboardList,
    title: 'PLAN',
    desc: 'Turn business goals into marketing actions.',
    color: 'hsl(282, 67%, 38%)',
  },
  {
    num: 3,
    icon: Sparkles,
    title: 'CREATE',
    desc: 'Generate content, campaigns and creatives.',
    color: 'hsl(207, 90%, 54%)',
  },
  { num: 4, icon: Send, title: 'PUBLISH', desc: 'Stay active across relevant channels.', color: 'hsl(122, 39%, 49%)' },
  {
    num: 5,
    icon: Megaphone,
    title: 'ADVERTISE',
    desc: 'Launch and optimize ad campaigns.',
    color: 'hsl(45, 100%, 51%)',
  },
  {
    num: 6,
    icon: Search,
    title: 'FIND',
    desc: 'Identify potential buyers and sales signals.',
    color: 'hsl(340, 74%, 42%)',
  },
  { num: 7, icon: MessageCircle, title: 'ENGAGE', desc: 'Manage customer conversations.', color: 'hsl(282, 67%, 38%)' },
  {
    num: 8,
    icon: ShoppingBag,
    title: 'SELL',
    desc: 'Move interested people toward purchase.',
    color: 'hsl(207, 90%, 54%)',
  },
  {
    num: 9,
    icon: TrendingUp,
    title: 'LEARN',
    desc: 'Understand what actually generates customers.',
    color: 'hsl(122, 39%, 49%)',
  },
];

const GrowthEngineSection = () => {
  return (
    <section className="py-16 lg:py-20 halftone-bg" style={{ backgroundColor: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color: 'black' }}>
            ONE SYSTEM <span className="highlight-strip">BEHIND YOUR GROWTH.</span>
          </h2>
          <p
            className="text-xs sm:text-sm font-black uppercase tracking-wider flex flex-wrap justify-center gap-x-1.5 gap-y-1"
            style={{ color: 'rgba(0, 0, 0, 0.4)' }}
          >
            {steps.map((step, i) => (
              <span key={step.title}>
                {step.title}
                {i < steps.length - 1 && <span style={{ color: 'hsl(340, 74%, 42%)' }}> &rarr;</span>}
              </span>
            ))}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="comic-panel p-5" style={{ backgroundColor: 'white' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: step.color, border: '2.5px solid black' }}
                  >
                    <Icon className="w-5 h-5" color="white" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wide" style={{ color: 'black' }}>
                    {step.num}. {step.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default GrowthEngineSection;
