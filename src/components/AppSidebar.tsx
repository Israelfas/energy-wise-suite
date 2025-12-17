import { useState } from "react";
import {
  LayoutDashboard,
  Shield,
  FileText,
  Scale,
  Mail,
  Settings,
  Zap,
  User,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";

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
  const [infoOpen] = useState(true);

  return (
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight">EcoSense</span>
              <span className="text-xs text-muted-foreground">Consumo Energético</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <div className="px-2 py-3">
            <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Navegación Principal
            </h2>

            <SidebarMenu>
              {mainItems.map((item) => {
                if (item.requireAuth && !user) return null;
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink to={item.url} end aria-label={item.description}>
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === "/admin"} tooltip="Administración">
                    <NavLink to="/admin" aria-label="Panel de administración">
                      <Shield className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span>Administración</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </div>

          <div className="mt-4 px-2">
            <SidebarSeparator />
            <div className="mt-2">
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Información</h3>
              <SidebarMenu>
                {infoItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url} tooltip={item.title}>
                      <NavLink to={item.url} aria-label={item.description}>
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </div>
          </div>
        </SidebarContent>

        <SidebarFooter>
          <div className="p-2 text-xs text-muted-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>© 2024 EcoSense</span>
          </div>
        </SidebarFooter>
      </Sidebar>
  );
}