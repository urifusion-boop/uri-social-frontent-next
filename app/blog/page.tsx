"use client";

import { ScrollReveal } from "@/components/ScrollReveal";
import { useEffect } from "react";

const posts = [
  { title: "Why Your Social Media Manager Should Be an AI (And When It Shouldn't)", category: "Insights", read: "8 min read", date: "March 2026", excerpt: "AI isn't replacing creative humans. It's replacing the repetitive operational work that burns creative humans out. Here's the difference." },
  { title: "The Brand Voice Problem: Why Most AI Content Sounds Like Everyone Else", category: "Product", read: "6 min read", date: "March 2026", excerpt: "Generic tone dropdowns don't work. Here's how Jane's personality quiz captures voice nuance that 'Professional' and 'Casual' never could." },
  { title: "WhatsApp-First: Why We Built Approval Around Africa's Favourite App", category: "Behind the Scenes", read: "5 min read", date: "February 2026", excerpt: "In Africa, WhatsApp IS the internet for many business owners. Building our approval flow around it wasn't a feature — it was a philosophy." },
  { title: "Content Pillars: The Strategy Most Small Businesses Skip", category: "Tips", read: "7 min read", date: "February 2026", excerpt: "Posting randomly is why your engagement flatlines. Here's how defining 3-5 content pillars transforms your social media from noise to strategy." },
  { title: "What We Learned Running a Social Media Agency for 3 Years", category: "Story", read: "10 min read", date: "January 2026", excerpt: "We managed 40+ clients. Here's what worked, what didn't, and why we decided to turn our agency workflows into an AI." },
  { title: "Posting Schedule: Why 'When' Matters as Much as 'What'", category: "Tips", read: "4 min read", date: "January 2026", excerpt: "Your audience in Lagos isn't scrolling at the same time as an audience in Nairobi. Jane knows the difference." },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Insights: { bg: "hsl(207 90% 54% / 0.1)", text: "hsl(207 90% 54%)" },
  Product: { bg: "hsl(340 74% 42% / 0.1)", text: "hsl(340 74% 42%)" },
  "Behind the Scenes": { bg: "hsl(282 67% 38% / 0.1)", text: "hsl(282 67% 38%)" },
  Tips: { bg: "hsl(122 39% 49% / 0.1)", text: "hsl(122 39% 49%)" },
  Story: { bg: "hsl(25 100% 50% / 0.1)", text: "hsl(25 100% 50%)" },
};

const Blog = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16 bg-background halftone-bg-light">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="comic-headline text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-5">
            The URI <span className="highlight-strip">Blog</span>
          </h1>
          <p className="text-muted-foreground font-bold text-lg max-w-2xl mx-auto">
            Social media tips, product updates, and the occasional hot take. Written by humans. (Jane offered to help, but we said no.)
          </p>
        </div>
      </section>

      <section className="py-20 bg-card halftone-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p, i) => (
              <ScrollReveal key={i}>
                <div className="comic-panel bg-background p-0 overflow-hidden h-full flex flex-col">
                  <div className="h-36 bg-gradient-to-br from-primary/20 to-primary/5 border-b-3 border-foreground" />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: categoryColors[p.category]?.bg || "hsl(20 30% 94%)",
                          color: categoryColors[p.category]?.text || "hsl(0 0% 40%)"
                        }}
                      >
                        {p.category}
                      </span>
                      <span className="text-xs text-muted-foreground font-bold">{p.read}</span>
                    </div>
                    <h3 className="text-base font-black text-foreground mb-2 leading-tight">{p.title}</h3>
                    <p className="text-sm font-bold text-foreground/60 mb-4 flex-1">{p.excerpt}</p>
                    <span className="text-xs font-bold text-muted-foreground">{p.date}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
