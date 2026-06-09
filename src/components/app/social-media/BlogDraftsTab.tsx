'use client';

import React, { useEffect, useState } from 'react';
import { SocialMediaAgentService, BlogPostData } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';
import { markdownToHtml } from '@/src/utils/markdown.util';
import { FiCopy, FiCheck, FiDownload } from 'react-icons/fi';

const URI_PINK = '#CD1B78';

export default function BlogDraftsTab() {
  const [posts, setPosts] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlogPostData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await SocialMediaAgentService.listBlogPosts();
      if (res.status && res.responseData) {
        setPosts(res.responseData);
      } else {
        ToastService.showToast(res.responseMessage || 'Failed to load posts', ToastTypeEnum.Error);
      }
    } catch {
      ToastService.showToast('Failed to load blog posts', ToastTypeEnum.Error);
    } finally {
      setLoading(false);
    }
  };

  const viewPost = async (post: BlogPostData) => {
    // List endpoint omits content fields — always fetch the full post by ID
    setLoadingDetail(true);
    try {
      const res = await SocialMediaAgentService.getBlogPostById(post.id);
      if (res.status && res.responseData) {
        setSelected(res.responseData);
      } else {
        setSelected(post); // fallback to list data
      }
    } catch {
      setSelected(post);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExportMarkdown = (post: BlogPostData) => {
    const title = post.current_title || post.generated_title || post.topic || '';
    const content = post.current_content || post.generated_content || '';
    const md = `# ${title}\n\n> ${post.generated_meta || ''}\n\n${content}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ToastService.showToast('Exported as Markdown', ToastTypeEnum.Success);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const statusColors = (status: string) => {
    if (status === 'published') return { bg: '#dcfce7', color: '#16a34a' };
    if (status === 'review') return { bg: '#fef9c3', color: '#ca8a04' };
    return { bg: '#f3f4f6', color: '#6b7280' };
  };

  // ── Detail view ──────────────────────────────────────────────────────────

  if (loadingDetail) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>
        Loading post...
      </div>
    );
  }

  if (selected) {
    const title = selected.current_title || selected.generated_title || selected.topic || '';
    const content = selected.current_content || selected.generated_content || '';
    const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    const sc = statusColors(selected.status);

    return (
      <div style={{ padding: '20px 30px 100px', maxWidth: '860px', margin: '0 auto', minHeight: '100vh' }}>
        <button
          onClick={() => setSelected(null)}
          style={{
            marginBottom: '20px',
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
          }}
        >
          ← Back to Drafts
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', lineHeight: '1.3', margin: 0, flex: 1 }}>
            {title}
          </h1>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => handleCopy(title, 'title')} style={iconBtnStyle} title="Copy title">
              {copied === 'title' ? <FiCheck size={15} color={URI_PINK} /> : <FiCopy size={15} color="#9ca3af" />}
            </button>
            <button onClick={() => handleExportMarkdown(selected)} style={iconBtnStyle} title="Export Markdown">
              <FiDownload size={15} color="#9ca3af" />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          <span
            style={{
              background: sc.bg,
              color: sc.color,
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'capitalize',
            }}
          >
            {selected.status}
          </span>
          {selected.has_writing_dna && (
            <span
              style={{
                background: `${URI_PINK}10`,
                color: URI_PINK,
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              ✓ Your Voice
            </span>
          )}
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{wordCount} words</span>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{formatDate(selected.created_at)}</span>
        </div>

        {selected.generated_meta && (
          <div
            style={{
              background: '#f9fafb',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Meta Description
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                {selected.generated_meta}
              </p>
            </div>
            <button onClick={() => handleCopy(selected.generated_meta, 'meta')} style={iconBtnStyle}>
              {copied === 'meta' ? <FiCheck size={15} color={URI_PINK} /> : <FiCopy size={15} color="#9ca3af" />}
            </button>
          </div>
        )}

        {selected.primary_keyword && (
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Keywords: </span>
            {[selected.primary_keyword, ...selected.secondary_keywords].filter(Boolean).map((kw, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  background: i === 0 ? `${URI_PINK}15` : '#f3f4f6',
                  color: i === 0 ? URI_PINK : '#6b7280',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginRight: '6px',
                  marginTop: '4px',
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        )}

        {selected.feedback?.rating && (
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px' }}>
            {selected.feedback.rating === 'up'
              ? '👍 You said this sounded like you'
              : '👎 You said this didn\'t sound quite right'}
          </p>
        )}

        <div style={{ height: '1px', background: '#f3f4f6', marginBottom: '24px' }} />

        <div
          className="blog-content"
          style={{ fontSize: '16px', lineHeight: '1.8', color: '#374151' }}
          dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
        />

        {selected.published_url && (
          <div
            style={{
              marginTop: '28px',
              padding: '12px 16px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#16a34a',
            }}
          >
            Published at:{' '}
            <a href={selected.published_url} target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: '600' }}>
              {selected.published_url}
            </a>
          </div>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '20px 30px 100px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px', color: '#111' }}>Blog Posts</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>All your generated and published blog posts</p>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '2px dashed #e5e7eb',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 6px' }}>No blog posts yet</p>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            Use the Blog Generator tab to create your first post
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {posts.map((post) => {
            const title = post.current_title || post.generated_title;
            const sc = statusColors(post.status);
            return (
              <div
                key={post.id}
                onClick={() => viewPost(post)}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                }}
              >
                <div style={{ width: '100%', height: '6px', borderRadius: '4px', background: `linear-gradient(90deg, ${URI_PINK}30, ${URI_PINK}08)`, marginBottom: '14px' }} />

                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>
                    {post.status}
                  </span>
                  {post.has_writing_dna && (
                    <span style={{ background: `${URI_PINK}10`, color: URI_PINK, padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                      ✓ Your Voice
                    </span>
                  )}
                  {post.feedback?.rating === 'up' && <span style={{ fontSize: '13px' }}>👍</span>}
                </div>

                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: '#111',
                    marginBottom: '8px',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {title || post.topic}
                </h3>

                {post.generated_meta && (
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      marginBottom: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.generated_meta}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
                  <span>{post.primary_keyword}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
};
