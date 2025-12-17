import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMetrics } from "@/hooks/useMetrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Leaf, ArrowLeft, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const passwordRulesRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/;

const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").refine((p) => passwordRulesRegex.test(p), {
    message: "La contraseña debe incluir mayúsculas, minúsculas, números y un carácter especial",
  }),
  confirmPassword: z.string(),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'Debes aceptar los términos y la política de privacidad' }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const resetSchema = z.object({
  email: z.string().email("Email inválido").max(255),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp, resetPassword } = useAuth();
  const { trackClick, trackMetric } = useMetrics("auth");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [registerData, setRegisterData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    lower: false,
    upper: false,
    number: false,
    special: false,
  });
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginStart, setLoginStart] = useState<number | null>(null);
  const [registerStart, setRegisterStart] = useState<number | null>(null);

  // Lockout policy: after this many failed attempts, block for LOCK_DURATION_MS
  const LOCK_THRESHOLD = 3;
  const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockTick, setLockTick] = useState(0);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => setLockTick((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // Redirect if already logged in
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    trackClick("login_submit");

    const attemptKey = `login_attempts_${loginData.email.toLowerCase()}`;
    // check lockout
    try {
      const raw = localStorage.getItem(attemptKey);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj.lockedUntil && new Date(obj.lockedUntil).getTime() > Date.now()) {
          setLockedUntil(new Date(obj.lockedUntil).getTime());
          trackMetric({ accion: 'login_locked', metadata: { email: loginData.email } });
          toast.error('Cuenta temporalmente bloqueada por múltiples intentos. Intenta más tarde.');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read login attempts', e);
    }

    // validate inputs
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path && err.path[0]) errs[String(err.path[0])] = err.message;
      });
      setLoginErrors(errs);
      if (!loginStart) setLoginStart(Date.now());
      const firstKey = Object.keys(errs)[0];
      const el = document.getElementById(`login-${firstKey}`) as HTMLElement | null;
      el?.focus();
      return;
    }

    setLoginErrors({});
    setLoading(true);
    if (!loginStart) setLoginStart(Date.now());
    try {
      const { error } = await signIn(loginData.email, loginData.password);
      if (error) {
        // failed attempt -> increment
        try {
          const raw = localStorage.getItem(attemptKey);
          const now = Date.now();
          let obj = raw ? JSON.parse(raw) : { count: 0, firstAttempt: now };
          obj.count = (obj.count || 0) + 1;
          if (obj.count >= LOCK_THRESHOLD) {
            obj.lockedUntil = new Date(now + LOCK_DURATION_MS).toISOString();
            setLockedUntil(new Date(obj.lockedUntil).getTime());
            trackMetric({ accion: 'login_locked', metadata: { email: loginData.email } });
          }
          localStorage.setItem(attemptKey, JSON.stringify(obj));
        } catch (e) {
          console.warn('Could not persist login attempts', e);
        }

        trackMetric({ accion: 'login_failed', metadata: { email: loginData.email } });
        toast.error(error.message || 'Credenciales incorrectas');
        return;
      }

      // success
      try { localStorage.removeItem(attemptKey); } catch {}
      if (loginStart) {
        const seconds = Math.floor((Date.now() - loginStart) / 1000);
        trackMetric({ accion: 'login_duration', metadata: { seconds } });
      }
  // track login success (include rememberMe flag)
  trackMetric({ accion: 'login_success', metadata: { email: loginData.email, remember: !!rememberMe, timestamp: new Date().toISOString() } });
      try { localStorage.setItem("rememberMe", JSON.stringify(rememberMe)); } catch {}
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    trackClick("register_submit");
    // run zod schema first
    const result = registerSchema.safeParse(registerData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path && err.path[0]) errs[String(err.path[0])] = err.message;
      });
      setRegisterErrors(errs);
      const firstKey = Object.keys(errs)[0];
      const el = document.getElementById(`register-${firstKey}`) as HTMLElement | null;
      el?.focus();
      return;
    }

    // additional safety: ensure password meets checks (should be redundant with zod but gives UX safety)
    const pw = registerData.password || "";
    const checks = {
      length: pw.length >= 8,
      lower: /[a-z]/.test(pw),
      upper: /[A-Z]/.test(pw),
      number: /\d/.test(pw),
      special: /[^A-Za-z0-9]/.test(pw),
    };
    const allOk = Object.values(checks).every(Boolean);
    if (!allOk) {
      setPasswordChecks(checks);
      setRegisterErrors({ password: 'La contraseña no cumple los requisitos de seguridad' });
      const el = document.getElementById('register-password') as HTMLElement | null;
      el?.focus();
      return;
    }

    setRegisterErrors({});
    setLoading(true);
    try {
      const { error } = await signUp(
        registerData.email,
        registerData.password,
        registerData.nombre
      );
      if (!error) {
        // track registration duration
        if (registerStart) {
          const seconds = Math.floor((Date.now() - registerStart) / 1000);
          trackMetric({ accion: 'register_duration', metadata: { seconds } });
        }
  // track registration success (include terms acceptance)
  trackMetric({ accion: 'register_success', metadata: { email: registerData.email, acceptedTerms: !!registerData.acceptedTerms, timestamp: new Date().toISOString() } });
  setRegisterData({ nombre: "", email: "", password: "", confirmPassword: "", acceptedTerms: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    trackClick("reset_submit");
    const result = resetSchema.safeParse({ email: resetEmail });
    if (!result.success) {
      setResetError(result.error.errors[0].message);
      const el = document.getElementById(`reset-email`) as HTMLElement | null;
      el?.focus();
      return;
    }

    setResetError(null);
    setLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 font-bold text-2xl hover:opacity-80 transition-opacity"
          >
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              EcoSense
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión o crea una cuenta para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      onFocus={() => { if (!loginStart) { setLoginStart(Date.now()); trackMetric({ accion: 'login_started', metadata: { timestamp: new Date().toISOString() } }); } }}
                      required
                      aria-invalid={!!loginErrors.email}
                      aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
                    />
                    {loginErrors.email ? (
                      <p id="login-email-error" className="text-xs text-destructive mt-1">{loginErrors.email}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Usa el email con el que te registraste.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      onFocus={() => { if (!loginStart) { setLoginStart(Date.now()); trackMetric({ accion: 'login_started', metadata: { timestamp: new Date().toISOString() } }); } }}
                      required
                      aria-invalid={!!loginErrors.password}
                      aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
                    />
                    {loginErrors.password ? (
                      <p id="login-password-error" className="text-xs text-destructive mt-1">{loginErrors.password}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Mínimo 6 caracteres.</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setRememberMe(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Recordarme
                      </Label>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Iniciando..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-nombre">Nombre Completo</Label>
                    <Input
                      id="register-nombre"
                      type="text"
                      placeholder="Tu nombre"
                      value={registerData.nombre}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, nombre: e.target.value })
                      }
                      onFocus={() => { if (!registerStart) { setRegisterStart(Date.now()); trackMetric({ accion: 'register_started', metadata: { timestamp: new Date().toISOString() } }); } }}
                      required
                      aria-invalid={!!registerErrors.nombre}
                      aria-describedby={registerErrors.nombre ? 'register-nombre-error' : undefined}
                    />
                    {registerErrors.nombre ? (
                      <p id="register-nombre-error" className="text-xs text-destructive mt-1">{registerErrors.nombre}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Introduce tu nombre completo para personalizar la cuenta.</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="register-terms"
                      checked={registerData.acceptedTerms}
                      onCheckedChange={(v) => setRegisterData({ ...registerData, acceptedTerms: Boolean(v) })}
                    />
                    <Label htmlFor="register-terms" className="text-sm">
                      Acepto los <a className="underline" href="/terms" target="_blank" rel="noreferrer">términos</a> y la <a className="underline" href="/privacy" target="_blank" rel="noreferrer">política de privacidad</a>
                    </Label>
                  </div>
                  {registerErrors.acceptedTerms && <p className="text-xs text-destructive mt-1">{registerErrors.acceptedTerms}</p>}
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, email: e.target.value })
                      }
                      onFocus={() => { if (!registerStart) setRegisterStart(Date.now()); }}
                      required
                      aria-invalid={!!registerErrors.email}
                      aria-describedby={registerErrors.email ? 'register-email-error' : undefined}
                    />
                    {registerErrors.email ? (
                      <p id="register-email-error" className="text-xs text-destructive mt-1">{registerErrors.email}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Usa un correo válido; recibirás un email de confirmación.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                      onFocus={() => { if (!registerStart) setRegisterStart(Date.now()); }}
                      required
                      aria-invalid={!!registerErrors.password}
                      aria-describedby={registerErrors.password ? 'register-password-error' : undefined}
                    />
                    <div className="mt-2">
                      <ul className="text-sm space-y-1">
                        <li className={`flex items-center gap-2 ${registerData.password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {registerData.password.length >= 8 ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} Mínimo 8 caracteres
                        </li>
                        <li className={`flex items-center gap-2 ${/[a-z]/.test(registerData.password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {/[a-z]/.test(registerData.password) ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} Letra minúscula
                        </li>
                        <li className={`flex items-center gap-2 ${/[A-Z]/.test(registerData.password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {/[A-Z]/.test(registerData.password) ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} Letra MAYÚSCULA
                        </li>
                        <li className={`flex items-center gap-2 ${/\d/.test(registerData.password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {/\d/.test(registerData.password) ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} Número
                        </li>
                        <li className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(registerData.password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {/[^A-Za-z0-9]/.test(registerData.password) ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />} Carácter especial
                        </li>
                      </ul>
                      {registerErrors.password && (
                        <p id="register-password-error" className="text-xs text-destructive mt-1">{registerErrors.password}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirmar Contraseña</Label>
                    <Input
                      id="register-confirmPassword"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          confirmPassword: e.target.value,
                        })
                      }
                      onFocus={() => { if (!registerStart) setRegisterStart(Date.now()); }}
                      required
                      aria-invalid={!!registerErrors.confirmPassword}
                      aria-describedby={registerErrors.confirmPassword ? 'register-confirmPassword-error' : undefined}
                    />
                    {registerErrors.confirmPassword ? (
                      <p id="register-confirmPassword-error" className="text-xs text-destructive mt-1">{registerErrors.confirmPassword}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">Repite la contraseña para confirmarla.</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Registrando..." : "Crear Cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t">
              <details className="space-y-4" onToggle={(e) => {
                const el = e.target as HTMLDetailsElement;
                if (el.open) {
                  trackMetric({ accion: 'help_opened', metadata: { area: 'auth_reset', timestamp: new Date().toISOString() } });
                }
              }}>
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-primary">
                  ¿Olvidaste tu contraseña?
                </summary>
                <form onSubmit={handleReset} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email de recuperación</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      aria-invalid={!!resetError}
                      aria-describedby={resetError ? 'reset-email-error' : undefined}
                      onFocus={() => { if (!registerStart) { /* don't override registerStart */ } ; /* start reset timer */ if (!loginStart) { /* use loginStart for fallback */ } }}
                    />
                    {resetError && <p id="reset-email-error" className="text-xs text-destructive mt-1">{resetError}</p>}
                  </div>
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Recuperar Contraseña"}
                  </Button>
                </form>
              </details>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          asChild
          className="w-full"
          onClick={() => trackClick("back_home")}
        >
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
