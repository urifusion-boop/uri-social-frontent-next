'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Answers reflect what the product does today — check the backend before changing them.
  const faqs = [
    {
      question: 'What does Jane actually do?',
      answer:
        'Jane is your AI marketing and sales employee. She creates posts, graphics and videos in your brand voice, publishes them on schedule, plans and runs ad campaigns, and brings your Instagram and Facebook messages and comments into one inbox so no enquiry goes unanswered.',
    },
    {
      question: 'Which platforms can Jane post to?',
      answer:
        'Facebook, Instagram, LinkedIn, X (Twitter) and TikTok. Connect your accounts once and Jane formats each post for the platform it is going to.',
    },
    {
      question: 'Do I get to approve posts before they go live?',
      answer:
        'Yes. By default every post waits for your approval: approve from the dashboard, or reply "1" on WhatsApp. If you would rather not review each one, switch your workspace to auto-publish.',
    },
    {
      question: 'How do ads work with Jane?',
      answer:
        'Tell Jane your goal and budget, such as more WhatsApp enquiries or more sales. She builds the campaign, audience and creatives, and shows you the plan. You can edit any line before you launch. Ads run on Facebook and Instagram, and Jane reports spend, conversations and cost per conversation.',
    },
    {
      question: 'Is ad spend included in my plan?',
      answer:
        'No. Your plan pays for Jane’s work. Ad spend is paid from a separate ad wallet that you top up in Naira (minimum top-up ₦5,000), so you always see exactly how much went to ads.',
    },
    {
      question: 'How does the free trial work?',
      answer:
        'Your 7-day free trial comes with 10 credits to create content. You don’t need a card to start, and you can upgrade to a paid plan at any time.',
    },
    {
      question: 'What are credits, and how much do plans cost?',
      answer:
        'Credits pay for what Jane creates. Video editing uses more credits than a single post. Plans start at ₦15,000 a month for 20 credits, and you can pay in Naira or US dollars. Pay for 3, 6 or 12 months upfront and save 5%.',
    },
    {
      question: 'Can I cancel?',
      answer:
        'Yes, at any time from Billing. Your remaining credits stay usable until the end of the period you have already paid for.',
    },
    {
      question: 'Does Jane write in Pidgin?',
      answer:
        'Yes. Choose standard English or a light-to-heavy mix of Nigerian Pidgin, and Jane writes your captions to match your brand voice.',
    },
  ];

  return (
    <section id="faq" className="py-16 lg:py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2
            className="comic-headline text-3xl sm:text-4xl lg:text-5xl font-black mb-4"
            style={{ color: 'black', transform: 'rotate(-1deg)' }}
          >
            QUESTIONS? <span className="highlight-strip">WE&apos;VE GOT ANSWERS.</span>
          </h2>
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
            Everything you need to know about Jane
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="comic-panel"
                style={{ backgroundColor: 'white' }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpenIndex(isOpen ? null : index);
                    if (!isOpen) trackEvent('faq_expanded', { question: faq.question });
                  }}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base sm:text-lg font-black uppercase" style={{ color: 'black' }}>
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      style={{ color: 'hsl(340, 74%, 42%)' }}
                      strokeWidth={3}
                    />
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm leading-relaxed mt-3" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                      {faq.answer}
                    </p>
                  </motion.div>
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-base font-black mb-4" style={{ color: 'black' }}>
            Still have questions?
          </p>
          <Link
            href="/contact"
            className="comic-btn inline-block px-8 py-3 rounded-lg text-sm"
            style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}
            onClick={() => trackEvent('faq_contact_click')}
          >
            CONTACT SUPPORT →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
