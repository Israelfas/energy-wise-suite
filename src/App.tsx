import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { Leaf } from "lucide-react";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AccessibilityFeatures } from "@/components/AccessibilityFeatures";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AccessibilityProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {/* IMPORTANTE: AccessibilityFeatures debe estar DENTRO de BrowserRouter */}
            <AccessibilityFeatures />
            <AppRouter />
          </BrowserRouter>
        </AccessibilityProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

function AppRouter() {
  const location = useLocation();
  const hideLayout = location.pathname === "/auth" || location.pathname.startsWith("/auth?");
  const hideSidebarOnHome = location.pathname === "/";

  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  if (hideLayout) {
    return (
      <main id="main-content" className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
        <div className="w-full max-w-md space-y-6">{routes}</div>
      </main>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {!hideSidebarOnHome && <AppSidebar />}
        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <Link to="/" className="-ml-1 inline-flex items-center">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
              <div className="flex-1" />
              <Header />
            </div>
          </header>
          <main id="main-content" className="flex-1 px-4 py-6 md:px-6">{routes}</main>
          <Footer />
          <AccessibilityMenu />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default App;