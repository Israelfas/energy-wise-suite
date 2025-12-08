import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { 
  Accessibility, 
  Eye, 
  Ear, 
  Hand, 
  Brain, 
  Check, 
  Sun, 
  Moon,
  Type,
  Contrast,
  Volume2,
  Link2,
  Space,
} from "lucide-react";
import { useMetrics } from "@/hooks/useMetrics";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const perfiles = [
  {
    value: "ninguna",
    label: "Estándar",
    description: "Interfaz estándar sin ajustes especiales",
    icon: Accessibility,
  },
  {
    value: "visual",
    label: "Discapacidad Visual",
    description: "Texto grande, alto contraste, compatibilidad con lectores de pantalla",
    icon: Eye,
  },
  {
    value: "auditiva",
    label: "Discapacidad Auditiva",
    description: "Alertas visuales reforzadas, sin dependencia de audio",
    icon: Ear,
  },
  {
    value: "motriz",
    label: "Discapacidad Motriz",
    description: "Áreas de clic más grandes, navegación por teclado mejorada",
    icon: Hand,
  },
  {
    value: "cognitiva",
    label: "Discapacidad Cognitiva",
    description: "Contenido simplificado, instrucciones claras, menos distracciones",
    icon: Brain,
  },
];

const spacingOptions = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Medio' },
  { value: 'wide', label: 'Amplio' },
];

export const AccessibilityMenu = () => {
  const { 
    perfil, 
    setPerfil, 
    aplicarPerfil, 
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
  } = useAccessibility();
  const { trackClick } = useMetrics('accessibility');
  const [open, setOpen] = useState(false);
  const [tempPerfil, setTempPerfil] = useState(perfil);

  // Keep the temporary selection in sync with the context perfil
  // so when the profile is loaded from Supabase the UI reflects it.
  // sync when perfil changes (e.g., after login and cargarPerfil runs)
  useEffect(() => {
    setTempPerfil(perfil);
  }, [perfil]);

  const handleApply = () => {
    aplicarPerfil(tempPerfil as any);
    setPerfil(tempPerfil as any);
    setOpen(false);
    toast.success("Perfil de accesibilidad aplicado correctamente");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Abrir menú de accesibilidad"
        >
          <Accessibility className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Accesibilidad</SheetTitle>
          <SheetDescription>
            Personaliza la interfaz según tus necesidades. Cumple con WCAG 2.2 nivel AA.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Tema de color
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { 
                toggleDark(); 
                trackClick('toggle_theme'); 
                toast.success(`Tema ${dark ? 'claro' : 'oscuro'} activado`); 
              }}
              aria-pressed={dark}
              className="min-h-[40px]"
            >
              {dark ? 'Claro' : 'Oscuro'}
            </Button>
          </div>

          <Separator />

          {/* Accessibility Profiles */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Perfiles de accesibilidad</Label>
            <RadioGroup value={tempPerfil} onValueChange={(value) => setTempPerfil(value as any)}>
              <div className="space-y-3">
                {perfiles.map((perfilItem) => {
                  const Icon = perfilItem.icon;
                  return (
                    <div
                      key={perfilItem.value}
                      className={`relative flex items-start space-x-3 rounded-lg border p-4 transition-all hover:border-primary cursor-pointer ${
                        tempPerfil === perfilItem.value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <RadioGroupItem
                        value={perfilItem.value}
                        id={perfilItem.value}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={perfilItem.value}
                          className="flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                          {perfilItem.label}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {perfilItem.description}
                        </p>
                      </div>
                      {tempPerfil === perfilItem.value && (
                        <Check className="h-5 w-5 text-primary mt-1" aria-hidden="true" />
                      )}
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Font Size */}
          <div className="space-y-4 rounded-lg border p-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Type className="h-4 w-4" aria-hidden="true" />
              Tamaño de fuente: {fontSize}px
            </Label>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">A</span>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => {
                  setFontSize(value[0]);
                  trackClick('font_size_change');
                }}
                min={12}
                max={24}
                step={1}
                className="flex-1"
                aria-label="Ajustar tamaño de fuente"
              />
              <span className="text-lg font-bold">A</span>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="space-y-3">
            {/* High Contrast */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label 
                htmlFor="high-contrast-sheet" 
                className="text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <Contrast className="h-4 w-4" aria-hidden="true" />
                Alto contraste
              </Label>
              <Switch
                id="high-contrast-sheet"
                checked={highContrast}
                onCheckedChange={(value) => {
                  setHighContrast(value);
                  trackClick('contrast_toggle');
                  toast.success(value ? "Alto contraste activado" : "Contraste normal activado");
                }}
                aria-label="Activar alto contraste"
              />
            </div>

            {/* Text to Speech */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label 
                htmlFor="tts-sheet" 
                className="text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                Lectura de voz
              </Label>
              <Switch
                id="tts-sheet"
                checked={textToSpeech}
                onCheckedChange={(value) => {
                  setTextToSpeech(value);
                  trackClick('tts_toggle');
                  toast.success(value ? "Lectura de voz activada" : "Lectura de voz desactivada");
                }}
                aria-label="Activar lectura de voz"
              />
            </div>

            {/* Link Highlight */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label 
                htmlFor="link-highlight-sheet" 
                className="text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <Link2 className="h-4 w-4" aria-hidden="true" />
                Resaltar enlaces
              </Label>
              <Switch
                id="link-highlight-sheet"
                checked={linkHighlight}
                onCheckedChange={(value) => {
                  setLinkHighlight(value);
                  trackClick('link_highlight_toggle');
                  toast.success(value ? "Enlaces resaltados" : "Resaltado de enlaces desactivado");
                }}
                aria-label="Resaltar enlaces"
              />
            </div>
          </div>

          {/* Spacing */}
          <div className="space-y-4 rounded-lg border p-4">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Space className="h-4 w-4" aria-hidden="true" />
              Espaciado de elementos
            </Label>
            <div className="flex gap-2">
              {spacingOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={spacing === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSpacing(option.value as 'normal' | 'medium' | 'wide');
                    trackClick(`spacing_${option.value}`);
                    toast.success(`Espaciado ${option.label.toLowerCase()} aplicado`);
                  }}
                  className="flex-1 min-h-[40px]"
                  aria-pressed={spacing === option.value}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex gap-3 pt-4">
            <Button onClick={handleApply} className="flex-1 min-h-[44px]">
              Aplicar Cambios
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTempPerfil(perfil);
                setOpen(false);
              }}
              className="min-h-[44px]"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
