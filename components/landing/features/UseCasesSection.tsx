'use client';

import { motion } from 'framer-motion';

const useCases = [
  {
    industry: 'Fashion',
    prompt: 'Get more WhatsApp orders for my new collection.',
    outcome:
      'Creates the content, launches the campaign, manages the enquiries, and learns which campaigns bring buyers.',
    color: 'hsl(282, 67%, 38%)',
  },
  {
    industry: 'Real Estate',
    prompt: 'Find people actively looking for property.',
    outcome: 'Monitors buying signals, runs the campaigns, and surfaces the people most likely to buy.',
    color: 'hsl(207, 90%, 54%)',
  },
  {
    industry: 'Restaurant',
    prompt: 'Get more orders this weekend.',
    outcome: 'Creates the promotion, runs localized campaigns, and tracks every conversation that turns into an order.',
    color: 'hsl(340, 74%, 42%)',
  },
  {
    industry: 'Professional Services',
    prompt: 'Find businesses that may need my service.',
    outcome: 'Identifies the buying signals that matter, then starts and manages outreach for you.',
    color: 'hsl(122, 39%, 49%)',
  },
  {
    industry: 'E-commerce',
    prompt: 'Sell more of this product.',
    outcome: 'Coordinates creative, distribution, ads, customer acquisition and measurement around one product.',
    color: 'hsl(45, 100%, 51%)',
  },
];

const UseCasesSection = () => {
  return (
    <section className="py-16 lg:py-20" style={{ backgroundColor: 'white' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-3" style={{ color: 'black' }}>
            WHAT CAN URI DO <span className="highlight-strip">FOR MY BUSINESS?</span>
          </h2>
          <p className="text-sm font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            Say what you want. Here is how it plays out for your kind of business.
          </p>
        </motion.div>

        {/* Mobile: snap-scrolling row. Desktop: five-up grid. */}
        <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {useCases.map((useCase, i) => (
            <motion.div
              key={useCase.industry}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="comic-panel snap-center shrink-0 w-[78%] sm:w-[52%] lg:w-auto p-5 flex flex-col"
              style={{ backgroundColor: 'white' }}
            >
              <span
                className="self-start text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-4"
                style={{ backgroundColor: useCase.color, border: '2px solid black', color: 'white' }}
              >
                {useCase.industry}
              </span>

              <div
                className="speech-bubble text-sm font-bold mb-4 leading-snug"
                style={{ border: '2px solid black', padding: '10px 12px', color: 'black' }}
              >
                &ldquo;{useCase.prompt}&rdquo;
              </div>

              <p className="text-xs leading-relaxed mt-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                {useCase.outcome}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
