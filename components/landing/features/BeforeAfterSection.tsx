'use client';

import { motion } from 'framer-motion';

// Before/after states are drawn from what Uri actually does (see the
// DailyTimeline and WhatsApp approval flow). Figures are illustrative
// examples until verified customer numbers exist.
const rows = [
  {
    area: 'Content',
    before: 'Posting when you remember. Your last post is still the one from February.',
    after: 'A week of posts drafted every morning. You approve from WhatsApp in about 30 seconds.',
    figure: '7 posts a week, without you writing them',
  },
  {
    area: 'Enquiries',
    before: 'DMs sit unread for days, and the buyer goes to someone who answered first.',
    after: 'Every enquiry answered, logged as a lead, and followed up on.',
    figure: '95% of enquiries answered within the hour',
  },
  {
    area: 'Ad spend',
    before: 'Money goes out on ads and nobody can say which one brought a customer.',
    after: 'Spend shifts to whatever is converting, and you can see the cost per customer.',
    figure: '38% lower cost per customer',
  },
];

const BeforeAfterSection = () => {
  return (
    <section className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-3" style={{ color: 'black' }}>
            BEFORE <span className="highlight-strip">AND AFTER URI.</span>
          </h2>
          <p className="text-sm font-bold" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            Figures shown are illustrative examples — real customer results coming soon.
          </p>
        </motion.div>

        <div className="hidden md:grid grid-cols-[1fr_1fr] gap-6 mb-3 px-1">
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#EF4444' }}>
            Without Uri
          </p>
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'hsl(122, 39%, 49%)' }}>
            With Uri
          </p>
        </div>

        <div className="space-y-5">
          {rows.map((row, i) => (
            <motion.div
              key={row.area}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="comic-panel p-4 md:p-5 bg-white"
            >
              <span
                className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mb-3"
                style={{ backgroundColor: 'black', color: 'white' }}
              >
                {row.area}
              </span>
              <div className="grid md:grid-cols-[1fr_1fr] gap-4">
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '2px solid #EF4444' }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
                    <span className="font-black mr-1" style={{ color: '#EF4444' }}>
                      ✕
                    </span>
                    {row.before}
                  </p>
                </div>
                <div
                  className="rounded-lg p-4"
                  style={{ backgroundColor: 'rgba(76, 175, 80, 0.07)', border: '2px solid hsl(122, 39%, 49%)' }}
                >
                  <p className="text-sm leading-relaxed font-semibold" style={{ color: 'black' }}>
                    <span className="font-black mr-1" style={{ color: 'hsl(122, 39%, 49%)' }}>
                      ✓
                    </span>
                    {row.after}
                  </p>
                  <p
                    className="text-xs font-black mt-3 pt-3"
                    style={{ color: 'hsl(340, 74%, 42%)', borderTop: '2px dashed rgba(0,0,0,0.15)' }}
                  >
                    {row.figure}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
