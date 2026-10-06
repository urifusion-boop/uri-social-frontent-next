'use client';

import { motion } from 'framer-motion';

// Template only. Replace every bracketed field with a verified customer's
// details and consent before this goes live. Nothing here is a real result.
const caseStudy = {
  business: '[Business name]',
  meta: '[Industry] · [City]',
  challenge:
    "[In the owner's own words: the problem they had before Uri, e.g. no time to post, enquiries going unanswered.]",
  actions: [
    'Jane drafted and queued [X] posts a week for approval.',
    'Every WhatsApp enquiry was answered and logged as a lead.',
    'Campaigns were run, and spend moved to what converted.',
  ],
  results: [
    { value: '[X]', label: 'Customers won' },
    { value: '[X]', label: 'Hours back a week' },
    { value: '₦[X]', label: 'Revenue attributed' },
  ],
  quote: '[A short quote from the customer, used only with their permission.]',
  quoteName: '[Name], [Role], [Business]',
};

const CaseStudySection = () => {
  return (
    <section className="py-16 lg:py-20" style={{ backgroundColor: 'white' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-3" style={{ color: 'black' }}>
            A CUSTOMER, <span className="highlight-strip">IN THEIR OWN WORDS.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="comic-panel bg-white overflow-hidden relative"
          style={{ borderStyle: 'dashed' }}
        >
          <span
            className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full z-10"
            style={{ backgroundColor: 'hsl(45, 100%, 51%)', border: '2px solid black', color: 'black' }}
          >
            Template
          </span>

          <div className="p-6 md:p-8 grid md:grid-cols-[1.2fr_1fr] gap-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'hsl(340, 74%, 42%)' }}>
                {caseStudy.meta}
              </p>
              <h3 className="text-2xl font-black mb-4" style={{ color: 'black' }}>
                {caseStudy.business}
              </h3>

              <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'rgba(0,0,0,0.5)' }}>
                The challenge
              </p>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
                {caseStudy.challenge}
              </p>

              <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: 'rgba(0,0,0,0.5)' }}>
                What Jane did
              </p>
              <ul className="space-y-2">
                {caseStudy.actions.map((action) => (
                  <li key={action} className="flex gap-2 text-sm" style={{ color: 'rgba(0, 0, 0, 0.75)' }}>
                    <span className="font-black" style={{ color: 'hsl(122, 39%, 49%)' }}>
                      ✓
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
                {caseStudy.results.map((r) => (
                  <div
                    key={r.label}
                    className="rounded-lg p-3 md:p-4"
                    style={{ backgroundColor: 'hsl(12, 100%, 98%)', border: '2px solid black' }}
                  >
                    <div className="text-xl md:text-2xl font-black" style={{ color: 'hsl(340, 74%, 42%)' }}>
                      {r.value}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'rgba(0,0,0,0.5)' }}>
                      {r.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="speech-bubble text-sm mt-auto"
                style={{ border: '2px solid black', padding: '14px', color: 'black' }}
              >
                &ldquo;{caseStudy.quote}&rdquo;
                <p className="text-xs font-bold mt-2" style={{ color: 'rgba(0,0,0,0.55)' }}>
                  {caseStudy.quoteName}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CaseStudySection;
