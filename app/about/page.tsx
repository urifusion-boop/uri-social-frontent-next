"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/landing/shared/ScrollReveal";
import { useEffect } from "react";

const teamMembers = [
  { name: "Chidi", role: "Founder & CEO", quote: "I built Jane so I could stop working weekends. It worked." },
  { name: "Amara", role: "Head of Product", quote: "If it takes more than 5 minutes to learn, we've failed." },
  { name: "Tunde", role: "Lead Engineer", quote: "I write code so Jane can write captions." },
  { name: "Ngozi", role: "Head of Design", quote: "Making AI feel human is an art. I take it seriously." },
];

const values = [
  { title: "Africa first, always", description: "We price in Naira. We design for WhatsApp. We optimize for African timezones. Every product decision starts with: does this work for a business owner in Lagos?" },
  { title: "Simple beats clever", description: "If it takes more than 5 minutes to learn, we've failed. Jane should feel like talking to a teammate, not configuring software." },
  { title: "Your brand, not ours", description: "Jane adapts to you. She doesn't impose a style or a voice. She learns yours and amplifies it. Your customers should never know an AI wrote that post." },
];

const About = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ paddingTop: '7rem', paddingBottom: '4rem', backgroundColor: 'hsl(262.1 83.3% 57.8%)', position: 'relative' }}>
        <div className="halftone-bg-dark" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}></div>
        <div style={{ maxWidth: '56rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1rem', paddingRight: '1rem', textAlign: 'center', position: 'relative' }}>
          <h1 className="comic-headline" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)', fontWeight: 900, color: 'hsl(210 40% 98%)', marginBottom: '1.25rem' }}>
            We Built Jane Because <span style={{ opacity: 0.8 }}>We Needed Her</span>
          </h1>
          <p style={{ color: 'hsla(210, 40%, 98%, 0.8)', fontWeight: 700, fontSize: '1.125rem', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto' }}>
            URI Creative started as a social media agency. We know the pain. We built the solution.
          </p>
        </div>
      </section>

      {/* Story */}
      <section style={{ paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'hsl(0 0% 100%)', position: 'relative' }}>
        <div className="halftone-bg-light" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}></div>
        <div style={{ maxWidth: '56rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1rem', paddingRight: '1rem', position: 'relative' }}>
          <ScrollReveal>
            <div className="comic-panel" style={{ backgroundColor: 'hsl(0 0% 100%)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'hsla(222.2, 84%, 4.9%, 0.8)' }}>We're URI Creative — a creative agency based in Lagos, Nigeria. For years, we managed social media for dozens of clients. We wrote the captions. We designed the graphics. We scheduled the posts. We tracked the analytics. We did the reporting.</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'hsla(222.2, 84%, 4.9%, 0.8)' }}>And we noticed something: <strong style={{ color: 'hsl(222.2 84% 4.9%)' }}>80% of what we did was repeatable.</strong> The same workflow, every day, for every client. The creative part was 20%. The operational grind was 80%.</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'hsla(222.2, 84%, 4.9%, 0.8)' }}>So we asked: what if we could automate the 80% and give every business — not just the ones who could afford an agency — access to consistent, on-brand social media management?</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'hsl(222.2 84% 4.9%)' }}>That's how Jane was born.</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'hsla(222.2, 84%, 4.9%, 0.8)' }}>Jane isn't a chatbot. She isn't a template generator. She's the distillation of everything we learned running a social media agency — packaged into an AI teammate that works 24/7 for a fraction of the cost.</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'hsla(222.2, 84%, 4.9%, 0.8)' }}>We built Jane for the African market first because that's home. We understand the WhatsApp-first workflow. We know that Naira pricing isn't a "nice to have" — it's a dealbreaker. And we believe African businesses deserve the same quality tools that Silicon Valley startups take for granted.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Team */}
      <section style={{ paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'hsl(0 0% 100%)', position: 'relative' }}>
        <div className="halftone-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}></div>
        <div style={{ maxWidth: '64rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1rem', paddingRight: '1rem', position: 'relative' }}>
          <ScrollReveal className="text-center" style={{ marginBottom: '3.5rem' }}>
            <h2 className="comic-headline" style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 900, color: 'hsl(222.2 84% 4.9%)' }}>The Humans <span className="highlight-strip">Behind Jane</span></h2>
          </ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {teamMembers.map((m, i) => (
              <ScrollReveal key={i}>
                <div className="comic-panel" style={{ backgroundColor: 'hsl(0 0% 100%)', padding: '1.5rem', textAlign: 'center', height: '100%' }}>
                  <div style={{ width: '4rem', height: '4rem', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1rem', borderRadius: '9999px', backgroundColor: 'hsla(262.1, 83.3%, 57.8%, 0.1)', border: '3px solid hsl(222.2 84% 4.9%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'hsl(262.1 83.3% 57.8%)' }}>{m.name[0]}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'hsl(222.2 84% 4.9%)', textTransform: 'uppercase' }}>{m.name}</h3>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(262.1 83.3% 57.8%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>{m.role}</p>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsla(222.2, 84%, 4.9%, 0.6)', fontStyle: 'italic' }}>"{m.quote}"</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'hsl(0 0% 100%)', position: 'relative' }}>
        <div className="halftone-bg-light" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}></div>
        <div style={{ maxWidth: '64rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1rem', paddingRight: '1rem', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {values.map((v, i) => (
              <ScrollReveal key={i}>
                <div className="comic-panel" style={{ backgroundColor: 'hsl(0 0% 100%)', padding: '1.5rem', height: '100%' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'hsl(222.2 84% 4.9%)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>{v.title}</h3>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'hsla(222.2, 84%, 4.9%, 0.7)' }}>{v.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ paddingTop: '5rem', paddingBottom: '5rem', backgroundColor: 'hsl(262.1 83.3% 57.8%)', position: 'relative' }}>
        <div className="halftone-bg-dark" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}></div>
        <div style={{ maxWidth: '48rem', marginLeft: 'auto', marginRight: 'auto', paddingLeft: '1rem', paddingRight: '1rem', textAlign: 'center', position: 'relative' }}>
          <h2 className="comic-headline" style={{ fontSize: '1.875rem', fontWeight: 900, color: 'hsl(210 40% 98%)', marginBottom: '1rem' }}>Want to join the team?</h2>
          <p style={{ color: 'hsla(210, 40%, 98%, 0.8)', fontWeight: 700, marginBottom: '1.5rem' }}>We're hiring.</p>
          <Link href="/careers" className="comic-btn" style={{ backgroundColor: 'hsl(0 0% 100%)', color: 'hsl(222.2 84% 4.9%)', paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1rem', paddingBottom: '1rem', borderRadius: '0.5rem', fontSize: '1rem', display: 'inline-block' }}>
            See Open Roles →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
