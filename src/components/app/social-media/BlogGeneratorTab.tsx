'use client';

import React, { useState } from 'react';
import { SocialMediaAgentService, BlogGenerationRequest, BlogContentResponse } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { FiBook, FiDownload, FiCopy, FiCheck, FiX, FiLoader } from 'react-icons/fi';

const URI_PINK = '#CD1B78';

export default function BlogGeneratorTab() {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [tone, setTone] = useState<'professional' | 'inspirational' | 'educational' | 'conversational'>('professional');
  const [wordCount, setWordCount] = useState<1000 | 2000 | 3000>(2000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blogResult, setBlogResult] = useState<BlogContentResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile viewport
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (keywords.length < 10 && !keywords.includes(keywordInput.trim())) {
        setKeywords([...keywords, keywordInput.trim()]);
        setKeywordInput('');
      }
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      ToastService.showToast('Please enter a blog topic', ToastTypeEnum.Error);
      return;
    }

    if (keywords.length === 0) {
      ToastService.showToast('Please add at least one keyword', ToastTypeEnum.Error);
      return;
    }

    setIsGenerating(true);
    setBlogResult(null);

    try {
      const request: BlogGenerationRequest = {
        topic: topic.trim(),
        keywords,
        tone,
        word_count: wordCount,
      };

      const response = await SocialMediaAgentService.generateBlogContent(request);

      if (response.status && response.responseData) {
        setBlogResult(response.responseData);
        ToastService.showToast('Blog content generated successfully!', ToastTypeEnum.Success);
      } else {
        ToastService.showToast(response.responseMessage || 'Failed to generate blog content', ToastTypeEnum.Error);
      }
    } catch (error) {
      console.error('Blog generation error:', error);
      ToastService.showToast(
        (error as Error)?.message || 'An error occurred while generating blog content',
        ToastTypeEnum.Error
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportHTML = () => {
    if (!blogResult) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${blogResult.meta_description}">
    <title>${blogResult.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 0.5em;
            color: #1a1a1a;
        }
        h2 {
            font-size: 1.8em;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            color: #2a2a2a;
        }
        .introduction, .conclusion {
            font-size: 1.1em;
            margin: 1.5em 0;
        }
        .section-content {
            margin: 1em 0;
        }
        strong {
            color: ${URI_PINK};
            font-weight: 600;
        }
        ul, ol {
            padding-left: 2em;
            margin: 1em 0;
        }
        li {
            margin: 0.5em 0;
        }
    </style>
</head>
<body>
    ${blogResult.content}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blogResult.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ToastService.showToast('Blog exported as HTML', ToastTypeEnum.Success);
  };

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    ToastService.showToast('Copied to clipboard!', ToastTypeEnum.Success);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div
      style={{
        padding: isMobile ? '16px 16px 100px 16px' : '20px 30px 100px 30px',
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: '100vh',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <FiBook size={28} color={URI_PINK} />
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1a1a1a' }}>Blog Content Generator</h1>
          <span
            style={{
              background: 'linear-gradient(135deg, #CD1B78 0%, #E94396 100%)',
              color: 'white',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '600',
              marginLeft: '6px',
            }}
          >
            BETA
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          Generate SEO-optimized blog posts with AI. Complete with featured images and social media snippets.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: blogResult && !isMobile ? 'minmax(320px, 500px) 1fr' : '1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {/* Generation Form */}
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
            Generation Settings
          </h2>

          {/* Topic Input */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151', fontSize: '14px' }}
            >
              Blog Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 10 Ways AI is Transforming Digital Marketing"
              maxLength={200}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = URI_PINK)}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>{topic.length}/200 characters</div>
          </div>

          {/* Keywords Input */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151', fontSize: '14px' }}
            >
              SEO Keywords * (Press Enter to add)
            </label>
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleAddKeyword}
              placeholder="e.g., AI marketing"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = URI_PINK)}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginTop: '8px',
              }}
            >
              {keywords.map((keyword) => (
                <span
                  key={keyword}
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
                  {keyword}
                  <FiX size={13} style={{ cursor: 'pointer' }} onClick={() => handleRemoveKeyword(keyword)} />
                </span>
              ))}
            </div>
            {keywords.length > 0 && (
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>{keywords.length}/10 keywords</div>
            )}
          </div>

          {/* Tone Selector */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151', fontSize: '14px' }}
            >
              Content Tone
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {(['professional', 'inspirational', 'educational', 'conversational'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `2px solid ${tone === t ? URI_PINK : '#e5e7eb'}`,
                    background: tone === t ? `${URI_PINK}10` : 'white',
                    color: tone === t ? URI_PINK : '#6b7280',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Word Count Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{ display: 'block', fontWeight: '500', marginBottom: '6px', color: '#374151', fontSize: '14px' }}
            >
              Target Word Count
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {([1000, 2000, 3000] as const).map((wc) => (
                <button
                  key={wc}
                  onClick={() => setWordCount(wc)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `2px solid ${wordCount === wc ? URI_PINK : '#e5e7eb'}`,
                    background: wordCount === wc ? `${URI_PINK}10` : 'white',
                    color: wordCount === wc ? URI_PINK : '#6b7280',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {wc}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim() || keywords.length === 0}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: isGenerating ? '#9ca3af' : `linear-gradient(135deg, ${URI_PINK} 0%, #E94396 100%)`,
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(205, 27, 120, 0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(205, 27, 120, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(205, 27, 120, 0.3)';
              }
            }}
          >
            {isGenerating ? (
              <>
                <FiLoader className="animate-spin" size={20} />
                Generating... (30-60s)
              </>
            ) : (
              <>
                <FiBook size={20} />
                Generate Blog Post
              </>
            )}
          </button>
        </div>

        {/* Results Preview */}
        {blogResult && (
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e7eb',
              padding: '30px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#1a1a1a' }}>Generated Content</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleExportHTML}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${URI_PINK}`,
                    background: 'white',
                    color: URI_PINK,
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = URI_PINK;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.color = URI_PINK;
                  }}
                >
                  <FiDownload size={16} />
                  Export HTML
                </button>
              </div>
            </div>

            {/* Featured Image */}
            {blogResult.featured_image_url && (
              <div style={{ marginBottom: '24px' }}>
                <img
                  src={blogResult.featured_image_url}
                  alt={blogResult.title}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    maxHeight: '400px',
                  }}
                />
              </div>
            )}

            {/* Title & Meta */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}
              >
                <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#1a1a1a', flex: 1 }}>
                  {blogResult.title}
                </h1>
                <button
                  onClick={() => handleCopyToClipboard(blogResult.title, 'title')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    background: 'white',
                    cursor: 'pointer',
                    marginLeft: '12px',
                  }}
                >
                  {copiedField === 'title' ? (
                    <FiCheck size={16} color={URI_PINK} />
                  ) : (
                    <FiCopy size={16} color="#6b7280" />
                  )}
                </button>
              </div>
              <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6', margin: '12px 0' }}>
                {blogResult.meta_description}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#9ca3af' }}>
                <span>{blogResult.reading_time} min read</span>
                <span>•</span>
                <span>{blogResult.word_count} words</span>
                <span>•</span>
                <span>{new Date(blogResult.generated_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Content Preview */}
            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#374151',
              }}
              dangerouslySetInnerHTML={{ __html: blogResult.content }}
            />

            {/* Social Snippets */}
            <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1a1a1a' }}>
                Social Media Snippets
              </h3>
              {Object.entries(blogResult.social_snippets).map(([platform, snippet]) => (
                <div
                  key={platform}
                  style={{
                    background: '#f9fafb',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: URI_PINK,
                        textTransform: 'capitalize',
                      }}
                    >
                      {platform}
                    </span>
                    <button
                      onClick={() => handleCopyToClipboard(snippet, platform)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                      }}
                    >
                      {copiedField === platform ? (
                        <>
                          <FiCheck size={14} color={URI_PINK} />
                          Copied
                        </>
                      ) : (
                        <>
                          <FiCopy size={14} color="#6b7280" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>{snippet}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
