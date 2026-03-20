"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Sparkles, ArrowRight, Zap, Check, Rocket, Target, TrendingUp, ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

// Modern Navbar Component
const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backgroundColor: 'rgba(252, 243, 239, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '3px solid black'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Image
                src="/images/uri-logo.png"
                alt="URI Social"
                width={40}
                height={40}
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">
                URI
              </span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Social
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollTo("how-it-works")}
              className="text-sm font-bold uppercase tracking-wide transition-colors duration-150"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="text-sm font-bold uppercase tracking-wide transition-colors duration-150"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo("faq")}
              className="text-sm font-bold uppercase tracking-wide transition-colors duration-150"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              FAQ
            </button>
            <Link
              href="/workspace"
              className="text-sm font-bold uppercase tracking-wide transition-colors duration-150"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              Sign In
            </Link>
            <button className="comic-btn px-5 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}>
              Get Started Free
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors"
            onClick={() => setOpen(!open)}
            style={{ color: 'black' }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden py-4 space-y-3"
            style={{ borderTop: '3px solid black', backgroundColor: 'rgba(252, 243, 239, 1)' }}
          >
            <button
              onClick={() => scrollTo("how-it-works")}
              className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo("faq")}
              className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              FAQ
            </button>
            <Link
              href="/workspace"
              className="block w-full text-left text-sm font-bold py-2 px-4 uppercase"
              style={{ color: 'rgba(0, 0, 0, 0.7)' }}
            >
              Sign In
            </Link>
            <button className="w-full comic-btn px-5 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}>
              Get Started Free
            </button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

// Comic Hero Section
const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center halftone-bg overflow-hidden pt-16" style={{ backgroundColor: 'hsl(340, 74%, 42%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
        {/* Comic headline */}
        <div className="text-center mb-12">
          <h1 className="comic-headline text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-6" style={{ color: 'white' }}>
            YOUR SOCIAL MEDIA MANAGER{" "}
            <span className="highlight-strip">JUST CLOCKED IN.</span>
          </h1>
          <p className="text-lg sm:text-xl font-semibold max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Meet Jane — she creates posts, publishes on time, monitors trends, replies to customers, and writes you a performance report every week. She never takes leave. She never asks for a raise. She just... delivers.
          </p>
        </div>

        {/* Before/After Comic Panels */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto mb-12">
          {/* BEFORE Panel */}
          <div className="comic-panel relative" style={{ backgroundColor: 'white' }}>
            <div className="comic-caption absolute top-3 left-3 z-10">PANEL 1: BEFORE JANE</div>
            <div className="p-6 pt-14">
              {/* SVG Character - stressed */}
              <div className="flex justify-center mb-4">
                <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="40" r="28" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="3"/>
                  <circle cx="50" cy="36" r="4" fill="white" stroke="hsl(var(--foreground))" strokeWidth="2"/>
                  <circle cx="70" cy="36" r="4" fill="white" stroke="hsl(var(--foreground))" strokeWidth="2"/>
                  <circle cx="51" cy="37" r="2" fill="hsl(var(--foreground))"/>
                  <circle cx="71" cy="37" r="2" fill="hsl(var(--foreground))"/>
                  <path d="M48 52 Q60 46 72 52" stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M86 28 Q88 22 90 28 Q88 32 86 28Z" fill="hsl(var(--uri-blue))" stroke="hsl(var(--foreground))" strokeWidth="1.5"/>
                  <path d="M92 36 Q94 32 96 36 Q94 39 92 36Z" fill="hsl(var(--uri-blue))" stroke="hsl(var(--foreground))" strokeWidth="1.5"/>
                  <rect x="38" y="68" width="44" height="50" rx="6" fill="hsl(var(--uri-purple))" stroke="hsl(var(--foreground))" strokeWidth="3"/>
                  <rect x="14" y="60" width="24" height="12" rx="6" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <rect x="82" y="60" width="24" height="12" rx="6" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <path d="M32 35 Q32 12 60 12 Q88 12 88 35" fill="#2D2D2D" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                </svg>
              </div>
              <div className="space-y-3">
                <div className="speech-bubble text-sm text-foreground">
                  "My last post was 3 weeks ago..."
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <span className="action-word text-xs !rotate-[-3deg]">BEHIND!</span>
                  <span className="action-word text-xs !rotate-[2deg]" style={{ background: 'hsl(var(--destructive))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>0 ENGAGEMENT</span>
                </div>
              </div>
            </div>
          </div>

          {/* AFTER Panel */}
          <div className="comic-panel relative" style={{ backgroundColor: 'white' }}>
            <div className="comic-caption absolute top-3 left-3 z-10" style={{ background: 'hsl(var(--uri-green))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>PANEL 2: AFTER JANE</div>
            <div className="p-6 pt-14">
              <div className="flex justify-center mb-4">
                <svg width="120" height="140" viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="40" r="28" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="3"/>
                  <path d="M46 36 Q50 32 54 36" stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M66 36 Q70 32 74 36" stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <path d="M48 48 Q60 58 72 48" stroke="hsl(var(--foreground))" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <rect x="38" y="68" width="44" height="50" rx="6" fill="hsl(var(--uri-green))" stroke="hsl(var(--foreground))" strokeWidth="3"/>
                  <rect x="10" y="78" width="28" height="12" rx="6" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <rect x="82" y="78" width="28" height="12" rx="6" fill="#8D6E63" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <path d="M32 35 Q32 12 60 12 Q88 12 88 35" fill="#2D2D2D" stroke="hsl(var(--foreground))" strokeWidth="2.5"/>
                  <rect x="44" y="30" width="14" height="10" rx="3" fill="hsl(var(--foreground))"/>
                  <rect x="62" y="30" width="14" height="10" rx="3" fill="hsl(var(--foreground))"/>
                  <line x1="58" y1="35" x2="62" y2="35" stroke="hsl(var(--foreground))" strokeWidth="2"/>
                </svg>
              </div>
              <div className="space-y-3">
                <div className="speech-bubble text-sm text-foreground">
                  "Jane's got it handled."
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <span className="action-word text-xs !rotate-[3deg]" style={{ background: 'hsl(var(--uri-green))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>POSTED!</span>
                  <span className="action-word text-xs !rotate-[-2deg]" style={{ background: 'hsl(var(--primary))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>SCHEDULED!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="comic-btn px-8 py-4 rounded-lg text-base" style={{ backgroundColor: 'black', color: 'white' }}>
            HIRE JANE — IT'S FREE
          </button>
          <button className="comic-btn px-8 py-4 rounded-lg text-base" style={{ backgroundColor: 'white', color: 'hsl(340, 74%, 42%)' }}>
            SEE HER IN ACTION
          </button>
        </div>

        {/* Trust bar */}
        <div className="text-center mt-10 space-y-3">
          <p className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>TRUSTED BY 200+ BUSINESSES ACROSS NIGERIA · GHANA · KENYA · SOUTH AFRICA</p>
          <div className="flex justify-center -space-x-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: 'white', color: 'black', borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black" style={{ backgroundColor: 'hsl(45, 100%, 51%)', color: 'black', borderWidth: '3px', borderStyle: 'solid', borderColor: 'black' }}>
              +194
            </div>
          </div>
        </div>
      </div>

      {/* Floating action words — kept select few */}
      <div className="absolute top-24 right-8 hidden lg:block action-word !text-xs animate-float-slow">TRENDING!</div>
      <div className="absolute bottom-32 left-12 hidden lg:block action-word !text-xs !rotate-[6deg] animate-float-medium" style={{ background: 'hsl(var(--uri-green))', color: 'white', borderColor: 'hsl(var(--foreground))' }}>APPROVED!</div>
      <div className="absolute top-1/2 right-16 hidden lg:block action-word !text-xs !rotate-[-8deg] animate-float-fast" style={{ background: 'hsl(var(--primary-foreground))', color: 'hsl(var(--primary))', borderColor: 'hsl(var(--foreground))' }}>SCHEDULED!</div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      icon: Rocket,
      title: "Connect Your Accounts",
      description: "Link your social media accounts in seconds. Jane syncs with all major platforms instantly.",
      tag: "30 seconds",
    },
    {
      number: "02",
      icon: Target,
      title: "Set Your Goals",
      description: "Tell Jane your brand voice, target audience, and posting schedule. She learns and adapts.",
      tag: "5 minutes",
    },
    {
      number: "03",
      icon: TrendingUp,
      title: "Watch Jane Work",
      description: "Jane creates engaging content, schedules posts, monitors engagement, and sends you weekly reports.",
      tag: "24/7",
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

// Pricing Section
const PricingSection = () => {
  const plans = [
    {
      name: "Intern",
      price: "29",
      description: "Perfect for solopreneurs and small businesses getting started",
      features: [
        "3 social media accounts",
        "30 posts per month",
        "Basic analytics",
        "Weekly reports",
        "Email support",
      ],
      cta: "Start Free Trial",
      featured: false,
    },
    {
      name: "Full-Time",
      price: "79",
      description: "For growing businesses that need consistent content",
      features: [
        "10 social media accounts",
        "100 posts per month",
        "Advanced analytics",
        "Daily reports",
        "Priority support",
        "Custom brand voice",
        "A/B testing",
      ],
      cta: "Start Free Trial",
      featured: true,
    },
    {
      name: "Executive",
      price: "199",
      description: "Enterprise-level social media management",
      features: [
        "Unlimited accounts",
        "Unlimited posts",
        "Real-time analytics",
        "Real-time alerts",
        "Dedicated account manager",
        "White-label reports",
        "API access",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-background">
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
            <span className="text-sm font-semibold text-primary">Simple Pricing</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Choose your <span className="text-gradient-primary">perfect plan</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            14-day free trial. No credit card required. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative ${plan.featured ? "md:-mt-4" : ""}`}
            >
              {plan.featured && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                  <span className="gradient-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div
                className={`bg-card border rounded-2xl p-8 h-full flex flex-col ${
                  plan.featured
                    ? "border-primary shadow-xl shadow-primary/10 scale-105"
                    : "border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300"
                }`}
              >
                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-300 ${
                    plan.featured
                      ? "gradient-primary text-white hover:shadow-lg hover:shadow-primary/25 hover:scale-105"
                      : "border-2 border-border hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-sm text-muted-foreground">
            All plans include 14-day free trial • No credit card required • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does Jane create content?",
      answer: "Jane uses advanced AI to analyze your brand voice, audience preferences, and trending topics. She generates engaging, on-brand content tailored to each platform's best practices.",
    },
    {
      question: "Can I review posts before they go live?",
      answer: "Absolutely! You can set Jane to auto-publish or require your approval for each post. You have full control over your content strategy.",
    },
    {
      question: "Which social media platforms does Jane support?",
      answer: "Jane supports all major platforms including Facebook, Instagram, Twitter/X, LinkedIn, TikTok, Pinterest, and YouTube. We're constantly adding new platforms.",
    },
    {
      question: "How does the free trial work?",
      answer: "Your 14-day free trial includes full access to all features in your chosen plan. No credit card required. Cancel anytime during the trial with no charges.",
    },
    {
      question: "Can I change plans later?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.",
    },
    {
      question: "What kind of analytics does Jane provide?",
      answer: "Jane tracks engagement metrics, audience growth, best posting times, content performance, and ROI. You'll receive detailed reports tailored to your plan level.",
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
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Jane and how she works
          </p>
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
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <motion.div
                  initial={false}
                  animate={{
                    height: openIndex === index ? "auto" : 0,
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

// Footer
const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-background to-primary/5 border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/images/uri-logo.png"
                alt="URI Social"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold">URI</span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Social
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered social media management that never sleeps
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} className="text-muted-foreground hover:text-primary transition-colors">
                  Pricing
                </button>
              </li>
              <li>
                <Link href="/workspace" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 URI Social. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main Landing Page
export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
