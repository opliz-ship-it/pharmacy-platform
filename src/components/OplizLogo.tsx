'use client';

import React from 'react';

interface OplizLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'icon' | 'horizontal';
  theme?: 'dark' | 'light';
  animated?: boolean;
}

/**
 * Opliz AI Pharmacy — Professional SVG Logo Component
 * Variants:
 *   - icon: Just the icon mark (great for navbar, favicon)
 *   - full: Icon + stacked text
 *   - horizontal: Icon + horizontal text
 */
export default function OplizLogo({
  size = 40,
  className = '',
  showText = false,
  variant = 'icon',
  theme = 'dark',
  animated = false,
}: OplizLogoProps) {
  const id = React.useId();
  const gradientId = `opliz-grad-${id}`;
  const pulseGradientId = `opliz-pulse-${id}`;
  const glowId = `opliz-glow-${id}`;

  const textColor = theme === 'dark' ? '#f1f5f9' : '#0f172a';
  const subtextColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  const iconMark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${animated ? 'transition-transform duration-300 hover:scale-110' : ''}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="50%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id={pulseGradientId} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="50" cy="50" r="46" fill={`url(#${gradientId})`} opacity="0.12" />

      {/* Outer ring — stylized "O" */}
      <circle
        cx="50"
        cy="50"
        r="38"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="180 60"
      />

      {/* Molecular dots */}
      <circle cx="22" cy="32" r="4" fill="#14b8a6" opacity="0.7" />
      <circle cx="16" cy="50" r="3" fill="#0d9488" opacity="0.5" />
      <circle cx="24" cy="65" r="3.5" fill="#14b8a6" opacity="0.6" />
      {/* Molecular connections */}
      <line x1="22" y1="32" x2="16" y2="50" stroke="#14b8a6" strokeWidth="1.2" opacity="0.4" />
      <line x1="16" y1="50" x2="24" y2="65" stroke="#14b8a6" strokeWidth="1.2" opacity="0.4" />
      <line x1="22" y1="32" x2="24" y2="65" stroke="#0d9488" strokeWidth="0.8" opacity="0.25" />

      {/* Heartbeat / Pulse line across center */}
      <polyline
        points="20,50 35,50 40,35 45,60 50,42 55,55 60,48 65,50 80,50"
        stroke={`url(#${pulseGradientId})`}
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
      >
        {animated && (
          <animate
            attributeName="stroke-dashoffset"
            from="200"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </polyline>
      {animated && (
        <polyline
          points="20,50 35,50 40,35 45,60 50,42 55,55 60,48 65,50 80,50"
          stroke={`url(#${pulseGradientId})`}
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="200"
          opacity="0.5"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="200"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </polyline>
      )}

      {/* AI cross / plus mark (pharmacy cross) */}
      <rect x="70" y="18" width="14" height="4" rx="2" fill="#14b8a6" opacity="0.6" />
      <rect x="75" y="13" width="4" height="14" rx="2" fill="#14b8a6" opacity="0.6" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={className}>{iconMark}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {iconMark}
        <div className="flex flex-col leading-tight">
          <span
            className="text-xl font-extrabold tracking-tight"
            style={{ color: textColor }}
          >
            Opliz<span style={{ color: '#14b8a6' }}>AI</span>
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: subtextColor }}
          >
            Pharmacy
          </span>
        </div>
      </div>
    );
  }

  // Full variant — icon + stacked text
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {iconMark}
      <div className="text-center leading-tight">
        <span
          className="text-2xl font-extrabold tracking-tight block"
          style={{ color: textColor }}
        >
          Opliz<span style={{ color: '#14b8a6' }}>AI</span>
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.25em] block"
          style={{ color: subtextColor }}
        >
          Pharmacy
        </span>
      </div>
    </div>
  );
}
