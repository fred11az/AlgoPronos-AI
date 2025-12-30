'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg' },
    md: { icon: 40, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
    xl: { icon: 64, text: 'text-3xl' },
  };

  const currentSize = sizes[size];

  return (
    <Link href="/" className={cn('flex items-center gap-3', className)}>
      {/* Logo Icon - Network/Graph Design */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: currentSize.icon, height: currentSize.icon }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#gradient)"
            strokeWidth="2"
            fill="none"
          />

          {/* Network Lines */}
          <line x1="25" y1="35" x2="50" y2="50" stroke="#00D4FF" strokeWidth="2" />
          <line x1="50" y1="50" x2="75" y2="35" stroke="#00D4FF" strokeWidth="2" />
          <line x1="25" y1="35" x2="45" y2="25" stroke="#00D4FF" strokeWidth="2" />
          <line x1="45" y1="25" x2="75" y2="35" stroke="#00D4FF" strokeWidth="2" />
          <line x1="50" y1="50" x2="30" y2="65" stroke="#00D4FF" strokeWidth="2" />
          <line x1="50" y1="50" x2="70" y2="65" stroke="#00D4FF" strokeWidth="2" />
          <line x1="30" y1="65" x2="70" y2="65" stroke="#00D4FF" strokeWidth="2" />
          <line x1="25" y1="35" x2="30" y2="65" stroke="#00D4FF" strokeWidth="2" />
          <line x1="75" y1="35" x2="70" y2="65" stroke="#00D4FF" strokeWidth="2" />

          {/* Network Nodes */}
          <circle cx="25" cy="35" r="6" fill="#00D4FF" />
          <circle cx="45" cy="25" r="5" fill="#00D4FF" />
          <circle cx="75" cy="35" r="6" fill="#00D4FF" />
          <circle cx="50" cy="50" r="7" fill="#00D4FF" />
          <circle cx="30" cy="65" r="5" fill="#00D4FF" />
          <circle cx="70" cy="65" r="5" fill="#00D4FF" />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#0099CC" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold text-white leading-tight', currentSize.text)}>
            AlgoPronos <span className="text-[#00D4FF]">AI</span>
          </span>
          <span className="text-[10px] text-[#00D4FF] tracking-[0.3em] uppercase font-medium">
            Data {'>'} Emotion
          </span>
        </div>
      )}
    </Link>
  );
}

export function LogoIcon({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <div
      className={cn('relative flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#gradient-icon)"
          strokeWidth="2"
          fill="none"
        />
        <line x1="25" y1="35" x2="50" y2="50" stroke="#00D4FF" strokeWidth="2" />
        <line x1="50" y1="50" x2="75" y2="35" stroke="#00D4FF" strokeWidth="2" />
        <line x1="25" y1="35" x2="45" y2="25" stroke="#00D4FF" strokeWidth="2" />
        <line x1="45" y1="25" x2="75" y2="35" stroke="#00D4FF" strokeWidth="2" />
        <line x1="50" y1="50" x2="30" y2="65" stroke="#00D4FF" strokeWidth="2" />
        <line x1="50" y1="50" x2="70" y2="65" stroke="#00D4FF" strokeWidth="2" />
        <line x1="30" y1="65" x2="70" y2="65" stroke="#00D4FF" strokeWidth="2" />
        <line x1="25" y1="35" x2="30" y2="65" stroke="#00D4FF" strokeWidth="2" />
        <line x1="75" y1="35" x2="70" y2="65" stroke="#00D4FF" strokeWidth="2" />
        <circle cx="25" cy="35" r="6" fill="#00D4FF" />
        <circle cx="45" cy="25" r="5" fill="#00D4FF" />
        <circle cx="75" cy="35" r="6" fill="#00D4FF" />
        <circle cx="50" cy="50" r="7" fill="#00D4FF" />
        <circle cx="30" cy="65" r="5" fill="#00D4FF" />
        <circle cx="70" cy="65" r="5" fill="#00D4FF" />
        <defs>
          <linearGradient id="gradient-icon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D4FF" />
            <stop offset="100%" stopColor="#0099CC" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
