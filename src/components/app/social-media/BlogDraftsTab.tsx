import React, { useEffect, useState } from 'react';
import { SocialMediaAgentService, BlogDraft } from '@/src/api/SocialMediaAgentService';
import { ToastService } from '@/src/utils/toast.util';
import { ToastTypeEnum } from '@/src/models/enum-models/ToastTypeEnum';

export default function BlogDraftsTab() {
  const [drafts, setDrafts] = useState<BlogDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDraft, setSelectedDraft] = useState<BlogDraft | null>(null);
  const [pollingDraftId, setPollingDraftId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlogDrafts();
  }, []);

  // Poll for image generation if a draft is pending
  useEffect(() => {
    if (!pollingDraftId) return;

    const interval = setInterval(async () => {
      try {
        const response = await SocialMediaAgentService.getBlogDraft(pollingDraftId);
        if (response.status && response.responseData) {
          const updatedDraft = response.responseData;

          // Update in list
          setDrafts((prev) => prev.map((d) => (d.id === pollingDraftId ? updatedDraft : d)));

          // Update selected draft if viewing
          if (selectedDraft?.id === pollingDraftId) {
            setSelectedDraft(updatedDraft);
          }

          // Stop polling if image is ready
          if (updatedDraft.featured_image_url) {
            setPollingDraftId(null);
          }
        }
      } catch (error) {
        console.error('Error polling draft:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [pollingDraftId, selectedDraft]);

  const fetchBlogDrafts = async () => {
    try {
      setLoading(true);
      const response = await SocialMediaAgentService.getBlogDrafts();

      if (response.status && response.responseData) {
        setDrafts(response.responseData);

        // Auto-poll any drafts with pending images
        const pendingDraft = response.responseData.find((d) => d.has_image && !d.featured_image_url);
        if (pendingDraft) {
          setPollingDraftId(pendingDraft.id);
        }
      } else {
        ToastService.showToast(response.responseMessage || 'Failed to fetch blog drafts', ToastTypeEnum.Error);
      }
    } catch (error) {
      console.error('Error fetching blog drafts:', error);
      ToastService.showToast('Failed to fetch blog drafts', ToastTypeEnum.Error);
    } finally {
      setLoading(false);
    }
  };

  const viewDraft = (draft: BlogDraft) => {
    setSelectedDraft(draft);

    // Start polling if image is pending
    if (draft.has_image && !draft.featured_image_url) {
      setPollingDraftId(draft.id);
    }
  };

  const closeDraft = () => {
    setSelectedDraft(null);
    setPollingDraftId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#666' }}>Loading blog drafts...</div>
      </div>
    );
  }

  if (selectedDraft) {
    return (
      <div
        style={{
          padding: '20px 30px 100px 30px',
          maxWidth: '1200px',
          margin: '0 auto',
          minHeight: '100vh',
          height: 'auto',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Back button */}
        <button
          onClick={closeDraft}
          style={{
            marginBottom: '20px',
            padding: '8px 16px',
            background: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Back to Drafts
        </button>

        {/* Featured Image */}
        {selectedDraft.featured_image_url ? (
          <img
            src={selectedDraft.featured_image_url}
            alt={selectedDraft.title}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          />
        ) : selectedDraft.has_image ? (
          <div
            style={{
              width: '100%',
              height: '300px',
              background: '#f9f9f9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              border: '2px dashed #ddd',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
                🎨 Generating featured image...
              </div>
              <div style={{ fontSize: '14px', color: '#999' }}>This may take 30-60 seconds</div>
            </div>
          </div>
        ) : null}

        {/* Title */}
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px', color: '#000' }}>
          {selectedDraft.title}
        </h1>

        {/* Meta info */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', color: '#666', fontSize: '14px' }}>
          <span>📖 {selectedDraft.reading_time} min read</span>
          <span>📝 {selectedDraft.word_count} words</span>
          <span>🏷️ {selectedDraft.tone}</span>
          <span>📅 {formatDate(selectedDraft.created_at)}</span>
        </div>

        {/* Meta Description */}
        <div
          style={{
            padding: '12px 16px',
            background: '#f9f9f9',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#555',
            borderLeft: '4px solid #CD1B78',
          }}
        >
          <strong>Meta Description:</strong> {selectedDraft.meta_description}
        </div>

        {/* Keywords */}
        <div style={{ marginBottom: '24px' }}>
          <strong style={{ fontSize: '14px', color: '#333' }}>Keywords: </strong>
          {selectedDraft.keywords.map((keyword, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                background: '#e8f5e9',
                borderRadius: '12px',
                fontSize: '13px',
                marginRight: '8px',
                marginTop: '4px',
              }}
            >
              {keyword}
            </span>
          ))}
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: '16px',
            lineHeight: '1.8',
            color: '#333',
            marginBottom: '32px',
          }}
          dangerouslySetInnerHTML={{ __html: selectedDraft.content }}
        />

        {/* Social Snippets */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '2px solid #eee' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Social Media Snippets</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* LinkedIn */}
            <div style={{ padding: '12px', background: '#f0f7ff', borderRadius: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0077B5', marginBottom: '6px' }}>
                LinkedIn
              </div>
              <div style={{ fontSize: '14px', color: '#333' }}>{selectedDraft.social_snippets.linkedin}</div>
            </div>

            {/* Twitter */}
            <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1DA1F2', marginBottom: '6px' }}>Twitter</div>
              <div style={{ fontSize: '14px', color: '#333' }}>{selectedDraft.social_snippets.twitter}</div>
            </div>

            {/* Facebook */}
            <div style={{ padding: '12px', background: '#f0f4ff', borderRadius: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1877F2', marginBottom: '6px' }}>
                Facebook
              </div>
              <div style={{ fontSize: '14px', color: '#333' }}>{selectedDraft.social_snippets.facebook}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px 30px 100px 30px',
        maxWidth: '1400px',
        margin: '0 auto',
        height: 'auto',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Blog Drafts</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>View and manage your AI-generated blog posts</p>
      </div>

      {drafts.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            background: '#f9f9f9',
            borderRadius: '8px',
            border: '2px dashed #ddd',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <div style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>No blog drafts yet</div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Generate your first blog post using the Blog Generator tab
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {drafts.map((draft) => (
            <div
              key={draft.id}
              onClick={() => viewDraft(draft)}
              style={{
                padding: '20px',
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
              }}
            >
              {/* Featured Image Thumbnail or Placeholder */}
              {draft.featured_image_url ? (
                <img
                  src={draft.featured_image_url}
                  alt={draft.title}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    marginBottom: '12px',
                  }}
                />
              ) : draft.has_image ? (
                <div
                  style={{
                    width: '100%',
                    height: '180px',
                    background: '#f5f5f5',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    border: '2px dashed #ddd',
                  }}
                >
                  <div style={{ textAlign: 'center', color: '#999', fontSize: '13px' }}>
                    <div>🎨</div>
                    <div>Generating...</div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '180px',
                    background: 'linear-gradient(135deg, #CD1B78 0%, #FF6B9D 100%)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    color: '#fff',
                    fontSize: '48px',
                  }}
                >
                  📝
                </div>
              )}

              {/* Title */}
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#000',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {draft.title}
              </h3>

              {/* Meta */}
              <div
                style={{
                  fontSize: '13px',
                  color: '#666',
                  marginBottom: '8px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {draft.meta_description}
              </div>

              {/* Stats */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '12px',
                  color: '#999',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                <span>📖 {draft.reading_time}min</span>
                <span>📝 {draft.word_count} words</span>
                <span>🏷️ {draft.tone}</span>
              </div>

              {/* Date */}
              <div style={{ fontSize: '11px', color: '#bbb', marginTop: '8px' }}>{formatDate(draft.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
