'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SocialMediaAgentService,
  WritingDNAData,
  BlogPostGenerateResult,
} from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import {
  FiBook,
  FiDownload,
  FiCopy,
  FiCheck,
  FiLoader,
  FiThumbsUp,
  FiThumbsDown,
  FiX,
  FiZap,
} from 'react-icons/fi';
import WritingDNAQuiz from './WritingDNAQuiz';
import BlogDraftsTab from './BlogDraftsTab';
import { markdownToHtml } from '@/src/utils/markdown.util';

const URI_PINK = '#CD1B78';

const WORD_COUNT_OPTIONS = [500, 800, 1200, 1500, 2000] as const;
type WordCount = (typeof WORD_COUNT_OPTIONS)[number];

const FEEDBACK_ISSUES = [
  { value: 'too_formal', label: 'Too formal' },
  { value: 'too_casual', label: 'Too casual' },
  { value: 'too_generic', label: 'Too generic' },
  { value: 'not_my_style', label: "Not my style" },
];

export default function BlogGeneratorTab() {
  const [view, setView] = useState<'main' | 'quiz'>('main');
  const [mode, setMode] = useState<'generate' | 'drafts'>('generate');
  const [dna, setDna] = useState<WritingDNAData | null>(null);
  const [dnaLoading, setDnaLoading] = useState(true);

  // Form state
  const [topic, setTopic] = useState('');
  const [primaryKeyword, setPrimaryKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState('');
  const [wordCount, setWordCount] = useState<WordCount>(800);

  // Result state
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<BlogPostGenerateResult | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [feedbackIssues, setFeedbackIssues] = useState<string[]>([]);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  // Published state
  const [published, setPublished] = useState(false);

  // Copy state
  const [copied, setCopied] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetchDNA();
  }, []);

  const fetchDNA = async () => {
    setDnaLoading(true);
    try {
      const res = await SocialMediaAgentService.getWritingDNA();
      if (res.status && res.responseData) {
        setDna(res.responseData);
      } else {
        setDna(null);
        // Auto-show quiz the first time user lands here without DNA (spec §2 UX)
        const seen = localStorage.getItem('uri_dna_quiz_seen');
        if (!seen) {
          localStorage.setItem('uri_dna_quiz_seen', '1');
          setView('quiz');
        }
      }
    } catch {
      setDna(null);
    } finally {
      setDnaLoading(false);
    }
  };

  // ── Keyword tag input ────────────────────────────────────────────────────

  const handleKwKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && kwInput.trim()) {
      e.preventDefault();
      if (secondaryKeywords.length < 5 && !secondaryKeywords.includes(kwInput.trim())) {
        setSecondaryKeywords((prev) => [...prev, kwInput.trim()]);
        setKwInput('');
      }
    }
  };

  // ── Generate ─────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!topic.trim()) {
      ToastService.showToast('Enter a blog topic first', ToastTypeEnum.Error);
      return;
    }
    if (!primaryKeyword.trim()) {
      ToastService.showToast('Enter a primary keyword', ToastTypeEnum.Error);
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setFeedback(null);
    setFeedbackIssues([]);
    setFeedbackSaved(false);
    setPublished(false);
    setIsEditing(false);

    try {
      const res = await SocialMediaAgentService.generateBlogPost({
        topic: topic.trim(),
        primary_keyword: primaryKeyword.trim(),
        secondary_keywords: secondaryKeywords,
        word_count: wordCount,
      });

      if (res.status && res.responseData) {
        setResult(res.responseData);
        setEditedContent(res.responseData.content);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        ToastService.showToast(res.responseMessage || 'Generation failed', ToastTypeEnum.Error);
      }
    } catch (err) {
      ToastService.showToast((err as Error)?.message || 'Something went wrong', ToastTypeEnum.Error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Save edits ───────────────────────────────────────────────────────────

  const handleSaveEdit = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      await SocialMediaAgentService.updateBlogPost(result.blog_id, editedContent);
      ToastService.showToast('Changes saved. Jane is learning from your edits.', ToastTypeEnum.Success);
      setIsEditing(false);
    } catch {
      ToastService.showToast('Failed to save changes', ToastTypeEnum.Error);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Feedback ─────────────────────────────────────────────────────────────

  const handleFeedback = async (rating: 'up' | 'down') => {
    if (!result || feedbackSaved) return;
    setFeedback(rating);
    if (rating === 'up') {
      try {
        await SocialMediaAgentService.recordBlogPostFeedback(result.blog_id, 'up');
        setFeedbackSaved(true);
        ToastService.showToast('Glad it sounds like you!', ToastTypeEnum.Success);
      } catch {
        // non-critical
      }
    }
  };

  const handleSubmitFeedbackIssues = async () => {
    if (!result) return;
    try {
      await SocialMediaAgentService.recordBlogPostFeedback(result.blog_id, 'down', feedbackIssues);
      setFeedbackSaved(true);
      ToastService.showToast('Feedback recorded. Jane will adjust next time.', ToastTypeEnum.Success);
    } catch {
      // non-critical
    }
  };

  // ── Publish ──────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!result) return;
    try {
      await SocialMediaAgentService.publishBlogPost(result.blog_id);
      setPublished(true);
      ToastService.showToast('Blog post published!', ToastTypeEnum.Success);
    } catch {
      ToastService.showToast('Failed to publish', ToastTypeEnum.Error);
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────

  const handleExportMarkdown = () => {
    if (!result) return;
    const md = `# ${result.title}\n\n> ${result.meta}\n\n${result.content}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ToastService.showToast('Exported as Markdown', ToastTypeEnum.Success);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    ToastService.showToast('Copied!', ToastTypeEnum.Success);
    setTimeout(() => setCopied(null), 2000);
  };

  // ── If in quiz view ──────────────────────────────────────────────────────

  if (view === 'quiz') {
    return (
      <WritingDNAQuiz
        onComplete={() => {
          setView('main');
          fetchDNA();
        }}
        onSkip={() => setView('main')}
      />
    );
  }

  // ── Main view ────────────────────────────────────────────────────────────

  const pad = isMobile ? '16px 16px 100px' : '24px 32px 100px';

  return (
    <div style={{ padding: pad, maxWidth: '900px', margin: '0 auto', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
          <FiBook size={26} color={URI_PINK} />
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: 0, color: '#111' }}>Blog</h1>
          <span
            style={{
              background: `linear-gradient(135deg, ${URI_PINK} 0%, #E94396 100%)`,
              color: 'white',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
            }}
          >
            WRITING DNA
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
          Jane writes YOUR blogs. Not AI blogs. Not generic blogs. Yours.
        </p>
      </div>

      {/* Sub-tabs: Generate | Drafts */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setMode('generate')}
          style={{
            padding: '8px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            border: `2px solid ${mode === 'generate' ? URI_PINK : '#e5e7eb'}`,
            background: mode === 'generate' ? `${URI_PINK}10` : 'white',
            color: mode === 'generate' ? URI_PINK : '#6b7280',
          }}
        >
          Generate
        </button>
        <button
          onClick={() => setMode('drafts')}
          style={{
            padding: '8px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            border: `2px solid ${mode === 'drafts' ? URI_PINK : '#e5e7eb'}`,
            background: mode === 'drafts' ? `${URI_PINK}10` : 'white',
            color: mode === 'drafts' ? URI_PINK : '#6b7280',
          }}
        >
          Drafts
        </button>
      </div>

      {/* Drafts mode renders the drafts list and nothing else */}
      {mode === 'drafts' && <BlogDraftsTab />}

      {/* DNA Status card (generate mode only) */}
      {mode === 'generate' && !dnaLoading && (
        dna ? (
          <DNAActiveCard dna={dna} onRetake={() => setView('quiz')} />
        ) : (
          <DNASetupCard onSetup={() => setView('quiz')} />
        )
      )}

      {/* Generation form */}
      {mode === 'generate' && (
      <div
        style={{
          background: 'white',
          borderRadius: '14px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          marginTop: '20px',
        }}
      >
        <h2 style={{ fontSize: '17px', fontWeight: '700', margin: '0 0 20px', color: '#111' }}>
          Blog Brief
        </h2>

        {/* Topic */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Topic *</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Why Nigerian SMEs fail at social media (and how to fix it)"
            maxLength={200}
            style={inputStyle(!!topic)}
            onFocus={(e) => (e.target.style.borderColor = URI_PINK)}
            onBlur={(e) => (e.target.style.borderColor = topic ? URI_PINK : '#e5e7eb')}
          />
        </div>

        {/* Primary keyword */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Primary keyword *</label>
          <input
            type="text"
            value={primaryKeyword}
            onChange={(e) => setPrimaryKeyword(e.target.value)}
            placeholder="e.g. social media for Nigerian businesses"
            maxLength={100}
            style={inputStyle(!!primaryKeyword)}
            onFocus={(e) => (e.target.style.borderColor = URI_PINK)}
            onBlur={(e) => (e.target.style.borderColor = primaryKeyword ? URI_PINK : '#e5e7eb')}
          />
        </div>

        {/* Secondary keywords */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Secondary keywords <span style={{ color: '#9ca3af', fontWeight: '400' }}>(optional · press Enter to add · max 5)</span></label>
          <input
            type="text"
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
            onKeyDown={handleKwKeyDown}
            placeholder="e.g. Instagram marketing"
            style={inputStyle(false)}
            onFocus={(e) => (e.target.style.borderColor = URI_PINK)}
            onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
          />
          {secondaryKeywords.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {secondaryKeywords.map((kw) => (
                <span
                  key={kw}
                  style={{
                    background: `${URI_PINK}15`,
                    color: URI_PINK,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '500',
                  }}
                >
                  {kw}
                  <FiX
                    size={12}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSecondaryKeywords((p) => p.filter((k) => k !== kw))}
                  />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Word count */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Target length</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {WORD_COUNT_OPTIONS.map((wc) => (
              <button
                key={wc}
                onClick={() => setWordCount(wc)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${wordCount === wc ? URI_PINK : '#e5e7eb'}`,
                  background: wordCount === wc ? `${URI_PINK}10` : 'white',
                  color: wordCount === wc ? URI_PINK : '#6b7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {wc} words
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim() || !primaryKeyword.trim()}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            background:
              isGenerating || !topic.trim() || !primaryKeyword.trim()
                ? '#e5e7eb'
                : `linear-gradient(135deg, ${URI_PINK} 0%, #E94396 100%)`,
            color: isGenerating || !topic.trim() || !primaryKeyword.trim() ? '#9ca3af' : 'white',
            fontSize: '15px',
            fontWeight: '700',
            cursor: isGenerating || !topic.trim() || !primaryKeyword.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.15s',
            boxShadow:
              isGenerating || !topic.trim() || !primaryKeyword.trim()
                ? 'none'
                : '0 4px 14px rgba(205, 27, 120, 0.3)',
          }}
        >
          {isGenerating ? (
            <>
              <FiLoader className="animate-spin" size={18} />
              Writing your blog... (30-60 seconds)
            </>
          ) : (
            <>
              <FiZap size={18} />
              {dna ? 'Generate Blog with Your Voice' : 'Generate Blog'}
            </>
          )}
        </button>
      </div>
      )}

      {/* Result */}
      {mode === 'generate' && result && (
        <div ref={resultRef} style={{ marginTop: '28px' }}>
          <BlogResult
            result={result}
            editedContent={editedContent}
            setEditedContent={setEditedContent}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            isSaving={isSaving}
            onSaveEdit={handleSaveEdit}
            feedback={feedback}
            feedbackIssues={feedbackIssues}
            setFeedbackIssues={setFeedbackIssues}
            feedbackSaved={feedbackSaved}
            onFeedback={handleFeedback}
            onSubmitFeedbackIssues={handleSubmitFeedbackIssues}
            published={published}
            onPublish={handlePublish}
            onExportMarkdown={handleExportMarkdown}
            copied={copied}
            onCopy={handleCopy}
          />
        </div>
      )}
    </div>
  );
}

// ── DNA status cards ──────────────────────────────────────────────────────

function DNASetupCard({ onSetup }: { onSetup: () => void }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${URI_PINK}08 0%, #f9f4f7 100%)`,
        border: `1px solid ${URI_PINK}25`,
        borderRadius: '14px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '32px' }}>🧬</span>
        <div>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111' }}>
            Jane doesn&apos;t know your writing voice yet
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
            Take the 3-minute Writing DNA quiz. Every blog will sound exactly like you — not AI, not generic. You.
          </p>
        </div>
      </div>
      <button
        onClick={onSetup}
        style={{
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          background: `linear-gradient(135deg, ${URI_PINK} 0%, #E94396 100%)`,
          color: 'white',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(205, 27, 120, 0.3)',
        }}
      >
        Set Up Writing DNA →
      </button>
    </div>
  );
}

function DNAActiveCard({ dna, onRetake }: { dna: WritingDNAData; onRetake: () => void }) {
  const keys = dna.dna_keys || {};
  const chips = [keys.archetype, keys.opening, keys.humour, keys.pidgin]
    .filter(Boolean)
    .map((k) => k!.replace(/_/g, ' '));

  return (
    <div
      style={{
        background: 'white',
        border: `1px solid #e5e7eb`,
        borderLeft: `4px solid ${URI_PINK}`,
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span
          style={{
            background: '#dcfce7',
            color: '#16a34a',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
          }}
        >
          ✓ Writing DNA: Active
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {chips.map((chip, i) => (
            <span
              key={i}
              style={{
                background: `${URI_PINK}10`,
                color: URI_PINK,
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                textTransform: 'capitalize',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onRetake}
        style={{
          background: 'none',
          border: '1px solid #e5e7eb',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#6b7280',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Retake Quiz
      </button>
    </div>
  );
}

// ── Blog result ───────────────────────────────────────────────────────────

interface BlogResultProps {
  result: BlogPostGenerateResult;
  editedContent: string;
  setEditedContent: (v: string) => void;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  isSaving: boolean;
  onSaveEdit: () => void;
  feedback: 'up' | 'down' | null;
  feedbackIssues: string[];
  setFeedbackIssues: (v: string[]) => void;
  feedbackSaved: boolean;
  onFeedback: (r: 'up' | 'down') => void;
  onSubmitFeedbackIssues: () => void;
  published: boolean;
  onPublish: () => void;
  onExportMarkdown: () => void;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

function BlogResult({
  result,
  editedContent,
  setEditedContent,
  isEditing,
  setIsEditing,
  isSaving,
  onSaveEdit,
  feedback,
  feedbackIssues,
  setFeedbackIssues,
  feedbackSaved,
  onFeedback,
  onSubmitFeedbackIssues,
  published,
  onPublish,
  onExportMarkdown,
  copied,
  onCopy,
}: BlogResultProps) {
  const wordCount = editedContent.trim().split(/\s+/).filter(Boolean).length;

  const toggleIssue = (v: string) => {
    setFeedbackIssues(
      feedbackIssues.includes(v) ? feedbackIssues.filter((i) => i !== v) : [...feedbackIssues, v]
    );
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '14px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      {/* Result header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>Generated Blog Post</span>
          <span
            style={{
              background: result.has_writing_dna ? '#dcfce7' : '#f3f4f6',
              color: result.has_writing_dna ? '#16a34a' : '#6b7280',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {result.has_writing_dna ? '✓ Your Voice' : 'Generic Voice'}
          </span>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{wordCount} words</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={onExportMarkdown}
            style={ghostButtonStyle}
          >
            <FiDownload size={14} />
            Export .md
          </button>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} style={ghostButtonStyle}>
              Edit
            </button>
          )}
          {!published && (
            <button
              onClick={onPublish}
              style={{
                ...ghostButtonStyle,
                background: URI_PINK,
                color: 'white',
                border: 'none',
              }}
            >
              Publish
            </button>
          )}
          {published && (
            <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600', padding: '6px 12px' }}>
              ✓ Published
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111', lineHeight: '1.3', flex: 1 }}>
            {result.title}
          </h1>
          <button onClick={() => onCopy(result.title, 'title')} style={iconButtonStyle}>
            {copied === 'title' ? <FiCheck size={15} color={URI_PINK} /> : <FiCopy size={15} color="#9ca3af" />}
          </button>
        </div>

        {/* Meta */}
        <div
          style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '12px 14px',
            marginBottom: '24px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
              Meta Description
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{result.meta}</p>
          </div>
          <button onClick={() => onCopy(result.meta, 'meta')} style={iconButtonStyle}>
            {copied === 'meta' ? <FiCheck size={15} color={URI_PINK} /> : <FiCopy size={15} color="#9ca3af" />}
          </button>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '24px' }} />

        {/* Content — edit mode or preview */}
        {isEditing ? (
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={30}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                border: `2px solid ${URI_PINK}`,
                fontSize: '14px',
                lineHeight: '1.7',
                fontFamily: 'monospace',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={onSaveEdit}
                disabled={isSaving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${URI_PINK} 0%, #E94396 100%)`,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isSaving ? <><FiLoader className="animate-spin" size={14} /> Saving...</> : 'Save changes'}
              </button>
              <button onClick={() => setIsEditing(false)} style={ghostButtonStyle}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="blog-content"
            style={{ fontSize: '16px', lineHeight: '1.8', color: '#374151' }}
            dangerouslySetInnerHTML={{ __html: markdownToHtml(editedContent) }}
          />
        )}

        {/* Feedback */}
        <div
          style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #f3f4f6',
          }}
        >
          {!feedbackSaved ? (
            <>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                Does this sound like you?
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => onFeedback('up')}
                  style={{
                    ...ghostButtonStyle,
                    borderColor: feedback === 'up' ? '#16a34a' : '#e5e7eb',
                    background: feedback === 'up' ? '#dcfce7' : 'white',
                    color: feedback === 'up' ? '#16a34a' : '#6b7280',
                  }}
                >
                  <FiThumbsUp size={15} /> Yes, nailed it
                </button>
                <button
                  onClick={() => onFeedback('down')}
                  style={{
                    ...ghostButtonStyle,
                    borderColor: feedback === 'down' ? URI_PINK : '#e5e7eb',
                    background: feedback === 'down' ? `${URI_PINK}08` : 'white',
                    color: feedback === 'down' ? URI_PINK : '#6b7280',
                  }}
                >
                  <FiThumbsDown size={15} /> Not quite
                </button>
              </div>

              {feedback === 'down' && (
                <div style={{ marginTop: '14px' }}>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>What felt off?</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {FEEDBACK_ISSUES.map((issue) => (
                      <button
                        key={issue.value}
                        onClick={() => toggleIssue(issue.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          border: `1px solid ${feedbackIssues.includes(issue.value) ? URI_PINK : '#e5e7eb'}`,
                          background: feedbackIssues.includes(issue.value) ? `${URI_PINK}10` : 'white',
                          color: feedbackIssues.includes(issue.value) ? URI_PINK : '#6b7280',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: feedbackIssues.includes(issue.value) ? '600' : '400',
                        }}
                      >
                        {issue.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={onSubmitFeedbackIssues}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: URI_PINK,
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Submit feedback
                  </button>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
              ✓ Feedback recorded. Jane will adjust next time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared micro-styles ───────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle = (active: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: `1px solid ${active ? URI_PINK : '#e5e7eb'}`,
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
});

const ghostButtonStyle: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  background: 'white',
  color: '#374151',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '6px',
  color: '#9ca3af',
  flexShrink: 0,
};
