import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMetrics } from "@/hooks/useMetrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  Zap, 
  Activity, 
  TrendingUp, 
  Cpu, 
  Calendar,
  Trash2,
  BarChart3
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { trackClick, trackMetric } = useMetrics("dashboard");

  const [consumoData, setConsumoData] = useState<any[]>([]);
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [nuevoDispositivo, setNuevoDispositivo] = useState({ nombre: "", potencia_w: "" });
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"hourly" | "daily">("hourly");
  const [hoursWindow, setHoursWindow] = useState<number>(48);
  const [daysWindow, setDaysWindow] = useState<number>(30);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      (async () => {
        try {
          await cargarDispositivos();
          await cargarConsumo();
        } catch (e) {
          console.error("Error cargando datos en useEffect:", e);
        }
      })();
    }
  }, [user, loading, navigate, viewMode, hoursWindow, daysWindow, selectedDevice]);

  const cargarDispositivos = async () => {
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from("dispositivos")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      const ms = Date.now() - start;
      try { await trackMetric({ accion: 'db_latency_dispositivos', metadata: { ms, rows: (data || []).length } }); } catch {}

      if (error) throw error;
      setDispositivos(data || []);
      if (data && data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0].id);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  const cargarConsumo = async () => {
    try {
      if (selectedDevice) {
        if (viewMode === "hourly") {
          const since = new Date(Date.now() - hoursWindow * 3600 * 1000).toISOString();
          const start = Date.now();
          const { data, error } = await supabase
            .from("dispositivo_consumo_horario")
            .select("*")
            .eq("dispositivo_id", selectedDevice)
            .gte("ts", since)
            .order("ts", { ascending: true });
          const ms = Date.now() - start;
          try { await trackMetric({ accion: 'db_latency_consumo_horario', metadata: { ms, rows: (data || []).length, device: selectedDevice } }); } catch {}
          if (error) throw error;
          setConsumoData(data || []);
          return;
        } else {
          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - daysWindow + 1);
          const sinceStr = sinceDate.toISOString().split("T")[0];
          const start = Date.now();
          const { data, error } = await supabase
            .from("dispositivo_consumo_diario")
            .select("*")
            .eq("dispositivo_id", selectedDevice)
            .gte("fecha", sinceStr)
            .order("fecha", { ascending: true });
          const ms = Date.now() - start;
          try { await trackMetric({ accion: 'db_latency_consumo_diario', metadata: { ms, rows: (data || []).length, device: selectedDevice } }); } catch {}
          if (error) throw error;
          setConsumoData(data || []);
          return;
        }
      }

      const { data: devices } = await supabase
        .from("dispositivos")
        .select("id")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const firstDeviceId = devices && devices[0] ? devices[0].id : null;
      if (firstDeviceId) {
        setSelectedDevice(firstDeviceId);
        return;
      }

      setConsumoData([]);
    } catch (error) {
      console.error("Error loading consumption:", error);
      toast.error("Error al cargar datos de consumo");
    } finally {
      setLoadingData(false);
    }
  };

  const handleAgregarDispositivo = async (e: React.FormEvent) => {
    e.preventDefault();
    trackClick("add_device");

    try {
      const { data, error } = await supabase.from("dispositivos").insert({
        user_id: user?.id,
        nombre: nuevoDispositivo.nombre,
        potencia_w: nuevoDispositivo.potencia_w ? Number(nuevoDispositivo.potencia_w) : null,
      }).select("*");

      if (error) throw error;
      toast.success("Dispositivo agregado");
      setNuevoDispositivo({ nombre: "", potencia_w: "" });
      const newDeviceId = data && data[0] ? data[0].id : null;
      await cargarDispositivos();
      if (newDeviceId) {
        setSelectedDevice(newDeviceId);
        const today = new Date().toISOString().split("T")[0];

        try {
          const potencia = data && data[0] ? Number(data[0].potencia_w || 0) : 0;
          const kwh = Math.round(((potencia * 24) / 1000) * 1000) / 1000;
          await supabase.from("dispositivo_consumo_diario").insert({
            dispositivo_id: newDeviceId,
            fecha: today,
            consumo_kwh: kwh,
          });
        } catch (e) {
          console.warn("No se pudo crear registro diario inicial:", e);
        }

        await cargarConsumo();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al agregar dispositivo");
    }
  };

  const handleEliminarDispositivo = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from("dispositivos")
        .delete()
        .eq("id", deviceId);

      if (error) throw error;
      toast.success("Dispositivo eliminado");
      if (selectedDevice === deviceId) {
        setSelectedDevice(null);
      }
      await cargarDispositivos();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar dispositivo");
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  const selectedDeviceData = dispositivos.find(d => d.id === selectedDevice);
  const totalConsumo = consumoData.reduce((sum, item) => sum + Number(item.consumo_kwh ?? 0), 0);
  const promedioConsumo = consumoData.length > 0 ? totalConsumo / consumoData.length : 0;
  const currentPower = consumoData.length > 0 
    ? Math.round((Number(consumoData[consumoData.length-1].consumo_kwh ?? 0) * 1000)) 
    : (selectedDeviceData?.potencia_w ?? 0);

  const chartData = consumoData.map((item) => {
    if (viewMode === "hourly") {
      const d = new Date(item.ts);
      return {
        fecha: d.toLocaleString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        kwh: Number(item.consumo_kwh),
      };
    }
    const d = new Date(item.fecha || item.ts);
    return {
      fecha: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      kwh: Number(item.consumo_kwh),
    };
  });

  const statCards = [
    {
      title: "Dispositivo Activo",
      value: selectedDeviceData?.nombre || "Sin seleccionar",
      subtitle: "dispositivo actual",
      icon: Cpu,
      color: "from-primary/20 to-primary/5",
      iconColor: "text-primary"
    },
    {
      title: "Potencia Nominal",
      value: `${selectedDeviceData?.potencia_w ?? 0} W`,
      subtitle: "potencia configurada",
      icon: Zap,
      color: "from-accent/20 to-accent/5",
      iconColor: "text-accent"
    },
    {
      title: "Consumo Total",
      value: `${totalConsumo.toFixed(2)} kWh`,
      subtitle: viewMode === "hourly" ? `últimas ${hoursWindow}h` : `últimos ${daysWindow}d`,
      icon: Activity,
      color: "from-green-500/20 to-green-500/5",
      iconColor: "text-green-500"
    },
    {
      title: "Promedio",
      value: `${promedioConsumo.toFixed(3)} kWh`,
      subtitle: viewMode === "hourly" ? "por hora" : "por día",
      icon: TrendingUp,
      color: "from-orange-500/20 to-orange-500/5",
      iconColor: "text-orange-500"
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard de Consumo</h1>
            <p className="text-muted-foreground text-sm">
              Gestiona y visualiza tu consumo energético
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="overflow-hidden border-0 shadow-md">
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", stat.color)} />
            <CardContent className="relative p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </p>
                  <p className="text-xl md:text-2xl font-bold truncate">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={cn("p-2 rounded-lg bg-background/80 shadow-sm", stat.iconColor)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="shadow-md border-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Historial de Consumo</CardTitle>
                <CardDescription>
                  {viewMode === "hourly"
                    ? `Últimas ${hoursWindow} horas` 
                    : `Últimos ${daysWindow} días`}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedDevice ?? ""} onValueChange={(v) => { setSelectedDevice(v || null); setLoadingData(true); }}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Dispositivo" />
                </SelectTrigger>
                <SelectContent>
                  {dispositivos.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.nombre || d.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={viewMode} onValueChange={(v) => { setViewMode(v as any); setLoadingData(true); }}>
                <SelectTrigger className="w-[120px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Horario</SelectItem>
                  <SelectItem value="daily">Diario</SelectItem>
                </SelectContent>
              </Select>

              {viewMode === "hourly" ? (
                <Select value={String(hoursWindow)} onValueChange={(v) => setHoursWindow(Number(v))}>
                  <SelectTrigger className="w-[80px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24h</SelectItem>
                    <SelectItem value="48">48h</SelectItem>
                    <SelectItem value="72">72h</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={String(daysWindow)} onValueChange={(v) => setDaysWindow(Number(v))}>
                  <SelectTrigger className="w-[80px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7d</SelectItem>
                    <SelectItem value="30">30d</SelectItem>
                    <SelectItem value="90">90d</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  label={{ 
                    value: 'kWh', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: 12 }
                  }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="kwh"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#colorKwh)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-16 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No hay datos de consumo para este dispositivo</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Selecciona otro dispositivo o espera a que se registren datos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Devices Management */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Cpu className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Mis Dispositivos</CardTitle>
              <CardDescription>
                Agrega y administra tus dispositivos eléctricos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add device form */}
          <form onSubmit={handleAgregarDispositivo} className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="device-nombre" className="text-sm font-medium">
                  Nombre del dispositivo
                </Label>
                <Input
                  id="device-nombre"
                  placeholder="Ej. Nevera, Televisor..."
                  value={nuevoDispositivo.nombre}
                  onChange={(e) => setNuevoDispositivo({ ...nuevoDispositivo, nombre: e.target.value })}
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-potencia" className="text-sm font-medium">
                  Potencia (W)
                </Label>
                <Input
                  id="device-potencia"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Ej. 1500"
                  value={nuevoDispositivo.potencia_w}
                  onChange={(e) => setNuevoDispositivo({ ...nuevoDispositivo, potencia_w: e.target.value })}
                  className="h-10"
                />
              </div>

              <Button type="submit" className="h-10 gap-2">
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
          </form>

          {/* Device list */}
          {dispositivos.length > 0 ? (
            <div className="grid gap-3">
              {dispositivos.map((d) => (
                <div 
                  key={d.id} 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                    selectedDevice === d.id 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-border/50 hover:border-border hover:bg-muted/30"
                  )}
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => setSelectedDevice(d.id)}
                  >
                    <div className={cn(
                      "p-2 rounded-lg",
                      selectedDevice === d.id ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Zap className={cn(
                        "h-4 w-4",
                        selectedDevice === d.id ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <div className="font-medium">{d.nombre}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{d.potencia_w ? `${d.potencia_w} W` : "Potencia no definida"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(d.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleEliminarDispositivo(d.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Cpu className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No tienes dispositivos registrados</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Agrega tu primer dispositivo usando el formulario</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
