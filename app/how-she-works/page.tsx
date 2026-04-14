'use client';

import Link from 'next/link';
import { useEffect } from 'react';

const onboardingSteps = [
  {
    step: 'STEP 1',
    title: 'Tell her who you are',
    time: '30 seconds',
    description:
      "Type your brand name, pick your industry, and optionally drop your website URL. If you have a site, Jane scans it automatically to learn your style, colors, and tone. If you don't have a site — no wahala. She'll learn from what you give her next.",
    bubble: 'Got it. Let me look around...',
  },
  {
    step: 'STEP 2',
    title: 'Show her the look',
    time: '60 seconds',
    description:
      'Upload your logo. Pick your brand colors (or let Jane extract them from your logo). She now knows your visual identity and will use it in every single post she creates. Consistent branding, every time, without you touching Canva again.',
    sticker: 'BRANDED!',
  },
  {
    step: 'STEP 3',
    title: 'Take the personality quiz',
    time: '90 seconds',
    description:
      'Jane shows you pairs of example posts and asks "Which sounds more like you?" In 4 quick choices, she maps your entire brand personality. No more "select your tone from a dropdown" nonsense.',
    bubble: "Ah, so you're the bold-and-witty type. I can work with that. 😏",
  },
  {
    step: 'STEP 4',
    title: 'Give her the playbook',
    time: '60 seconds',
    description:
      'Pick your content pillars — the topics you want to talk about. Behind the Scenes, Product Highlights, Tips & Education, Customer Stories, and more. Pick 3-5, drag to rank by priority. Set your guardrails: topics to avoid, words to never use, emoji rules.',
    sticker: 'LOCKED IN!',
  },
  {
    step: 'STEP 5',
    title: 'Connect and go',
    time: '60 seconds',
    description:
      'Connect your social accounts (Instagram, Facebook, LinkedIn, X, TikTok, Pinterest, YouTube). Choose your posting cadence and pick your approval method (WhatsApp, email, dashboard, Slack, SMS). Done.',
    bubble: 'Onboarding complete. Your first posts will be ready in 10 minutes. Go get a coffee. ☕',
  },
];

const timeline = [
  {
    time: '6:00 AM',
    title: 'Rise and grind',
    description:
      'Jane checks overnight engagement. Scans trending topics across your niche. Identifies competitor moves. Prepares your morning briefing.',
  },
  {
    time: '8:00 AM',
    title: 'Morning briefing drops',
    description:
      'You open the workspace (or WhatsApp) and Jane has already sent you: a summary of what happened overnight, engagement snapshot, trending topics, and 3 draft posts ready for review.',
  },
  {
    time: '8:15 AM',
    title: 'You review in 30 seconds',
    description:
      'Each post shows up as an approval card — preview image, caption, hashtags, scheduled time. Tap Approve, Revise, or Reject. On WhatsApp, reply "1" to approve.',
  },
  {
    time: '10:00 AM',
    title: 'First post goes live',
    description:
      "Jane publishes at the optimal time for your audience. Hashtags selected. Caption in your brand voice. Image on-brand. You didn't open Instagram once.",
    sticker: 'POSTED!',
  },
  {
    time: '1:00 PM',
    title: 'Customer engagement',
    description:
      'A DM comes in on Instagram. Jane flags it with a sentiment tag and suggests a reply in your brand voice. Nothing falls through the cracks.',
  },
  {
    time: '4:00 PM',
    title: 'Trend alert',
    description:
      'Jane spots a trending hashtag relevant to your business. She drafts a timely post that ties the trend to your brand. Sends it for approval.',
    sticker: 'TRENDING!',
  },
  {
    time: '6:00 PM',
    title: 'Second post goes live',
    description:
      'Another post published. Jane tracks real-time engagement and notes that carousel format gets 2.8× more saves than single images.',
  },
  {
    time: '10:00 PM',
    title: 'End of day (for you, not Jane)',
    description:
      "Jane prepares tomorrow's content. Schedules posts for optimal times. Monitors overnight engagement. Starts drafting next week's content calendar.",
  },
  {
    time: 'Every Friday',
    title: 'The performance memo',
    description:
      "Jane writes you a weekly report in plain language: what worked, what didn't, which pillar performed best, how your audience grew, and her recommendations.",
  },
];

const approvalChannels = [
  {
    name: 'WhatsApp',
    tagline: 'The Nigerian way',
    description:
      'Jane sends you a preview card right in WhatsApp. Reply 1 to approve, 2 to revise, 3 to reject. Done before your next meeting starts.',
  },
  {
    name: 'Dashboard',
    tagline: 'The full control room',
    description:
      'Full editing capabilities. Change the caption, swap the image, adjust the schedule, tweak hashtags. For when you want to be hands-on.',
  },
  {
    name: 'Email',
    tagline: 'The inbox method',
    description: 'Post preview in your inbox with one-click approve/reject buttons. No login required.',
  },
  {
    name: 'Slack',
    tagline: 'The team workflow',
    description:
      'Approval card appears in your Slack channel. Team members can discuss, then approve with inline buttons.',
  },
  {
    name: 'SMS',
    tagline: 'The minimalist approach',
    description: "Text preview with a link. Reply YES to approve. For when you're truly on the go.",
  },
];

export default function HowSheWorks() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="pt-28 pb-16 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="comic-headline text-4xl sm:text-5xl lg:text-6xl font-black mb-5" style={{ color: 'black' }}>
            JANE'S <span className="highlight-strip">JOB DESCRIPTION</span>
          </h1>
          <p className="font-bold text-lg max-w-2xl mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
            Here's exactly what happens when you hire Jane. No mystery. No jargon. Just a really good employee doing
            really good work.
          </p>
        </div>
      </section>

      {/* Onboarding */}
      <section className="py-20 halftone-bg" style={{ backgroundColor: 'white' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="comic-headline text-3xl sm:text-4xl font-black mb-3" style={{ color: 'black' }}>
              DAY ONE: <span className="highlight-strip">TEACH HER YOUR VIBES</span>
            </h2>
            <p className="font-bold" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              5-minute setup. That's all she needs.
            </p>
          </div>

          <div className="space-y-6">
            {onboardingSteps.map((s, i) => (
              <div key={i} className="comic-panel p-6" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
                <div className="flex items-start gap-4">
                  <span
                    className="text-xs font-black px-3 py-1 rounded shrink-0"
                    style={{ backgroundColor: 'hsl(340, 74%, 42%)', color: 'white' }}
                  >
                    {s.step}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-black uppercase mb-1" style={{ color: 'black' }}>
                      {s.title}{' '}
                      <span className="text-sm font-bold normal-case" style={{ color: 'rgba(0, 0, 0, 0.5)' }}>
                        ({s.time})
                      </span>
                    </h3>
                    <p className="text-sm font-bold mb-3" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
                      {s.description}
                    </p>
                    {s.bubble && (
                      <div className="speech-bubble max-w-md">
                        <p className="text-sm font-bold italic" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
                          "{s.bubble}"
                        </p>
                      </div>
                    )}
                    {s.sticker && (
                      <span
                        className="inline-block font-black text-xs px-3 py-1 rounded"
                        style={{
                          backgroundColor: 'rgba(203, 42, 124, 0.1)',
                          color: 'hsl(340, 74%, 42%)',
                          border: '2px solid hsl(340, 74%, 42%)',
                        }}
                      >
                        {s.sticker}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Daily Timeline */}
      <section className="py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="comic-headline text-3xl sm:text-4xl font-black mb-3" style={{ color: 'black' }}>
              WHAT JANE DOES <span className="highlight-strip">WHILE YOU WORK</span>
            </h2>
          </div>

          <div className="space-y-4">
            {timeline.map((t, i) => (
              <div key={i} className="comic-panel p-5 flex items-start gap-4" style={{ backgroundColor: 'white' }}>
                <span
                  className="text-xs font-black px-3 py-1.5 rounded shrink-0 min-w-[70px] sm:min-w-[90px] text-center"
                  style={{ backgroundColor: 'black', color: 'white' }}
                >
                  {t.time}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-black uppercase mb-1" style={{ color: 'black' }}>
                    {t.title}
                  </h3>
                  <p className="text-sm font-bold" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
                    {t.description}
                  </p>
                  {t.sticker && (
                    <span
                      className="inline-block mt-2 font-black text-xs px-3 py-1 rounded"
                      style={{
                        backgroundColor: 'rgba(203, 42, 124, 0.1)',
                        color: 'hsl(340, 74%, 42%)',
                        border: '2px solid hsl(340, 74%, 42%)',
                      }}
                    >
                      {t.sticker}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approval Channels */}
      <section className="py-20 halftone-bg" style={{ backgroundColor: 'white' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="comic-headline text-3xl sm:text-4xl font-black mb-3" style={{ color: 'black' }}>
              APPROVE FROM <span className="highlight-strip">WHEREVER YOU ARE</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvalChannels.map((c, i) => (
              <div key={i} className="comic-panel p-6 h-full" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
                <h3 className="text-lg font-black uppercase mb-1" style={{ color: 'black' }}>
                  {c.name}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'hsl(340, 74%, 42%)' }}>
                  {c.tagline}
                </p>
                <p className="text-sm font-bold" style={{ color: 'rgba(0, 0, 0, 0.7)' }}>
                  {c.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Section */}
      <section className="py-20 halftone-bg-light" style={{ backgroundColor: 'hsl(12, 100%, 98%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="comic-headline text-3xl sm:text-4xl font-black mb-3" style={{ color: 'black' }}>
              THE MORE SHE WORKS, <span className="highlight-strip">THE BETTER SHE GETS</span>
            </h2>
          </div>

          <div className="comic-panel p-8" style={{ backgroundColor: 'white' }}>
            <ul className="space-y-3 mb-6">
              {[
                'Every time you approve a post, she learns what you like',
                'Every time you revise, she learns what to adjust',
                'Every time you reject, she learns what to avoid',
                'She tracks which posts perform best and shifts toward what works',
                'After 30 days, Jane knows your brand better than most human hires would after 3 months',
                "After 90 days, she's practically reading your mind",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-black text-sm mt-0.5" style={{ color: 'hsl(340, 74%, 42%)' }}>
                    ✓
                  </span>
                  <span className="text-sm font-bold" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <div className="speech-bubble max-w-lg">
              <p className="text-sm font-bold italic" style={{ color: 'rgba(0, 0, 0, 0.8)' }}>
                "I'm like a new hire who never forgets feedback and never repeats mistakes. Give me a month. You'll
                see."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 halftone-bg-dark" style={{ backgroundColor: 'hsl(340, 74%, 42%)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="comic-headline text-3xl sm:text-4xl font-black mb-6" style={{ color: 'white' }}>
            READY TO SEE HER IN ACTION?
          </h2>
          <Link
            href="/#pricing"
            className="comic-btn px-8 py-4 rounded-lg text-base inline-block"
            style={{ backgroundColor: 'white', color: 'black' }}
          >
            HIRE JANE — START FREE →
          </Link>
        </div>
      </section>
    </div>
  );
}
