import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, ChevronRight, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
// SidebarTrigger removed per UX request
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import useNotify from "@/hooks/useNotify";
import { useAuth } from "@/hooks/useAuth";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import { useMetrics } from "@/hooks/useMetrics";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Breadcrumb configuration
const routeNames: Record<string, string> = {
  "/": "Inicio",
  "/dashboard": "Dashboard",
  "/profile": "Perfil",
  "/admin": "Administración",
  "/privacy": "Privacidad",
  "/terms": "Términos",
  "/contact": "Contacto",
  "/auth": "Autenticación",
};

export const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { trackClick } = useMetrics("header");
  const { perfil, aplicarPerfil, cargarPerfil } = useAccessibility();
  const { notify } = useNotify();
  const location = useLocation();
  const [localPerfil, setLocalPerfil] = useState<string | null>(null);
  const [showSyncBanner, setShowSyncBanner] = useState(false);
  const [notifications] = useState([
    { id: 1, title: "Consumo reducido", message: "Has reducido tu consumo un 15% esta semana", unread: true },
    { id: 2, title: "Nuevo dispositivo", message: "Se detectó un nuevo dispositivo en tu red", unread: true },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const local = localStorage.getItem("accessibility_perfil");
    setLocalPerfil(local);
    setShowSyncBanner(!!(user && local && local !== perfil));
  }, [user, perfil]);

  const navigate = useNavigate();

  const handleSignOut = async () => {
    trackClick("logout_button");
    try {
      await signOut();
    } finally {
      navigate("/auth");
    }
  };

  // Generate breadcrumb items
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === "/") return [{ label: "Inicio", href: "/" }];
    
    return [
      { label: "Inicio", href: "/" },
      { label: routeNames[path] || path.slice(1), href: path }
    ];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      {/* Sync Dialog */}
      <Dialog open={showSyncBanner} onOpenChange={setShowSyncBanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preferencia local detectada</DialogTitle>
            <DialogDescription>
              Se encontró una preferencia de accesibilidad guardada localmente que difiere de la configurada en tu cuenta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 w-full">
              <Button
                className="flex-1"
                onClick={() => {
                  if (localPerfil) {
                    aplicarPerfil(localPerfil as any);
                    notify({ title: "Preferencia sincronizada", description: "Se aplicó y sincronizó tu preferencia local." });
                  }
                  setShowSyncBanner(false);
                }}
              >
                Usar local
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  await cargarPerfil(true);
                  notify({ title: "Preferencia de cuenta aplicada", description: "Se aplicó la preferencia almacenada en tu cuenta." });
                  setShowSyncBanner(false);
                }}
              >
                Usar cuenta
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Header */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
        {/* Left Section: Sidebar trigger + Breadcrumb */}
        <div className="flex items-center gap-4 flex-1">
          <Separator orientation="vertical" className="h-6 hidden md:block" />
          
          {/* Breadcrumb Navigation - WCAG 2.4.8 */}
          <nav 
            aria-label="Navegación de migas de pan" 
            className="hidden md:flex items-center gap-1 text-sm"
          >
            {breadcrumbs.map((item, index) => (
              <div key={item.href} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span 
                    className="font-medium text-foreground"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link 
                    to={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded px-1"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-2">
          {/* Accessibility Profile Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-xs font-medium">
            <span className="text-muted-foreground">Perfil:</span>
            <span className="capitalize text-foreground">
              {perfil === 'ninguna' ? 'Estándar' : perfil}
            </span>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10"
                aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notif) => (
                <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-sm">{notif.title}</span>
                    {notif.unread && (
                      <span className="h-2 w-2 rounded-full bg-primary ml-auto" aria-label="Sin leer" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{notif.message}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center text-primary cursor-pointer">
                Ver todas las notificaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Menú de usuario"
                >
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage src="" alt="" />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user?.email ? user.email.split("@")[0].slice(0, 2).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Mi cuenta</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    to="/profile" 
                    onClick={() => trackClick('profile_link')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    Mi perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link 
                    to="/dashboard" 
                    onClick={() => trackClick('dashboard_link')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link 
                        to="/admin" 
                        onClick={() => trackClick('admin_link')}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="h-4 w-4" />
                        Administración
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild onClick={() => trackClick("login_link")} className="min-h-[40px]">
              <Link to="/auth">Iniciar Sesión</Link>
            </Button>
          )}
        </div>
      </header>
    </>
  );
};
