"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { User, Store, Building2, Megaphone, CheckCircle2, AlertTriangle } from "lucide-react";

const sections = [
  {
    id: "individuals",
    icon: User,
    color: "hsl(31, 95%, 50%)",
    bg: "hsla(31, 95%, 50%, 0.1)",
    borderColor: "hsl(31, 95%, 50%)",
    title: "Individuals",
    subtitle: "Influencers, Creators & Freelancers",
    who: "You're building a personal brand, growing an audience, and trying to stand out in a crowded space — but creating content consistently feels like a full-time job on top of your actual work.",
    challenges: [
      "Struggling to post consistently while juggling your main hustle",
      "Trying to build an audience but can't crack the algorithm",
      "Growing your personal brand feels overwhelming without a team",
      "You know what you want to say, but not how to package it for social",
    ],
    solutions: [
      "Jane learns your voice and posts content that sounds like YOU — every single day",
      "She tracks trends in real-time so your content stays relevant and discoverable",
      "Auto-scheduling means your brand is active even when you're sleeping",
      "She helps you grow your audience with consistent, on-brand content across all platforms",
    ],
    quote: "I just want to focus on my craft. Jane handles everything else.",
  },
  {
    id: "smbs",
    icon: Store,
    color: "hsl(270, 85%, 60%)",
    bg: "hsla(270, 85%, 60%, 0.1)",
    borderColor: "hsl(270, 85%, 60%)",
    title: "Small & Mid Businesses",
    subtitle: "Restaurants, Salons, Shops & Service Providers",
    who: "You're wearing every hat — CEO, marketer, accountant, customer service. Social media is important, but it keeps falling to the bottom of your to-do list.",
    challenges: [
      "No dedicated marketing person — you're doing it all",
      "Posting is inconsistent: 3 posts one week, silence for two weeks",
      "You know social media matters but can't afford ₦200K/month for an agency",
      "Approving content takes too long with back-and-forth emails",
    ],
    solutions: [
      "Jane creates and posts daily content — completely hands-off",
      "Approve posts instantly via WhatsApp — no apps, no dashboards",
      "Starting from ₦15,000/month — a fraction of agency costs",
      "She monitors comments and replies so you never miss a customer",
    ],
    quote: "I used to spend my Sundays making posts for the week. Now Jane does it before I wake up.",
  },
  {
    id: "large-businesses",
    icon: Building2,
    color: "hsl(205, 90%, 50%)",
    bg: "hsla(205, 90%, 50%, 0.1)",
    borderColor: "hsl(205, 90%, 50%)",
    title: "Large Businesses",
    subtitle: "Established Brands & Enterprises",
    who: "You have the brand, the audience, and the budget — but maintaining consistent, high-quality content across multiple channels and markets is a logistical headache.",
    challenges: [
      "Keeping brand voice consistent across teams and platforms",
      "Coordinating content calendars across departments and regions",
      "Need real-time analytics but your tools are fragmented",
      "Scaling content output without scaling headcount",
    ],
    solutions: [
      "Jane maintains brand guidelines perfectly across every channel",
      "Multi-brand management with dedicated workspaces per team or product",
      "Advanced analytics dashboard with real-time performance insights",
      "Scale content 10x without hiring — Jane generates, schedules, and optimizes",
    ],
    quote: "We needed consistency at scale. Jane delivers it without the overhead.",
  },
  {
    id: "agencies",
    icon: Megaphone,
    color: "hsl(145, 65%, 45%)",
    bg: "hsla(145, 65%, 45%, 0.1)",
    borderColor: "hsl(145, 65%, 45%)",
    title: "Agencies",
    subtitle: "Marketing & Social Media Agencies",
    who: "You're managing 10, 20, maybe 50+ client accounts. Content calendars, approvals, reporting — it's chaos. You need a system that scales with your client list.",
    challenges: [
      "Managing multiple client accounts with different brand voices",
      "Content approval workflows are slow and messy",
      "Client reporting takes hours every month",
      "Onboarding new clients takes weeks before content starts flowing",
    ],
    solutions: [
      "Multi-brand dashboard — switch between clients in one click",
      "Built-in approval workflows with client-facing review links",
      "Auto-generated performance reports you can white-label",
      "Onboard a new client in 5 minutes — Jane learns their brand instantly",
    ],
    quote: "Jane turned our 4-person content team into a 40-client powerhouse.",
  },
];

const UseCases = () => {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-28 pb-16 bg-background halftone-bg-light">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="comic-headline text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-5">
            How <span className="highlight-strip">Jane Works</span> For You
          </h1>
          <p className="text-muted-foreground font-bold text-lg max-w-2xl mx-auto">
            No matter your size or industry — if you need social media content, Jane's built for you.
          </p>
        </div>
      </section>

      {/* Sections */}
      {sections.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          className={`py-20 lg:py-24 ${i % 2 === 0 ? "bg-card halftone-bg" : "bg-background halftone-bg-light"}`}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="p-3 rounded-lg border-3 border-foreground"
                  style={{ backgroundColor: s.bg }}
                >
                  <s.icon className="w-8 h-8" strokeWidth={2.5} style={{ color: s.color }} />
                </div>
                <div>
                  <h2 className="comic-headline text-2xl sm:text-3xl lg:text-4xl font-black text-foreground">
                    {s.title}
                  </h2>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{s.subtitle}</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal>
              <p className="text-foreground/80 font-bold text-base sm:text-lg mb-10 max-w-3xl">{s.who}</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              {/* Challenges */}
              <ScrollReveal>
                <div
                  className="comic-panel p-6"
                  style={{
                    backgroundColor: "hsla(0, 84%, 60%, 0.05)",
                    borderColor: "hsl(0, 84%, 60%)",
                  }}
                >
                  <h3 className="text-lg font-black text-foreground uppercase mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" style={{ color: "hsl(0, 84%, 60%)" }} />
                    The Struggle
                  </h3>
                  <ul className="space-y-3">
                    {s.challenges.map((c, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="font-black text-sm mt-0.5" style={{ color: "hsl(0, 84%, 60%)" }}>✕</span>
                        <span className="text-sm font-bold text-foreground/80">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>

              {/* Solutions */}
              <ScrollReveal>
                <div
                  className="comic-panel p-6"
                  style={{
                    backgroundColor: "hsla(31, 95%, 50%, 0.05)",
                    borderColor: s.borderColor,
                  }}
                >
                  <h3 className="text-lg font-black text-foreground uppercase mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" style={{ color: s.color }} />
                    How Jane Fixes It
                  </h3>
                  <ul className="space-y-3">
                    {s.solutions.map((sol, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="font-black text-sm mt-0.5" style={{ color: "hsl(145, 65%, 45%)" }}>✓</span>
                        <span className="text-sm font-bold text-foreground/80">{sol}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            </div>

            {/* Quote */}
            <ScrollReveal>
              <div className="speech-bubble max-w-lg">
                <p className="text-sm font-bold text-foreground/80 italic">"{s.quote}"</p>
              </div>
            </ScrollReveal>

            {/* CTA */}
            <ScrollReveal className="mt-8">
              <Link
                href="/#pricing"
                className="comic-btn bg-primary text-primary-foreground px-6 py-3 rounded-lg text-sm inline-block"
              >
                Hire Jane for your {s.title.toLowerCase()} →
              </Link>
            </ScrollReveal>
          </div>
        </section>
      ))}
    </div>
  );
};

export default UseCases;
