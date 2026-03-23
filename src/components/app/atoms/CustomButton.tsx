'use client';

import React, { ReactNode } from 'react';

type IButtonMode = 'primary' | 'secondary' | 'inverse' | 'error' | 'disabled';

interface IProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  mode?: IButtonMode;
  loading?: boolean;
  small?: boolean;
}

const modeStyles: Record<string, React.CSSProperties> = {
  primary: { background: 'linear-gradient(135deg, #CD1B78 0%, #A01560 100%)', color: '#fff', border: 'none' },
  secondary: { background: '#fff', color: '#CD1B78', border: '1.5px solid #CD1B78' },
  inverse: { background: '#111827', color: '#fff', border: 'none' },
  error: { background: '#FB5A36', color: '#fff', border: 'none' },
  disabled: { background: '#E5E7EB', color: '#9CA3AF', border: 'none', cursor: 'not-allowed' },
};

const CustomButton: React.FC<IProps> = ({ children, mode = 'primary', loading, disabled, style, small, ...props }) => {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: small ? '8px 16px' : '12px 24px',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: small ? '13px' : '14px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled && mode !== 'disabled' ? 0.6 : 1,
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    ...modeStyles[disabled ? 'disabled' : mode],
    ...style,
  };

  return (
    <button style={base} disabled={disabled || loading} {...props}>
      {loading && (
        <span
          style={{
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
};

export default CustomButton;
