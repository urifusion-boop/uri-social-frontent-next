import Link from 'next/link';
import { useState } from 'react';
import { Sparkles, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How does Jane create content?',
      answer:
        "Jane uses advanced AI to analyze your brand voice, audience preferences, and trending topics. She generates engaging, on-brand content tailored to each platform's best practices.",
    },
    {
      question: 'Can I review posts before they go live?',
      answer:
        'Absolutely! You can set Jane to auto-publish or require your approval for each post. You have full control over your content strategy.',
    },
    {
      question: 'Which social media platforms does Jane support?',
      answer:
        "Jane supports all major platforms including Facebook, Instagram, Twitter/X, LinkedIn, TikTok, Pinterest, and YouTube. We're constantly adding new platforms.",
    },
    {
      question: 'How does the free trial work?',
      answer:
        'Your 14-day free trial includes full access to all features in your chosen plan. No credit card required. Cancel anytime during the trial with no charges.',
    },
    {
      question: 'Can I change plans later?',
      answer:
        "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.",
    },
    {
      question: 'What kind of analytics does Jane provide?',
      answer:
        "Jane tracks engagement metrics, audience growth, best posting times, content performance, and ROI. You'll receive detailed reports tailored to your plan level.",
    },
  ];

  return (
    <section id="faq" className="py-24 lg:py-32 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">FAQ</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Questions? <span className="text-gradient-primary">We've got answers</span>
          </h2>
          <p className="text-xl text-muted-foreground">Everything you need to know about Jane and how she works</p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold pr-8 group-hover:text-primary transition-colors">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? 'auto' : 0,
                    opacity: openIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="text-muted-foreground mt-4 leading-relaxed">{faq.answer}</p>
                </motion.div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <button className="gradient-primary text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105">
            Contact Support
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
