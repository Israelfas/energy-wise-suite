import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type PerfilAccesibilidad = "visual" | "auditiva" | "motriz" | "cognitiva" | "ninguna";
type FontFamily = "default" | "arial" | "verdana" | "opendyslexic" | "comic";

interface AccessibilityContextType {
  perfil: PerfilAccesibilidad;
  setPerfil: (perfil: PerfilAccesibilidad) => void;
  aplicarPerfil: (perfil?: PerfilAccesibilidad) => void;
  cargarPerfil: (apply?: boolean) => Promise<PerfilAccesibilidad | null>;
  dark: boolean;
  toggleDark: () => void;
  // Existing features
  fontSize: number;
  setFontSize: (size: number) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  textToSpeech: boolean;
  setTextToSpeech: (value: boolean) => void;
  linkHighlight: boolean;
  setLinkHighlight: (value: boolean) => void;
  spacing: 'normal' | 'medium' | 'wide';
  setSpacing: (value: 'normal' | 'medium' | 'wide') => void;
  // NEW: Tipo de Fuente
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  // NEW: Color personalizado
  customColors: {
    background: string;
    text: string;
  };
  setCustomColors: (colors: { background: string; text: string }) => void;
  customColorsEnabled: boolean;
  setCustomColorsEnabled: (enabled: boolean) => void;
  // NEW: Espaciado de texto (letter-spacing y line-height)
  letterSpacing: 'normal' | 'wide' | 'wider';
  setLetterSpacing: (value: 'normal' | 'wide' | 'wider') => void;
  lineHeight: 'normal' | 'relaxed' | 'loose';
  setLineHeight: (value: 'normal' | 'relaxed' | 'loose') => void;
  // NEW: Atajos de teclado personalizados
  customShortcuts: Record<string, string>;
  setCustomShortcuts: (shortcuts: Record<string, string>) => void;
  // NEW: Control por voz
  voiceControl: boolean;
  setVoiceControl: (enabled: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [perfil, setPerfil] = useState<PerfilAccesibilidad>("ninguna");
  const [dark, setDark] = useState<boolean>(false);
  const [fontSize, setFontSizeState] = useState<number>(16);
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [textToSpeech, setTextToSpeechState] = useState<boolean>(false);
  const [linkHighlight, setLinkHighlightState] = useState<boolean>(false);
  const [spacing, setSpacingState] = useState<'normal' | 'medium' | 'wide'>('normal');
  
  // NEW STATES
  const [fontFamily, setFontFamilyState] = useState<FontFamily>('default');
  const [customColors, setCustomColorsState] = useState({ background: '#ffffff', text: '#000000' });
  const [customColorsEnabled, setCustomColorsEnabledState] = useState(false);
  const [letterSpacing, setLetterSpacingState] = useState<'normal' | 'wide' | 'wider'>('normal');
  const [lineHeight, setLineHeightState] = useState<'normal' | 'relaxed' | 'loose'>('normal');
  const [customShortcuts, setCustomShortcutsState] = useState<Record<string, string>>({});
  const [voiceControl, setVoiceControlState] = useState(false);
  
  const { user } = useAuth();

  const LOCAL_KEY = "accessibility_perfil";
  const LOCAL_THEME = "theme_pref";
  const LOCAL_FONT_SIZE = "accessibility_font_size";
  const LOCAL_HIGH_CONTRAST = "accessibility_high_contrast";
  const LOCAL_TTS = "accessibility_tts";
  const LOCAL_LINK_HIGHLIGHT = "accessibility_link_highlight";
  const LOCAL_SPACING = "accessibility_spacing";
  const LOCAL_FONT_FAMILY = "accessibility_font_family";
  const LOCAL_CUSTOM_COLORS = "accessibility_custom_colors";
  const LOCAL_CUSTOM_COLORS_ENABLED = "accessibility_custom_colors_enabled";
  const LOCAL_LETTER_SPACING = "accessibility_letter_spacing";
  const LOCAL_LINE_HEIGHT = "accessibility_line_height";
  const LOCAL_CUSTOM_SHORTCUTS = "accessibility_custom_shortcuts";
  const LOCAL_VOICE_CONTROL = "accessibility_voice_control";

  // Apply font size to DOM
  const applyFontSizeDOM = useCallback((size: number) => {
    document.documentElement.style.setProperty('--font-size-base', `${size}px`);
  }, []);

  // Apply high contrast to DOM
  const applyHighContrastDOM = useCallback((value: boolean) => {
    const root = document.documentElement;
    if (value) {
      root.classList.add('high-contrast');
      root.style.setProperty('--contrast-boost', '1.5');
    } else {
      root.classList.remove('high-contrast');
      root.style.removeProperty('--contrast-boost');
    }
  }, []);

  // Apply link highlight to DOM
  const applyLinkHighlightDOM = useCallback((value: boolean) => {
    const root = document.documentElement;
    if (value) {
      root.classList.add('link-highlight');
    } else {
      root.classList.remove('link-highlight');
    }
  }, []);

  // Apply spacing to DOM
  const applySpacingDOM = useCallback((value: 'normal' | 'medium' | 'wide') => {
    const root = document.documentElement;
    root.classList.remove('spacing-normal', 'spacing-medium', 'spacing-wide');
    root.classList.add(`spacing-${value}`);
    
    const spacingValues = {
      normal: '0.5rem',
      medium: '1rem',
      wide: '1.5rem'
    };
    root.style.setProperty('--spacing-interactive', spacingValues[value]);
  }, []);

  // NEW: Apply font family to DOM
  const applyFontFamilyDOM = useCallback((font: FontFamily) => {
    const fontMap = {
      default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      arial: 'Arial, sans-serif',
      verdana: 'Verdana, sans-serif',
      opendyslexic: '"OpenDyslexic", sans-serif',
      comic: '"Comic Sans MS", "Comic Sans", cursive'
    };
    document.documentElement.style.setProperty('--font-family-base', fontMap[font]);
  }, []);

  // NEW: Apply custom colors to DOM
  const applyCustomColorsDOM = useCallback((colors: { background: string; text: string }, enabled: boolean) => {
    const root = document.documentElement;
    if (enabled) {
      root.style.setProperty('--custom-bg', colors.background);
      root.style.setProperty('--custom-text', colors.text);
      root.classList.add('custom-colors-enabled');
    } else {
      root.classList.remove('custom-colors-enabled');
      root.style.removeProperty('--custom-bg');
      root.style.removeProperty('--custom-text');
    }
  }, []);

  // NEW: Apply letter spacing to DOM
  const applyLetterSpacingDOM = useCallback((value: 'normal' | 'wide' | 'wider') => {
    const spacingMap = {
      normal: '0',
      wide: '0.05em',
      wider: '0.1em'
    };
    document.documentElement.style.setProperty('--letter-spacing', spacingMap[value]);
  }, []);

  // NEW: Apply line height to DOM
  const applyLineHeightDOM = useCallback((value: 'normal' | 'relaxed' | 'loose') => {
    const heightMap = {
      normal: '1.6',
      relaxed: '2.0',
      loose: '2.5'
    };
    document.documentElement.style.setProperty('--line-height-text', heightMap[value]);
  }, []);

  // Set font size with persistence
  const setFontSize = useCallback((size: number) => {
    setFontSizeState(size);
    applyFontSizeDOM(size);
    try { localStorage.setItem(LOCAL_FONT_SIZE, String(size)); } catch {}
  }, [applyFontSizeDOM]);

  // Set high contrast with persistence
  const setHighContrast = useCallback((value: boolean) => {
    setHighContrastState(value);
    applyHighContrastDOM(value);
    try { localStorage.setItem(LOCAL_HIGH_CONTRAST, String(value)); } catch {}
  }, [applyHighContrastDOM]);

  // Set text to speech with persistence
  const setTextToSpeech = useCallback((value: boolean) => {
    setTextToSpeechState(value);
    try { localStorage.setItem(LOCAL_TTS, String(value)); } catch {}
    
    if (!value && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Set link highlight with persistence
  const setLinkHighlight = useCallback((value: boolean) => {
    setLinkHighlightState(value);
    applyLinkHighlightDOM(value);
    try { localStorage.setItem(LOCAL_LINK_HIGHLIGHT, String(value)); } catch {}
  }, [applyLinkHighlightDOM]);

  // Set spacing with persistence
  const setSpacing = useCallback((value: 'normal' | 'medium' | 'wide') => {
    setSpacingState(value);
    applySpacingDOM(value);
    try { localStorage.setItem(LOCAL_SPACING, value); } catch {}
  }, [applySpacingDOM]);

  // NEW: Set font family with persistence
  const setFontFamily = useCallback((font: FontFamily) => {
    setFontFamilyState(font);
    applyFontFamilyDOM(font);
    try { localStorage.setItem(LOCAL_FONT_FAMILY, font); } catch {}
  }, [applyFontFamilyDOM]);

  // NEW: Set custom colors with persistence
  const setCustomColors = useCallback((colors: { background: string; text: string }) => {
    setCustomColorsState(colors);
    applyCustomColorsDOM(colors, customColorsEnabled);
    try { localStorage.setItem(LOCAL_CUSTOM_COLORS, JSON.stringify(colors)); } catch {}
  }, [applyCustomColorsDOM, customColorsEnabled]);

  // NEW: Set custom colors enabled with persistence
  const setCustomColorsEnabled = useCallback((enabled: boolean) => {
    setCustomColorsEnabledState(enabled);
    applyCustomColorsDOM(customColors, enabled);
    try { localStorage.setItem(LOCAL_CUSTOM_COLORS_ENABLED, String(enabled)); } catch {}
  }, [applyCustomColorsDOM, customColors]);

  // NEW: Set letter spacing with persistence
  const setLetterSpacing = useCallback((value: 'normal' | 'wide' | 'wider') => {
    setLetterSpacingState(value);
    applyLetterSpacingDOM(value);
    try { localStorage.setItem(LOCAL_LETTER_SPACING, value); } catch {}
  }, [applyLetterSpacingDOM]);

  // NEW: Set line height with persistence
  const setLineHeight = useCallback((value: 'normal' | 'relaxed' | 'loose') => {
    setLineHeightState(value);
    applyLineHeightDOM(value);
    try { localStorage.setItem(LOCAL_LINE_HEIGHT, value); } catch {}
  }, [applyLineHeightDOM]);

  // NEW: Set custom shortcuts with persistence
  const setCustomShortcuts = useCallback((shortcuts: Record<string, string>) => {
    setCustomShortcutsState(shortcuts);
    try { localStorage.setItem(LOCAL_CUSTOM_SHORTCUTS, JSON.stringify(shortcuts)); } catch {}
  }, []);

  // NEW: Set voice control with persistence
  const setVoiceControl = useCallback((enabled: boolean) => {
    setVoiceControlState(enabled);
    try { localStorage.setItem(LOCAL_VOICE_CONTROL, String(enabled)); } catch {}
  }, []);

  // On mount, load all preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (stored) {
        const parsed = stored as PerfilAccesibilidad;
        setPerfil(parsed);
        aplicarPerfilDOM(parsed);
      }
      
      const themeStored = localStorage.getItem(LOCAL_THEME);
      if (themeStored) {
        const isDark = themeStored === 'dark';
        setDark(isDark);
        applyThemeDOM(isDark);
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDark(prefersDark);
        applyThemeDOM(prefersDark);
      }

      const fontSizeStored = localStorage.getItem(LOCAL_FONT_SIZE);
      if (fontSizeStored) {
        const size = parseInt(fontSizeStored, 10);
        setFontSizeState(size);
        applyFontSizeDOM(size);
      }

      const highContrastStored = localStorage.getItem(LOCAL_HIGH_CONTRAST);
      if (highContrastStored === 'true') {
        setHighContrastState(true);
        applyHighContrastDOM(true);
      }

      const ttsStored = localStorage.getItem(LOCAL_TTS);
      if (ttsStored === 'true') {
        setTextToSpeechState(true);
      }

      const linkHighlightStored = localStorage.getItem(LOCAL_LINK_HIGHLIGHT);
      if (linkHighlightStored === 'true') {
        setLinkHighlightState(true);
        applyLinkHighlightDOM(true);
      }

      const spacingStored = localStorage.getItem(LOCAL_SPACING) as 'normal' | 'medium' | 'wide' | null;
      if (spacingStored) {
        setSpacingState(spacingStored);
        applySpacingDOM(spacingStored);
      }

      // NEW: Load font family
      const fontFamilyStored = localStorage.getItem(LOCAL_FONT_FAMILY) as FontFamily | null;
      if (fontFamilyStored) {
        setFontFamilyState(fontFamilyStored);
        applyFontFamilyDOM(fontFamilyStored);
      }

      // NEW: Load custom colors
      const customColorsStored = localStorage.getItem(LOCAL_CUSTOM_COLORS);
      if (customColorsStored) {
        const colors = JSON.parse(customColorsStored);
        setCustomColorsState(colors);
      }

      const customColorsEnabledStored = localStorage.getItem(LOCAL_CUSTOM_COLORS_ENABLED);
      if (customColorsEnabledStored === 'true') {
        setCustomColorsEnabledState(true);
        const colors = customColorsStored ? JSON.parse(customColorsStored) : customColors;
        applyCustomColorsDOM(colors, true);
      }

      // NEW: Load letter spacing
      const letterSpacingStored = localStorage.getItem(LOCAL_LETTER_SPACING) as 'normal' | 'wide' | 'wider' | null;
      if (letterSpacingStored) {
        setLetterSpacingState(letterSpacingStored);
        applyLetterSpacingDOM(letterSpacingStored);
      }

      // NEW: Load line height
      const lineHeightStored = localStorage.getItem(LOCAL_LINE_HEIGHT) as 'normal' | 'relaxed' | 'loose' | null;
      if (lineHeightStored) {
        setLineHeightState(lineHeightStored);
        applyLineHeightDOM(lineHeightStored);
      }

      // NEW: Load custom shortcuts
      const shortcutsStored = localStorage.getItem(LOCAL_CUSTOM_SHORTCUTS);
      if (shortcutsStored) {
        setCustomShortcutsState(JSON.parse(shortcutsStored));
      }

      // NEW: Load voice control
      const voiceControlStored = localStorage.getItem(LOCAL_VOICE_CONTROL);
      if (voiceControlStored === 'true') {
        setVoiceControlState(true);
      }
    } catch (error) {
      console.warn("Could not read accessibility profile from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    const handle = async () => {
      if (!user) return;
      try {
        const serverPerfil = await cargarPerfil(false);
        const local = localStorage.getItem(LOCAL_KEY) as PerfilAccesibilidad | null;

        if (!local && serverPerfil) {
          await cargarPerfil(true);
        }
      } catch (e) {
        console.error("Error during initial perfil sync on login:", e);
      }
    };

    handle();
  }, [user]);

  const cargarPerfil = async (apply: boolean = true): Promise<PerfilAccesibilidad | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("perfil_accesibilidad")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      const perfilDb = (data?.perfil_accesibilidad as PerfilAccesibilidad) ?? 'ninguna';

      if (apply) {
        setPerfil(perfilDb);
        aplicarPerfilDOM(perfilDb);
        try { localStorage.setItem(LOCAL_KEY, perfilDb); } catch {}
      }

      return perfilDb;
    } catch (error) {
      console.error("Error loading accessibility profile:", error);
      return null;
    }
  };

  const aplicarPerfil = async (perfilArg?: PerfilAccesibilidad) => {
    const perfilParaAplicar = perfilArg ?? perfil;

    setPerfil(perfilParaAplicar);
    aplicarPerfilDOM(perfilParaAplicar);

    try {
      localStorage.setItem(LOCAL_KEY, perfilParaAplicar);
    } catch (error) {
      console.warn("Could not save accessibility profile to localStorage:", error);
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ perfil_accesibilidad: perfilParaAplicar })
        .eq("id", user.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error saving accessibility profile:", error);
    }
  };

  const applyThemeDOM = (isDark: boolean) => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
  };

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    try { localStorage.setItem(LOCAL_THEME, next ? 'dark' : 'light'); } catch {}
    applyThemeDOM(next);
  };

  const aplicarPerfilDOM = (perfilActual: PerfilAccesibilidad) => {
    const root = document.documentElement;
    
    root.classList.remove('perfil-visual', 'perfil-auditiva', 'perfil-motriz', 'perfil-cognitiva');
    
    if (perfilActual !== 'ninguna') {
      root.classList.add(`perfil-${perfilActual}`);
    }

    switch (perfilActual) {
      case 'visual':
        root.style.setProperty('--font-size-base', '1.125rem');
        root.style.setProperty('--contrast-boost', '1.2');
        break;
      case 'auditiva':
        root.style.setProperty('--animation-duration', '0.6s');
        root.style.setProperty('--prefers-visual-alerts', '1');
        root.style.setProperty('--prefers-reduced-motion', '1');
        break;
      case 'motriz':
        root.style.setProperty('--target-size-min', '48px');
        root.style.setProperty('--spacing-interactive', '1rem');
        break;
      case 'cognitiva':
        root.style.setProperty('--content-max-width', '65ch');
        root.style.setProperty('--line-height', '1.8');
        break;
      default:
        root.style.removeProperty('--font-size-base');
        root.style.removeProperty('--contrast-boost');
        root.style.removeProperty('--animation-duration');
        root.style.removeProperty('--target-size-min');
        root.style.removeProperty('--spacing-interactive');
        root.style.removeProperty('--content-max-width');
        root.style.removeProperty('--line-height');
        root.style.removeProperty('--prefers-visual-alerts');
        root.style.removeProperty('--prefers-reduced-motion');
    }
  };

  return (
    <AccessibilityContext.Provider value={{ 
      perfil, 
      setPerfil, 
      aplicarPerfil, 
      cargarPerfil, 
      dark, 
      toggleDark,
      fontSize,
      setFontSize,
      highContrast,
      setHighContrast,
      textToSpeech,
      setTextToSpeech,
      linkHighlight,
      setLinkHighlight,
      spacing,
      setSpacing,
      fontFamily,
      setFontFamily,
      customColors,
      setCustomColors,
      customColorsEnabled,
      setCustomColorsEnabled,
      letterSpacing,
      setLetterSpacing,
      lineHeight,
      setLineHeight,
      customShortcuts,
      setCustomShortcuts,
      voiceControl,
      setVoiceControl,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};