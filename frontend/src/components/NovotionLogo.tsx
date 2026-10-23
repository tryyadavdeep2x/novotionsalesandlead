import React, { useState } from 'react';
import logoImg from '../assets/logo.png';
import logoIconImg from '../assets/logo-icon.png';

interface NovotionLogoProps {
  variant?: 'full' | 'icon' | 'header';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
  badge?: string;
  badgeColor?: 'blue' | 'cyan' | 'purple' | 'emerald';
}

export const NovotionLogo: React.FC<NovotionLogoProps> = ({
  variant = 'full',
  className = '',
  size = 'md',
  subtitle,
  badge,
  badgeColor = 'purple',
}) => {
  const [imgError, setImgError] = useState(false);

  const logoHeights = {
    sm: 'h-5',
    md: 'h-6.5',
    lg: 'h-8',
    xl: 'h-10',
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
    xl: 'h-12 w-12',
  };

  const badgeStyles = {
    blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  };

  // Fallback typography badge if image ever fails
  const renderFallback = () => (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
        N
      </div>
      <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
        Novotion
      </span>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        {!imgError ? (
          <img
            src={logoIconImg}
            alt="Novotion"
            onError={() => setImgError(true)}
            className={`${iconSizes[size]} object-contain rounded-lg`}
          />
        ) : (
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            N
          </div>
        )}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        {!imgError ? (
          <img
            src={logoImg}
            alt="Novotion"
            onError={() => setImgError(true)}
            className="h-6.5 w-auto object-contain dark:brightness-110"
          />
        ) : (
          renderFallback()
        )}
        {(badge || subtitle) && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-700/60">
            {badge && (
              <span className={`text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full border ${badgeStyles[badgeColor]}`}>
                {badge}
              </span>
            )}
            {subtitle && (
              <span className="hidden sm:inline-block text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full Logo variant (Login page)
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div className="relative group flex items-center justify-center">
        <div className="relative px-6 py-3 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          {!imgError ? (
            <img
              src={logoImg}
              alt="Novotion"
              onError={() => setImgError(true)}
              className={`${logoHeights[size]} w-auto object-contain dark:brightness-110 transition-all duration-300`}
            />
          ) : (
            renderFallback()
          )}
        </div>
      </div>
      {subtitle && (
        <p className="text-slate-400 dark:text-slate-500 mt-2.5 text-xs font-medium tracking-normal text-center">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default NovotionLogo;
