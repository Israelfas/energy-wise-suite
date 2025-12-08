import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type PerfilAccesibilidad = "visual" | "auditiva" | "motriz" | "cognitiva" | "ninguna";

interface AccessibilityContextType {
  perfil: PerfilAccesibilidad;
  setPerfil: (perfil: PerfilAccesibilidad) => void;
  aplicarPerfil: (perfil?: PerfilAccesibilidad) => void;
  cargarPerfil: (apply?: boolean) => Promise<PerfilAccesibilidad | null>;
  dark: boolean;
  toggleDark: () => void;
  // New accessibility features
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
  const { user } = useAuth();

  const LOCAL_KEY = "accessibility_perfil";
  const LOCAL_THEME = "theme_pref";
  const LOCAL_FONT_SIZE = "accessibility_font_size";
  const LOCAL_HIGH_CONTRAST = "accessibility_high_contrast";
  const LOCAL_TTS = "accessibility_tts";
  const LOCAL_LINK_HIGHLIGHT = "accessibility_link_highlight";
  const LOCAL_SPACING = "accessibility_spacing";

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
    
    // Cancel any ongoing speech when disabled
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

  // On mount, load profile from localStorage if present (for unauthenticated users)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (stored) {
        const parsed = stored as PerfilAccesibilidad;
        setPerfil(parsed);
        aplicarPerfilDOM(parsed);
      }
      
      // Load theme preference (dark/light) -- fall back to system preference
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

      // Load font size
      const fontSizeStored = localStorage.getItem(LOCAL_FONT_SIZE);
      if (fontSizeStored) {
        const size = parseInt(fontSizeStored, 10);
        setFontSizeState(size);
        applyFontSizeDOM(size);
      }

      // Load high contrast
      const highContrastStored = localStorage.getItem(LOCAL_HIGH_CONTRAST);
      if (highContrastStored === 'true') {
        setHighContrastState(true);
        applyHighContrastDOM(true);
      }

      // Load TTS
      const ttsStored = localStorage.getItem(LOCAL_TTS);
      if (ttsStored === 'true') {
        setTextToSpeechState(true);
      }

      // Load link highlight
      const linkHighlightStored = localStorage.getItem(LOCAL_LINK_HIGHLIGHT);
      if (linkHighlightStored === 'true') {
        setLinkHighlightState(true);
        applyLinkHighlightDOM(true);
      }

      // Load spacing
      const spacingStored = localStorage.getItem(LOCAL_SPACING) as 'normal' | 'medium' | 'wide' | null;
      if (spacingStored) {
        setSpacingState(spacingStored);
        applySpacingDOM(spacingStored);
      }
    } catch (error) {
      console.warn("Could not read accessibility profile from localStorage:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When a user logs in, fetch their server profile but don't auto-apply if
    // the visitor already has a local preference. We will let the UI prompt
    // the user to choose which to keep.
    const handle = async () => {
      if (!user) return;
      try {
        const serverPerfil = await cargarPerfil(false);

        const local = localStorage.getItem(LOCAL_KEY) as PerfilAccesibilidad | null;

        // If there's no local preference, apply server profile immediately
        if (!local && serverPerfil) {
          await cargarPerfil(true);
        }
        // If there is a local preference and it differs from server, do not override here;
        // Header will show a banner to let the user choose.
      } catch (e) {
        console.error("Error during initial perfil sync on login:", e);
      }
    };

    handle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Update local state immediately so UI reflects change
    setPerfil(perfilParaAplicar);

    // Always apply to DOM so changes are immediate even without auth
    aplicarPerfilDOM(perfilParaAplicar);

    // Persist locally always
    try {
      localStorage.setItem(LOCAL_KEY, perfilParaAplicar);
    } catch (error) {
      console.warn("Could not save accessibility profile to localStorage:", error);
    }

    // If user is logged in, persist to supabase as well and also keep localStorage in sync
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
    
    // Remove previous classes
    root.classList.remove('perfil-visual', 'perfil-auditiva', 'perfil-motriz', 'perfil-cognitiva');
    
    // Apply new profile
    if (perfilActual !== 'ninguna') {
      root.classList.add(`perfil-${perfilActual}`);
    }

    // Apply specific styles based on profile
    switch (perfilActual) {
      case 'visual':
        root.style.setProperty('--font-size-base', '1.125rem');
        root.style.setProperty('--contrast-boost', '1.2');
        break;
      case 'auditiva':
        root.style.setProperty('--animation-duration', '0.6s');
        // Indicate components should prefer visual alerts over audio
        root.style.setProperty('--prefers-visual-alerts', '1');
        // Suggest reduced-motion preference for audio-impaired users
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
