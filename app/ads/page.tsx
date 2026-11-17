import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ScrollReveal';
import AdsAuditForm from '@/components/ads/AdsAuditForm';

export const metadata: Metadata = {
  title: 'Uri Ads | Set your goal. Uri runs your ads.',
  description: 'We launch, watch and improve your Meta, TikTok and Google ads every day. Get a free ad audit.',
};

// Edit these before launch.
const PRICE_NAIRA = '30,000';
const AD_SPEND_FEE_PERCENT = 10;
// Keep false until the result below is verified: you have the customer's consent, you have confirmed that
// "gained" means sales, and you know the time period. Then fill in the sector and period.
const SHOW_PROOF = false;
const PROOF = { sector: '[sector]', period: '[period]' };

const INK = 'hsl(330 40% 7%)';
const BORDER = 'hsl(0 0% 7%)';
const MAGENTA = 'hsl(340 74% 42%)';
const CREAM = 'hsl(12 100% 98%)';
const MUTED = 'hsl(0 0% 40%)';

const panel = {
  backgroundColor: 'hsl(0 0% 100%)',
  border: `3px solid ${BORDER}`,
  borderRadius: '8px',
  boxShadow: `6px 6px 0px ${BORDER}`,
} as const;

const problems = [
  { title: 'Boosted. Got likes.', text: 'Boost optimises for taps, not buyers. You pay for attention.' },
  { title: 'Ads Manager is hard.', text: 'Most owners launch once and never touch the ad again.' },
  { title: "Nobody's watching.", text: 'An ad that stops working keeps spending. Nobody tells you.' },
];

const steps = [
  { title: 'Pick your goal', text: 'Messages, sales or followers. Set your budget.' },
  {
    title: 'Uri launches',
    text: 'Ad graphics and captions made for you. Live on Meta, TikTok and Google.',
  },
  { title: 'Uri watches daily', text: "We pause what isn't working and put budget behind what is." },
];

const included = [
  'Ads launched and managed on Meta, TikTok and Google',
  'Credits for ad graphics and captions',
  'Daily monitoring and optimisation',
  'Clear report: what each naira bought',
];

const faqs = [
  {
    q: 'What is the free ad audit?',
    a: "You share your details and your last ad. We tell you what's wasting money and what to fix. No cost, no obligation.",
  },
  {
    q: 'How much ad budget do I need?',
    a: "Tell us your budget in the form and we'll advise on what makes sense for your goal.",
  },
  {
    q: 'What does the 10% cover?',
    a: "It's our fee on the ad spend we manage for you. You'll always see the spend, the results and what we charged.",
  },
  {
    q: 'Is it fully automated?',
    a: "Uri's tools do the daily monitoring and optimising. A real person is assigned to check in on your account.",
  },
  { q: 'Which platforms do you run ads on?', a: 'Meta (Facebook and Instagram), TikTok and Google.' },
  {
    q: 'Do you guarantee sales?',
    a: "No. Results vary by business, product and budget. We'll be honest about what we see in your audit.",
  },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-3xl sm:text-4xl font-black mb-8"
      style={{ color: INK, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.05 }}
    >
      {children}
    </h2>
  );
}

const ctaButton = {
  backgroundColor: MAGENTA,
  color: 'hsl(0 0% 100%)',
  border: `3px solid ${BORDER}`,
  boxShadow: `4px 4px 0px ${BORDER}`,
  letterSpacing: '0.5px',
} as const;

export default function AdsPage() {
  return (
    <div className="min-h-screen">
      <header className="bg-white" style={{ borderBottom: `3px solid ${BORDER}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="URI Social home">
            <Image src="/images/urilogo-nobg.png" alt="URI Social" width={44} height={44} className="h-11 w-auto" />
            <span
              className="text-lg font-light tracking-wide lowercase italic"
              style={{ color: '#CD1B78', fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.5px' }}
            >
              social
            </span>
          </Link>
          <a href="#audit" className="px-4 py-2 rounded-lg text-xs font-bold uppercase" style={ctaButton}>
            Free ad audit
          </a>
        </div>
      </header>

      <main>
        <section
          className="pt-12 pb-16"
          style={{
            backgroundColor: CREAM,
            backgroundImage: 'radial-gradient(circle, hsl(340 74% 42% / 0.04) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div>
              <span className="comic-caption mb-5">Get your ads ready before December</span>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black mb-5"
                style={{ color: INK, textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.05 }}
              >
                Set your goal.{' '}
                <span
                  style={{
                    background: 'linear-gradient(180deg, transparent 55%, hsl(45 100% 51% / 0.4) 55%)',
                    padding: '0 4px',
                  }}
                >
                  Uri runs your ads.
                </span>
              </h1>
              <p className="text-lg max-w-xl mb-4 font-bold" style={{ color: MUTED }}>
                We launch, watch and improve your Meta, TikTok and Google ads every day. You see what every naira
                bought.
              </p>
              <p className="text-sm font-black uppercase tracking-wide" style={{ color: 'hsl(330 40% 7% / 0.7)' }}>
                Meta (Facebook, Instagram) · TikTok · Google
              </p>

              {SHOW_PROOF && (
                <div className="mt-6 p-5 max-w-md" style={{ ...panel, backgroundColor: 'hsl(12 100% 98%)' }}>
                  <strong className="text-xl font-black" style={{ color: INK }}>
                    ₦35,000 on ads → ₦300,000 in sales
                  </strong>
                  <p className="text-xs font-bold mt-1" style={{ color: MUTED }}>
                    A Lagos {PROOF.sector} brand, {PROOF.period}, with Uri. Results vary by business.
                  </p>
                </div>
              )}
            </div>

            <AdsAuditForm />
          </div>
        </section>

        <section
          className="py-16"
          style={{
            backgroundColor: 'hsl(0 0% 100%)',
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeading>The problem</SectionHeading>
            <div className="grid md:grid-cols-3 gap-6">
              {problems.map((p) => (
                <ScrollReveal key={p.title}>
                  <div className="p-6 h-full" style={{ ...panel, backgroundColor: CREAM }}>
                    <h3 className="text-base font-black uppercase mb-2" style={{ color: INK }}>
                      {p.title}
                    </h3>
                    <p className="text-sm font-bold" style={{ color: MUTED }}>
                      {p.text}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section
          className="py-16"
          style={{
            backgroundColor: CREAM,
            backgroundImage: 'radial-gradient(circle, hsl(340 74% 42% / 0.04) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeading>How Uri works</SectionHeading>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s, i) => (
                <ScrollReveal key={s.title}>
                  <div className="p-6 h-full" style={panel}>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black mb-3"
                      style={{
                        backgroundColor: 'hsl(45 100% 51%)',
                        color: INK,
                        border: `3px solid ${BORDER}`,
                      }}
                    >
                      {i + 1}
                    </div>
                    <h3 className="text-base font-black uppercase mb-2" style={{ color: INK }}>
                      {s.title}
                    </h3>
                    <p className="text-sm font-bold" style={{ color: MUTED }}>
                      {s.text}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
            <p className="mt-6 text-sm font-bold" style={{ color: MUTED }}>
              Automated, with a real person checking in on your account.
            </p>
          </div>
        </section>

        <section
          className="py-16"
          style={{
            backgroundColor: 'hsl(0 0% 100%)',
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <SectionHeading>Simple pricing</SectionHeading>
            <ScrollReveal>
              <div className="p-6 max-w-lg" style={{ ...panel, backgroundColor: CREAM }}>
                <p className="text-4xl font-black" style={{ color: INK, letterSpacing: '-0.02em' }}>
                  ₦{PRICE_NAIRA}
                  <span className="text-sm font-bold" style={{ color: MUTED, letterSpacing: 0 }}>
                    {' '}
                    / month in creative credits
                  </span>
                </p>
                <p className="mt-1 text-base font-black uppercase" style={{ color: MAGENTA }}>
                  + {AD_SPEND_FEE_PERCENT}% of your ad spend
                </p>
                <ul className="mt-4 space-y-2">
                  {included.map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-bold" style={{ color: INK }}>
                      <span aria-hidden="true" style={{ color: 'hsl(142 60% 28%)' }}>
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="#audit"
                  className="mt-6 block text-center px-6 py-3 rounded-lg text-sm font-bold uppercase"
                  style={ctaButton}
                >
                  Get my free audit
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section
          className="py-16"
          style={{
            backgroundColor: CREAM,
            backgroundImage: 'radial-gradient(circle, hsl(340 74% 42% / 0.04) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <SectionHeading>Questions</SectionHeading>
            <div className="space-y-4">
              {faqs.map((f) => (
                <details key={f.q} className="p-4" style={{ ...panel, boxShadow: `4px 4px 0px ${BORDER}` }}>
                  <summary className="cursor-pointer text-sm font-black uppercase" style={{ color: INK }}>
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm font-bold" style={{ color: MUTED }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          className="py-16 halftone-bg-dark"
          style={{ backgroundColor: 'hsl(330, 40%, 7%)', color: 'white', borderTop: '4px solid black' }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2
              className="text-3xl sm:text-4xl font-black mb-3"
              style={{ textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1.05 }}
            >
              Ready for December?
            </h2>
            <p className="text-base font-bold mb-6" style={{ opacity: 0.7 }}>
              Get your ads set up and working before the busy season.
            </p>
            <a
              href="#audit"
              className="inline-block px-6 py-3 rounded-lg text-sm font-bold uppercase"
              style={{ ...ctaButton, border: '3px solid white', boxShadow: '4px 4px 0px white' }}
            >
              Get my free audit
            </a>
          </div>
        </section>
      </main>

      <footer
        className="py-6 text-center text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: 'hsl(330, 40%, 7%)', color: 'white', borderTop: '1px solid hsl(0 0% 100% / 0.15)' }}
      >
        <span style={{ opacity: 0.5 }}>© Uruzi Insights Ltd · URI Social</span>
      </footer>
    </div>
  );
}
