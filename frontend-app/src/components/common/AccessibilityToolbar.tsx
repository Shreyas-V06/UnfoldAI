import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Type,
  SunMedium,
  Volume2,
  VolumeX,
  Eye,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAccessibility, FontFamily, FontSize, LetterSpacing, LineHeight, ColorTheme } from '../../context/AccessibilityContext';
import { clsx } from 'clsx';

export const AccessibilityToolbar: React.FC = () => {
  const {
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    letterSpacing,
    setLetterSpacing,
    lineHeight,
    setLineHeight,
    colorTheme,
    setColorTheme,
    ttsEnabled,
    setTtsEnabled,
    ttsRate,
    setTtsRate,
    readingRulerEnabled,
    setReadingRulerEnabled,
    resetSettings,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  const fonts: { id: FontFamily; label: string; desc: string }[] = [
    { id: 'lexend', label: 'Lexend', desc: 'Readability font' },
    { id: 'dyslexic', label: 'OpenDyslexic', desc: 'Weighted gravity letters' },
    { id: 'sans', label: 'Modern Sans', desc: 'Clean geometric' },
  ];

  const fontSizes: { id: FontSize; label: string }[] = [
    { id: 'sm', label: 'A-' },
    { id: 'base', label: 'A' },
    { id: 'lg', label: 'A+' },
    { id: 'xl', label: 'A++' },
  ];

  const themes: { id: ColorTheme; label: string; bg: string; border: string }[] = [
    { id: 'default', label: 'Day White', bg: 'bg-white', border: 'border-slate-300' },
    { id: 'cream', label: 'Warm Cream', bg: 'bg-[#FFFDF5]', border: 'border-amber-300' },
    { id: 'sage', label: 'Pastel Sage', bg: 'bg-[#F4F8F3]', border: 'border-emerald-300' },
    { id: 'lavender', label: 'Soft Lavender', bg: 'bg-[#F7F5FF]', border: 'border-purple-300' },
    { id: 'dark', label: 'Deep Contrast', bg: 'bg-[#0F172A]', border: 'border-slate-700' },
  ];

  return (
    <div className="relative z-30">
      {/* Quick Access Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs md:text-sm font-semibold rounded-full border border-slate-200/80 dark:border-slate-700 shadow-sm backdrop-blur transition-all focus:ring-2 focus:ring-brand-400 cursor-pointer"
        aria-label="Accessibility & Dyslexia Settings"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span className="hidden sm:inline">Dyslexia Tools</span>
        <span className="sm:hidden">A11y</span>
        {isOpen ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
      </button>

      {/* Expanded Control Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Dyslexia & Accessibility
              </h3>
            </div>
            <button
              onClick={resetSettings}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* 1. Typography Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              <span>Font Style</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontFamily(f.id)}
                  className={clsx(
                    'px-2 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer text-center',
                    fontFamily === f.id
                      ? 'bg-brand-50 dark:bg-brand-950/60 border-brand-500 text-brand-700 dark:text-brand-300 font-bold shadow-sm ring-1 ring-brand-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Sizing & Spacing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Text Size
              </label>
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                {fontSizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFontSize(s.id)}
                    className={clsx(
                      'flex-1 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                      fontSize === s.id
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Letter Spacing
              </label>
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                {(['normal', 'wide', 'wider'] as LetterSpacing[]).map((ls) => (
                  <button
                    key={ls}
                    type="button"
                    onClick={() => setLetterSpacing(ls)}
                    className={clsx(
                      'flex-1 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer',
                      letterSpacing === ls
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    )}
                  >
                    {ls === 'normal' ? 'Std' : ls === 'wide' ? 'Wide' : 'Max'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Line Spacing */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Line Height
            </label>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
              {(['normal', 'relaxed', 'loose'] as LineHeight[]).map((lh) => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => setLineHeight(lh)}
                  className={clsx(
                    'flex-1 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer',
                    lineHeight === lh
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  )}
                >
                  {lh}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Color Contrast Theme */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <SunMedium className="w-3.5 h-3.5" />
              <span>Background Tint</span>
            </label>
            <div className="flex items-center gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setColorTheme(t.id)}
                  title={t.label}
                  className={clsx(
                    'w-7 h-7 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center',
                    t.bg,
                    t.border,
                    colorTheme === t.id && 'ring-2 ring-brand-500 ring-offset-2 scale-110'
                  )}
                />
              ))}
            </div>
          </div>

          {/* 5. Audio & Reading Guides */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {/* Reading Ruler Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Reading Guide Line
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReadingRulerEnabled(!readingRulerEnabled)}
                className={clsx(
                  'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                  readingRulerEnabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
                )}
              >
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm',
                    readingRulerEnabled && 'translate-x-5'
                  )}
                />
              </button>
            </div>

            {/* TTS Master Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {ttsEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Text-to-Speech (TTS)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                className={clsx(
                  'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                  ttsEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                )}
              >
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-sm',
                    ttsEnabled && 'translate-x-5'
                  )}
                />
              </button>
            </div>

            {/* Speech Rate Slider */}
            {ttsEnabled && (
              <div className="space-y-1 pl-6">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Speaking Speed</span>
                  <span className="font-mono">{ttsRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.3"
                  step="0.1"
                  value={ttsRate}
                  onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
