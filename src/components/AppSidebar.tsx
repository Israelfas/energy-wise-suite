import { useState } from "react";
import { 
  LayoutDashboard, 
  Shield, 
  FileText, 
  Scale, 
  Mail, 
  ChevronDown,
  Zap,
  User,
  Info
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const mainItems = [
  { 
    title: "Dashboard", 
    url: "/dashboard", 
    icon: LayoutDashboard, 
    requireAuth: true,
    description: "Panel de control de consumo"
  },
  { 
    title: "Perfil", 
    url: "/profile", 
    icon: User, 
    requireAuth: true,
    description: "Tu perfil de usuario"
  },
];

const infoItems = [
  { 
    title: "Privacidad", 
    url: "/privacy", 
    icon: FileText,
    description: "Política de privacidad"
  },
  { 
    title: "Términos", 
    url: "/terms", 
    icon: Scale,
    description: "Términos de uso"
  },
  { 
    title: "Contacto", 
    url: "/contact", 
    icon: Mail,
    description: "Contáctanos"
  },
];

export function AppSidebar() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [infoOpen, setInfoOpen] = useState(true);

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium w-full",
      "min-h-[48px] transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "group relative overflow-hidden",
      isActive 
        ? "bg-primary text-primary-foreground shadow-md" 
        : "text-foreground hover:bg-muted hover:shadow-sm"
    );

  return (
    <aside className="w-64 border-r border-border bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header with logo */}
      <div className="border-b border-border px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <Zap className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight">
              EcoSense
            </span>
            <span className="text-xs text-muted-foreground">
              Consumo Energético
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        {/* Main Navigation */}
        <div className="mb-4">
          <h2 className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Navegación
          </h2>
          <nav className="space-y-1.5">
            {mainItems.map((item) => {
              if (item.requireAuth && !user) return null;
              const isActive = location.pathname === item.url;
              
              return (
                <NavLink
                  key={item.title}
                  to={item.url}
                  end
                  className={getNavClassName({ isActive })}
                  aria-label={item.description}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.title}</span>
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary-foreground/10 rounded-xl" />
                  )}
                </NavLink>
              );
            })}
            
            {/* Admin link */}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={getNavClassName({ isActive: location.pathname === "/admin" })}
                aria-label="Panel de administración"
              >
                <Shield className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Administración</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* Information Section */}
        <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
          <div className="mb-2">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-lg"
                aria-expanded={infoOpen}
              >
                <span className="flex items-center gap-2">
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  Información
                </span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    infoOpen && "rotate-180"
                  )} 
                  aria-hidden="true"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-accordion-down">
              <nav className="space-y-1.5 mt-2">
                {infoItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      className={getNavClassName({ isActive })}
                      aria-label={item.description}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 px-2 text-[10px] text-muted-foreground">
          <span>© 2024 EcoSense</span>
        </div>
      </div>
    </aside>
  );
}
