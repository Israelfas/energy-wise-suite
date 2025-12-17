import { useState } from "react";
import { 
  Home, 
  LayoutDashboard, 
  Shield, 
  FileText, 
  Scale, 
  Mail, 
  Settings,
  ChevronDown,
  Zap,
  User
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

  // WCAG: Clear visual indication of active state
  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium w-full",
      "min-h-[44px] transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      isActive 
        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
        : "text-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
    );

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col">
      {/* Header with logo */}
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Zap className="h-5 w-5" aria-hidden="true" />
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
        <div className="mb-6">
          <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Navegación Principal
          </h2>
          <nav className="space-y-1">
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
                className="w-full justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                aria-expanded={infoOpen}
              >
                <span>Información</span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    infoOpen && "rotate-180"
                  )} 
                  aria-hidden="true"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <nav className="space-y-1 mt-2">
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
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>© 2024 EcoSense</span>
        </div>
      </div>
    </aside>
  );
}