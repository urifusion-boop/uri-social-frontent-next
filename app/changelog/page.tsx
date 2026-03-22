"use client";

import { ScrollReveal } from "@/components/ScrollReveal";
import { useEffect } from "react";

const months = [
  {
    month: "March 2026",
    entries: [
      { type: "New Feature", tag: { bg: "hsl(122 39% 49% / 0.1)", text: "hsl(122 39% 49%)" }, title: "Voice Note Directives", description: "You can now send Jane voice notes instead of typing. Just tap the mic, tell her what you need, and she transcribes and executes." },
      { type: "New Feature", tag: { bg: "hsl(122 39% 49% / 0.1)", text: "hsl(122 39% 49%)" }, title: "WhatsApp Approval Flow", description: "Approve, revise, or reject posts directly from WhatsApp. No need to open the dashboard." },
      { type: "Improvement", tag: { bg: "hsl(207 90% 54% / 0.1)", text: "hsl(207 90% 54%)" }, title: "Improved Brand Voice Matching", description: "Jane's content now more accurately mirrors your tone after analyzing your brand personality quiz results and writing samples." },
      { type: "Fix", tag: { bg: "hsl(25 100% 50% / 0.1)", text: "hsl(25 100% 50%)" }, title: "Scheduling timezone fix", description: "Scheduling timezone issue for WAT users resolved." },
    ],
  },
  {
    month: "February 2026",
    entries: [
      { type: "New Feature", tag: { bg: "hsl(122 39% 49% / 0.1)", text: "hsl(122 39% 49%)" }, title: "Social Inbox", description: "All your DMs, comments, and mentions from every platform in one unified inbox. Jane flags important messages and suggests replies." },
      { type: "New Feature", tag: { bg: "hsl(122 39% 49% / 0.1)", text: "hsl(122 39% 49%)" }, title: "Competitor Monitoring", description: "Add up to 3 competitor handles. Jane watches what they post and flags opportunities." },
      { type: "Improvement", tag: { bg: "hsl(207 90% 54% / 0.1)", text: "hsl(207 90% 54%)" }, title: "Faster Post Generation", description: "Content generation is now 40% faster with improved AI processing." },
    ],
  },
  {
    month: "January 2026",
    entries: [
      { type: "New Feature", tag: { bg: "hsl(122 39% 49% / 0.1)", text: "hsl(122 39% 49%)" }, title: "URI Social Launch", description: "Jane is officially available! Full onboarding, content creation, multi-platform publishing, trend monitoring, and performance analytics." },
      { type: "New Feature", tag: { bg: "hsl(122 39% 49% / 0.1)", text: "hsl(122 39% 49%)" }, title: "Brand Personality Quiz", description: "Interactive onboarding quiz that captures your brand voice in 60 seconds." },
      { type: "New Feature", tag: { bg: "hsl(122 39% 49% / 0.1)", text: "hsl(122 39% 49%)" }, title: "Multi-Platform Publishing", description: "Support for Instagram, Facebook, LinkedIn, X, TikTok, Pinterest, and YouTube." },
    ],
  },
];

const Changelog = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16 bg-background halftone-bg-light">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="comic-headline text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-5">
            What's New <span className="highlight-strip">With Jane</span>
          </h1>
          <p className="text-muted-foreground font-bold text-lg max-w-2xl mx-auto">
            We're always teaching Jane new tricks. Here's what she's learned recently.
          </p>
        </div>
      </section>

      <section className="py-20 bg-card halftone-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {months.map((m, i) => (
            <ScrollReveal key={i}>
              <h2 className="comic-headline text-2xl font-black text-foreground mb-6">{m.month}</h2>
              <div className="space-y-4">
                {m.entries.map((e, j) => (
                  <div key={j} className="comic-panel bg-background p-5 flex items-start gap-4">
                    <span
                      className="text-xs font-black px-2.5 py-1 rounded shrink-0"
                      style={{
                        backgroundColor: e.tag.bg,
                        color: e.tag.text
                      }}
                    >
                      {e.type}
                    </span>
                    <div>
                      <h3 className="text-base font-black text-foreground mb-1">{e.title}</h3>
                      <p className="text-sm font-bold text-foreground/70">{e.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Changelog;
