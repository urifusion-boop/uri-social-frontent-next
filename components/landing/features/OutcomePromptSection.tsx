'use client';

import { useEffect, useState } from 'react';

const prompts = [
  'Jane, I have ₦10,000. Get me customers this week.',
  'Jane, create ads for my new product.',
  'Jane, find people looking for what I sell.',
  'Jane, follow up with everyone who asked about pricing.',
  'Jane, what marketing actually brought me customers this month?',
  'Jane, create content for my business this week.',
];

const OutcomePromptSection = () => {
  const [text, setText] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const typingSpeed = isDeleting ? 25 : 45;
    const current = prompts[promptIndex];

    if (!isDeleting && charIndex === current.length) {
      const pause = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(pause);
    }

    if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPromptIndex((prev) => (prev + 1) % prompts.length);
      return;
    }

    const timeout = setTimeout(() => {
      setText(current.substring(0, charIndex));
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, promptIndex]);

  return (
    <section className="py-8 sm:py-10" style={{ backgroundColor: 'white' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <p
          className="text-center text-xs font-black uppercase tracking-widest mb-3"
          style={{ color: 'rgba(0, 0, 0, 0.4)' }}
        >
          You say the outcome. Jane figures out the work.
        </p>
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3 sm:px-5 sm:py-4"
          style={{ border: '3px solid black', backgroundColor: 'hsl(12, 100%, 98%)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(340, 74%, 42%) 0%, hsl(340, 82%, 50%) 100%)',
              border: '2px solid black',
              color: 'white',
            }}
          >
            J
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm sm:text-base font-semibold" style={{ color: 'black' }}>
              {text}
            </span>
            <span
              className="inline-block w-0.5 h-4 sm:h-5 ml-0.5 align-middle animate-pulse"
              style={{ backgroundColor: 'hsl(340, 74%, 42%)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OutcomePromptSection;
