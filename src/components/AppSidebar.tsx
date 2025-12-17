import { useState } from "react";
import { 
  Home, 
  LayoutDashboard, 
  Shield, 
  FileText, 
  Scale, 
  Mail, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [isCollapsed, setIsCollapsed] = useState(false);

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

  const CollapsedNavItem = ({ item, isActive }: { item: typeof mainItems[0], isActive: boolean }) => (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <NavLink
          to={item.url}
          end
          className={cn(
            "flex items-center justify-center rounded-xl p-3",
            "min-h-[48px] min-w-[48px] transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isActive 
              ? "bg-primary text-primary-foreground shadow-md" 
              : "text-foreground hover:bg-muted"
          )}
          aria-label={item.description}
          aria-current={isActive ? "page" : undefined}
        >
          <item.icon className="h-5 w-5" aria-hidden="true" />
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {item.title}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <aside 
      className={cn(
        "border-r border-border bg-background/95 backdrop-blur-sm flex flex-col transition-all duration-300 ease-out",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header with logo */}
      <div className="border-b border-border px-3 py-4">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-3 transition-all duration-300", isCollapsed && "justify-center w-full")}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
              <Zap className="h-6 w-6" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-fade-in">
                <span className="font-bold text-lg tracking-tight">
                  EcoSense
                </span>
                <span className="text-xs text-muted-foreground">
                  Consumo Energético
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full h-9 rounded-lg transition-all duration-200",
            "hover:bg-muted",
            isCollapsed ? "justify-center" : "justify-between"
          )}
          aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
        >
          {!isCollapsed && <span className="text-xs text-muted-foreground">Contraer</span>}
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 px-3 py-2 overflow-y-auto">
        {/* Main Navigation */}
        <div className="mb-4">
          {!isCollapsed && (
            <h2 className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Navegación
            </h2>
          )}
          <nav className="space-y-1.5">
            {mainItems.map((item) => {
              if (item.requireAuth && !user) return null;
              const isActive = location.pathname === item.url;
              
              if (isCollapsed) {
                return <CollapsedNavItem key={item.title} item={item} isActive={isActive} />;
              }
              
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
              isCollapsed ? (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to="/admin"
                      className={cn(
                        "flex items-center justify-center rounded-xl p-3",
                        "min-h-[48px] min-w-[48px] transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        location.pathname === "/admin"
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "text-foreground hover:bg-muted"
                      )}
                      aria-label="Panel de administración"
                    >
                      <Shield className="h-5 w-5" aria-hidden="true" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    Administración
                  </TooltipContent>
                </Tooltip>
              ) : (
                <NavLink
                  to="/admin"
                  className={getNavClassName({ isActive: location.pathname === "/admin" })}
                  aria-label="Panel de administración"
                >
                  <Shield className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>Administración</span>
                </NavLink>
              )
            )}
          </nav>
        </div>

        {/* Information Section */}
        {isCollapsed ? (
          <div className="space-y-1.5">
            {infoItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Tooltip key={item.title} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center justify-center rounded-xl p-3",
                        "min-h-[48px] min-w-[48px] transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md" 
                          : "text-foreground hover:bg-muted"
                      )}
                      aria-label={item.description}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ) : (
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
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <div className={cn(
          "flex items-center text-[10px] text-muted-foreground",
          isCollapsed ? "justify-center" : "gap-2 px-2"
        )}>
          {isCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="cursor-default">©</span>
              </TooltipTrigger>
              <TooltipContent side="right">
                © 2024 EcoSense
              </TooltipContent>
            </Tooltip>
          ) : (
            <span>© 2024 EcoSense</span>
          )}
        </div>
      </div>
    </aside>
  );
}
