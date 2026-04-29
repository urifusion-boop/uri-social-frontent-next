'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#EF4444',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#fff',
          borderRadius: 16,
          padding: 32,
          width: '90%',
          maxWidth: 420,
          zIndex: 9999,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease',
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, color: '#111', fontFamily: 'var(--wf)' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#6B7280', fontFamily: 'var(--wf)', lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: confirmColor,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--wf)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  );
}
