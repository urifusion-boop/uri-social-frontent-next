import { Sparkles, Rocket, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      icon: Rocket,
      title: 'Connect Your Accounts',
      description: 'Link your social media accounts in seconds. Jane syncs with all major platforms instantly.',
      tag: '30 seconds',
    },
    {
      number: '02',
      icon: Target,
      title: 'Set Your Goals',
      description: 'Tell Jane your brand voice, target audience, and posting schedule. She learns and adapts.',
      tag: '5 minutes',
    },
    {
      number: '03',
      icon: TrendingUp,
      title: 'Watch Jane Work',
      description: 'Jane creates engaging content, schedules posts, monitors engagement, and sends you weekly reports.',
      tag: '24/7',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 lg:py-32 bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Simple Process</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Get started in <span className="text-gradient-primary">3 easy steps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No technical skills needed. Jane handles everything from content creation to analytics.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="relative group"
            >
              <div className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 h-full">
                {/* Tag */}
                <div className="absolute -top-4 right-8">
                  <span className="gradient-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    {step.tag}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-6 relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -left-2 text-7xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors duration-300">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>

              {/* Connector Line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-12 w-12 lg:w-24 h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
