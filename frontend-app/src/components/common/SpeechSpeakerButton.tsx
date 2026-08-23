import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { clsx } from 'clsx';

interface SpeechSpeakerButtonProps {
  text: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'filled' | 'pill';
  className?: string;
}

export const SpeechSpeakerButton: React.FC<SpeechSpeakerButtonProps> = ({
  text,
  label,
  size = 'md',
  variant = 'ghost',
  className = '',
}) => {
  const { speakText, stopSpeech, isSpeaking, ttsEnabled } = useAccessibility();

  if (!ttsEnabled) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeech();
    } else {
      speakText(text);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs gap-1',
    md: 'p-2 text-sm gap-1.5',
    lg: 'p-2.5 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantClasses = {
    ghost:
      'text-brand-600 hover:text-brand-800 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/30 rounded-xl',
    filled:
      'bg-brand-100 hover:bg-brand-200 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200 rounded-xl shadow-sm',
    pill:
      'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 rounded-full px-3 py-1 font-medium border border-amber-200 dark:border-amber-700/50',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isSpeaking ? 'Stop reading' : 'Read aloud with Text-to-Speech'}
      aria-label={label || 'Read text aloud'}
      className={clsx(
        'inline-flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-400 select-none cursor-pointer',
        sizeClasses[size],
        variantClasses[variant],
        isSpeaking && 'animate-pulse ring-2 ring-brand-500 bg-brand-200 text-brand-900',
        className
      )}
    >
      {isSpeaking ? (
        <VolumeX className={clsx(iconSizes[size], 'text-rose-600')} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
      {label && <span>{label}</span>}
    </button>
  );
};
