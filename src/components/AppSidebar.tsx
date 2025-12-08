import { useState } from "react";
import { 
  Home, 
  LayoutDashboard, 
  Shield, 
  FileText, 
  Scale, 
  Mail, 
  Accessibility,
  Settings,
  ChevronDown,
  Zap,
  User
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AccessibilitySidebarMenu } from "./AccessibilitySidebarMenu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mainItems = [
  { 
    title: "Inicio", 
    url: "/", 
    icon: Home,
    description: "Página principal"
  },
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [infoOpen, setInfoOpen] = useState(true);

  // WCAG: Clear visual indication of active state
  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      // Base styles with proper touch targets (min 44px for WCAG 2.2)
      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
      "min-h-[44px] transition-all duration-200 ease-out",
      // Focus styles for keyboard navigation (WCAG 2.4.7)
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2",
      isActive 
        ? "bg-primary text-primary-foreground shadow-sm" 
        : "text-foreground hover:bg-accent hover:text-accent-foreground"
    );

  const renderMenuItem = (item: typeof mainItems[0], showTooltip = false) => {
    const content = (
      <NavLink 
        to={item.url} 
        end 
        className={getNavClassName}
        aria-label={item.description}
        aria-current={location.pathname === item.url ? "page" : undefined}
      >
        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className={cn(
          "truncate transition-opacity duration-200",
          isCollapsed && "opacity-0 w-0"
        )}>
          {item.title}
        </span>
      </NavLink>
    );

    if (isCollapsed && showTooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r border-sidebar-border"
    >
      {/* Header with logo - WCAG: Proper heading structure */}
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Zap className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className={cn(
            "flex flex-col transition-opacity duration-200",
            isCollapsed && "opacity-0 w-0 overflow-hidden"
          )}>
            <span className="font-bold text-lg tracking-tight text-sidebar-foreground">
              EcoSense
            </span>
            <span className="text-xs text-muted-foreground">
              Consumo Energético
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2",
            isCollapsed && "sr-only"
          )}>
            Navegación Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => {
                if (item.requireAuth && !user) return null;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="p-0">
                      {renderMenuItem(item, true)}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              
              {/* Admin link with special styling */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="p-0">
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink 
                            to="/admin" 
                            className={getNavClassName}
                            aria-label="Panel de administración"
                          >
                            <Shield className="h-5 w-5 shrink-0" aria-hidden="true" />
                            <span className="opacity-0 w-0">Admin</span>
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          Administración
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <NavLink 
                        to="/admin" 
                        className={getNavClassName}
                        aria-label="Panel de administración"
                      >
                        <Shield className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span>Administración</span>
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Accessibility Menu integrated into sidebar */}
        <AccessibilitySidebarMenu isCollapsed={isCollapsed} />

        {/* Information Group with Collapsible */}
        <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isCollapsed && "justify-center"
                )}
                aria-expanded={infoOpen}
                aria-label={infoOpen ? "Contraer sección de información" : "Expandir sección de información"}
              >
                {!isCollapsed && <span>Información</span>}
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
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 mt-2">
                  {infoItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="p-0">
                        {renderMenuItem(item, true)}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      {/* Footer with copyright */}
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground",
          isCollapsed && "justify-center"
        )}>
          <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className={cn(
            "transition-opacity duration-200",
            isCollapsed && "opacity-0 w-0 sr-only"
          )}>
            © 2024 EcoSense
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
