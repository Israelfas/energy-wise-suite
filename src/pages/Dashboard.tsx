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
import { Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
      // don't block consumption loading
    }
  };

  const cargarConsumo = async () => {
    try {
      // If a device is selected, load series depending on viewMode
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
          // daily
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

      // Otherwise, load the most recent device (if any) and show its series
      const { data: devices } = await supabase
        .from("dispositivos")
        .select("id")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const firstDeviceId = devices && devices[0] ? devices[0].id : null;
      if (firstDeviceId) {
        setSelectedDevice(firstDeviceId);
        // Recursive call will handle selectedDevice case on next effect
        return;
      }

      // no devices -> empty series
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
      // If the insert returned the new device, select it and create an initial daily record
      const newDeviceId = data && data[0] ? data[0].id : null;
      await cargarDispositivos();
      if (newDeviceId) {
        setSelectedDevice(newDeviceId);
        const today = new Date().toISOString().split("T")[0];

        // Create initial per-device daily consumption using potencia (hours=24)
        try {
          const potencia = data && data[0] ? Number(data[0].potencia_w || 0) : 0;
          const kwh = Math.round(((potencia * 24) / 1000) * 1000) / 1000; // 3 decimals
          const { error: insertError } = await supabase.from("dispositivo_consumo_diario").insert({
            dispositivo_id: newDeviceId,
            fecha: today,
            consumo_kwh: kwh,
          });
          if (insertError) throw insertError;
        } catch (e) {
          console.warn("No se pudo crear registro diario inicial:", e);
        }

        await cargarConsumo();
        toast.success("Dispositivo agregado y registro diario inicial creado");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al agregar dispositivo");
    }
  };

  if (loading || !user) {
    return null;
  }

  const totalConsumo = consumoData.reduce((sum, item) => sum + Number(item.consumo_kwh ?? 0), 0);
  const promedioConsumo = consumoData.length > 0 ? totalConsumo / consumoData.length : 0;

  const chartData = consumoData.map((item) => {
    if (viewMode === "hourly") {
      const d = new Date(item.ts);
      return {
        fecha: d.toLocaleString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        kwh: Number(item.consumo_kwh),
      };
    }
    // daily
    const d = new Date(item.fecha || item.ts);
    return {
      fecha: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      kwh: Number(item.consumo_kwh),
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard de Consumo</h1>
        <p className="text-muted-foreground">
          Gestiona y visualiza tu consumo energético
        </p>
      </div>

      {/* Device summary cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(dispositivos.find(d => d.id === selectedDevice)?.nombre) || "-"}</div>
            <p className="text-xs text-muted-foreground">nombre</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potencia nominal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(dispositivos.find(d => d.id === selectedDevice)?.potencia_w ?? 0)} W</div>
            <p className="text-xs text-muted-foreground">potencia configurada</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potencia actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consumoData.length > 0 ? Math.round((Number(consumoData[consumoData.length-1].consumo_kwh ?? 0) * 1000)) : (dispositivos.find(d => d.id === selectedDevice)?.potencia_w ?? 0)} W</div>
            <p className="text-xs text-muted-foreground">estimación instantánea (W)</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Historial de Consumo</CardTitle>
            <CardDescription>
              {viewMode === "hourly"
                ? `Últimas ${hoursWindow} horas` 
                : `Últimos ${daysWindow} días`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="rounded border p-2 bg-card text-card-foreground border-border shadow-sm text-sm"
              value={selectedDevice ?? ""}
              onChange={(e) => { setSelectedDevice(e.target.value || null); setLoadingData(true); }}
            >
              <option value="">Selecciona dispositivo</option>
              {dispositivos.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre || d.id}</option>
              ))}
            </select>

            <select
              className="rounded border p-2 bg-card text-card-foreground border-border shadow-sm text-sm"
              value={viewMode}
              onChange={(e) => { setViewMode(e.target.value as any); setLoadingData(true); }}
            >
              <option value="hourly">Horario (por hora)</option>
              <option value="daily">Diario</option>
            </select>

            {viewMode === "hourly" ? (
              <select className="rounded border p-2 bg-card text-card-foreground border-border shadow-sm text-sm" value={hoursWindow} onChange={(e) => setHoursWindow(Number(e.target.value))}>
                <option value={24}>24h</option>
                <option value={48}>48h</option>
                <option value={72}>72h</option>
              </select>
            ) : (
              <select className="rounded border p-2 bg-card text-card-foreground border-border shadow-sm text-sm" value={daysWindow} onChange={(e) => setDaysWindow(Number(e.target.value))}>
                <option value={7}>7d</option>
                <option value={30}>30d</option>
                <option value={90}>90d</option>
              </select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis label={{ value: viewMode === "hourly" ? "Watts (W)" : "kWh", angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={viewMode === "hourly" ? "watts" : "kwh"}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-muted-foreground">No hay datos de consumo aún para el dispositivo seleccionado.</div>
          )}
        </CardContent>
      </Card>

      {/* Devices management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Mis Dispositivos
          </CardTitle>
          <CardDescription>
            Agrega y administra los dispositivos eléctricos asociados a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form onSubmit={handleAgregarDispositivo} className="grid md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="device-nombre">Nombre del dispositivo</Label>
                <Input
                  id="device-nombre"
                  placeholder="Ej. Nevera"
                  value={nuevoDispositivo.nombre}
                  onChange={(e) => setNuevoDispositivo({ ...nuevoDispositivo, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-potencia">Potencia (W)</Label>
                <Input
                  id="device-potencia"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="Ej. 1500"
                  value={nuevoDispositivo.potencia_w}
                  onChange={(e) => setNuevoDispositivo({ ...nuevoDispositivo, potencia_w: e.target.value })}
                />
              </div>

              <div>
                <Button type="submit" className="w-full md:w-auto">
                  Agregar dispositivo
                </Button>
              </div>
            </form>

            {dispositivos.length > 0 ? (
              <div className="grid gap-2">
                {dispositivos.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50 hover:bg-accent/50 transition-colors">
                    <div>
                      <div className="font-medium">{d.nombre}</div>
                      <div className="text-xs text-muted-foreground">{d.potencia_w ? `${d.potencia_w} W` : "Potencia no definida"}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay dispositivos. Agrega uno arriba.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
