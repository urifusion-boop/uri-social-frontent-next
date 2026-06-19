'use client';

import React, { useState } from 'react';
import { SocialMediaAgentService, WritingDNAAnswers } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { FiChevronLeft, FiLoader, FiX } from 'react-icons/fi';

const URI_PINK = '#CD1B78';

interface QuizOption {
  value: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface QuizQuestion {
  id: string;
  part: string;
  question: string;
  options: QuizOption[];
  janeComment: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    part: 'Opening & Energy',
    question: 'How do you start a conversation?',
    options: [
      { value: 'A', text: '"So I\'ve been thinking about something..."' },
      { value: 'B', text: '"Let me get straight to the point."' },
      { value: 'C', text: '"Okay so hear me out..."' },
      { value: 'D', text: '"Here\'s something most people get wrong."' },
    ],
    janeComment: 'Nice. That tells me exactly how you enter a room.',
  },
  {
    id: 'q2',
    part: 'Opening & Energy',
    question: 'Pick the sentence that sounds most like you.',
    options: [
      { value: 'A', text: '"The numbers speak for themselves. Revenue grew 40% in Q2."' },
      { value: 'B', text: '"We tried it. It worked. That\'s all you need to know."' },
      {
        value: 'C',
        text: '"There\'s this thing that happens when you finally figure out what works, and honestly, it changes everything."',
      },
      { value: 'D', text: '"Nobody talks about this enough, but most marketing advice is recycled nonsense."' },
    ],
    janeComment: "Good one. Now I'm hearing your rhythm.",
  },
  {
    id: 'q3',
    part: 'Teaching & Explanation',
    question: 'When you explain something, you tend to...',
    options: [
      { value: 'A', text: 'Tell a story from my own experience' },
      { value: 'B', text: 'Break it down step by step with clear logic' },
      { value: 'C', text: 'Compare it to something the reader already understands' },
      { value: 'D', text: 'Challenge what the reader currently believes, then show the better way' },
    ],
    janeComment: "Got it. That's how you transfer knowledge.",
  },
  {
    id: 'q4',
    part: 'Teaching & Explanation',
    question: 'How deep do you go with industry jargon?',
    options: [
      { value: 'A', text: 'I use technical terms freely. My readers are insiders.' },
      { value: 'B', text: 'I use a few industry terms but explain them briefly.' },
      { value: 'C', text: 'I avoid jargon completely. I write for everyone.' },
      {
        value: 'D',
        text: 'I use jargon deliberately, then translate it to plain language. Shows I know the space without gatekeeping.',
      },
    ],
    janeComment: 'Now I know how you signal expertise.',
  },
  {
    id: 'q5',
    part: 'Personality & Tone',
    question: "Pick the blog title you'd actually click on.",
    options: [
      { value: 'A', text: '"What I Learned From Losing My Biggest Client"' },
      { value: 'B', text: '"5 Metrics Every Business Owner Should Track Weekly"' },
      { value: 'C', text: '"Stop Doing This With Your Social Media. Seriously."' },
      { value: 'D', text: '"The Quiet Strategy That Doubled Our Revenue"' },
    ],
    janeComment: "That's the kind of content you want to create.",
  },
  {
    id: 'q6',
    part: 'Personality & Tone',
    question: 'How do you feel about humour in business writing?',
    options: [
      { value: 'A', text: 'I keep it serious. My content is about expertise, not laughs.' },
      { value: 'B', text: 'A dry observation here and there. Nothing forced.' },
      { value: 'C', text: "I'm naturally funny and it comes through in my writing." },
      { value: 'D', text: 'I want my readers to actually laugh out loud sometimes.' },
    ],
    janeComment: 'Good to know exactly where the line is.',
  },
  {
    id: 'q7',
    part: 'Personality & Tone',
    question: 'When you disagree with popular advice, you...',
    options: [
      { value: 'A', text: 'Respectfully present my alternative view with evidence.' },
      { value: 'B', text: 'Say it directly. "This advice is wrong and here\'s why."' },
      { value: 'C', text: 'Tell a story about how following that advice burned me.' },
      { value: 'D', text: "I don't usually disagree publicly." },
    ],
    janeComment: "That's how you hold your ground.",
  },
  {
    id: 'q8',
    part: 'Personality & Tone',
    question: 'How comfortable are you sharing failures and struggles?',
    options: [
      { value: 'A', text: 'Very. My best content comes from being honest about what went wrong.' },
      { value: 'B', text: "Sometimes. If there's a clear lesson. I won't share just to share." },
      { value: 'C', text: 'Rarely. I prefer to focus on solutions and wins.' },
      { value: 'D', text: 'Never publicly. My brand is about strength and expertise.' },
    ],
    janeComment: 'Vulnerability is a writing superpower. Now I know yours.',
  },
  {
    id: 'q9',
    part: 'Rhythm & Structure',
    question: 'How long are your natural paragraphs?',
    options: [
      { value: 'A', text: 'Short. 1-2 sentences. I like space between thoughts.' },
      { value: 'B', text: 'Medium. 3-4 sentences feels right.' },
      { value: 'C', text: "Long when I'm on a roll. I write like I talk." },
      { value: 'D', text: 'It depends. Some thoughts need one line. Some need a whole paragraph.' },
    ],
    janeComment: 'Paragraph rhythm is part of your fingerprint.',
  },
  {
    id: 'q10',
    part: 'Rhythm & Structure',
    question: "Pick the closing you'd use for a blog post.",
    options: [
      { value: 'A', text: '"The ball is in your court now."' },
      { value: 'B', text: '"Here\'s what I\'d do if I were you: [specific action]."' },
      { value: 'C', text: '"I\'m still figuring this out too. But so far, this is working."' },
      { value: 'D', text: '"If this resonated, share it with someone who needs to hear it."' },
    ],
    janeComment: 'How you leave readers says everything.',
  },
  {
    id: 'q11',
    part: 'Cultural & Identity',
    question: 'Do you use Pidgin or Nigerian expressions in your writing?',
    options: [
      { value: 'A', text: 'Never. Pure English. My audience is formal.' },
      { value: 'B', text: 'Occasionally. A phrase here and there for flavour.' },
      { value: 'C', text: "Regularly. It's how I naturally communicate." },
      { value: 'D', text: 'Heavily. My brand voice IS Pidgin.' },
    ],
    janeComment: "Language is identity. I've got yours.",
  },
  {
    id: 'q12',
    part: 'Cultural & Identity',
    question: 'When you make comparisons, you reach for...',
    options: [
      { value: 'A', text: 'Business examples: Dangote, Flutterwave, Nigerian startups, Naira economics' },
      { value: 'B', text: 'Global examples: Apple, Tesla, Silicon Valley, Harvard research' },
      { value: 'C', text: 'Personal life: my family, my neighbourhood, everyday Lagos life' },
      { value: 'D', text: 'Pop culture: Nollywood, Afrobeats, Twitter drama, trending topics' },
    ],
    janeComment: 'The world you reference is the world you live in.',
  },
  {
    id: 'q13',
    part: 'Cultural & Identity',
    question: 'How edgy is your writing?',
    options: [
      { value: 'A', text: 'Clean and professional. No swearing, no edge.' },
      { value: 'B', text: 'Mild expressions: "this rubbish", "God abeg", "wahala"' },
      { value: 'C', text: 'I\'ll say "BS" or "nonsense" when something deserves it.' },
      { value: 'D', text: "I write raw. If I'm frustrated, the reader will feel it." },
    ],
    janeComment: "Knowing the edge means I won't cross it.",
  },
  {
    id: 'q14',
    part: 'Identity & Positioning',
    question: "What role does your brand play in your reader's life?",
    options: [
      { value: 'A', text: 'The trusted expert. They come to me for answers.' },
      { value: 'B', text: "The friend who's been through it. They relate to my journey." },
      { value: 'C', text: 'The provocateur. I challenge how they think.' },
      { value: 'D', text: 'The calm guide. I make complicated things simple.' },
    ],
    janeComment: 'Reader relationships shape everything.',
  },
  {
    id: 'q15',
    part: 'Identity & Positioning',
    question: 'Pick the version that sounds most like your internal voice.',
    options: [
      {
        value: 'A',
        text: "\"I've spent the last three years building this from nothing, and every time I think I've figured it out, the market shifts. But that's the game, isn't it?\"",
      },
      { value: 'B', text: '"Revenue up 40%. Churn down to 3%. Team of 12. Next target: 1,000 customers by December."' },
      {
        value: 'C',
        text: "\"I don't have all the answers. But I've made enough mistakes to know what doesn't work. And that's genuinely more useful.\"",
      },
      {
        value: 'D',
        text: '"Everyone\'s following the same playbook and getting mediocre results. We did something different. Here\'s what."',
      },
    ],
    janeComment: 'This is the most honest question in the quiz. It shows.',
  },
  {
    id: 'q16',
    part: 'Identity & Positioning',
    question: 'Name 1-2 writers, bloggers, or creators whose style you admire.',
    options: [], // Free text — handled separately
    janeComment: "Great taste. I'll channel their energy, not copy their words.",
  },
];

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export default function WritingDNAQuiz({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState(0); // 0–15 = questions, 16 = writing sample
  const [answers, setAnswers] = useState<Partial<WritingDNAAnswers>>({});
  const [q16Text, setQ16Text] = useState('');
  const [writingSample, setWritingSample] = useState('');
  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = Math.round((step / 17) * 100);
  const question = step < 16 ? QUESTIONS[step] : null;
  const qKey = `q${step + 1}` as keyof WritingDNAAnswers;
  const currentAnswer = answers[qKey] ?? null;

  const handleOptionSelect = (value: string) => {
    if (pendingAnswer) return; // already advancing
    setPendingAnswer(value);
    setAnswers((prev) => ({ ...prev, [qKey]: value }));
    setTimeout(() => {
      setPendingAnswer(null);
      setStep((s) => s + 1);
    }, 1000);
  };

  const handleQ16Next = () => {
    setAnswers((prev) => ({ ...prev, q16: q16Text.trim() }));
    setStep(16);
  };

  const handleBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const fullAnswers: WritingDNAAnswers = {
        q1: answers.q1 ?? 'B',
        q2: answers.q2 ?? 'C',
        q3: answers.q3 ?? 'A',
        q4: answers.q4 ?? 'B',
        q5: answers.q5 ?? 'D',
        q6: answers.q6 ?? 'A',
        q7: answers.q7 ?? 'A',
        q8: answers.q8 ?? 'B',
        q9: answers.q9 ?? 'B',
        q10: answers.q10 ?? 'B',
        q11: answers.q11 ?? 'A',
        q12: answers.q12 ?? 'A',
        q13: answers.q13 ?? 'A',
        q14: answers.q14 ?? 'B',
        q15: answers.q15 ?? 'C',
        q16: q16Text.trim(),
      };
      const res = await SocialMediaAgentService.submitWritingDNAQuiz({
        quiz_answers: fullAnswers,
        writing_sample: writingSample.trim() || undefined,
      });
      if (res.status) {
        ToastService.showToast('Writing DNA saved! Jane now writes like you.', ToastTypeEnum.Success);
        onComplete();
      } else {
        ToastService.showToast(res.responseMessage || 'Failed to save Writing DNA', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Something went wrong. Please try again.', ToastTypeEnum.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleBack}
            disabled={step === 0}
            style={{
              background: 'none',
              border: 'none',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              color: step === 0 ? '#d1d5db' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <FiChevronLeft size={22} />
          </button>
          <span style={{ fontSize: '14px', fontWeight: '600', color: URI_PINK }}>Writing DNA Quiz</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>
            {step < 16 ? `${step + 1} / 16` : 'Writing sample'}
          </span>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Skip quiz"
          >
            <FiX size={20} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: '#f3f4f6' }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${URI_PINK}, #E94396)`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 24px 80px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '560px' }}>
          {/* ── Question 1-15: multiple choice ── */}
          {step < 15 && question && (
            <QuestionStep
              question={question}
              questionNumber={step + 1}
              selectedAnswer={currentAnswer}
              pendingAnswer={pendingAnswer}
              onSelect={handleOptionSelect}
            />
          )}

          {/* ── Question 16: free text ── */}
          {step === 15 && (
            <div>
              <p
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: URI_PINK,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '8px',
                }}
              >
                Identity & Positioning · 16 / 16
              </p>
              <h2
                style={{ fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '28px', lineHeight: '1.35' }}
              >
                Name 1-2 writers, bloggers, or creators whose style you admire.
              </h2>
              <input
                type="text"
                value={q16Text}
                onChange={(e) => setQ16Text(e.target.value)}
                placeholder="e.g. Paul Graham, Chimamanda Ngozi Adichie"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `2px solid ${q16Text ? URI_PINK : '#e5e7eb'}`,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = URI_PINK)}
                onBlur={(e) => (e.target.style.borderColor = q16Text ? URI_PINK : '#e5e7eb')}
              />
              <button
                onClick={handleQ16Next}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${URI_PINK} 0%, #E94396 100%)`,
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {q16Text.trim() ? 'Continue →' : 'Skip & Continue →'}
              </button>
            </div>
          )}

          {/* ── Writing sample (optional) ── */}
          {step === 16 && (
            <div>
              <div
                style={{
                  background: `${URI_PINK}10`,
                  border: `1px solid ${URI_PINK}30`,
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '24px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '20px' }}>✍️</span>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: URI_PINK }}>
                    Bonus: The most powerful signal
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Paste a paragraph you&apos;ve written that sounds like you. Real writing beats quiz answers every
                    time. This is optional but it makes Jane&apos;s voice match dramatically more accurate.
                  </p>
                </div>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111', marginBottom: '16px' }}>
                Paste a writing sample (optional)
              </h2>
              <textarea
                value={writingSample}
                onChange={(e) => setWritingSample(e.target.value)}
                placeholder="Paste a paragraph or two from something you've written — a caption, a LinkedIn post, a WhatsApp message to a client..."
                rows={6}
                maxLength={3000}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: '1.6',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.target.style.borderColor = URI_PINK)}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '24px', textAlign: 'right' }}>
                {writingSample.length} / 3000
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isSubmitting ? '#9ca3af' : `linear-gradient(135deg, ${URI_PINK} 0%, #E94396 100%)`,
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(205, 27, 120, 0.35)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin" size={20} />
                    Generating your Writing DNA...
                  </>
                ) : (
                  'Generate My Writing DNA →'
                )}
              </button>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#9ca3af', marginTop: '12px' }}>
                Takes about 5 seconds.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-component: a single question with A/B/C/D cards ──────────────────

interface QuestionStepProps {
  question: QuizQuestion;
  questionNumber: number;
  selectedAnswer: string | null;
  pendingAnswer: string | null;
  onSelect: (value: string) => void;
}

function QuestionStep({ question, questionNumber, selectedAnswer, pendingAnswer, onSelect }: QuestionStepProps) {
  const chosenAnswer = pendingAnswer ?? selectedAnswer;

  if (pendingAnswer) {
    // Show Jane's comment briefly after selection
    const picked = question.options.find((o) => o.value === pendingAnswer);
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '14px',
            background: 'white',
            borderRadius: '16px',
            border: `2px solid ${URI_PINK}30`,
            padding: '20px 28px',
            boxShadow: '0 4px 20px rgba(205, 27, 120, 0.12)',
          }}
        >
          {/* Jane avatar */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${URI_PINK} 0%, #E94396 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: '800',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(205, 27, 120, 0.35)',
            }}
          >
            J
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '13px', color: URI_PINK, fontWeight: '600' }}>Jane says</p>
            <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: '500', color: '#111' }}>
              {question.janeComment}
            </p>
          </div>
        </div>
        {picked && (
          <p style={{ marginTop: '20px', fontSize: '13px', color: '#9ca3af' }}>
            You chose: <em>&quot;{picked.text.replace(/^"/, '').replace(/"$/, '')}&quot;</em>
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p
        style={{
          fontSize: '12px',
          fontWeight: '600',
          color: URI_PINK,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '8px',
        }}
      >
        {question.part} · {questionNumber} / 16
      </p>
      <h2
        style={{
          fontSize: '22px',
          fontWeight: '700',
          color: '#111',
          marginBottom: '28px',
          lineHeight: '1.35',
        }}
      >
        {question.question}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {question.options.map((opt) => {
          const isSelected = chosenAnswer === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '12px',
                border: `2px solid ${isSelected ? URI_PINK : '#e5e7eb'}`,
                background: isSelected ? `${URI_PINK}08` : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.15s',
                boxShadow: isSelected ? `0 0 0 3px ${URI_PINK}20` : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = `${URI_PINK}60`;
                  e.currentTarget.style.background = '#fafafa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <span
                style={{
                  minWidth: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isSelected ? URI_PINK : '#f3f4f6',
                  color: isSelected ? 'white' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {opt.value}
              </span>
              <span
                style={{
                  fontSize: '14px',
                  color: isSelected ? '#111' : '#374151',
                  fontWeight: isSelected ? '600' : '400',
                  lineHeight: '1.5',
                }}
              >
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
