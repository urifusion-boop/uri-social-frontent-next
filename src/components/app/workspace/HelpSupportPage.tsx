'use client';
/**
 * Help & Support: ways to reach the team, and answers to the questions people ask most.
 * Replaces the "A real help centre isn't built yet" placeholder.
 */
import { useState } from 'react';
import BugReportModal from '@/src/components/app/atoms/BugReportModal';
import { useIsMobile } from '@/src/hooks/useIsMobile';

const PINK = '#C2185B';
const INK = '#1A0A12';
const MUTED = '#7A7270';

const SUPPORT_EMAIL = 'support@urisocial.com';
// Digits only, with country code (e.g. '2348012345678'). The WhatsApp card stays hidden until set.
const SUPPORT_WHATSAPP = '';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do credits work?',
    a: 'Each thing Jane creates for you — a post, a carousel, an ad creative — uses one credit. Your plan’s credits refresh every month, and you can buy more any time under Settings → Billing & Subscription.',
  },
  {
    q: 'How do I connect Instagram or Facebook?',
    a: 'Go to Connected Accounts → Social Accounts and tap Connect, then sign in with Facebook. Instagram needs to be a Business or Creator account linked to your Facebook Page. On a phone, use Chrome or Safari rather than the Facebook app.',
  },
  {
    q: 'When does my ad start spending?',
    a: 'Only after you approve and launch it. Jane builds the plan, the ad and the audience first and shows you everything — nothing goes live or spends until you say go. After that, spend comes out of your Ad Wallet within the budget you set.',
  },
  {
    q: 'How do I top up my ad wallet?',
    a: 'Open Campaign Manager → Ad Wallet, pick or type an amount (₦5,000 minimum) and tap Top up. You’ll pay securely through Squad, and the money shows in your wallet once the payment clears.',
  },
  {
    q: 'Can Jane reply to my customers?',
    a: 'Yes. Connect Instagram or Facebook under Messaging → Connections and set up Brand Voice. Jane only answers with facts from your FAQs and Brand Playbook; anything she isn’t sure about comes to you to approve. You can turn automatic replies on or off in Inbox Settings.',
  },
  {
    q: 'How do I change my plan?',
    a: 'Go to Settings → Billing & Subscription → Subscription Plans and choose the plan you want. Your new credits are available as soon as the payment goes through.',
  },
];

function ContactCard({
  emoji,
  tint,
  title,
  note,
  cta,
  href,
  onClick,
}: {
  emoji: string;
  tint: string;
  title: string;
  note: string;
  cta: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: tint,
          display: 'grid',
          placeItems: 'center',
          fontSize: 18,
          marginBottom: 10,
        }}
      >
        {emoji}
      </span>
      <b style={{ display: 'block', fontSize: 15, color: INK }}>{title}</b>
      <small style={{ display: 'block', color: MUTED, fontSize: 12.5, marginTop: 3, lineHeight: 1.4 }}>{note}</small>
      <span style={{ display: 'block', marginTop: 10, fontSize: 13, fontWeight: 800, color: PINK }}>{cta} →</span>
    </>
  );
  const style: React.CSSProperties = {
    display: 'block',
    textAlign: 'left',
    background: '#fff',
    borderRadius: 16,
    padding: 16,
    border: '1px solid rgba(194,24,91,.08)',
    boxShadow: '0 10px 26px -18px rgba(120,20,60,.4)',
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={style}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} style={{ ...style, width: '100%' }}>
      {inner}
    </button>
  );
}

export default function HelpSupportPage() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState<number | null>(null);
  const [bugOpen, setBugOpen] = useState(false);

  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(180deg, #FCE4EC 0%, #FBF8F7 40%, #FAFAF8 100%)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '18px 14px 32px' : '26px 24px 40px' }}>
        <div style={{ textAlign: 'center', margin: '6px auto 20px', maxWidth: 620 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 26 : 30, fontWeight: 900, letterSpacing: -0.6, color: INK }}>
            How can we help?
          </h1>
          <p style={{ margin: '6px 0 0', color: MUTED, fontSize: 14.5 }}>
            Real people from the Uri team, usually within a few hours.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : `repeat(${SUPPORT_WHATSAPP ? 3 : 2}, 1fr)`,
            gap: 14,
            marginBottom: 24,
          }}
        >
          {SUPPORT_WHATSAPP && (
            <ContactCard
              emoji="💚"
              tint="#E7F6EE"
              title="Chat on WhatsApp"
              note="Fastest. Send a screenshot and we'll sort it out."
              cta="Open WhatsApp"
              href={`https://wa.me/${SUPPORT_WHATSAPP}`}
            />
          )}
          <ContactCard
            emoji="✉️"
            tint="#FCE4EE"
            title="Email support"
            note="For billing questions or anything detailed."
            cta="Email us"
            href={`mailto:${SUPPORT_EMAIL}`}
          />
          <ContactCard
            emoji="🐞"
            tint="#EEE7FB"
            title="Report a bug"
            note="Something broken? Tell us what happened."
            cta="Report it"
            onClick={() => setBugOpen(true)}
          />
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#9A9090',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Common questions
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 10,
            alignItems: 'start',
          }}
        >
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1E9EC', overflow: 'hidden' }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 16px',
                    background: 'none',
                    border: 0,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: 700,
                    color: INK,
                    textAlign: 'left',
                  }}
                >
                  {f.q}
                  <span aria-hidden style={{ color: PINK, fontWeight: 900, fontSize: 16 }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p style={{ margin: 0, padding: '0 16px 14px', fontSize: 13.5, color: '#4a4440', lineHeight: 1.55 }}>
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <BugReportModal isOpen={bugOpen} onClose={() => setBugOpen(false)} />
    </div>
  );
}
