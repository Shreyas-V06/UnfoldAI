import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontFamily = 'lexend' | 'dyslexic' | 'sans';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type LetterSpacing = 'normal' | 'wide' | 'wider';
export type LineHeight = 'normal' | 'relaxed' | 'loose';
export type ColorTheme = 'default' | 'cream' | 'sage' | 'dark' | 'lavender';

interface AccessibilityContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  letterSpacing: LetterSpacing;
  setLetterSpacing: (spacing: LetterSpacing) => void;
  lineHeight: LineHeight;
  setLineHeight: (height: LineHeight) => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  
  // TTS
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  ttsRate: number;
  setTtsRate: (rate: number) => void;
  speakText: (text: string) => void;
  stopSpeech: () => void;
  isSpeaking: boolean;
  
  // Reading Ruler
  readingRulerEnabled: boolean;
  setReadingRulerEnabled: (enabled: boolean) => void;
  rulerHeight: number;
  setRulerHeight: (height: number) => void;
  
  // Syllable / Word highlighting
  syllableHighlighting: boolean;
  setSyllableHighlighting: (val: boolean) => void;
  
  resetSettings: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => 
    (localStorage.getItem('unfold_font') as FontFamily) || 'lexend'
  );
  const [fontSize, setFontSizeState] = useState<FontSize>(() => 
    (localStorage.getItem('unfold_font_size') as FontSize) || 'base'
  );
  const [letterSpacing, setLetterSpacingState] = useState<LetterSpacing>(() => 
    (localStorage.getItem('unfold_letter_spacing') as LetterSpacing) || 'normal'
  );
  const [lineHeight, setLineHeightState] = useState<LineHeight>(() => 
    (localStorage.getItem('unfold_line_height') as LineHeight) || 'normal'
  );
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => 
    (localStorage.getItem('unfold_theme') as ColorTheme) || 'default'
  );

  const [ttsEnabled, setTtsEnabledState] = useState<boolean>(() => 
    localStorage.getItem('unfold_tts_enabled') !== 'false'
  );
  const [ttsRate, setTtsRateState] = useState<number>(() => 
    parseFloat(localStorage.getItem('unfold_tts_rate') || '0.9')
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const [readingRulerEnabled, setReadingRulerEnabledState] = useState<boolean>(() => 
    localStorage.getItem('unfold_ruler_enabled') === 'true'
  );
  const [rulerHeight, setRulerHeightState] = useState<number>(() => 
    parseInt(localStorage.getItem('unfold_ruler_height') || '40', 10)
  );
  const [syllableHighlighting, setSyllableHighlightingState] = useState<boolean>(() => 
    localStorage.getItem('unfold_syllables') === 'true'
  );

  // Apply typography and theme dynamically to the DOM
  useEffect(() => {
    localStorage.setItem('unfold_font', fontFamily);
    const fontValue =
      fontFamily === 'dyslexic'
        ? "'OpenDyslexic', 'Open-Dyslexic', 'OpenDyslexic-Regular', sans-serif"
        : fontFamily === 'lexend'
        ? "'Lexend', sans-serif"
        : "'Plus Jakarta Sans', sans-serif";

    document.documentElement.style.setProperty('--app-font-family', fontValue);
    document.body.style.fontFamily = fontValue;

    document.documentElement.classList.remove('font-dyslexic', 'font-lexend', 'font-sans');
    document.body.classList.remove('font-dyslexic', 'font-lexend', 'font-sans');

    document.documentElement.classList.add(`font-${fontFamily}`);
    document.body.classList.add(`font-${fontFamily}`);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('unfold_font_size', fontSize);
    const htmlEl = document.documentElement;
    htmlEl.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    if (fontSize === 'sm') htmlEl.style.fontSize = '14px';
    else if (fontSize === 'base') htmlEl.style.fontSize = '16px';
    else if (fontSize === 'lg') htmlEl.style.fontSize = '18px';
    else if (fontSize === 'xl') htmlEl.style.fontSize = '20px';
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('unfold_letter_spacing', letterSpacing);
    const spacingValue =
      letterSpacing === 'wider' ? '0.08em' : letterSpacing === 'wide' ? '0.04em' : '0.015em';
    document.documentElement.style.setProperty('--app-letter-spacing', spacingValue);
  }, [letterSpacing]);

  useEffect(() => {
    localStorage.setItem('unfold_line_height', lineHeight);
    const heightValue = lineHeight === 'loose' ? '2.0' : lineHeight === 'relaxed' ? '1.8' : '1.6';
    document.documentElement.style.setProperty('--app-line-height', heightValue);
  }, [lineHeight]);

  useEffect(() => {
    localStorage.setItem('unfold_theme', colorTheme);
    const body = document.body;
    body.classList.remove('theme-cream', 'theme-sage', 'theme-dark', 'theme-lavender');
    if (colorTheme !== 'default') {
      body.classList.add(`theme-${colorTheme}`);
    }
  }, [colorTheme]);

  const setFontFamily = (val: FontFamily) => setFontFamilyState(val);
  const setFontSize = (val: FontSize) => setFontSizeState(val);
  const setLetterSpacing = (val: LetterSpacing) => setLetterSpacingState(val);
  const setLineHeight = (val: LineHeight) => setLineHeightState(val);
  const setColorTheme = (val: ColorTheme) => setColorThemeState(val);
  const setTtsEnabled = (val: boolean) => {
    localStorage.setItem('unfold_tts_enabled', String(val));
    setTtsEnabledState(val);
    if (!val) stopSpeech();
  };
  const setTtsRate = (val: number) => {
    localStorage.setItem('unfold_tts_rate', String(val));
    setTtsRateState(val);
  };
  const setReadingRulerEnabled = (val: boolean) => {
    localStorage.setItem('unfold_ruler_enabled', String(val));
    setReadingRulerEnabledState(val);
  };
  const setRulerHeight = (val: number) => {
    localStorage.setItem('unfold_ruler_height', String(val));
    setRulerHeightState(val);
  };
  const setSyllableHighlighting = (val: boolean) => {
    localStorage.setItem('unfold_syllables', String(val));
    setSyllableHighlightingState(val);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window) || !text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsRate;
    utterance.pitch = 1.05; // Slightly friendly upbeat pitch

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const resetSettings = () => {
    setFontFamilyState('lexend');
    setFontSizeState('base');
    setLetterSpacingState('normal');
    setLineHeightState('normal');
    setColorThemeState('default');
    setTtsEnabledState(true);
    setTtsRateState(0.9);
    setReadingRulerEnabledState(false);
    setSyllableHighlightingState(false);
    stopSpeech();
    localStorage.clear();
  };

  return (
    <AccessibilityContext.Provider
      value={{
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
        speakText,
        stopSpeech,
        isSpeaking,
        readingRulerEnabled,
        setReadingRulerEnabled,
        rulerHeight,
        setRulerHeight,
        syllableHighlighting,
        setSyllableHighlighting,
        resetSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
