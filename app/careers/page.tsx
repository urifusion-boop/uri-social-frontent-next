"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useEffect } from "react";
import { MapPin, Briefcase } from "lucide-react";

const perks = [
  { title: "We're remote-first", description: "Work from anywhere in Africa (or anywhere, honestly). We care about output, not office hours." },
  { title: "We ship fast", description: "We went from idea to launch in 4 months. If you like moving fast and breaking (then fixing) things, you'll fit in." },
  { title: "We're solving a real problem", description: "African businesses deserve world-class tools. We're building them." },
  { title: "Jane handles our social media", description: "Yes, we use our own product. And yes, she's good at it." },
];

const roles = [
  { title: "Full-Stack Engineer", location: "Lagos / Remote", type: "Full-time", description: "Build the workspace where thousands of businesses talk to Jane. React, Node, Python, and a healthy respect for clean code." },
  { title: "AI/ML Engineer", location: "Lagos / Remote", type: "Full-time", description: "Make Jane smarter. Fine-tune language models, build brand voice matching systems, and optimize content generation pipelines." },
  { title: "Product Designer", location: "Lagos / Remote", type: "Full-time", description: "Design the most intuitive social media workspace in Africa. If you can make complex workflows feel like a conversation, we need you." },
  { title: "Growth Marketer", location: "Lagos / Remote", type: "Full-time", description: "Get URI Social in front of every business owner in Africa. Content, paid, partnerships, community — whatever works." },
];

const Careers = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16 bg-primary halftone-bg-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="comic-headline text-4xl sm:text-5xl lg:text-6xl font-black text-primary-foreground mb-5">
            Come Build The Future Of Social Media In Africa
          </h1>
          <p className="text-primary-foreground/80 font-bold text-lg max-w-2xl mx-auto">
            We're a small team with big plans. If you're talented, relentless, and slightly obsessed with making things better — we want to talk.
          </p>
        </div>
      </section>

      {/* Why URI */}
      <section className="py-20 bg-background halftone-bg-light">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-6">
            {perks.map((p, i) => (
              <ScrollReveal key={i}>
                <div className="comic-panel bg-card p-6 h-full">
                  <h3 className="text-base font-black text-foreground uppercase mb-2">{p.title}</h3>
                  <p className="text-sm font-bold text-foreground/70">{p.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-20 bg-card halftone-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-14">
            <h2 className="comic-headline text-3xl sm:text-4xl font-black text-foreground">Open <span className="highlight-strip">Roles</span></h2>
          </ScrollReveal>

          <div className="space-y-4">
            {roles.map((r, i) => (
              <ScrollReveal key={i}>
                <div className="comic-panel bg-background p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <h3 className="text-lg font-black text-foreground uppercase">{r.title}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.location}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{r.type}</span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground/70">{r.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="mt-10">
            <div className="comic-panel bg-primary/5 !border-primary p-6 text-center">
              <h3 className="text-base font-black text-foreground uppercase mb-2">Don't see your role?</h3>
              <p className="text-sm font-bold text-foreground/70">We're always interested in exceptional people. Send us a note at <a href="mailto:careers@uricreative.com" className="text-primary underline">careers@uricreative.com</a> with what you'd bring to the team.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Careers;
