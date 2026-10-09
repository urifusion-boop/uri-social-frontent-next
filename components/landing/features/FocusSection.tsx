'use client';

import { motion } from 'framer-motion';

const professions = [
  'Selling food.',
  'Designing clothes.',
  'Building houses.',
  'Running a salon.',
  'Providing professional services.',
  'Creating products.',
];

const FocusSection = () => {
  return (
    <section className="py-16 lg:py-20" style={{ backgroundColor: 'white' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-3"
          style={{ color: 'black' }}
        >
          FOCUS ON <span className="highlight-strip">WHAT YOU&apos;RE GOOD AT.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-base font-semibold mb-8"
          style={{ color: 'rgba(0, 0, 0, 0.55)' }}
        >
          Let Uri handle the growth work. You started your business because you&apos;re good at something.
        </motion.p>

        <div className="flex flex-wrap justify-center gap-x-2 gap-y-2 mb-8">
          {professions.map((item, i) => (
            <motion.span
              key={item}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.2 + i * 0.08 }}
              className="text-sm sm:text-base font-bold px-3 py-1.5 rounded-full"
              style={{
                border: '2px solid black',
                color: 'black',
                backgroundColor: 'hsl(12, 100%, 98%)',
              }}
            >
              {item}
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-base sm:text-lg font-medium mb-2"
          style={{ color: 'rgba(0, 0, 0, 0.6)' }}
        >
          You shouldn&apos;t also have to become a content creator, media buyer, marketing analyst and lead-generation
          expert.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-lg sm:text-xl font-black"
          style={{ color: 'hsl(340, 74%, 42%)' }}
        >
          Tell Jane the outcome. She handles the work.
        </motion.p>
      </div>
    </section>
  );
};

export default FocusSection;
